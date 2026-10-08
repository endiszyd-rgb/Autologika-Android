import test from 'node:test'
import assert from 'node:assert/strict'
import {appointmentConflicts,appointmentsOnDay,findingPayload,orderAmount,repairHistory,searchWorkCatalog,weekDates} from '../src/workshop-review.js'
import {attentionReasons,matchingInventoryParts} from '../src/workshop-logic.js'
import {deriveMobileOrderWorkflow} from '../src/order-workflow.js'
import {buildVehicleHealth} from '../src/vehicle-health.js'

test('historia grupuje prace w naprawy i zachowuje zlecenia otwarte oraz wydane',()=>{
 const orders=[{cloud_id:'a',payload:{vehicle_cloud_id:7,status:'WYDANE',opened_at:'2026-09-01'}},{cloud_id:'b',payload:{vehicle_cloud_id:'7',status:'NAPRAWA',opened_at:'2026-10-05'}},{cloud_id:'c',payload:{vehicle_cloud_id:8,status:'NAPRAWA'}}]
 const items=[{payload:{order_cloud_id:'a',name:'Hamulce'}},{payload:{order_cloud_id:'a',name:'Płyn'}}]
 const history=repairHistory(orders,'7',items)
 assert.deepEqual(history.map(row=>row.cloud_id),['b','a'])
 assert.deepEqual(history[1].work,['Hamulce','Płyn'])
 assert.deepEqual(repairHistory(orders,'',items),[])
})

test('wyszukiwarka prac odnajduje wariant poza aktualną grupą i ignoruje polskie znaki',()=>{
 const catalog=[{group:'Hamulce',jobs:[{name:'Wymiana płynu',variants:[{name:'Odpowietrzanie ABS'}]}]},{group:'Silnik',jobs:[{name:'Olej',variants:[]}]}]
 assert.equal(searchWorkCatalog(catalog,'plynu abs')[0].group,'Hamulce')
 assert.equal(searchWorkCatalog(catalog,'rozrząd').length,0)
})

test('planer wykrywa kolizję na stanowisku, pomija własną i anulowaną wizytę',()=>{
 const payload={title:'Wizyta',bay:'1',start_at:'2026-10-05T10:00:00Z',end_at:'2026-10-05T11:00:00Z',status:'PLAN'}
 const rows=[{cloud_id:'a',payload},{cloud_id:'b',payload:{...payload,bay:'2'}},{cloud_id:'c',payload:{...payload,status:'ANULOWANY'}},{cloud_id:'d',payload:{...payload,start_at:payload.end_at,end_at:'2026-10-05T12:00:00Z'}}]
 assert.deepEqual(appointmentConflicts(rows,payload).map(row=>row.cloud_id),['a'])
 assert.equal(appointmentConflicts(rows,payload,'a').length,0)
})

test('wizyta przechodząca przez północ jest widoczna w obu dniach, tydzień od poniedziałku',()=>{
 const rows=[{payload:{start_at:new Date('2026-10-05T23:00:00').toISOString(),end_at:new Date('2026-10-06T02:00:00').toISOString()}}]
 assert.equal(appointmentsOnDay(rows,'2026-10-05').length,1)
 assert.equal(appointmentsOnDay(rows,'2026-10-06').length,1)
 assert.equal(appointmentsOnDay(rows,'2026-10-07').length,0)
 assert.deepEqual(weekDates('2026-10-11'),['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11'])
})

test('kontrola pojazdu zmienia ocenę, a usunięcie usterki przywraca punkty',()=>{
 const vehicle={vin:'VIN',mileage:100000},form={category:'Hamulce',title:'Wyciek płynu',severity:'CRITICAL',status:'OPEN'}
 const finding=findingPayload(form,'v','o',new Date('2026-10-05'))
 assert.equal(finding.vehicle_cloud_id,'v')
 const bad=buildVehicleHealth({vehicle,findings:[finding]})
 const good=buildVehicleHealth({vehicle,findings:[{...finding,status:'RESOLVED'}]})
 assert.ok(good.score>bad.score)
 assert.equal(good.issueCount,0)
 assert.throws(()=>findingPayload(form,'','o'),/przypisz pojazd/)
 assert.throws(()=>findingPayload({...form,title:' '},'v','o'),/wynik kontroli/)
})

test('diagnoza identyfikuje zlecenie UUID, więc zakończona diagnoza nie zaniża oceny',()=>{
 const health=buildVehicleHealth({vehicle:{vin:'VIN',mileage:100000},orders:[{id:'order-uuid',status:'NAPRAWA',title:'Hamulce'}],diagnostics:[{order_id:'order-uuid',conclusion:'Naprawa potwierdzona'}]})
 assert.equal(health.issueCount,0)
})

test('część nie pasuje na podstawie fragmentu modelu lub połączenia dwóch aut',()=>{
 const rows=[{payload:{stock:2,vehicle_fitment:'AUDI A30'}},{payload:{stock:2,vehicle_fitment:'Audi A4; VW A3'}},{payload:{stock:2,vehicle_fitment:'Audi A3 2010-2018'}}]
 assert.equal(matchingInventoryParts(rows,{make:'Audi',model:'A3'}).length,1)
 assert.equal(matchingInventoryParts(rows,{make:'Audi'}).length,0)
})

test('części wpisane jako do zamówienia nie wyłączają uwagi, złożone zamówienie wyłącza',()=>{
 const order={status:'PRZYJETE',opened_at:'2026-10-05T08:00:00Z'},now=new Date('2026-10-05T17:00:00Z')
 assert.equal(attentionReasons(order,[{payload:{status:'DO_ZAMOWIENIA'}}],now).length,1)
 assert.equal(attentionReasons(order,[{payload:{status:'ZAMOWIONE'}}],now).length,0)
 assert.match(attentionReasons({...order,opened_at:'2026-10-04T08:00:00Z'},[],now)[0],/od dnia przyjęcia/)
 assert.equal(attentionReasons({...order,status:'WYDANE'},[],now).length,0)
})

test('QC wydania poprzedza płatność, a QC naprawy ma odrębny ekran',()=>{
 const input={order:{status:'GOTOWE'},diagnosis:{conclusion:'Naprawa'},items:[{}],approvals:[{payload:{status:'APPROVED'}}],logs:[{payload:{ended_at:'2026-10-05'}}],qc:[{payload:{key:'documents',checked:true}}],total:100}
 const unpaid=deriveMobileOrderWorkflow(input)
 assert.equal(unpaid.next.key,'releaseQc')
 assert.equal(unpaid.steps.find(row=>row.key==='repairQc').tab,'repairQc')
 const paid=deriveMobileOrderWorkflow({...input,payments:[{payload:{amount:100}}]})
 assert.equal(paid.next.key,'releaseQc')
 const checked=deriveMobileOrderWorkflow({...input,qc:[...input.qc,{payload:{key:'final',checked:true}}]})
 assert.equal(checked.next.key,'payment')
})

test('wartość kafelka i historii uwzględnia zakres prac i cenę końcową',()=>{
 const order={cloud_id:'o',payload:{total:0}},items=[{payload:{order_cloud_id:'o',qty:2,unit_price:100}}]
 assert.equal(orderAmount(order,items),200)
 assert.equal(orderAmount({...order,payload:{final_price:150}},items),150)
 assert.equal(orderAmount({...order,payload:{final_price:0}},items),0)
 assert.equal(orderAmount({...order,payload:{total:50}},[]),50)
})

test('odebrane części z dawnym terminem dostawy nie są zgłaszane jako opóźnione',()=>{
 const order={status:'NAPRAWA',opened_at:'2026-10-04T08:00:00Z'},now=new Date('2026-10-05T17:00:00Z')
 const reasons=attentionReasons(order,[{payload:{status:'ODEBRANE',expected_at:'2026-10-04T12:00:00Z'}}],now)
 assert.equal(reasons.length,0)
 assert.match(attentionReasons(order,[{payload:{status:'W_DRODZE',expected_at:'2026-10-04T12:00:00Z'}}],now)[0],/Opóźniona dostawa/)
})
