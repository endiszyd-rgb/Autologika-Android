import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeWorkTemplate,workTemplateForm,workTemplateOrderItem,workTemplatePayload} from '../src/work-templates.js'
import {catalogRows,WORK_CATALOG} from '../src/work-catalog.js'

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

test('creates a synchronized template payload from the Android editor',()=>{
  const payload=workTemplatePayload({name:' Diagnostyka DPF ',group_name:'Diagnostyka',variant:'pełna',scope:'Pomiary',hours:'1,5',rate:'220,50',pre:'Zapłon wyłączony',steps:'Odczytaj DTC\nZmierz ciśnienie',qc:'Zapisz wynik',parts:'Czujnik różnicy ciśnień',materials:'Preparat do styków'})
  assert.equal(payload.name,'Diagnostyka DPF')
  assert.equal(payload.hours,1.5)
  assert.equal(payload.rate,220.5)
  assert.deepEqual(JSON.parse(payload.steps_json),['Odczytaj DTC','Zmierz ciśnienie'])
  assert.deepEqual(JSON.parse(payload.parts_json),[{name:'Czujnik różnicy ciśnień',qty:1,selected:true}])
  const normalized=normalizeWorkTemplate({cloud_id:'mobile-1',payload})
  assert.equal(normalized.group,'Diagnostyka')
  assert.deepEqual(normalized.materials,[{name:'Preparat do styków',qty:1,selected:true}])
})

test('turns a synchronized template back into editable lines',()=>{
  const form=workTemplateForm({cloud_id:'abc',payload:{name:'Test',hours:2,rate:180,steps_json:'["Krok 1","Krok 2"]',parts_json:'[{"name":"Filtr"}]'}})
  assert.equal(form.id,'abc')
  assert.equal(form.steps,'Krok 1\nKrok 2')
  assert.equal(form.parts,'Filtr')
})

test('rejects incomplete or invalid work templates',()=>{
  assert.throws(()=>workTemplatePayload({name:'',hours:'1',rate:'220'}),/nazwę/i)
  assert.throws(()=>workTemplatePayload({name:'Test',hours:'0',rate:'220'}),/większy od zera/i)
  assert.throws(()=>workTemplatePayload({name:'Test',hours:'1',rate:'-1'}),/ujemna/i)
})

test('Android exposes the complete built-in work-template library',()=>{
  const rows=catalogRows()
  assert.ok(WORK_CATALOG.length>=40)
  assert.ok(rows.length>=1000)
  assert.ok(rows.every(row=>row.group&&row.job?.name&&row.variant?.name))
})
