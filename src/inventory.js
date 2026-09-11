import {isGtin,normalizeBarcode} from './part-catalog.js'

const text=value=>String(value??'').trim()
const number=(value,label)=>{
  const parsed=Number(value??0)
  if(!Number.isFinite(parsed)||parsed<0)throw new Error(`${label}: wpisz liczbę równą lub większą od zera.`)
  return parsed
}
const lines=value=>{
  const seen=new Set(),result=[]
  for(const entry of text(value).split(/[\n;,]+/)){
    const clean=entry.trim().replace(/\s+/g,' '),key=clean.toLocaleUpperCase('pl-PL')
    if(clean&&!seen.has(key)){seen.add(key);result.push(clean)}
  }
  return result.join('\n')
}

export function inventoryPayload(draft={}){
  const barcode=normalizeBarcode(draft.barcode),name=text(draft.name)
  if(!name)throw new Error('Wpisz nazwę części.')
  if(barcode&&!isGtin(barcode))throw new Error('Kod kreskowy nie jest poprawnym EAN, UPC ani GTIN.')
  return {
    barcode,name,brand:text(draft.brand),part_no:text(draft.part_no),category:text(draft.category),description:'',
    vehicle_fitment:lines(draft.vehicle_fitment),cross_numbers:lines(draft.cross_numbers),image_url:text(draft.image_url),
    lookup_source:text(draft.lookup_source),lookup_url:text(draft.lookup_url),stock:number(draft.stock,'Stan magazynowy'),
    min_stock:number(draft.min_stock,'Stan minimalny'),unit_cost:number(draft.unit_cost,'Cena zakupu'),
    sell_price:number(draft.sell_price,'Cena sprzedaży'),location:text(draft.location),notes:text(draft.notes)
  }
}

export function adjustedStock(current,delta){
  return Math.max(0,Number(current||0)+Number(delta||0))
}
