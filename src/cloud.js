import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system/legacy'
import { dirty, markClean, metaGet, metaSet, put, db } from './db'

const K='autologika_cloud_config_v2', S='autologika_cloud_session_v2'
export async function loadCloud(){ try{return JSON.parse(await SecureStore.getItemAsync(K)||'{}')}catch{return {}} }
export function normalizeUrl(value=''){return String(value||'').trim().replace(/\/+(rest|auth|storage)\/v1\/?$/i,'').replace(/\/+$/,'')}
export function keyKind(key=''){const k=String(key||'').trim();if(k.startsWith('sb_publishable_'))return 'publishable';if(k.startsWith('eyJ'))return 'legacy-anon';if(k.startsWith('sb_secret_'))return 'secret';return k?'unknown':'empty'}
export async function saveCloud(c){const current=await loadCloud();const incoming=String(c?.key||'').trim();const next={...current,...c,url:normalizeUrl(c?.url??current.url),key:incoming||current.key||''};if(keyKind(next.key)==='secret')throw new Error('Nie używaj klucza sb_secret_ w aplikacji. Wklej Publishable key (sb_publishable_...).');await SecureStore.setItemAsync(K,JSON.stringify(next));return next}
export async function publicCloudConfig(){const c=await loadCloud();return {...c,key:'',keyConfigured:!!c.key,keyLength:String(c.key||'').length,keyKind:keyKind(c.key),keyHint:c.key?`${String(c.key).slice(0,14)}…${String(c.key).slice(-4)}`:''}}
export async function loadSession(){ try{return JSON.parse(await SecureStore.getItemAsync(S)||'{}')}catch{return {}} }
async function saveSession(s){ await SecureStore.setItemAsync(S,JSON.stringify(s||{})); return s }
export async function logout(){ await SecureStore.deleteItemAsync(S) }
function ok(c){return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(normalizeUrl(c.url||''))&&String(c.key||'').length>20&&keyKind(c.key)!=='secret'}
function base(c){return normalizeUrl(c.url||'')}
async function authReq(c,path,opt={}){const r=await fetch(base(c)+path,{...opt,headers:{'apikey':c.key,'Content-Type':'application/json',...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(`Auth ${r.status}: ${t.slice(0,300)}`);return t?JSON.parse(t):null}
export async function login(email,password){const c=await loadCloud();if(!ok(c))throw new Error('Najpierw podaj URL i Publishable key Supabase.');const s=await authReq(c,'/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});await saveSession({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Date.now()+Number(s.expires_in||3600)*1000,user:s.user});return s.user}
export async function signup(email,password){const c=await loadCloud();if(!ok(c))throw new Error('Najpierw podaj URL i Publishable key Supabase.');const s=await authReq(c,'/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});if(s?.access_token)await saveSession({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Date.now()+Number(s.expires_in||3600)*1000,user:s.user});return s}
async function sessionToken(c){let s=await loadSession();if(!s?.access_token)throw new Error('Zaloguj się do Autologika Cloud.');if(s.expires_at&&Date.now()>s.expires_at-60000&&s.refresh_token){const n=await authReq(c,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});s={access_token:n.access_token,refresh_token:n.refresh_token||s.refresh_token,expires_at:Date.now()+Number(n.expires_in||3600)*1000,user:n.user||s.user};await saveSession(s)}return s.access_token}
async function headers(c,extra={}){const token=await sessionToken(c);return {'apikey':c.key,'Authorization':`Bearer ${token}`,'Content-Type':'application/json',...extra}}
async function req(c,path,opt={}){const r=await fetch(base(c)+path,{...opt,headers:{...(await headers(c)),...(opt.headers||{})}});if(!r.ok)throw new Error(`Cloud ${r.status}: ${(await r.text()).slice(0,350)}`);if(r.status===204)return null;const t=await r.text();return t?JSON.parse(t):null}
export async function testConnection(){const c=await loadCloud();if(!ok(c))throw new Error('Uzupełnij poprawny Project URL i Publishable key Supabase.');let r;try{r=await fetch(base(c)+'/auth/v1/settings',{headers:{apikey:c.key}})}catch(e){throw new Error(`Brak połączenia z ${base(c)}: ${e?.message||e}`)}const t=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status}: ${t.slice(0,300)}`);return {ok:true,status:r.status}}
export async function currentAccount(){const c=await loadCloud(),s=await loadSession();return {configured:ok(c),loggedIn:!!s?.access_token,email:s?.user?.email||'',userId:s?.user?.id||'',workshopId:c.workshopId||s?.user?.id||''}}

const safeName=n=>String(n||'file').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-120)||'file'
const encPath=p=>String(p||'').split('/').map(encodeURIComponent).join('/')
async function uploadAttachment(c,workshopId,x){
  let payload={...(x.payload||{})}
  if(payload.storage_path||!payload.local_uri)return payload
  const order=payload.order_cloud_id||'bez-zlecenia'
  const storagePath=`${workshopId}/${order}/${x.cloud_id}-${safeName(payload.name||'zdjecie.jpg')}`
  const token=await sessionToken(c)
  const file=await fetch(payload.local_uri)
  const blob=await file.blob()
  const r=await fetch(`${base(c)}/storage/v1/object/order-files/${encPath(storagePath)}`,{method:'POST',headers:{'apikey':c.key,'Authorization':`Bearer ${token}`,'Content-Type':payload.mime||blob.type||'application/octet-stream','x-upsert':'true'},body:blob})
  if(!r.ok)throw new Error(`Zdjęcie upload ${r.status}: ${(await r.text()).slice(0,250)}`)
  payload={...payload,storage_path:storagePath,size_bytes:blob.size||payload.size_bytes||0}
  await put('attachments',x.cloud_id,payload,{dirty:1,updatedAt:x.updated_at,version:x.version||1})
  return payload
}
async function deleteRemoteAttachment(c,payload){
  if(!payload?.storage_path)return false
  const token=await sessionToken(c)
  const r=await fetch(`${base(c)}/storage/v1/object/order-files`,{method:'DELETE',headers:{'apikey':c.key,'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[payload.storage_path]})})
  if(!r.ok&&r.status!==404)throw new Error(`Usuwanie pliku ${r.status}: ${(await r.text()).slice(0,250)}`)
  return true
}
async function downloadAttachment(c,cloudId,payload){
  if(!payload?.storage_path)return payload
  if(payload.local_uri){try{const info=await FileSystem.getInfoAsync(payload.local_uri);if(info.exists)return payload}catch{}}
  const dir=`${FileSystem.documentDirectory}autologika/order-files/`
  await FileSystem.makeDirectoryAsync(dir,{intermediates:true})
  const ext=(String(payload.name||'').match(/\.[a-zA-Z0-9]{1,8}$/)||['.bin'])[0]
  const dest=`${dir}${cloudId}${ext}`
  const token=await sessionToken(c)
  try{
    const info=await FileSystem.getInfoAsync(dest)
    if(!info.exists)await FileSystem.downloadAsync(`${base(c)}/storage/v1/object/authenticated/order-files/${encPath(payload.storage_path)}`,dest,{headers:{'apikey':c.key,'Authorization':`Bearer ${token}`}})
    return {...payload,local_uri:dest}
  }catch{return payload}
}

let activeSync=null
async function performSync({full=false}={}){
 const initial=await loadCloud(); if(!ok(initial))throw new Error('Uzupe\u0142nij URL i Publishable key Supabase.')
 const account=await currentAccount(); if(!account.loggedIn)throw new Error('Zaloguj si\u0119 do Autologika Cloud.')
 const workshopId=account.userId; if(!workshopId)throw new Error('Brak identyfikatora konta warsztatu.')
 let cursorReset=false,c=initial
 const cursorOwner=await metaGet('lastSyncWorkshopId')
 if(String(c.workshopId||'')!==workshopId){c=await saveCloud({...c,workshopId});cursorReset=true}
 if(cursorOwner!==workshopId){await metaSet('lastSync','');await metaSet('lastSyncWorkshopId',workshopId);cursorReset=true}
 const outgoing=await dirty(); let pushed=0,filesUp=0,filesDown=0
 for(const x of outgoing){
   let payload=x.payload
   if(x.entity_type==='attachments'&&x.deleted_at){await deleteRemoteAttachment(c,payload)}
   if(x.entity_type==='attachments'&&!x.deleted_at&&!payload.storage_path){payload=await uploadAttachment(c,workshopId,x);if(payload.storage_path)filesUp++}
   const rec={workshop_id:workshopId,entity_type:x.entity_type,cloud_id:x.cloud_id,payload,updated_at:x.updated_at,deleted_at:x.deleted_at||null,version:x.version||1,device_id:c.deviceId||'android'}
   await req(c,'/rest/v1/sync_records?on_conflict=workshop_id,entity_type,cloud_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rec)})
   await markClean(x.entity_type,x.cloud_id); pushed++
 }
 const savedCursor=await metaGet('lastSync')||''
 const since=full||cursorReset||!savedCursor?'1970-01-01T00:00:00.000Z':savedCursor
 const rows=[];let offset=0
 while(true){
   const page=await req(c,`/rest/v1/sync_records?select=entity_type,cloud_id,payload,updated_at,deleted_at,version&workshop_id=eq.${encodeURIComponent(workshopId)}&updated_at=gt.${encodeURIComponent(since)}&order=updated_at.asc,cloud_id.asc&limit=1000&offset=${offset}`,{method:'GET'})||[]
   rows.push(...page);if(page.length<1000)break;offset+=page.length
 }
 const d=await db(); let pulled=0,skipped=0
 for(const r of rows){
   const local=await d.getFirstAsync('SELECT payload,updated_at,dirty FROM records WHERE entity_type=? AND cloud_id=?',[r.entity_type,r.cloud_id])
   if(local?.dirty && Date.parse(local.updated_at||0)>Date.parse(r.updated_at||0)){skipped++;continue}
   let payload=r.payload||{}
   if(r.entity_type==='attachments'&&r.deleted_at){try{const lp=local?.payload?JSON.parse(local.payload):{};if(lp.local_uri)await FileSystem.deleteAsync(lp.local_uri,{idempotent:true})}catch{}}
   if(r.entity_type==='attachments'&&!r.deleted_at){const before=payload.local_uri;payload=await downloadAttachment(c,r.cloud_id,payload);if(!before&&payload.local_uri)filesDown++}
   await d.runAsync(`INSERT INTO records(entity_type,cloud_id,payload,updated_at,deleted_at,version,dirty) VALUES (?,?,?,?,?,?,0) ON CONFLICT(entity_type,cloud_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,version=excluded.version,dirty=0`,[r.entity_type,r.cloud_id,JSON.stringify(payload),r.updated_at,r.deleted_at||null,r.version||1]); pulled++
 }
 if(rows.length)await metaSet('lastSync',rows[rows.length-1].updated_at)
 await metaSet('lastSyncWorkshopId',workshopId)
 return {pushed,pulled,skipped,remoteRows:rows.length,filesUp,filesDown,full:Boolean(full||cursorReset),cursor:rows.at(-1)?.updated_at||savedCursor,workshopId}
}
export async function syncNow(options={}){
 if(activeSync)return activeSync
 activeSync=performSync(options)
 try{return await activeSync}finally{activeSync=null}
}
