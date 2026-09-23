function lines(value=''){
 const seen=new Set()
 return String(value||'').split(/[\n;,]+/).map(item=>item.trim()).filter(item=>{
  const key=item.toLocaleUpperCase('pl-PL')
  if(!item||seen.has(key))return false
  seen.add(key)
  return true
 })
}

export function orderPartDraft(item={}){
 const references=lines(item.cross_numbers)
 return {
  barcode:String(item.barcode||'').trim(),
  name:String(item.name||'').trim(),
  brand:String(item.brand||'').trim(),
  part_no:String(item.part_no||'').trim(),
  oe_number:references[0]||'',
  qty:'1',
  unit_cost:String(item.unit_cost||0),
  unit_price:String(item.sell_price||item.unit_price||0),
  supplier:'',
  status:'DO_ZAMOWIENIA',
  vehicle_fitment:String(item.vehicle_fitment||'').trim(),
  cross_numbers:references.join('\n'),
  lookup_source:String(item.lookup_source||'').trim(),
  lookup_url:String(item.lookup_url||'').trim()
 }
}

export function partLookupMessage(item={},fromStock=false){
 if(fromStock)return 'Część znaleziona w magazynie. Dane możesz poprawić przed dodaniem do zlecenia.'
 const details=[item.brand,item.part_no,item.cross_numbers,item.vehicle_fitment].filter(Boolean).length
 return details>=3
  ?'Znaleziono komplet danych produktu. Sprawdź numer OE i zgodność z pojazdem.'
  :'Znaleziono produkt. Uzupełnij brakujące dane i potwierdź numer OE dla pojazdu.'
}
