import test from 'node:test'
import assert from 'node:assert/strict'
import {canonicalEntityType,normalizeSyncPayload,normalizeSyncRecord} from '../src/sync-contract.js'

test('legacy mobile approvals use the desktop approvals entity',()=>{
 assert.equal(canonicalEntityType('quote_approvals'),'approvals')
 assert.deepEqual(normalizeSyncRecord({entity_type:'quote_approvals',payload:{status:'approved',source:'ANDROID'}}),{
  entity_type:'approvals',
  payload:{status:'APPROVED',source:'ANDROID',scope:'Akceptacja zakresu w aplikacji mobilnej',channel:'OSOBISCIE'}
 })
})

test('mobile labor and part names follow the desktop order item contract',()=>{
 assert.equal(normalizeSyncPayload('order_items',{kind:'LABOR'}).kind,'ROBOCIZNA')
 assert.equal(normalizeSyncPayload('order_items',{kind:'CZĘŚĆ'}).kind,'CZESC')
})

test('quality checks carry both mobile and desktop key names',()=>{
 assert.deepEqual(normalizeSyncPayload('order_qc',{check_key:'road',checked:true}),{check_key:'road',key:'road',checked:true})
 assert.deepEqual(normalizeSyncPayload('order_qc',{key:'documents',checked:false}),{key:'documents',check_key:'documents',checked:false})
})
