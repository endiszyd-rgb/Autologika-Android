import {matchesSearch} from './mobile-search.js'
import {resolveOrderVehicle} from './order-vehicle.js'
import {sameRecordId} from './record-id.js'

const pad=value=>String(value).padStart(2,'0')

export function localDate(value=new Date()){
 const date=value instanceof Date?value:new Date(value)
 return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}

export function localTime(value=new Date()){
 const date=value instanceof Date?value:new Date(value)
 return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function appointmentForm(row,now=new Date()){
 const start=row?.payload?.start_at?new Date(row.payload.start_at):new Date(now.getTime()+60*60*1000)
 start.setMinutes(Math.ceil(start.getMinutes()/15)*15,0,0)
 const end=row?.payload?.end_at?new Date(row.payload.end_at):new Date(start.getTime()+60*60*1000)
 return {order_cloud_id:row?.payload?.order_cloud_id||'',title:row?.payload?.title||'',date:localDate(start),start_time:localTime(start),end_date:localDate(end),end_time:localTime(end),bay:row?.payload?.bay||'Stanowisko 1',status:row?.payload?.status||'PLAN',notes:row?.payload?.notes||''}
}

export function appointmentPayload(form){
 const start=new Date(`${form.date}T${form.start_time}:00`),end=new Date(`${form.end_date||form.date}T${form.end_time}:00`)
 if(!String(form.title||'').trim())throw new Error('Wpisz tytuł wizyty.')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date)||!/^\d{2}:\d{2}$/.test(form.start_time)||!/^\d{4}-\d{2}-\d{2}$/.test(form.end_date||form.date)||!/^\d{2}:\d{2}$/.test(form.end_time)||Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))throw new Error('Sprawdź datę i godzinę wizyty.')
 if(end<=start)throw new Error('Koniec wizyty musi być później niż początek.')
 return {order_cloud_id:form.order_cloud_id||'',title:String(form.title).trim(),start_at:start.toISOString(),end_at:end.toISOString(),bay:String(form.bay||'Stanowisko 1').trim(),status:form.status||'PLAN',notes:String(form.notes||'').trim()}
}

export function scheduleDays(rows,now=new Date()){
 const today=localDate(now),tomorrowDate=new Date(now);tomorrowDate.setDate(tomorrowDate.getDate()+1);const tomorrow=localDate(tomorrowDate)
 const groups=new Map()
 ;[...(rows||[])].sort((a,b)=>Date.parse(a.payload?.start_at||0)-Date.parse(b.payload?.start_at||0)).forEach(row=>{
  const key=localDate(row.payload?.start_at)
  const label=key===today?'Dzisiaj':key===tomorrow?'Jutro':new Date(`${key}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long'})
  if(!groups.has(key))groups.set(key,{key,label,rows:[]})
  groups.get(key).rows.push(row)
 })
 return [...groups.values()]
}

export const appointmentStatuses=['PLAN','POTWIERDZONY','W_TRAKCIE','ZAKONCZONY']
export function nextAppointmentStatus(status){const index=appointmentStatuses.indexOf(status);return appointmentStatuses[Math.min(Math.max(index,0)+1,appointmentStatuses.length-1)]}

export function appointmentStatusLabel(status){return ({PLAN:'PLAN',POTWIERDZONY:'POTWIERDZONY',W_TRAKCIE:'W TRAKCIE',ZAKONCZONY:'ZAKOŃCZONY',ANULOWANY:'ANULOWANY'})[status]||String(status||'PLAN').replaceAll('_',' ')}

export function appointmentSearch(row,order){return {...(row.payload||{}),order:order?.payload||{}}}

const closedOrder=status=>['WYDANE','CLOSED','DONE'].includes(String(status||'').toUpperCase())
const partKind=kind=>['CZESC','CZĘŚĆ','PART'].includes(String(kind||'').toUpperCase())

export function scheduleOrderChoices(orders=[],vehicles=[],items=[],query=''){
 return (orders||[]).filter(row=>!closedOrder(row.payload?.status)&&!row.payload?.archived_at).map(order=>{
  const payload=order.payload||{},vehicle=resolveOrderVehicle(payload,vehicles).display
  const work=(items||[]).filter(item=>sameRecordId(item.payload?.order_cloud_id,order.cloud_id)&&!partKind(item.payload?.kind)).map(item=>String(item.payload?.work_name||item.payload?.name||'').trim()).filter(Boolean)
  const choice={order,vehicle,plate:vehicle.plate||payload.plate||'',vehicleName:[vehicle.make||payload.make,vehicle.model||payload.model].filter(Boolean).join(' '),customer:payload.customer||'',title:payload.title||'Zlecenie warsztatowe',workSummary:work.slice(0,4).join(' • '),workCount:work.length}
  return choice
 }).filter(choice=>matchesSearch(choice,query))
}
