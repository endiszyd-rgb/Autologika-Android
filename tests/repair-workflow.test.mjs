import test from 'node:test'
import assert from 'node:assert/strict'
import {availableInventoryQuantity,calculateMobileRepairEstimates,reservedInventoryTotals,cancelReservationTransition,deriveOrderPartWait,installIssuedTransition,jobPartStatusTransition} from '../src/repair-workflow.js'

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

test('status części zapisuje datę montażu i zachowuje ją przy ponowieniu',()=>{
 const first=jobPartStatusTransition({order_cloud_id:'order-1',status:'ODEBRANE'},'ZAMONTOWANE','2026-10-16T08:00:00.000Z')
 assert.equal(first.status,'ZAMONTOWANE')
 assert.equal(first.installed_at,'2026-10-16T08:00:00.000Z')
 const repeated=jobPartStatusTransition(first,'ZAMONTOWANE','2026-10-16T09:00:00.000Z')
 assert.equal(repeated.installed_at,first.installed_at)
})

test('oczekiwanie na części znika dopiero po zamknięciu ostatniej blokującej pozycji',()=>{
 const parts=[{order_cloud_id:'order-1',status:'ZAMONTOWANE'},{order_cloud_id:'order-1',status:'W_DRODZE'},{order_cloud_id:'order-2',status:'DO_ZAMOWIENIA'}]
 assert.deepEqual(deriveOrderPartWait('CZESCI',parts,'order-1'),{blocking:1,waitState:'CZESCI'})
 parts[1].status='ODEBRANE'
 assert.deepEqual(deriveOrderPartWait('CZESCI',parts,'order-1'),{blocking:0,waitState:'BRAK'})
})

test('automatyka części nie nadpisuje oczekiwania na decyzję klienta',()=>{
 const parts=[{order_cloud_id:'order-1',status:'DO_ZAMOWIENIA'}]
 assert.deepEqual(deriveOrderPartWait('DECYZJA',parts,'order-1'),{blocking:1,waitState:'DECYZJA'})
 parts[0].status='ODEBRANE'
 assert.deepEqual(deriveOrderPartWait('DECYZJA',parts,'order-1'),{blocking:0,waitState:'DECYZJA'})
})

