import test from 'node:test'
import assert from 'node:assert/strict'
import {FULL_REPLAY_INTERVAL_MS,assertCloudOwner,needsFullReplay,remoteHeadsRoute,remotePageRoute,remoteWins,shouldApplyRemote} from '../src/cloud-sync-model.js'

test('Android checks exact remote records before uploading offline changes',()=>{
 const query=new URL(remoteHeadsRoute('workshop-1','vehicles',['vehicle-1','vehicle-2']),'https://example.test').searchParams
 assert.equal(query.get('entity_type'),'eq.vehicles')
 assert.equal(query.get('cloud_id'),'in.(vehicle-1,vehicle-2)')
 assert.equal(remoteWins({updated_at:'2026-09-20T10:15:31.000Z'},'2026-09-20T10:15:30.000Z'),true)
 assert.equal(remoteWins({updated_at:'2026-09-20T10:15:29.000Z'},'2026-09-20T10:15:30.000Z'),false)
})

test('Android keeps one local database bound to its Cloud account',()=>{
 assert.equal(assertCloudOwner('','account-1'),'account-1')
 assert.equal(assertCloudOwner('account-1','account-1'),'account-1')
 assert.throws(()=>assertCloudOwner('account-1','account-2'),/innym kontem Cloud/)
})

test('Android replays the cursor boundary and orders all record types consistently',()=>{
 const stamp='2026-09-15T10:00:00.000Z'
 const query=new URL(remotePageRoute('workshop-1',stamp,1000),'https://example.test').searchParams
 assert.equal(query.get('updated_at'),`gte.${stamp}`)
 assert.equal(query.get('order'),'updated_at.asc,entity_type.asc,cloud_id.asc')
 assert.equal(query.get('offset'),'1000')
})

test('Android replays historical records on first sync and at least once daily',()=>{
 const now=Date.parse('2026-09-15T10:00:00.000Z')
 assert.equal(needsFullReplay('',now),true)
 assert.equal(needsFullReplay(new Date(now-FULL_REPLAY_INTERVAL_MS+1).toISOString(),now),false)
 assert.equal(needsFullReplay(new Date(now-FULL_REPLAY_INTERVAL_MS).toISOString(),now),true)
})

test('an older remote edit or deletion cannot overwrite newer local data',()=>{
 const local={updated_at:'2026-09-15T12:00:00.000Z',dirty:0}
 assert.equal(shouldApplyRemote(local,{updated_at:'2026-09-14T12:00:00.000Z',deleted_at:null}),false)
 assert.equal(shouldApplyRemote(local,{updated_at:'2026-09-14T12:00:00.000Z',deleted_at:'2026-09-14T12:00:00.000Z'}),false)
 assert.equal(shouldApplyRemote(local,{updated_at:'2026-09-16T12:00:00.000Z'}),true)
 assert.equal(shouldApplyRemote({...local,dirty:1},{updated_at:local.updated_at}),false)
})
