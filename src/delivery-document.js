const clean=value=>String(value??'').trim()
const round=value=>Math.round((Number(value)||0)*100)/100
const amount=value=>{
  const normalized=clean(value).replace(/\s/g,'').replace(/(?<=\d):(?=\d{2}\b)/g,'.').replace(',','.')
  const parsed=Number(normalized.replace(/[^\d.-]/g,''))
  return Number.isFinite(parsed)?parsed:0
}

export const normalizePartNumber=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Ł/gi,'L').replace(/^[^A-Z0-9]+|[^A-Z0-9./-]+$/gi,'').toUpperCase()
export const normalizeOcrText=value=>String(value||'').replace(/\r/g,'').replace(/[„”]/g,'"').replace(/(?<=\d):(?=\d{2}\b)/g,'.').replace(/[ \t]+/g,' ').split('\n').map(line=>line.trim()).filter(Boolean).join('\n')

function supplierFrom(lines,documentIndex){
  const before=lines.slice(0,Math.max(0,documentIndex)).filter(line=>!/(sprzedaw|adres|nip|regon|konto|bank|telefon|tel\.|email|polica|data|wydruk)/i.test(line))
  return before.find(line=>/[A-ZĄĆĘŁŃÓŚŹŻ]{3}/.test(line)&&/[a-ząćęłńóśźż]{2}/i.test(line)&&line.length>=6&&line.length<=90)?.replace(/^[^A-ZĄĆĘŁŃÓŚŹŻ]+/,'').trim()||''
}

export function parseDeliveryItem(line){
  const normalized=clean(line).replace(/[|;]/g,' ').replace(/(?<=\d):(?=\d{2}\b)/g,'.').replace(/\s+/g,' ')
  const decimals=[...normalized.matchAll(/\b\d{1,6}[.,]\d{2}\b/g)]
  if(decimals.length<4)return null
  const quantityIndex=decimals.findIndex((match,index)=>index<2&&amount(match[0])>0&&amount(match[0])<=999)
  if(quantityIndex<0||decimals.length-quantityIndex<4)return null
  const quantityMatch=decimals[quantityIndex],prefix=normalized.slice(0,quantityMatch.index).trim()
  const tokens=[...prefix.matchAll(/[A-ZĄĆĘŁŃÓŚŹŻ0-9][A-ZĄĆĘŁŃÓŚŹŻ0-9./-]*/gi)]
  const code=tokens.find(token=>token[0].length>=4&&/[A-ZĄĆĘŁŃÓŚŹŻ]/i.test(token[0])&&/\d/.test(token[0])&&!/^SZT$/i.test(token[0]))
  if(!code)return null
  const part_no=normalizePartNumber(code[0])
  const name=prefix.slice(code.index+code[0].length).replace(/^[^A-ZĄĆĘŁŃÓŚŹŻ]+/i,'').replace(/[|;]/g,' ').replace(/\s+/g,' ').trim()
  if(!name||name.length<3)return null
  const values=decimals.slice(quantityIndex).map(match=>amount(match[0]))
  const qty=values[0],scannedCost=values[1],netTotal=values[2]
  const vatMatch=normalized.slice(quantityMatch.index).match(/(?:^|\s)(8|23)(?:\s|$)/),vat_rate=vatMatch?Number(vatMatch[1]):23
  const vat_amount=values.length>=5?values[values.length-2]:values[3]
  const gross_total=values.length>=5?values[values.length-1]:round(netTotal+vat_amount)
  const lineMismatch=Math.abs(round(qty*scannedCost)-round(netTotal))>.08,taxMismatch=Math.abs(round(netTotal+vat_amount)-round(gross_total))>.08
  const derivedNet=vat_rate>0&&vat_amount>0?vat_amount/(vat_rate/100):0
  const unit_cost=round((lineMismatch||taxMismatch)&&qty>0?(derivedNet||netTotal)/qty:scannedCost)
  return{enabled:true,part_no,name,qty,unit_cost,net_total:netTotal,vat_rate,vat_amount,gross_total,confidence:lineMismatch||taxMismatch||part_no.length<5?'CHECK':'GOOD',source_line:line}
}

export function parseDeliveryDocument(rawText){
  const raw_text=normalizeOcrText(rawText),lines=raw_text.split('\n')
  const documentIndex=lines.findIndex(line=>/(wydanie\s+zewn|faktura|paragon|dokument\s+dostaw)/i.test(line)),documentLine=lines[documentIndex]||''
  const document_no=documentLine.match(/(?:nr\s*[:.]?\s*)?([A-Z0-9]+(?:[\/-][A-Z0-9]+){2,})/i)?.[1]||''
  const dateLine=lines.find(line=>/(data\s+(dostaw|wystaw|wykon)|wydrukowano)/i.test(line))||'',date=dateLine.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/)?.[1]||''
  const totalLine=lines.find(line=>/wartość\s+dokumentu/i.test(line))||'',totals=[...totalLine.matchAll(/\d+[.,]\d{2}/g)]
  const items=[];let current=null
  for(const line of lines){
    if(/^(razem|w tym|wartość dokumentu|sposób zapłaty)/i.test(line))break
    const item=parseDeliveryItem(line)
    if(item){items.push(item);current=item;continue}
    if(current&&line.length<=45&&!/^(lp\.|kod|nazwa|ilość|j\.?m|cena|wartość|podatek|netto|brutto)/i.test(line)&&/[A-ZĄĆĘŁŃÓŚŹŻ]{2}/.test(line)){
      const continuation=line.replace(/[|;]/g,' ').replace(/^[^A-ZĄĆĘŁŃÓŚŹŻ]+/,'').replace(/\s+/g,' ').trim()
      if(continuation.length>2)current.name=`${current.name} ${continuation}`.replace(/\s+/g,' ').trim()
    }
  }
  const rowsGross=round(items.reduce((sum,item)=>sum+item.gross_total,0)),gross_total=totals.length?amount(totals.at(-1)[0]):rowsGross,warnings=[]
  if(!items.length)warnings.push('Nie rozpoznano pozycji tabeli. Zrób zdjęcie prosto nad kartką albo dodaj wiersze ręcznie.')
  if(items.some(item=>item.confidence==='CHECK'))warnings.push('Co najmniej jeden numer lub cena wymaga sprawdzenia z dokumentem.')
  if(gross_total>0&&Math.abs(gross_total-rowsGross)>.1)warnings.push(`Suma odczytanych pozycji (${rowsGross.toFixed(2)} zł) różni się od wartości dokumentu (${gross_total.toFixed(2)} zł).`)
  return{supplier_name:supplierFrom(lines,documentIndex),document_no,document_date:date?date.split(/[./-]/).reverse().join('-'):'',currency:'PLN',gross_total,items,warnings,raw_text}
}

export function stableDocumentId(document={}){
  const seed=[document.supplier_name,document.document_no,document.document_date,document.gross_total,document.raw_text].map(value=>clean(value).toUpperCase()).join('|')
  let hash=2166136261
  for(let index=0;index<seed.length;index++){hash^=seed.charCodeAt(index);hash=Math.imul(hash,16777619)}
  return `delivery-${(hash>>>0).toString(16).padStart(8,'0')}`
}

export function defaultSellPrice(cost){
  const value=Number(cost)||0,markup=value<50?.45:value<200?.35:value<500?.28:.22
  return round(value*(1+markup))
}

export function buildInventoryImport(stock=[],document={}){
  const selected=(document.items||[]).filter(item=>item.enabled!==false),byNumber=new Map(stock.filter(row=>normalizePartNumber(row.payload?.part_no)).map(row=>[normalizePartNumber(row.payload.part_no),row]))
  if(!selected.length)throw new Error('Wybierz co najmniej jedną pozycję do przyjęcia.')
  const operations=[]
  selected.forEach((source,index)=>{
    const part_no=normalizePartNumber(source.part_no),name=clean(source.name),qty=Number(source.qty),unit_cost=round(source.unit_cost)
    if(!part_no)throw new Error(`Pozycja ${index+1}: uzupełnij numer katalogowy.`)
    if(!name)throw new Error(`Pozycja ${index+1}: uzupełnij nazwę części.`)
    if(!Number.isFinite(qty)||qty<=0)throw new Error(`Pozycja ${index+1}: ilość musi być większa od zera.`)
    if(!Number.isFinite(unit_cost)||unit_cost<0)throw new Error(`Pozycja ${index+1}: cena zakupu jest niepoprawna.`)
    const existing=byNumber.get(part_no)
    if(existing){
      const oldStock=Number(existing.payload.stock||0),newStock=oldStock+qty,weighted=newStock?round((oldStock*Number(existing.payload.unit_cost||0)+qty*unit_cost)/newStock):unit_cost
      operations.push({kind:'update',id:existing.cloud_id,payload:{stock:newStock,unit_cost:weighted,lookup_source:'Dokument dostawy OCR',notes:[existing.payload.notes,`Dostawa ${document.document_no||'bez numeru'} · ${document.document_date||new Date().toISOString().slice(0,10)} · ${document.supplier_name||'dostawca'}`].filter(Boolean).join('\n')}})
      existing.payload={...existing.payload,stock:newStock,unit_cost:weighted}
    }else{
      const id=`part-${stableDocumentId({...document,raw_text:`${document.raw_text}|${part_no}`}).slice(9)}`
      const payload={barcode:'',name,brand:'',part_no,category:'Części samochodowe',vehicle_fitment:'',cross_numbers:'',image_url:'',lookup_source:'Dokument dostawy OCR',lookup_url:'',stock:qty,min_stock:0,unit_cost,sell_price:defaultSellPrice(unit_cost),location:'',notes:`Dostawa ${document.document_no||'bez numeru'} · ${document.document_date||new Date().toISOString().slice(0,10)} · ${document.supplier_name||'dostawca'}`}
      operations.push({kind:'create',id,payload});byNumber.set(part_no,{cloud_id:id,payload})
    }
  })
  return operations
}
