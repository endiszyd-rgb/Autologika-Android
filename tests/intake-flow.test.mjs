import test from 'node:test'
import assert from 'node:assert/strict'
import {customerForVehicle,findExistingIntakeVehicle,intakeVehicleSearchRecord,orderVehicleSnapshot} from '../src/intake-flow.js'

const customers=[{cloud_id:'c-1',payload:{name:'Jan Kowalski',phone:'500 600 700'}}]
const vehicles=[{cloud_id:'v-1',payload:{customer_cloud_id:'c-1',plate:'WX 1234',vin:'WVWZZZ1JZXW000001',make:'Volkswagen',model:'Golf',mileage:123000}}]

test('skan rozpoznaje istniejący pojazd po VIN lub rejestracji',()=>{
 assert.equal(findExistingIntakeVehicle(vehicles,{vin:'wvwzzz1jzxw000001'}).cloud_id,'v-1')
 assert.equal(findExistingIntakeVehicle(vehicles,{plate:'wx1234'}).cloud_id,'v-1')
 assert.equal(findExistingIntakeVehicle(vehicles,{plate:'PO 9999'}),null)
})

test('wyszukiwanie pojazdu obejmuje właściciela i telefon',()=>{
 assert.equal(customerForVehicle(customers,vehicles[0]).cloud_id,'c-1')
 assert.deepEqual(intakeVehicleSearchRecord(vehicles[0],customers),{...vehicles[0].payload,owner:'Jan Kowalski',owner_phone:'500 600 700'})
})

test('zlecenie zachowuje migawkę wybranego pojazdu i aktualny przebieg',()=>{
 const snapshot=orderVehicleSnapshot({mileage:'124500'},vehicles[0],customers[0])
 assert.equal(snapshot.plate,'WX1234')
 assert.equal(snapshot.customer,'Jan Kowalski')
 assert.equal(snapshot.mileage,124500)
})
