import test from 'node:test'
import assert from 'node:assert/strict'
import {buildCustomerDossier,customerDossierSearch} from '../src/customer-dossier.js'

test('kartoteka klienta łączy jego auta i wszystkie ich wizyty',()=>{
 const customer={cloud_id:'c1',payload:{name:'Anna Nowak',phone:'500600700'}}
 const vehicles=[{cloud_id:'v1',payload:{customer_cloud_id:'c1',plate:'WA 123'}},{cloud_id:'v2',payload:{customer_cloud_id:'c1',plate:'WA 456'}},{cloud_id:'v3',payload:{customer_cloud_id:'c2'}}]
 const orders=[{cloud_id:'o1',updated_at:'2026-01-01',payload:{vehicle_cloud_id:'v1',title:'Hamulce',status:'W_TRAKCIE',total:200}},{cloud_id:'o2',updated_at:'2026-02-01',payload:{vehicle_cloud_id:'v2',title:'Olej',status:'WYDANE',final_price:350}},{cloud_id:'o3',payload:{vehicle_cloud_id:'v3',total:999}}]
 const dossier=buildCustomerDossier(customer,vehicles,orders)
 assert.deepEqual(dossier.vehicles.map(row=>row.cloud_id),['v1','v2'])
 assert.deepEqual(dossier.visits.map(row=>row.cloud_id),['o2','o1'])
 assert.equal(dossier.active.length,1)
 assert.equal(dossier.value,550)
})

test('wyszukiwanie klienta obejmuje jego pojazdy i wcześniejsze prace',()=>{
 const dossier=buildCustomerDossier({cloud_id:'c1',payload:{name:'Anna Nowak'}},[{cloud_id:'v1',payload:{customer_cloud_id:'c1',plate:'WA123',make:'Volvo'}}],[{cloud_id:'o1',payload:{vehicle_cloud_id:'v1',title:'Diagnostyka DPF'}}])
 const payload=JSON.stringify(customerDossierSearch(dossier))
 assert.match(payload,/WA123/)
 assert.match(payload,/Diagnostyka DPF/)
})
