import test from 'node:test'
import assert from 'node:assert/strict'
import {availableInventoryQuantity,calculateMobileRepairEstimates,reservedInventoryTotals,cancelReservationTransition,installIssuedTransition} from '../src/repair-workflow.js'

test('rezerwacja zmniejsza stan dostępny bez zmiany stanu fizycznego',()=>{
 const inventory={cloud_id:'part-1',payload:{stock:4}},parts=[{payload:{inventory_part_cloud_id:'part-1',reserved_qty:2}},{payload:{inventory_part_cloud_id:'part-1',reserved_qty:1}}]
 assert.equal(reservedInventoryTotals(parts)['part-1'],3)
 assert.equal(availableInventoryQuantity(inventory,parts),1)
 assert.equal(inventory.payload.stock,4)
})

test('kosztorys Android rozdziela naprawy, VAT i marżę',()=>{
 const operations=[{cloud_id:'a',payload:{planned_hours:1,labor_rate:200,labor_cost_rate:80,vat_rate:23}},{cloud_id:'b',payload:{planned_hours:2,labor_rate:100,labor_cost_rate:50,vat_rate:0}}]
 const parts=[{payload:{repair_operation_cloud_id:'a',qty:1,unit_cost:50,unit_price:100}},{payload:{repair_operation_cloud_id:'b',qty:2,unit_cost:10,unit_price:25}}]
 const rows=calculateMobileRepairEstimates(operations,parts)
 assert.equal(rows[0].gross,369)
 assert.equal(rows[0].margin,170)
 assert.equal(rows[1].gross,250)
 assert.equal(rows[1].margin,130)
})

test('anulowanie rezerwacji zwalnia dostępny stan bez ruchu fizycznego',()=>{
 const result=cancelReservationTransition({qty:2,reserved_qty:2,issued_qty:0,status:'RESERVED'})
 assert.equal(result.amount,2)
 assert.equal(result.payload.reserved_qty,0)
 assert.equal(result.payload.status,'CANCELLED')
 assert.throws(()=>cancelReservationTransition(result.payload),/Brak aktywnej rezerwacji/)
})

test('montaż obejmuje tylko wydane i jeszcze nierozliczone sztuki',()=>{
 const result=installIssuedTransition({qty:3,issued_qty:3,returned_qty:1,installed_qty:1,status:'ISSUED'})
 assert.equal(result.amount,1)
 assert.equal(result.payload.installed_qty,2)
 assert.equal(result.payload.status,'INSTALLED')
 assert.throws(()=>installIssuedTransition(result.payload),/Brak wydanych części/)
})

