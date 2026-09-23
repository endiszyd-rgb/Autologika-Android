import test from 'node:test'
import assert from 'node:assert/strict'
import {appointmentForm,appointmentPayload,nextAppointmentStatus,scheduleDays} from '../src/schedule-model.js'

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
