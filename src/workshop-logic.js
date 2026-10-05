const clean=value=>String(value??'').trim()
const fold=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl-PL')

export const vehicleTitle=vehicle=>[vehicle?.make,vehicle?.model].map(clean).filter(Boolean).join(' ')||'Pojazd bez opisu'
export const vehicleMeta=(vehicle,owner='')=>[clean(owner),clean(vehicle?.plate)&&`rej. ${clean(vehicle.plate)}`].filter(Boolean).join(' · ')||'Brak właściciela i rejestracji'
export const orderTitle=(order,vehicle)=>vehicleTitle(vehicle)
export const orderMeta=(order,vehicle)=>[clean(order?.customer),clean(vehicle?.plate)&&`rej. ${clean(vehicle.plate)}`,clean(order?.title)].filter(Boolean).join(' · ')

export function matchingInventoryParts(stock=[],vehicle={}){
 const make=fold(vehicle.make),model=fold(vehicle.model)
 if(!make&&!model)return []
 return stock.filter(row=>{
  const fit=fold(row?.payload?.vehicle_fitment)
  if(!fit||Number(row?.payload?.stock||0)<=0)return false
  return (!make||fit.includes(make))&&(!model||fit.includes(model))
 })
}

export function partitionOrderedParts(rows=[]){
 const archived=new Set(['ZAMONTOWANE','ZWROT_ZAKONCZONY','ANULOWANE'])
 return {current:rows.filter(row=>!archived.has(row?.payload?.status)),archive:rows.filter(row=>archived.has(row?.payload?.status))}
}

const sameDay=(value,now)=>{const date=new Date(value||0);return Number.isFinite(date.getTime())&&date.toDateString()===now.toDateString()}
export function attentionReasons(order,parts=[],now=new Date()){
 const reasons=[]
 if(order?.wait_state&&order.wait_state!=='BRAK')reasons.push(`Oczekuje: ${clean(order.wait_state).replaceAll('_',' ').toLowerCase()}`)
 const opened=order?.opened_at||order?.created_at||order?.updated_at||order?._record_updated_at
 if(sameDay(opened,now)&&!parts.length)reasons.push('Nowe zlecenie bez zamówionych części')
 return reasons
}
