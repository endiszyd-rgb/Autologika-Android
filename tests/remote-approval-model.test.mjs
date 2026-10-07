import assert from 'node:assert/strict'
import {buildMobileApprovalSnapshot,canonicalJson,mobileApprovalLocalId,remoteApprovalPayload} from '../src/remote-approval-model.js'

const snapshot=buildMobileApprovalSnapshot({approvalLocalId:1712345678900123,orderId:'order-mobile',order:{title:'Serwis',complaint:'Hałas',customer:'Jan Kowalski',email:'jan@example.pl',opened_at:'2026-10-07T08:00:00.000Z'},vehicle:{make:'Volkswagen',model:'Golf',year:2018,plate:'ZS 1234A',vin:'WVWZZZ1KZJW000001',engine:'2.0 TDI'},items:[{payload:{kind:'ROBOCIZNA',name:'Diagnostyka',qty:1,unit_price:120}}],parts:[{payload:{name:'Filtr oleju',qty:1,unit_price:35,part_no:'HU719/7X',oe_number:'03L115562',brand:'MANN',status:'ZAMONTOWANE'}},{payload:{name:'Anulowana',qty:1,unit_price:999,status:'ANULOWANE'}}],total:160,sequence:2,previouslyApprovedTotal:300,createdAt:'2026-10-07T09:00:00.000Z'})

assert.equal(snapshot.items.length,3)
assert.equal(snapshot.items[0].value,120)
assert.equal(snapshot.items[1].value,35)
assert.equal(snapshot.items[2].name,'Korekta ceny końcowej zlecenia')
assert.equal(snapshot.items[2].value,5)
assert.equal(snapshot.totals.gross,160)
assert.equal(snapshot.newCombinedTotal,460)
assert.equal(snapshot.vehicle.plate,'ZS 1234A')
assert.equal(snapshot.customer.email,'jan@example.pl')
assert.equal(snapshot.approvalDocumentNo,'AL-M-78900123-A02')
assert.equal(canonicalJson({z:1,a:{y:2,x:3}}),'{"a":{"x":3,"y":2},"z":1}')
assert.equal(mobileApprovalLocalId(1712345678900,42),1712345678900042)
assert.deepEqual(remoteApprovalPayload({status:'approved',customer_note:'OK',approval_sequence:'2',previously_approved_total:'300.00'}),{status:'APPROVED',note:'OK',decided_at:null,remote_id:null,remote_expires_at:null,snapshot:null,snapshot_hash:'',hash_algorithm:'SHA-256',signature_storage_path:'',signature_hash:'',pdf_storage_path:'',pdf_hash:'',document_no:'',approval_sequence:2,previously_approved_total:300})
console.log('remote approval model tests passed')
