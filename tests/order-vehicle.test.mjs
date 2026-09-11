import test from 'node:test'
import assert from 'node:assert/strict'
import {orderVehicleRepairs,resolveOrderVehicle} from '../src/order-vehicle.js'

const vehicles=[{cloud_id:'vehicle-1',payload:{plate:'PO 123AB',vin:'WVWZZZ1JZXW000001',make:'Volkswagen',model:'Golf'}}]

test('uses the linked vehicle while keeping order snapshots as fallback',()=>{
  const result=resolveOrderVehicle({vehicle_cloud_id:'vehicle-1',plate:'PO 123AB'},vehicles)
  assert.equal(result.vehicle.cloud_id,'vehicle-1')
  assert.equal(result.display.model,'Golf')
  assert.equal(result.missing,false)
})

test('repairs a stale relation by unique VIN or registration',()=>{
  const orders=[{cloud_id:'order-1',payload:{vehicle_cloud_id:'old-id',plate:'PO123AB'}}]
  assert.deepEqual(orderVehicleRepairs(orders,vehicles),[{orderId:'order-1',vehicleCloudId:'vehicle-1',matchedBy:'PLATE'}])
})

test('does not report a missing vehicle when the order contains its snapshot',()=>{
  const result=resolveOrderVehicle({plate:'PO 999ZZ',make:'BMW',model:'Seria 3'},[])
  assert.equal(result.missing,false)
  assert.equal(result.vehicle,null)
  assert.equal(result.display.plate,'PO 999ZZ')
})
