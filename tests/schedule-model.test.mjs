import test from 'node:test'
import assert from 'node:assert/strict'
import {appointmentForm,appointmentPayload,appointmentResourceIssues,nextAppointmentStatus,normalizeResourceCalendar,scheduleDays,scheduleOrderChoices} from '../src/schedule-model.js'

test('formularz terminarza zachowuje wizytę przechodzącą na kolejny dzień',()=>{
 const payload=appointmentPayload({title:'Diagnostyka',date:'2026-09-23',start_time:'23:30',end_date:'2026-09-24',end_time:'00:30',bay:'Stanowisko 2',status:'PLAN'})
 const form=appointmentForm({payload})
 assert.equal(form.date,'2026-09-23')
 assert.equal(form.end_date,'2026-09-24')
 assert.equal(form.start_time,'23:30')
 assert.equal(form.end_time,'00:30')
})

test('terminarz grupuje i sortuje wizyty według lokalnego dnia',()=>{
 const rows=[{cloud_id:'b',payload:{start_at:'2026-09-24T09:00:00+02:00'}},{cloud_id:'a',payload:{start_at:'2026-09-23T12:00:00+02:00'}},{cloud_id:'c',payload:{start_at:'2026-09-23T08:00:00+02:00'}}]
 const groups=scheduleDays(rows,new Date('2026-09-23T06:00:00+02:00'))
 assert.equal(groups[0].label,'Dzisiaj')
 assert.deepEqual(groups[0].rows.map(row=>row.cloud_id),['c','a'])
 assert.equal(groups[1].label,'Jutro')
})

test('status wizyty przechodzi przez kolejne etapy',()=>{
 assert.equal(nextAppointmentStatus('PLAN'),'POTWIERDZONY')
 assert.equal(nextAppointmentStatus('POTWIERDZONY'),'W_TRAKCIE')
 assert.equal(nextAppointmentStatus('W_TRAKCIE'),'ZAKONCZONY')
 assert.equal(nextAppointmentStatus('ZAKONCZONY'),'ZAKONCZONY')
})

test('nowa wizyta korzysta z godzin, długości i stanowiska warsztatu',()=>{
 const form=appointmentForm(undefined,new Date('2026-09-23T19:20:00+02:00'),{bays:['Podnośnik A'],openingHour:7,closingHour:18,defaultAppointmentMinutes:90})
 assert.equal(form.date,'2026-09-24')
 assert.equal(form.start_time,'07:00')
 assert.equal(form.end_time,'08:30')
 assert.equal(form.bay,'Podnośnik A')
})

test('nowa wizyta pokazuje aktywne zlecenia z autem, klientem i zakresem prac',()=>{
 const orders=[
  {cloud_id:'o1',payload:{vehicle_cloud_id:'v1',title:'Naprawa hamulców',customer:'Jan Kowalski',status:'NAPRAWA'}},
  {cloud_id:'o2',payload:{title:'Zakończone',status:'WYDANE'}}
 ]
 const vehicles=[{cloud_id:'v1',payload:{plate:'PO 7TEST',make:'Audi',model:'A4 Avant'}}]
 const items=[
  {payload:{order_cloud_id:'o1',kind:'LABOR',name:'Diagnostyka układu hamulcowego'}},
  {payload:{order_cloud_id:'o1',kind:'ROBOCIZNA',work_name:'Wymiana klocków hamulcowych'}},
  {payload:{order_cloud_id:'o1',kind:'CZĘŚĆ',name:'Klocki hamulcowe'}}
 ]
 const choices=scheduleOrderChoices(orders,vehicles,items,'audi diagnostyka')
 assert.equal(choices.length,1)
 assert.equal(choices[0].plate,'PO 7TEST')
 assert.equal(choices[0].customer,'Jan Kowalski')
 assert.equal(choices[0].workCount,2)
 assert.match(choices[0].workSummary,/Diagnostyka.*Wymiana/)
})

test('zasób respektuje warszawskie godziny pracy i zaplanowaną niedostępność',()=>{
 const resources=[{cloud_id:'mechanic-1',payload:{name:'Jan',capacity:1,work_calendar_json:JSON.stringify({weekdays:[1,2,3,4,5],start:'08:00',end:'16:00'})}}],base={resources,resourceIds:['mechanic-1'],links:[],appointments:[]}
 assert.equal(appointmentResourceIssues({...base,payload:{start_at:'2026-10-12T05:00:00.000Z',end_at:'2026-10-12T06:00:00.000Z'}})[0].kind,'OUTSIDE_CALENDAR')
 const unavailability=[{payload:{resource_cloud_id:'mechanic-1',start_at:'2026-10-12T08:00:00.000Z',end_at:'2026-10-12T10:00:00.000Z',reason:'Szkolenie'}}]
 const issues=appointmentResourceIssues({...base,unavailability,payload:{start_at:'2026-10-12T08:30:00.000Z',end_at:'2026-10-12T09:30:00.000Z'}})
 assert.equal(issues[0].kind,'UNAVAILABLE')
 assert.equal(issues[0].reason,'Szkolenie')
})

test('pojemność zasobu dopuszcza równoległe wizyty wyłącznie do limitu',()=>{
 const resource={cloud_id:'lift-1',payload:{name:'Strefa szybka',capacity:2,calendar:{weekdays:[1],start:'08:00',end:'18:00'}}},payload={start_at:'2026-10-12T08:00:00.000Z',end_at:'2026-10-12T09:00:00.000Z'},appointments=[{cloud_id:'a',payload},{cloud_id:'b',payload}],links=['a','b'].map(id=>({payload:{appointment_cloud_id:id,resource_cloud_id:'lift-1'}}))
 assert.equal(appointmentResourceIssues({resources:[resource],resourceIds:['lift-1'],appointments,links,payload,excludeId:'b'}).length,0)
 const issues=appointmentResourceIssues({resources:[resource],resourceIds:['lift-1'],appointments,links,payload})
 assert.equal(issues[0].kind,'CAPACITY')
})

test('kalendarz zasobu wymaga pełnego zakresu godzin i co najmniej jednego dnia',()=>{
 assert.deepEqual(normalizeResourceCalendar({start:'07:00',end:'15:00',weekdays:[1,1,2]}),{weekdays:[1,2],start:'07:00',end:'15:00'})
 assert.throws(()=>normalizeResourceCalendar({start:'15:00',end:'08:00',weekdays:[1]}),/godziny/)
 assert.throws(()=>normalizeResourceCalendar({start:'08:00',end:'16:00',weekdays:[]}),/dni/)
})
