import assert from 'node:assert/strict'
import test from 'node:test'
import {isWholePartQuantity,normalizePartPayload,partQuantityLabel,roundedPartQuantity,wholePartQuantity} from '../src/part-quantity.js'

test('części można zapisać wyłącznie jako pełne sztuki',()=>{
 assert.equal(wholePartQuantity('2'),2)
 assert.equal(wholePartQuantity('0',{allowZero:true}),0)
 assert.throws(()=>wholePartQuantity('1,97'),/liczbą całkowitą/)
 assert.equal(isWholePartQuantity('3'),true)
 assert.equal(isWholePartQuantity('3.2'),false)
 assert.equal(partQuantityLabel(1.97),'2 szt.')
})

test('starsze dane z chmury są zaokrąglane tylko dla części',()=>{
 assert.deepEqual(normalizePartPayload('inventory_parts',{stock:1.97,min_stock:.6}),{stock:2,min_stock:1})
 assert.deepEqual(normalizePartPayload('job_part_orders',{qty:2.4}),{qty:2})
 assert.deepEqual(normalizePartPayload('order_items',{kind:'CZESC',qty:1.97}),{kind:'CZESC',qty:2})
 assert.deepEqual(normalizePartPayload('order_items',{kind:'MATERIAL',qty:1.5}),{kind:'MATERIAL',qty:1.5})
 assert.equal(roundedPartQuantity(-2,{allowZero:true}),0)
})
