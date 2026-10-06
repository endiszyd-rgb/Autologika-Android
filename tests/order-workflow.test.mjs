import test from 'node:test'
import assert from 'node:assert/strict'
import {deriveMobileOrderWorkflow,deriveOrderWorkflows} from '../src/order-workflow.js'

const complete={order:{status:'GOTOWE'},diagnosis:{symptom_confirmed:'Uszkodzony czujnik'},approvals:[{cloud_id:'1',payload:{status:'APPROVED',decided_at:'2026-09-22'}}],parts:[],items:[{cloud_id:'item'}],logs:[{payload:{ended_at:'2026-09-22',duration_minutes:45}}],payments:[{payload:{amount:500}}],qc:[{payload:{key:'documents',checked:true}},{payload:{key:'final',checked:true}}],notes:{release_notes:'Zalecenia przekazane'},total:500}

test('nowe zlecenie po przyjęciu przechodzi do podstawowej diagnozy',()=>{
 const result=deriveMobileOrderWorkflow({order:{status:'PRZYJETE'}})
 assert.equal(result.next.key,'diagnosis')
 assert.equal(result.suggestedStatus,'DIAGNOZA')
 assert.equal(result.done,1)
})

test('zakończona praca poprzedza QC naprawy i płatność',()=>{
 const result=deriveMobileOrderWorkflow({...complete,logs:[]})
 assert.equal(result.next.key,'repair')
 assert.equal(result.suggestedStatus,'NAPRAWA')
 assert.equal(result.steps.find(step=>step.key==='repair').done,false)
 assert.equal(result.steps.find(step=>step.key==='repairQc').done,false)
 assert.equal(result.steps.find(step=>step.key==='payment').done,false)
})

test('niewykonana procedura blokuje zakończenie naprawy',()=>{
 const procedures=[{payload:{steps_json:'["Demontaż","Montaż"]',progress_json:'{"steps:0":true,"steps:1":false}'}}]
 const result=deriveMobileOrderWorkflow({...complete,procedures})
 assert.equal(result.next.key,'repair')
 assert.equal(result.steps.find(step=>step.key==='repair').done,false)
 assert.equal(result.steps.find(step=>step.key==='repairQc').done,false)
 const completed=deriveMobileOrderWorkflow({...complete,procedures:[{payload:{...procedures[0].payload,progress_json:'{"steps:0":true,"steps:1":true}'}}]})
 assert.equal(completed.steps.find(step=>step.key==='repair').done,true)
 assert.equal(completed.suggestedStatus,'GOTOWE')
 assert.equal(completed.complete,true)
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

test('workflow odczytuje klucze kontroli jakości zapisane przez PC',()=>{
 const workflow=deriveMobileOrderWorkflow({
  order:{status:'GOTOWE'},diagnosis:{conclusion:'Usterka potwierdzona'},
  approvals:[{payload:{status:'APPROVED',decided_at:'2026-10-03T10:00:00Z'}}],
  parts:[],items:[{payload:{kind:'ROBOCIZNA',name:'Naprawa'}}],
  logs:[{payload:{ended_at:'2026-10-03T11:00:00Z'}}],
  qc:[{payload:{check_key:'documents',checked:true}},{payload:{check_key:'final',checked:true}}],
  payments:[{payload:{amount:100}}],notes:{release_notes:'Pojazd sprawdzony'},total:100
 })
 assert.equal(workflow.steps.find(step=>step.key==='repairQc').done,true)
 assert.equal(workflow.steps.find(step=>step.key==='releaseQc').done,true)
 assert.equal(workflow.complete,true)
})

test('lista zleceń wylicza niezależny postęp każdego zlecenia',()=>{
 const orders=[{cloud_id:'o1',payload:{status:'PRZYJETE'}},{cloud_id:2,payload:{status:'WYCENA',total:100}}]
 const diagnostics=[{payload:{order_cloud_id:'o1',conclusion:'Usterka'}},{payload:{order_cloud_id:'2',conclusion:'Usterka'}}]
 const items=[{payload:{order_cloud_id:2,name:'Naprawa',qty:1,unit_price:100}}]
 const result=deriveOrderWorkflows({orders,diagnostics,items})
 assert.equal(result.o1.next.key,'quote')
 assert.equal(result['2'].next.key,'approval')
 assert.equal(result['2'].due,100)
})
