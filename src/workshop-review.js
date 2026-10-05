import {sameRecordId} from './record-id.js'
import {matchesSearch} from './mobile-search.js'
import {localDate} from './schedule-model.js'

export function orderAmount(order,items=[]){
 const payload=order?.payload||{}
 if(payload.final_price!==null&&payload.final_price!==undefined)return Number(payload.final_price)||0
 const linked=items.filter(row=>sameRecordId(row.payload?.order_cloud_id,order.cloud_id))
 return linked.length?linked.reduce((sum,row)=>sum+Number(row.payload.qty||1)*Number(row.payload.unit_price||0),0):Number(payload.total)||0
}

export function repairHistory(orders=[],vehicleId,items=[]){
 if(!vehicleId)return []
 return orders.filter(row=>sameRecordId(row.payload?.vehicle_cloud_id,vehicleId)).map(row=>({
  ...row,amount:orderAmount(row,items),work:items.filter(item=>sameRecordId(item.payload?.order_cloud_id,row.cloud_id)).map(item=>item.payload?.name||item.payload?.work_name).filter(Boolean)
 })).sort((a,b)=>(Date.parse(b.payload?.opened_at||b.payload?.created_at||b.updated_at)||0)-(Date.parse(a.payload?.opened_at||a.payload?.created_at||a.updated_at)||0))
}

export function searchWorkCatalog(catalog=[],query=''){
 return catalog.flatMap(group=>group.jobs.map(job=>({...job,group:group.group}))).filter(job=>matchesSearch(job,query))
}

export function appointmentConflicts(rows=[],payload={},excludeId=''){
 if(payload.status==='ANULOWANY')return []
 const start=Date.parse(payload.start_at),end=Date.parse(payload.end_at)
 return rows.filter(row=>!sameRecordId(row.cloud_id,excludeId)&&row.payload?.status!=='ANULOWANY'&&row.payload?.bay===payload.bay&&Date.parse(row.payload.start_at)<end&&Date.parse(row.payload.end_at)>start)
}

export function appointmentsOnDay(rows=[],day){
 const start=new Date(`${day}T00:00:00`),end=new Date(start);end.setDate(end.getDate()+1)
 return rows.filter(row=>Date.parse(row.payload?.start_at)<end.getTime()&&Date.parse(row.payload?.end_at)>start.getTime()).sort((a,b)=>Date.parse(a.payload.start_at)-Date.parse(b.payload.start_at))
}

export function weekDates(value=new Date()){
 const start=value instanceof Date?new Date(value):new Date(`${value}T12:00:00`)
 start.setDate(start.getDate()-((start.getDay()+6)%7))
 return Array.from({length:7},(_,index)=>{const day=new Date(start);day.setDate(start.getDate()+index);return localDate(day)})
}

export function findingPayload(form,vehicleId,orderId,now=new Date()){
 if(!vehicleId)throw new Error('Najpierw przypisz pojazd do zlecenia.')
 if(!String(form.title||'').trim())throw new Error('Opisz wynik kontroli pojazdu.')
 return {vehicle_cloud_id:vehicleId,order_cloud_id:orderId,category:form.category,title:String(form.title).trim(),details:String(form.details||'').trim(),severity:form.severity||'INFO',status:form.status||'OPEN',created_at:form.created_at||now.toISOString(),resolved_at:form.status==='RESOLVED'?now.toISOString():null}
}
