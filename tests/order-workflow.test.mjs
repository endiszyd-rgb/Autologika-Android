import test from 'node:test'
import assert from 'node:assert/strict'
import {deriveMobileOrderWorkflow} from '../src/order-workflow.js'

const complete={order:{status:'GOTOWE'},diagnosis:{symptom_confirmed:'Uszkodzony czujnik'},approvals:[{cloud_id:'1',payload:{status:'APPROVED',decided_at:'2026-09-22'}}],parts:[],items:[{cloud_id:'item'}],logs:[{payload:{ended_at:'2026-09-22',duration_minutes:45}}],payments:[{payload:{amount:500}}],qc:[{payload:{key:'documents',checked:true}},{payload:{key:'final',checked:true}}],notes:{release_notes:'Zalecenia przekazane'},total:500}

test('nowe zlecenie zaczyna od podstawowej diagnozy',()=>{
 const result=deriveMobileOrderWorkflow({order:{status:'PRZYJETE'}})
 assert.equal(result.next.key,'diagnosis')
 assert.equal(result.done,0)
})

test('czas pracy poprzedza kontrolę jakości i płatność',()=>{
 const result=deriveMobileOrderWorkflow({...complete,logs:[]})
 assert.equal(result.next.key,'time')
 assert.equal(result.steps.find(step=>step.key==='qc').done,false)
 assert.equal(result.steps.find(step=>step.key==='payment').done,false)
})

test('najnowsza decyzja klienta zastępuje wcześniejszą akceptację',()=>{
 const approvals=[{cloud_id:'1',payload:{status:'APPROVED',decided_at:'2026-09-20'}},{cloud_id:'2',payload:{status:'DECLINED',decided_at:'2026-09-21'}}]
 const result=deriveMobileOrderWorkflow({...complete,approvals})
 assert.equal(result.next.key,'approval')
})

test('wydanie wymaga statusu GOTOWE nawet po uzupełnieniu dokumentacji',()=>{
 const result=deriveMobileOrderWorkflow({...complete,order:{status:'W_TRAKCIE'}})
 assert.equal(result.next.key,'release')
 assert.equal(result.complete,false)
})

test('kompletne zlecenie jest gotowe do wydania',()=>{
 const result=deriveMobileOrderWorkflow(complete)
 assert.equal(result.complete,true)
 assert.equal(result.due,0)
 assert.equal(result.next,null)
})
