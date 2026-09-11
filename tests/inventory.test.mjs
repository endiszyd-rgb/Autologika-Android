import test from 'node:test'
import assert from 'node:assert/strict'
import {adjustedStock,inventoryPayload} from '../src/inventory.js'

test('normalizes an editable inventory card and its cross references',()=>{
  const result=inventoryPayload({barcode:' 5901947342091 ',name:' Czujnik parkowania ',brand:' ESEN SKV ',stock:'2',min_stock:'1',unit_cost:'42.50',sell_price:'75',vehicle_fitment:'BMW Seria 1; BMW Seria 1\nBMW Seria 2',cross_numbers:'66209261582, 66202180149'})
  assert.equal(result.barcode,'5901947342091')
  assert.equal(result.stock,2)
  assert.equal(result.vehicle_fitment,'BMW Seria 1\nBMW Seria 2')
  assert.equal(result.cross_numbers,'66209261582\n66202180149')
})

test('rejects invalid inventory data and prevents a negative stock',()=>{
  assert.throws(()=>inventoryPayload({name:'Filtr',stock:'-1'}),/Stan magazynowy/)
  assert.throws(()=>inventoryPayload({name:'Filtr',barcode:'123'}),/Kod kreskowy/)
  assert.equal(adjustedStock(0,-1),0)
  assert.equal(adjustedStock(2,1),3)
})
