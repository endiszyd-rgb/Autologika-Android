export const FULL_REPLAY_INTERVAL_MS=24*60*60*1000

export function needsFullReplay(lastFullSyncAt,now=Date.now()){
 const last=Date.parse(lastFullSyncAt||'')
 return !Number.isFinite(last)||now-last>=FULL_REPLAY_INTERVAL_MS
}

export function remotePageRoute(workshopId,since,offset=0){
 return `/rest/v1/sync_records?select=entity_type,cloud_id,payload,updated_at,deleted_at,version&workshop_id=eq.${encodeURIComponent(workshopId)}&updated_at=gte.${encodeURIComponent(since)}&order=updated_at.asc,entity_type.asc,cloud_id.asc&limit=1000&offset=${offset}`
}

export function shouldApplyRemote(local,remote){
 if(!local)return true
 const localTime=Date.parse(local.updated_at||'')||0
 const remoteTime=Date.parse(remote.updated_at||'')||0
 return localTime<=remoteTime&&!(local.dirty&&localTime===remoteTime)
}
