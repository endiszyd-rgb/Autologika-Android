import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeWorkTemplate,workTemplateOrderItem} from '../src/work-templates.js'

test('normalizes a synchronized desktop work template',()=>{
  const template=normalizeWorkTemplate({cloud_id:'abc',payload:{name:'Diagnostyka czujnika',group_name:'Diagnostyka',variant:'pełna',scope:'Pomiary i wnioski.',hours:1.5,rate:200,steps_json:'["Pomiar sygnału"]',qc_json:'["Zapis wyniku"]'}})
  assert.equal(template.id,'abc')
  assert.deepEqual(template.steps,['Pomiar sygnału'])
  assert.deepEqual(template.qc,['Zapis wyniku'])
})

test('creates an order item with price and complete procedure',()=>{
  const item=workTemplateOrderItem({cloud_id:'abc',payload:{name:'Test',variant:'standard',hours:2,rate:180,pre_json:'["Przygotuj"]',parts_json:'[{"name":"Czujnik"}]'}},'order-1')
  assert.equal(item.order_cloud_id,'order-1')
  assert.equal(item.unit_price,360)
  assert.equal(item.template_key,'custom:abc')
  assert.deepEqual(item.procedure.pre,['Przygotuj'])
  assert.deepEqual(item.procedure.parts,[{name:'Czujnik'}])
})
