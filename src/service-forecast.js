const DAY=86400000

export const SERVICE_RULES=[
 {id:'oil',title:'Olej silnikowy i filtr',months:12,km:15000,terms:['wymiana oleju','olej silnikowy','serwis olejowy']},
 {id:'inspection',title:'Przegląd okresowy',months:12,terms:['przegląd okresowy','przegląd roczny','serwis okresowy','inspekcja okresowa']},
 {id:'brake-fluid',title:'Płyn hamulcowy',months:24,terms:['wymiana płynu hamulcowego','płyn hamulcowy']},
 {id:'cabin-filter',title:'Filtr kabinowy',months:12,km:15000,terms:['filtr kabinowy','filtr przeciwpyłkowy']},
 {id:'air-filter',title:'Filtr powietrza silnika',months:24,km:30000,terms:['filtr powietrza','filtra powietrza']},
 {id:'ac',title:'Kontrola klimatyzacji',months:24,terms:['serwis klimatyzacji','kontrola klimatyzacji','napełnienie klimatyzacji']}
]

const fold=value=>String(value||'').toLocaleLowerCase('pl').replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const dateMs=value=>{const ms=new Date(value||'').getTime();return Number.isFinite(ms)?ms:0}
const isoDate=ms=>new Date(ms).toISOString().slice(0,10)
const addMonths=(value,months)=>{const date=new Date(value);date.setUTCMonth(date.getUTCMonth()+months);return date.getTime()}
const completed=order=>['GOTOWE','WYDANE','CLOSED','DONE'].includes(String(order.status||'').toUpperCase())
const orderDate=order=>dateMs(order.released_at||order.closed_at||order.opened_at||order.created_at)
const orderText=order=>fold([order.title,order.complaint,order.service_text,order.items_text,order.work_names].join(' '))

export function forecastUrgency(dueDate,dueMileage,currentMileage,now=Date.now()){
 const days=dueDate?Math.ceil((dateMs(dueDate)-now)/DAY):null,km=dueMileage!=null?Number(dueMileage)-Number(currentMileage||0):null
 if((days!=null&&days<0)||(km!=null&&km<0))return{state:'OVERDUE',label:'po terminie',rank:0,daysLeft:days,kmLeft:km}
 if((days!=null&&days<=30)||(km!=null&&km<=1500))return{state:'SOON',label:'wkrótce',rank:1,daysLeft:days,kmLeft:km}
 return{state:'PLANNED',label:'zaplanować',rank:2,daysLeft:days,kmLeft:km}
}

export function attachServiceHistory(orders=[],items=[]){
 const names=new Map()
 for(const record of items){const item=record?.payload||record||{},orderId=String(item.order_cloud_id||item.order_id||'');if(!orderId||String(item.kind||'').toUpperCase()!=='ROBOCIZNA')continue;const name=String(item.work_name||item.name||'').trim();if(name)names.set(orderId,[...(names.get(orderId)||[]),name])}
 return orders.map(order=>({...order,service_text:[order.service_text,...(names.get(String(order.id||order.cloud_id||''))||[])].filter(Boolean).join(' | ')}))
}

export function buildServiceForecast(input={},options={}){
 const now=dateMs(options.now)||Date.now(),vehicle=input.vehicle||{},orders=input.orders||[],reminders=input.reminders||[],currentMileage=Number(vehicle.mileage||0),openReminders=reminders.filter(row=>String(row.status||'OPEN').toUpperCase()==='OPEN')
 const manual=openReminders.map(row=>{const u=forecastUrgency(row.due_date,row.due_mileage,currentMileage,now);return{id:`reminder:${row.id||row.cloud_id||row.title}`,ruleId:null,title:row.title||'Zaplanowana obsługa',dueDate:row.due_date||null,dueMileage:row.due_mileage==null?null:Number(row.due_mileage),source:'REMINDER',sourceLabel:'zapisane przypomnienie',confidence:'HIGH',...u}})
 const inferred=[]
 for(const rule of SERVICE_RULES){const match=orders.filter(completed).filter(order=>rule.terms.some(term=>orderText(order).includes(fold(term)))).sort((a,b)=>orderDate(b)-orderDate(a))[0];if(!match)continue;const lastDate=orderDate(match);if(!lastDate)continue;const dueDate=isoDate(addMonths(lastDate,rule.months)),mileageAtService=Number(match.mileage_snapshot||match.service_mileage||0),dueMileage=rule.km&&mileageAtService?mileageAtService+rule.km:null,duplicate=manual.some(row=>fold(row.title).includes(fold(rule.title))||rule.terms.some(term=>fold(row.title).includes(fold(term))));if(duplicate)continue;const u=forecastUrgency(dueDate,dueMileage,currentMileage,now);inferred.push({id:`forecast:${rule.id}`,ruleId:rule.id,title:rule.title,dueDate,dueMileage,source:'HISTORY',sourceLabel:`historia: ${isoDate(lastDate)}`,confidence:orderText(match).includes(fold(rule.title))?'HIGH':'MEDIUM',intervalMonths:rule.months,intervalKm:rule.km||null,lastServiceDate:isoDate(lastDate),...u})}
 const rows=[...manual,...inferred].sort((a,b)=>a.rank-b.rank||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))).slice(0,6)
 return{rows,overdue:rows.filter(row=>row.state==='OVERDUE').length,soon:rows.filter(row=>row.state==='SOON').length,coverage:inferred.length?Math.min(100,35+inferred.length*15):openReminders.length?35:0,calculatedAt:new Date(now).toISOString(),version:'service-forecast-v1'}
}
