const clean=value=>String(value??'').trim()
const fold=value=>clean(value).replace(/[łŁ]/g,'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl-PL').replace(/[^a-z0-9]+/g,' ').trim()

export const vehicleTitle=vehicle=>[vehicle?.make,vehicle?.model].map(clean).filter(Boolean).join(' ')||'Pojazd bez opisu'
export const vehicleMeta=(vehicle,owner='')=>[clean(owner),clean(vehicle?.plate)&&`rej. ${clean(vehicle.plate)}`].filter(Boolean).join(' · ')||'Brak właściciela i rejestracji'
export const orderTitle=(order,vehicle)=>vehicleTitle(vehicle)
export const orderMeta=(order,vehicle)=>[clean(order?.customer),clean(vehicle?.plate)&&`rej. ${clean(vehicle.plate)}`,clean(order?.title)].filter(Boolean).join(' · ')

export function matchingInventoryParts(stock=[],vehicle={}){
 const make=fold(vehicle.make),model=fold(vehicle.model)
 if(!make||!model)return []
 return stock.filter(row=>{
  const fit=fold(row?.payload?.vehicle_fitment)
  if(!fit||Number(row?.payload?.stock||0)<=0)return false
  // A3 must not match A30; make and model must belong to the same fitment entry.
  return String(row.payload.vehicle_fitment).split(/[\n;|,]/).some(entry=>{
   const normalized=` ${fold(entry)} `
   return normalized.includes(` ${make} `)&&normalized.includes(` ${model} `)
  })
 })
}

export function partitionOrderedParts(rows=[]){
 const archived=new Set(['ZAMONTOWANE','ZWROT_ZAKONCZONY','ANULOWANE'])
 return {current:rows.filter(row=>!archived.has(row?.payload?.status)),archive:rows.filter(row=>archived.has(row?.payload?.status))}
}

const sameDay=(value,now)=>{const date=new Date(value||0);return Number.isFinite(date.getTime())&&date.toDateString()===now.toDateString()}
export function attentionReasons(order,parts=[],now=new Date()){
 const reasons=[]
 if(['WYDANE','GOTOWE'].includes(order?.status)||order?.archived_at)return reasons
 if(order?.wait_state&&order.wait_state!=='BRAK')reasons.push(`Oczekuje: ${clean(order.wait_state).replaceAll('_',' ').toLowerCase()}`)
 const opened=order?.opened_at||order?.created_at||order?.updated_at||order?._record_updated_at
 const openedAt=new Date(opened||0)
 const pendingOrder=!['QC_NAPRAWY','QC_WYDANIA','PLATNOSC'].includes(order?.status)
 const procurement=parts.some(row=>!['DO_ZAMOWIENIA','ANULOWANE','ZWROT_ZAKONCZONY'].includes(row?.payload?.status)&&Boolean(row?.payload?.status))
 if(pendingOrder&&Number.isFinite(openedAt.getTime())&&opened&&openedAt<=now&&!procurement){
  reasons.push(sameDay(opened,now)?'Nowe zlecenie bez zamówionych części':'Nie zamówiono części od dnia przyjęcia')
 }
 const overdue=parts.filter(row=>row?.payload?.expected_at&&Date.parse(row.payload.expected_at)<now.getTime()&&!['ODEBRANE','DOSTARCZONE','ZAMONTOWANE','ANULOWANE','ZWROT_ZAKONCZONY'].includes(row.payload.status))
 if(overdue.length)reasons.push(`Opóźniona dostawa części (${overdue.length})`)
 return reasons
}
