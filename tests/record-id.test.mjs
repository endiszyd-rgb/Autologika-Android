import test from 'node:test'
import assert from 'node:assert/strict'
import {recordId,sameRecordId} from '../src/record-id.js'

test('normalizes synchronized record identifiers before matching relations',()=>{
 assert.equal(recordId(' 21 '),'21')
 assert.equal(sameRecordId(21,'21'),true)
 assert.equal(sameRecordId(null,''),false)
 assert.equal(sameRecordId('21','22'),false)
})
