import assert from 'node:assert/strict'
import test from 'node:test'
import {orderPartDraft,partLookupMessage} from '../src/order-part-draft.js'

test('wynik skanowania tworzy gotową część do zlecenia',()=>{
 const draft=orderPartDraft({barcode:'5901532528992',name:'Łącznik stabilizatora',brand:'TEKNOROT',part_no:'V-557',cross_numbers:'1K0411315B\n1K0411315D',vehicle_fitment:'Audi A3\nVolkswagen Golf',unit_cost:45,sell_price:79})
 assert.equal(draft.name,'Łącznik stabilizatora')
 assert.equal(draft.oe_number,'1K0411315B')
 assert.equal(draft.cross_numbers,'1K0411315B\n1K0411315D')
 assert.equal(draft.unit_price,'79')
})

test('komunikat odróżnia część magazynową od wyniku online',()=>{
 assert.match(partLookupMessage({},true),/magazynie/)
 assert.match(partLookupMessage({brand:'BOSCH',part_no:'X',cross_numbers:'OE',vehicle_fitment:'Audi'}),/komplet/)
})
