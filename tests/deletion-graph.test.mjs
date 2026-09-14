import test from 'node:test'
import assert from 'node:assert/strict'
import {ORDER_CHILD_TYPES,relatedDeletionRows} from '../src/deletion-graph.js'

const emptyRows=()=>Object.fromEntries(['vehicles','orders','appointments','service_reminders_v2',...ORDER_CHILD_TYPES].map(type=>[type,[]]))

test('vehicle deletion also removes reminders without an order',()=>{
 const rows=emptyRows();rows.vehicles=[{cloud_id:'vehicle-1',payload:{}}];rows.service_reminders_v2=[{cloud_id:'reminder-1',payload:{vehicle_cloud_id:'vehicle-1',order_cloud_id:null}}]
 const plan=relatedDeletionRows(rows,'vehicles','vehicle-1')
 assert.ok(plan.deletions.some(row=>row.type==='service_reminders_v2'&&row.id==='reminder-1'))
})

test('order deletion unlinks its reminder and preserves the vehicle service plan',()=>{
 const rows=emptyRows();rows.vehicles=[{cloud_id:'vehicle-1',payload:{}}];rows.orders=[{cloud_id:'order-1',payload:{vehicle_cloud_id:'vehicle-1'}}];rows.service_reminders_v2=[{cloud_id:'reminder-1',payload:{vehicle_cloud_id:'vehicle-1',order_cloud_id:'order-1'}}]
 const plan=relatedDeletionRows(rows,'orders','order-1')
 assert.equal(plan.reminderLinks[0].cloud_id,'reminder-1')
 assert.equal(plan.deletions.some(row=>row.type==='service_reminders_v2'),false)
})

test('relations match numeric identifiers serialized as strings',()=>{
 const rows=emptyRows();rows.vehicles=[{cloud_id:'12',payload:{customer_cloud_id:'7'}}];rows.orders=[{cloud_id:'21',payload:{vehicle_cloud_id:12}}]
 const plan=relatedDeletionRows(rows,'customers',7)
 assert.equal(plan.vehicleIds.has('12'),true)
 assert.equal(plan.orderIds.has('21'),true)
})
