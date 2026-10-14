import {matchesSearch} from './mobile-search.js'
import {resolveOrderVehicle} from './order-vehicle.js'
import {sameRecordId} from './record-id.js'
import {DEFAULT_WORKSHOP_LAYOUT,normalizeWorkshopLayout} from './workshop-settings.js'

const pad=value=>String(value).padStart(2,'0')

export function localDate(value=new Date()){
 const date=value instanceof Date?value:new Date(value)
 return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}

export function localTime(value=new Date()){
 const date=value instanceof Date?value:new Date(value)
 return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function appointmentForm(row,now=new Date(),workshop=DEFAULT_WORKSHOP_LAYOUT){
 const layout=normalizeWorkshopLayout(workshop),start=row?.payload?.start_at?new Date(row.payload.start_at):new Date(now.getTime()+60*60*1000)
 if(!row?.payload?.start_at&&(start.getHours()<layout.openingHour||start.getHours()>=layout.closingHour)){if(start.getHours()>=layout.closingHour)start.setDate(start.getDate()+1);start.setHours(layout.openingHour,0,0,0)}
 start.setMinutes(Math.ceil(start.getMinutes()/15)*15,0,0)
 const end=row?.payload?.end_at?new Date(row.payload.end_at):new Date(start.getTime()+layout.defaultAppointmentMinutes*60000)
 return {order_cloud_id:row?.payload?.order_cloud_id||'',title:row?.payload?.title||'',date:localDate(start),start_time:localTime(start),end_date:localDate(end),end_time:localTime(end),bay:row?.payload?.bay||layout.bays[0],status:row?.payload?.status||'PLAN',notes:row?.payload?.notes||''}
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

export function resourceCalendar(resource={}){
 const source=resource?.payload||resource||{},value=source.calendar??source.work_calendar_json
 if(value&&typeof value==='object')return value
 try{return JSON.parse(value||'{}')}catch{return {}}
}

const clockMinutes=value=>{const match=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));if(!match)return null;const result=Number(match[1])*60+Number(match[2]);return result>=0&&result<=1440?result:null}
const warsawParts=value=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).reduce((out,part)=>(out[part.type]=part.value,out),{});return{weekday:{Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0}[parts.weekday],date:`${parts.year}-${parts.month}-${parts.day}`,minutes:Number(parts.hour)*60+Number(parts.minute)}}
const overlaps=(a,b)=>Date.parse(a.start_at)<Date.parse(b.end_at)&&Date.parse(a.end_at)>Date.parse(b.start_at)

export function normalizeResourceCalendar(value={}){
 const weekdays=(value.weekdays||[1,2,3,4,5]).map(Number).filter(day=>day>=0&&day<=6),start=String(value.start||'08:00'),end=String(value.end||'17:00')
 if(!weekdays.length||clockMinutes(start)===null||clockMinutes(end)===null||clockMinutes(end)<=clockMinutes(start))throw new Error('Sprawdź dni i godziny pracy zasobu.')
 return {weekdays:[...new Set(weekdays)].sort(),start,end}
}

export function appointmentResourceIssues({resources=[],unavailability=[],links=[],appointments=[],resourceIds=[],payload={},excludeId=''}){
 const ids=[...new Set((resourceIds||[]).filter(Boolean).map(String))],start=warsawParts(payload.start_at),end=warsawParts(payload.end_at),issues=[]
 for(const id of ids){
  const resource=resources.find(row=>String(row.cloud_id)===id),data=resource?.payload||{}
  if(!resource||data.active===false)continue
  const calendar=resourceCalendar(resource)
  if(Object.keys(calendar).length){
   const days=(calendar.weekdays||[]).map(Number),from=clockMinutes(calendar.start),to=clockMinutes(calendar.end),inside=start.date===end.date&&days.includes(start.weekday)&&from!==null&&to!==null&&start.minutes>=from&&end.minutes<=to
   if(!inside)issues.push({kind:'OUTSIDE_CALENDAR',resource,reason:'poza kalendarzem pracy'})
  }
  const blocked=unavailability.filter(row=>String(row.payload?.resource_cloud_id)===id&&overlaps(row.payload,payload))
  if(blocked.length)issues.push({kind:'UNAVAILABLE',resource,reason:blocked[0].payload?.reason||'zasób niedostępny',rows:blocked})
  const linkedIds=new Set(links.filter(link=>String(link.payload?.resource_cloud_id)===id&&String(link.payload?.appointment_cloud_id)!==String(excludeId)).map(link=>String(link.payload?.appointment_cloud_id)))
  const occupied=appointments.filter(row=>linkedIds.has(String(row.cloud_id))&&row.payload?.status!=='ANULOWANY'&&overlaps(row.payload,payload)),capacity=Math.max(1,Math.round(Number(data.capacity)||1))
  if(occupied.length>=capacity)issues.push({kind:'CAPACITY',resource,reason:`pełna pojemność (${capacity})`,rows:occupied})
 }
 return issues
}

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
