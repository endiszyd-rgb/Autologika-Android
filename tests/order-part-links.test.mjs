import test from 'node:test'
import assert from 'node:assert/strict'
import {inventoryAssignmentPayload,linkedPartsForRepair,partModuleBucket} from '../src/order-part-links.js'

test('część magazynowa łączy magazyn, naprawę, zlecenie i kosztorys',()=>{
 const result=inventoryAssignmentPayload({inventoryId:'stock-1',orderId:'order-1',repairItemId:'repair-1',qty:2,inventory:{name:'Klocki przód',brand:'ATE',part_no:'13.0460',stock:4,unit_cost:100,sell_price:160,location:'A-03'},repairItem:{name:'Wymiana klocków'},vehicle:{make:'Audi',model:'A4'}})
 assert.equal(result.inventory.stock,2)
 assert.equal(result.jobPart.repair_item_cloud_id,'repair-1')
 assert.equal(result.jobPart.inventory_part_cloud_id,'stock-1')
 assert.equal(result.jobPart.source,'MAGAZYN')
 assert.equal(result.orderItem.kind,'CZESC')
 assert.equal(result.orderItem.qty*result.orderItem.unit_price,320)
})

test('nie pozwala pobrać większej liczby części niż stan magazynowy',()=>{
 assert.throws(()=>inventoryAssignmentPayload({inventoryId:'s',orderId:'o',repairItemId:'r',qty:3,inventory:{stock:2}}),/dostępne: 2/)
})

test('części są grupowane według przepływu magazynowego',()=>{
 assert.equal(partModuleBucket({status:'DO_ZAMOWIENIA'}),'DO ZAMÓWIENIA')
 assert.equal(partModuleBucket({status:'DO_ZAMOWIENIA',repair_item_cloud_id:'r'}),'DO ZAMÓWIENIA')
 assert.equal(partModuleBucket({status:'W_DRODZE'}),'ZAMÓWIONE')
 assert.equal(partModuleBucket({status:'ODEBRANE',repair_item_cloud_id:'r'}),'PRZYPISANE DO ZLECEŃ')
 assert.equal(partModuleBucket({source:'MAGAZYN',repair_item_cloud_id:'r'}),'PRZYPISANE DO ZLECEŃ')
 assert.equal(partModuleBucket({status:'DO_ZWROTU'}),'ZWROTY')
 assert.equal(linkedPartsForRepair([{payload:{repair_item_cloud_id:'r'}},{payload:{repair_item_cloud_id:'x'}}],'r').length,1)
})
