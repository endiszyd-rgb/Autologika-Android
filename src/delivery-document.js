const clean=value=>String(value??'').trim()
import {isWholePartQuantity,wholePartQuantity} from './part-quantity.js'
const round=value=>Math.round((Number(value)||0)*100)/100
const amount=value=>{
  const normalized=clean(value).replace(/\s/g,'').replace(/(?<=\d):(?=\d{2}\b)/g,'.').replace(',','.')
  const parsed=Number(normalized.replace(/[^\d.-]/g,''))
  return Number.isFinite(parsed)?parsed:0
}

export function deliveryDocumentTotals(items=[]){
  return(items||[]).filter(item=>item?.enabled!==false).reduce((totals,item)=>({
    count:totals.count+1,
    qty:round(totals.qty+amount(item.qty)),
    gross:round(totals.gross+amount(item.gross_total)),
  }),{count:0,qty:0,gross:0})
}

function closestDocumentTotal(rowsGross,...values){
  const candidates=[...new Set(values.flat().map(amount).filter(value=>value>0))]
  if(!candidates.length)return rowsGross
  if(rowsGross<=0)return candidates[0]
  return candidates.sort((a,b)=>Math.abs(a-rowsGross)-Math.abs(b-rowsGross))[0]
}

function reconcileDocumentRounding(items,total){
  const current=deliveryDocumentTotals(items),difference=round(amount(total)-current.gross)
  if(!items.length||!difference||Math.abs(difference)>.1)return items
  const index=items.map(item=>item?.enabled!==false).lastIndexOf(true)
  if(index<0)return items
  return items.map((item,itemIndex)=>{
    if(itemIndex!==index)return item
    const gross_total=round(amount(item.gross_total)+difference),qty=amount(item.qty)
    return{...item,gross_total,unit_cost:qty>0?round(gross_total/qty):item.unit_cost,rounding_adjustment:difference}
  })
}

export const normalizePartNumber=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Ł/gi,'L').replace(/^[^A-Z0-9]+|[^A-Z0-9./-]+$/gi,'').toUpperCase()
export const normalizeOcrText=value=>String(value||'').replace(/\r/g,'').replace(/[„”]/g,'"').replace(/(?<=\d):(?=\d{2}\b)/g,'.').replace(/\b(\d{1,6})[ \t]+(\d{2})\b/g,'$1.$2').replace(/[ \t]+/g,' ').split('\n').map(line=>line.trim()).filter(Boolean).join('\n')

const tableHeader=/^(lp\.?|mag\.?|grupa|adres|kod(?:\s+towaru)?|nazwa(?:\s+towaru)?|ilo(?:ś|s)ć|j\.?m\.?|cena|warto(?:ś|s)ć|podatek|netto|brutto)(?:\s|$)/i
const tableEnd=/^(razem|w tym|warto(?:ś|s)ć dokumentu|spos(?:ó|o)b zap(?:ł|l)aty|termin|transport)(?:\s|:|$)/i
const likelyPartToken=token=>{
  const value=normalizePartNumber(token)
  return value.length>=4&&value.length<=32&&/[A-Z]/i.test(value)&&/\d/.test(value)&&!/^SZT$/i.test(value)&&!/^(?:WZ|FV|FA|VAT)\d*$/i.test(value)
}
const partTokenIn=line=>[...clean(line).matchAll(/[A-ZĄĆĘŁŃÓŚŹŻ0-9][A-ZĄĆĘŁŃÓŚŹŻ0-9./-]*/gi)].find(match=>{
  if(!likelyPartToken(match[0]))return false
  const prefix=clean(line).slice(0,match.index).trim()
  // Before a catalogue number documents may contain LP, warehouse group or
  // location columns. Reject mixed tokens embedded later in a product name
  // (for example 5W30), because those are not starts of new rows.
  return !prefix||prefix.split(/\s+/).every(token=>/^\d{1,3}$/.test(token)||/^[A-Z0-9]{1,3}$/i.test(token))
})

function joinedDeliveryRows(lines){
  const rows=[]
  let current=[]
  let insideTable=false
  const flush=()=>{
    if(!current.length)return
    const item=parseDeliveryItem(current.join(' '))
    if(item)rows.push(item)
    current=[]
  }
  for(const line of lines){
    if(tableEnd.test(line)){flush();break}
    if(tableHeader.test(line)){insideTable=true;continue}
    const code=partTokenIn(line)
    if(code){
      // A new catalogue number starts the next physical table row. OCR often
      // emits the name and numeric columns as separate lines afterwards.
      flush()
      current=[line]
      insideTable=true
      continue
    }
    if(insideTable&&current.length)current.push(line)
  }
  flush()
  return rows
}

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
  const unit_cost=round(qty>0?gross_total/qty:0)
  return{enabled:true,part_no,name,qty,unit_cost,net_unit_cost:scannedCost,net_total:netTotal,vat_rate,vat_amount,gross_total,confidence:lineMismatch||taxMismatch||part_no.length<5?'CHECK':'GOOD',source_line:line}
}

export function parseDeliveryDocument(rawText){
  const raw_text=normalizeOcrText(rawText),lines=raw_text.split('\n')
  const documentIndex=lines.findIndex(line=>/(wydanie\s+zewn|faktura|paragon|dokument\s+dostaw)/i.test(line)),documentLine=lines[documentIndex]||''
  const document_no=documentLine.match(/(?:nr\s*[:.]?\s*)?([A-Z0-9]+(?:[\/-][A-Z0-9]+){2,})/i)?.[1]||''
  const dateLine=lines.find(line=>/(data\s+(dostaw|wystaw|wykon)|wydrukowano)/i.test(line))||'',date=dateLine.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/)?.[1]||''
  const totalLines=lines.filter(line=>/wartość\s+dokumentu|(?:razem|zapłacono).*(?:pln|\d+[.,]\d{2})/i.test(line))
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
  for(const joined of joinedDeliveryRows(lines)){
    const existing=items.find(item=>item.part_no===joined.part_no)
    if(!existing)items.push(joined)
  }
  const rowsGross=round(items.reduce((sum,item)=>sum+item.gross_total,0))
  const totalCandidates=totalLines.map(line=>[...line.matchAll(/\d+[.,]\d{2}/g)].at(-1)?.[0]).filter(Boolean)
  const gross_total=closestDocumentTotal(rowsGross,totalCandidates)
  const reconciledItems=reconcileDocumentRounding(items,gross_total),reconciledGross=deliveryDocumentTotals(reconciledItems).gross,warnings=[]
  if(!items.length)warnings.push('Nie rozpoznano pozycji tabeli. Zrób zdjęcie prosto nad kartką albo dodaj wiersze ręcznie.')
  if(items.some(item=>item.confidence==='CHECK'))warnings.push('Co najmniej jeden numer lub cena wymaga sprawdzenia z dokumentem.')
  if(gross_total>0&&Math.abs(gross_total-reconciledGross)>.1)warnings.push(`Suma odczytanych pozycji (${reconciledGross.toFixed(2)} zł) różni się od wartości dokumentu (${gross_total.toFixed(2)} zł).`)
  return{supplier_name:supplierFrom(lines,documentIndex),document_no,document_date:date?date.split(/[./-]/).reverse().join('-'):'',currency:'PLN',gross_total,items:reconciledItems,warnings,raw_text}
}

const spatialNumber=value=>Number.isFinite(Number(value))?Number(value):0

export function spatialOcrLines(elements=[]){
  const words=elements.map(element=>({
    text:clean(element?.text),
    left:spatialNumber(element?.left),
    right:spatialNumber(element?.right),
    top:spatialNumber(element?.top),
    bottom:spatialNumber(element?.bottom),
  })).filter(word=>word.text&&word.right>word.left&&word.bottom>word.top)
    .sort((a,b)=>((a.top+a.bottom)-(b.top+b.bottom))||a.left-b.left)
  const rows=[]
  for(const word of words){
    const center=(word.top+word.bottom)/2,height=word.bottom-word.top
    let best=null,bestDistance=Infinity
    for(const row of rows){
      const overlap=Math.min(row.bottom,word.bottom)-Math.max(row.top,word.top)
      const minHeight=Math.min(row.height,height)
      const distance=Math.abs(center-row.center)
      if((overlap>=minHeight*.22||distance<=Math.max(row.height,height)*.68)&&distance<bestDistance){best=row;bestDistance=distance}
    }
    if(best){
      best.words.push(word)
      best.top=Math.min(best.top,word.top);best.bottom=Math.max(best.bottom,word.bottom)
      best.height=best.bottom-best.top;best.center=(best.top+best.bottom)/2
    }else rows.push({words:[word],top:word.top,bottom:word.bottom,height,center})
  }
  return rows.sort((a,b)=>a.center-b.center).map(row=>row.words.sort((a,b)=>a.left-b.left).map(word=>word.text).join(' '))
}

const folded=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const centerX=word=>(word.left+word.right)/2
const centerY=word=>(word.top+word.bottom)/2
const spatialWords=elements=>elements.map(element=>({
  text:clean(element?.text),
  left:spatialNumber(element?.left),right:spatialNumber(element?.right),
  top:spatialNumber(element?.top),bottom:spatialNumber(element?.bottom),
})).filter(word=>word.text&&word.right>word.left&&word.bottom>word.top)

function closestHeader(words,label,minX=-Infinity){
  return words.filter(word=>centerX(word)>minX&&folded(word.text).startsWith(label)).sort((a,b)=>a.top-b.top||a.left-b.left)[0]
}

function clusterCodeRows(words){
  const rows=[]
  for(const word of [...words].sort((a,b)=>centerY(a)-centerY(b)||a.left-b.left)){
    const y=centerY(word),height=word.bottom-word.top
    const row=rows.find(candidate=>Math.abs(candidate.y-y)<=Math.max(candidate.height,height)*.75)
    if(row){row.words.push(word);row.y=row.words.reduce((sum,item)=>sum+centerY(item),0)/row.words.length;row.height=Math.max(row.height,height)}
    else rows.push({words:[word],y,height})
  }
  return rows.sort((a,b)=>a.y-b.y)
}

const wordsInHorizontalBand=(words,left,right)=>words.filter(word=>centerX(word)>=left&&centerX(word)<right)

function cellAmount(words){
  const ordered=[...words].sort((a,b)=>a.left-b.left)
  const direct=ordered.map(word=>({value:amount(word.text),text:clean(word.text)}))
    .filter(entry=>entry.value>0&&/\d/.test(entry.text))
  const decimal=direct.find(entry=>/[.,:]\s*\d{2}\b/.test(entry.text)||/^\d+\s+\d{2}$/.test(entry.text))
  if(decimal)return decimal.value
  // ML Kit sometimes returns `243` and `98` as two elements because the dot
  // lies on a printed table line. Rebuild that cell before parsing it.
  const digits=ordered.map(word=>clean(word.text).replace(/\D/g,'')).filter(Boolean)
  if(digits.length>=2&&digits.at(-1).length===2)return amount(`${digits.slice(0,-1).join('')}.${digits.at(-1)}`)
  return direct[0]?.value||0
}

function numericCells(words){
  const ordered=[...words].sort((a,b)=>a.left-b.left),cells=[]
  for(let index=0;index<ordered.length;index++){
    const word=ordered[index],text=clean(word.text)
    if(/^\d{1,6}[.,:]\d{2}$/.test(text)){cells.push({...word,value:amount(text)});continue}
    const next=ordered[index+1],nextText=clean(next?.text)
    const gap=next?next.left-word.right:Infinity
    const sameLine=next&&Math.abs(centerY(next)-centerY(word))<=Math.max(word.bottom-word.top,next.bottom-next.top)*.8
    if(/^\d{1,6}$/.test(text)&&/^\d{2}$/.test(nextText)&&sameLine&&gap<=Math.max(18,(word.bottom-word.top)*2.8)){
      cells.push({left:word.left,right:next.right,top:Math.min(word.top,next.top),bottom:Math.max(word.bottom,next.bottom),value:amount(`${text}.${nextText}`)})
      index++
    }
  }
  return cells.filter(cell=>cell.value>0)
}

function rowCodeCandidates(row,index){
  const ordered=[...row.words].sort((a,b)=>a.left-b.left),numbers=numericCells(ordered)
  if(numbers.length<2)return[]
  const firstNumber=numbers[0]
  const candidates=[]
  for(let start=0;start<ordered.length;start++){
    if(ordered[start].left>=firstNumber.left)break
    for(let length=1;length<=3&&start+length<=ordered.length;length++){
      const slice=ordered.slice(start,start+length)
      if(slice.at(-1).right>=firstNumber.left)break
      const code=normalizePartNumber(slice.map(word=>word.text).join(''))
      const between=ordered.filter(word=>word.left>slice.at(-1).right&&word.right<firstNumber.left)
      if(!likelyPartToken(code)||!between.some(word=>/[A-ZĄĆĘŁŃÓŚŹŻ]{2}/i.test(word.text)))continue
      candidates.push({row,index,code,left:slice[0].left,right:slice.at(-1).right,x:slice[0].left,numbers,words:slice})
    }
  }
  return candidates
}

function strongestCodeColumn(candidates,observedWidth){
  const tolerance=Math.max(24,observedWidth*.045),clusters=[]
  for(const candidate of candidates){
    let cluster=clusters.find(item=>Math.abs(item.x-candidate.x)<=tolerance)
    if(!cluster){cluster={x:candidate.x,candidates:[]};clusters.push(cluster)}
    cluster.candidates.push(candidate)
    cluster.x=cluster.candidates.reduce((sum,item)=>sum+item.x,0)/cluster.candidates.length
  }
  return clusters.sort((a,b)=>{
    const aRows=new Set(a.candidates.map(item=>item.index)).size,bRows=new Set(b.candidates.map(item=>item.index)).size
    // Supplier documents put warehouse group and shelf/address columns before
    // the actual catalogue number. Joining those cells can look like a valid
    // alphanumeric part number in every row. When two repeated columns are
    // equally strong, the rightmost one is the catalogue-number column because
    // it sits directly before the product name and numeric values.
    return bRows-aRows||b.x-a.x||b.candidates.length-a.candidates.length
  })[0]
}

function deliveryCandidateScore(items=[],documentTotal=0){
  if(!items.length)return-Infinity
  const totals=deliveryDocumentTotals(items)
  const whole=items.filter(item=>isWholePartQuantity(item.qty)).length
  const fractional=items.length-whole
  const complete=items.filter(item=>normalizePartNumber(item.part_no)&&clean(item.name)&&amount(item.gross_total)>0).length
  const mismatch=documentTotal>0?Math.abs(documentTotal-totals.gross):0
  // A fractional quantity is evidence that the OCR shifted the row and read a
  // price as quantity. Penalize it more strongly than a missing row; users can
  // add a missing line, while a shifted line silently corrupts every field.
  return items.length*100+whole*80+complete*30-fractional*260-Math.min(mismatch,500)
}

// Spatial fallback for sharp documents photographed at any angle. It learns
// the catalogue-number column from repetition across physical rows, then reads
// quantity and the rightmost amount relative to each row. No page percentage
// or supplier-specific column coordinate is used.
export function parseGeometricDeliveryTable(result={}){
  const words=spatialWords(result.elements)
  if(words.length<8)return[]
  const physicalRows=clusterCodeRows(words)
  const candidates=physicalRows.flatMap((row,index)=>rowCodeCandidates(row,index))
  if(!candidates.length)return[]
  const observedWidth=Math.max(...words.map(word=>word.right))-Math.min(...words.map(word=>word.left))
  const column=strongestCodeColumn(candidates,observedWidth)
  if(!column)return[]
  const distinctRows=new Set(column.candidates.map(item=>item.index)).size
  if(distinctRows<2&&physicalRows.length>4)return[]

  const anchors=[...new Set(column.candidates.map(item=>item.index))].map(index=>{
    const choices=candidates.filter(item=>item.index===index)
    return choices.sort((a,b)=>Math.abs(a.x-column.x)-Math.abs(b.x-column.x)||a.words.length-b.words.length||a.code.length-b.code.length)[0]
  }).sort((a,b)=>a.row.y-b.row.y)

  return anchors.map((anchor,index)=>{
    const previous=anchors[index-1],next=anchors[index+1]
    const top=previous?(previous.row.y+anchor.row.y)/2:anchor.row.y-anchor.row.height*1.15
    const bottom=next?(anchor.row.y+next.row.y)/2:anchor.row.y+anchor.row.height*2.8
    const body=words.filter(word=>centerY(word)>=top&&centerY(word)<bottom)
    const anchorNumbers=numericCells(anchor.row.words.filter(word=>word.left>anchor.right))
    if(anchorNumbers.length<2)return null
    const qtyCell=anchorNumbers[0],grossCell=anchorNumbers.at(-1)
    const name=body.filter(word=>word.left>anchor.right&&word.right<qtyCell.left)
      .sort((a,b)=>centerY(a)-centerY(b)||a.left-b.left).map(word=>word.text).join(' ').replace(/\s+/g,' ').trim()
    const qty=qtyCell.value,gross_total=grossCell.value
    if(!name||qty<=0||gross_total<=0)return null
    return{enabled:true,part_no:anchor.code,name,qty,unit_cost:round(gross_total/qty),net_unit_cost:0,net_total:0,vat_rate:23,vat_amount:0,gross_total,confidence:'GOOD',source_line:body.sort((a,b)=>a.top-b.top||a.left-b.left).map(word=>word.text).join(' ')}
  }).filter(Boolean)
}

export function parseFixedSupplierTable(result={}){
  const words=spatialWords(result.elements)
  if(!words.length)return[]
  const priceHeader=closestHeader(words,'cena')
  if(!priceHeader)return[]
  const headerAt=label=>words.filter(word=>folded(word.text).startsWith(label)).sort((a,b)=>Math.abs(centerY(a)-centerY(priceHeader))-Math.abs(centerY(b)-centerY(priceHeader))||a.left-b.left)[0]
  const codeHeader=headerAt('kod'),nameHeader=headerAt('nazwa'),qtyHeader=headerAt('ilosc'),addressHeader=headerAt('adres')
  if(!codeHeader||!nameHeader||!qtyHeader||!priceHeader)return[]
  const headerTolerance=Math.max(28,(priceHeader.bottom-priceHeader.top)*2.25)
  const headerY=Math.max(...words.filter(word=>Math.abs(centerY(word)-centerY(priceHeader))<=headerTolerance).map(word=>word.bottom))
  const valueHeaders=words.filter(word=>folded(word.text).startsWith('wartosc')&&Math.abs(centerY(word)-centerY(priceHeader))<=headerTolerance).sort((a,b)=>a.left-b.left)
  const grossHeader=valueHeaders.at(-1)
  const vatAmountHeader=words.filter(word=>folded(word.text).startsWith('kwota')&&Math.abs(centerY(word)-centerY(priceHeader))<=headerTolerance).sort((a,b)=>b.left-a.left)[0]
  if(!grossHeader)return[]
  const endWord=words.filter(word=>word.top>headerY&&/^(razem|wartosc)$/i.test(folded(word.text))).sort((a,b)=>a.top-b.top)[0]
  const tableBottom=endWord?.top||(Math.max(...words.map(word=>word.bottom))+1)
  const codeLeft=addressHeader?(centerX(addressHeader)+centerX(codeHeader))/2:codeHeader.left-(Number(result.width)||grossHeader.right)*.04
  const codeRight=(centerX(codeHeader)+centerX(nameHeader))/2
  const nameRight=(centerX(nameHeader)+centerX(qtyHeader))/2
  const qtyRight=(centerX(qtyHeader)+centerX(priceHeader))/2
  const grossLeft=vatAmountHeader?(centerX(vatAmountHeader)+centerX(grossHeader))/2:grossHeader.left-(Number(result.width)||grossHeader.right)*.035
  const body=words.filter(word=>word.top>headerY&&word.bottom<tableBottom)
  const codeRows=clusterCodeRows(body.filter(word=>centerX(word)>=codeLeft&&centerX(word)<codeRight))
    .filter(row=>row.words.some(word=>/\d/.test(word.text)))
  return codeRows.map((row,index)=>{
    const next=codeRows[index+1]
    // The code is printed at the beginning of a physical row, while a long
    // product name may wrap two or three lines below it. Keep everything up
    // to the beginning of the next code instead of splitting at the midpoint.
    const top=Math.max(headerY,row.y-row.height*.75)
    const bottom=next?next.y-next.height*.75:tableBottom
    const rowWords=body.filter(word=>centerY(word)>=top&&centerY(word)<bottom)
    const code=row.words.sort((a,b)=>a.left-b.left).map(word=>word.text).join('').replace(/\s+/g,'')
    const name=rowWords.filter(word=>centerX(word)>=codeRight&&centerX(word)<nameRight).sort((a,b)=>centerY(a)-centerY(b)||a.left-b.left).map(word=>word.text).join(' ').replace(/\s+/g,' ').trim()
    const qtyWord=rowWords.filter(word=>centerX(word)>=nameRight&&centerX(word)<qtyRight&&/\d/.test(word.text)).sort((a,b)=>Math.abs(centerX(a)-centerX(qtyHeader))-Math.abs(centerX(b)-centerX(qtyHeader)))[0]
    const grossWord=rowWords.filter(word=>centerX(word)>=grossLeft&&/\d/.test(word.text)).sort((a,b)=>b.right-a.right)[0]
    const qty=amount(qtyWord?.text),gross_total=amount(grossWord?.text)
    if(!normalizePartNumber(code)||!name||qty<=0||gross_total<=0)return null
    return{enabled:true,part_no:normalizePartNumber(code),name,qty,unit_cost:round(gross_total/qty),net_unit_cost:0,net_total:0,vat_rate:23,vat_amount:0,gross_total,confidence:'GOOD',source_line:rowWords.sort((a,b)=>a.left-b.left).map(word=>word.text).join(' ')}
  }).filter(Boolean)
}

export function parseSpatialDeliveryDocument(result={}){
  const visualText=spatialOcrLines(result.elements).join('\n')
  const visual=parseDeliveryDocument(visualText)
  const linear=parseDeliveryDocument(result.text||'')
  const fixed=parseFixedSupplierTable(result)
  const geometric=parseGeometricDeliveryTable(result)
  const referenceTotal=closestDocumentTotal(0,linear.gross_total,visual.gross_total)
  // Prefer complete rows with whole-piece quantities and a sum close to the
  // printed document total. Counting rows alone allowed a shifted table to win
  // even when it interpreted 78.05 or 17.89 as the number of parts.
  const recoveredItems=[fixed,geometric,visual.items,linear.items]
    .sort((a,b)=>deliveryCandidateScore(b,referenceTotal)-deliveryCandidateScore(a,referenceTotal))[0]
  const itemTotals=deliveryDocumentTotals(recoveredItems)
  // ML Kit exposes both a linear text stream and positioned words. A character
  // may be confused in only one representation (for example 180.00 as 184.06),
  // so choose the document total that agrees best with the recovered rows.
  const gross_total=closestDocumentTotal(itemTotals.gross,linear.gross_total,visual.gross_total)
  const items=reconcileDocumentRounding(recoveredItems,gross_total)
  const reconciledTotals=deliveryDocumentTotals(items)
  const warnings=[...new Set([
    ...(items.length?visual.warnings.filter(warning=>!warning.startsWith('Nie rozpoznano pozycji')):visual.warnings),
    ...linear.warnings.filter(warning=>!warning.startsWith('Nie rozpoznano pozycji')),
  ].filter(warning=>!warning.startsWith('Suma odczytanych pozycji')))]
  if(!items.length)warnings.unshift('Nie rozpoznano pozycji tabeli. Zrób zdjęcie prosto nad kartką i obejmij cały obszar od numerów katalogowych do cen brutto.')
  if(gross_total>0&&Math.abs(gross_total-reconciledTotals.gross)>.1)warnings.push(`Suma odczytanych pozycji (${reconciledTotals.gross.toFixed(2)} zł) różni się od wartości dokumentu (${gross_total.toFixed(2)} zł).`)
  return{
    ...linear,
    supplier_name:linear.supplier_name||visual.supplier_name,
    document_no:linear.document_no||visual.document_no,
    document_date:linear.document_date||visual.document_date,
    gross_total,
    items,
    warnings,
    raw_text:visualText||linear.raw_text,
  }
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
    const part_no=normalizePartNumber(source.part_no),name=clean(source.name),qty=amount(source.qty),line_total=round(amount(source.gross_total)),fallbackUnitCost=round(amount(source.unit_cost))
    if(!part_no)throw new Error(`Pozycja ${index+1}: uzupełnij numer katalogowy.`)
    if(!name)throw new Error(`Pozycja ${index+1}: uzupełnij nazwę części.`)
    wholePartQuantity(qty,{label:`Pozycja ${index+1}: ilość części`})
    if((!Number.isFinite(line_total)||line_total<=0)&&(!Number.isFinite(fallbackUnitCost)||fallbackUnitCost<0))throw new Error(`Pozycja ${index+1}: cena zakupu jest niepoprawna.`)
    const unit_cost=line_total>0?round(line_total/qty):fallbackUnitCost
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
