import test from 'node:test'
import assert from 'node:assert/strict'
import {attentionReasons,matchingInventoryParts,orderMeta,partitionOrderedParts,vehicleTitle} from '../src/workshop-logic.js'

test('pojazd jest prezentowany marką i modelem przed rejestracją',()=>{
 assert.equal(vehicleTitle({make:'Volvo',model:'V60',plate:'ZS 1234'}),'Volvo V60')
 assert.match(orderMeta({customer:'Jan Kowalski',title:'Przegląd'},{plate:'ZS 1234'}),/^Jan Kowalski · rej\. ZS 1234/)
})

test('magazyn wskazuje dostępne części pasujące do modelu',()=>{
 const rows=[{payload:{name:'Filtr',stock:2,vehicle_fitment:'VOLVO V60 2018-2024'}},{payload:{name:'Inny',stock:2,vehicle_fitment:'BMW 3'}},{payload:{name:'Brak',stock:0,vehicle_fitment:'VOLVO V60'}}]
 assert.deepEqual(matchingInventoryParts(rows,{make:'Volvo',model:'V60'}).map(x=>x.payload.name),['Filtr'])
})

test('zamontowane części przechodzą do archiwum',()=>{
 const rows=[{payload:{status:'ZAMOWIONE'}},{payload:{status:'ZAMONTOWANE'}},{payload:{status:'ANULOWANE'}}]
 const result=partitionOrderedParts(rows)
 assert.equal(result.current.length,1)
 assert.equal(result.archive.length,2)
})

test('nowe zlecenie bez zamówionych części wymaga uwagi',()=>{
 const reasons=attentionReasons({opened_at:'2026-10-05T08:00:00Z',wait_state:'BRAK'},[],new Date('2026-10-05T15:00:00Z'))
 assert.equal(reasons[0],'Nowe zlecenie bez zamówionych części')
})
