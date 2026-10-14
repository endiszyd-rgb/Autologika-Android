import assert from 'node:assert/strict'
import test from 'node:test'
import {dviInspectionProgress,dviNeedsCustomerDecision,nextDviDecisionVersion} from '../src/dvi-workflow.js'

const row=(id,inspection,status,decision='PENDING')=>({cloud_id:id,payload:{inspection_cloud_id:inspection,status,decision}})

test('DVI wymaga decyzji klienta wyłącznie dla rekomendacji naprawy',()=>{
 assert.equal(dviNeedsCustomerDecision(row('1','a','OK')),false)
 assert.equal(dviNeedsCustomerDecision(row('2','a','OBSERVATION')),false)
 assert.equal(dviNeedsCustomerDecision(row('3','a','REPAIR')),true)
})

test('ostatnia decyzja kończy tylko właściwą inspekcję',()=>{
 const items=[row('1','a','OK'),row('2','a','REPAIR','APPROVED'),row('3','a','REPAIR'),row('4','b','REPAIR')]
 assert.deepEqual(dviInspectionProgress(items,'a'),{recommendations:2,pending:1,completed:false})
 assert.deepEqual(dviInspectionProgress(items,'a',{itemId:'3',value:'DECLINED'}),{recommendations:2,pending:0,completed:true})
 assert.deepEqual(dviInspectionProgress(items,'b'),{recommendations:1,pending:1,completed:false})
})

test('wersja decyzji rośnie niezależnie dla każdej pozycji DVI',()=>{
 const decisions=[{payload:{dvi_item_cloud_id:'x',version:1}},{payload:{dvi_item_cloud_id:'x',version:3}},{payload:{dvi_item_cloud_id:'y',version:9}}]
 assert.equal(nextDviDecisionVersion(decisions,'x'),4)
 assert.equal(nextDviDecisionVersion(decisions,'z'),1)
})
