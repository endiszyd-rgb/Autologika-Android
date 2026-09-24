import test from 'node:test'
import assert from 'node:assert/strict'
import {appointmentForm,appointmentPayload,nextAppointmentStatus,scheduleDays,scheduleOrderChoices} from '../src/schedule-model.js'

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
