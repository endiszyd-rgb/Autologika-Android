import test from 'node:test'
import assert from 'node:assert/strict'
import {customerPayload,customerSearchRecord,duplicateCustomer} from '../src/customer-model.js'

test('normalizuje kartę klienta i sprawdza adres e-mail',()=>{
 assert.deepEqual(customerPayload({name:'  Jan Kowalski ',phone:' 500 600 700 ',email:' JAN@EXAMPLE.PL '}),{name:'Jan Kowalski',phone:'500 600 700',email:'jan@example.pl',company:'',notes:''})
 assert.throws(()=>customerPayload({name:'Jan',email:'błędny'}),/prawidłowy adres/)
})

test('wykrywa istniejącego klienta po telefonie lub e-mailu',()=>{
 const rows=[{cloud_id:'c1',payload:{name:'Jan',phone:'+48 500-600-700',email:'jan@example.pl'}}]
 assert.equal(duplicateCustomer(rows,{phone:'500600700'}).cloud_id,'c1')
 assert.equal(duplicateCustomer(rows,{email:'JAN@example.pl'}).cloud_id,'c1')
 assert.equal(duplicateCustomer(rows,{phone:'111222333'}),null)
})

test('rekord wyszukiwania obejmuje dane klienta i identyfikator',()=>{
 const row={cloud_id:'c1',payload:{name:'Jan',company:'Auto Serwis'}}
 assert.deepEqual(customerSearchRecord(row),{name:'Jan',company:'Auto Serwis',id:'c1'})
})
