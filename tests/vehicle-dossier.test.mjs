import test from 'node:test'
import assert from 'node:assert/strict'
import {buildVehicleDossier,vehicleDossierSearch} from '../src/vehicle-dossier.js'

const vehicle={cloud_id:'v1',payload:{customer_cloud_id:'c1',plate:'WX 1234',make:'Audi',model:'A4'}}
const customers=[{cloud_id:'c1',payload:{name:'Jan Kowalski',phone:'500600700'}}]
const orders=[
 {cloud_id:'o1',updated_at:'2026-01-01T10:00:00Z',payload:{vehicle_cloud_id:'v1',title:'Wymiana oleju',status:'WYDANE',total:500,released_at:'2026-01-01T09:00:00Z'}},
 {cloud_id:'o2',updated_at:'2026-03-01T10:00:00Z',payload:{vehicle_cloud_id:'v1',title:'Hamulce',status:'NAPRAWA',final_price:1200}},
 {cloud_id:'o3',payload:{vehicle_cloud_id:'v2',title:'Inne auto',status:'PRZYJETE',total:300}}
]

test('kartoteka pojazdu łączy właściciela, wizyty i wartość',()=>{
 const dossier=buildVehicleDossier(vehicle,customers,orders)
 assert.equal(dossier.owner.payload.name,'Jan Kowalski')
 assert.deepEqual(dossier.visits.map(row=>row.cloud_id),['o2','o1'])
 assert.equal(dossier.active.length,1)
 assert.equal(dossier.value,1700)
})

test('wyszukiwanie kartoteki obejmuje właściciela i nazwy wcześniejszych prac',()=>{
 const result=vehicleDossierSearch(buildVehicleDossier(vehicle,customers,orders))
 assert.equal(result.owner.phone,'500600700')
 assert.deepEqual(result.orders,['Hamulce','Wymiana oleju'])
})
