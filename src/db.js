import * as SQLite from 'expo-sqlite'
import * as FileSystem from 'expo-file-system/legacy'
import {ORDER_CHILD_TYPES,relatedDeletionRows} from './deletion-graph.js'
import {recordId,sameRecordId} from './record-id.js'

let dbPromise
export function db(){ if(!dbPromise)dbPromise=SQLite.openDatabaseAsync('autologika-mobile.db'); return dbPromise }
export async function initDb(){
  const d=await db()
  await d.execAsync(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS records(
      entity_type TEXT NOT NULL,
      cloud_id TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      dirty INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(entity_type,cloud_id)
    );
    CREATE INDEX IF NOT EXISTS idx_records_type ON records(entity_type,deleted_at);
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT);
  `)
  // 0.4+: ujednolicenie nazwy załączników z desktopem.
  await d.runAsync("UPDATE records SET entity_type='attachments' WHERE entity_type='attachments_mobile'")
}
export const now=()=>new Date().toISOString()
export const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
export async function list(type){ const d=await db(); const rows=await d.getAllAsync('SELECT * FROM records WHERE entity_type=? AND deleted_at IS NULL ORDER BY updated_at DESC',[type]); return rows.map(x=>({...x,payload:JSON.parse(x.payload||'{}')})) }
export async function get(type,id){ const d=await db(); const x=await d.getFirstAsync('SELECT * FROM records WHERE entity_type=? AND cloud_id=?',[type,id]); return x?{...x,payload:JSON.parse(x.payload||'{}')}:null }
export async function put(type,id,payload,{dirty=1,updatedAt=now(),version=1}={}){ const d=await db(); await d.runAsync(`INSERT INTO records(entity_type,cloud_id,payload,updated_at,version,dirty) VALUES (?,?,?,?,?,?) ON CONFLICT(entity_type,cloud_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at,version=excluded.version,dirty=excluded.dirty,deleted_at=NULL`,[type,id,JSON.stringify(payload),updatedAt,version,dirty]); return id }
export async function patch(type,id,changes){ const x=await get(type,id); if(!x)return; return put(type,id,{...x.payload,...changes},{dirty:1,version:(x.version||1)+1}) }
const clean=value=>String(value??'').trim()
const normalizePlate=value=>clean(value).replace(/\s+/g,' ').toUpperCase()
const normalizeVin=value=>clean(value).replace(/\s+/g,'').toUpperCase()
const optionalNumber=(value,min,max,label)=>{if(value===''||value===null||value===undefined)return null;const number=Number(value);if(!Number.isFinite(number)||number<min||number>max)throw new Error(`${label}: nieprawidłowa wartość.`);return number}
export async function updateCustomerGraph(id,input){
 const current=await get('customers',id);if(!current)throw new Error('Klient już nie istnieje.')
 const payload={...current.payload,name:clean(input.name),phone:clean(input.phone),email:clean(input.email).toLowerCase(),company:clean(input.company),notes:clean(input.notes)}
 if(!payload.name)throw new Error('Wpisz nazwę lub imię klienta.')
 if(payload.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))throw new Error('Podaj prawidłowy adres e-mail.')
 await patch('customers',id,payload)
 const [vehicles,orders]=await Promise.all([list('vehicles'),list('orders')]),vehicleIds=new Set(vehicles.filter(x=>sameRecordId(x.payload.customer_cloud_id,id)).map(x=>recordId(x.cloud_id)))
 for(const order of orders.filter(x=>vehicleIds.has(recordId(x.payload.vehicle_cloud_id))))await patch('orders',order.cloud_id,{customer:payload.name})
}
export async function vehiclePayload(input,id=''){
 const customerId=clean(input.customer_cloud_id),customer=customerId?await get('customers',customerId):null,plate=normalizePlate(input.plate),vin=normalizeVin(input.vin),make=clean(input.make)
 if(customerId&&!customer)throw new Error('Wybrany klient nie istnieje.');if(!make)throw new Error('Wpisz markę pojazdu.');if(!plate&&!vin)throw new Error('Podaj numer rejestracyjny lub VIN.');if(vin&&!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))throw new Error('VIN musi mieć 17 prawidłowych znaków.')
 const vehicles=await list('vehicles'),duplicate=vehicles.find(x=>x.cloud_id!==id&&((vin&&normalizeVin(x.payload.vin)===vin)||(plate&&normalizePlate(x.payload.plate)===plate)))
 if(duplicate)throw new Error(vin&&normalizeVin(duplicate.payload.vin)===vin?'Pojazd z tym VIN-em już istnieje.':'Pojazd z tym numerem rejestracyjnym już istnieje.')
 return {customer_cloud_id:customerId||null,plate,vin,make,model:clean(input.model),generation:clean(input.generation),year:optionalNumber(input.year,1886,new Date().getFullYear()+1,'Rok produkcji'),engine:clean(input.engine),power_hp:optionalNumber(input.power_hp,1,2500,'Moc silnika'),engine_code:clean(input.engine_code).toUpperCase(),mileage:optionalNumber(input.mileage,0,10000000,'Przebieg')||0,notes:clean(input.notes)}
}
export async function createVehicleGraph(input){const payload=await vehiclePayload(input);const id=uid();await put('vehicles',id,payload);return {id,payload}}
export async function updateVehicleGraph(id,input){
 const current=await get('vehicles',id);if(!current)throw new Error('Pojazd już nie istnieje.')
 const payload={...current.payload,...await vehiclePayload(input,id)}
 await patch('vehicles',id,payload)
 const customer=payload.customer_cloud_id?await get('customers',payload.customer_cloud_id):null,orders=await list('orders')
 for(const order of orders.filter(x=>sameRecordId(x.payload.vehicle_cloud_id,id)))await patch('orders',order.cloud_id,{customer:customer?.payload.name||'',plate:payload.plate,vin:payload.vin,make:payload.make,model:payload.model,generation:payload.generation,year:payload.year,engine:payload.engine,power_hp:payload.power_hp,engine_code:payload.engine_code,mileage:payload.mileage})
}

export async function remove(type,id){ const d=await db(); await d.runAsync('UPDATE records SET deleted_at=?,updated_at=?,dirty=1 WHERE entity_type=? AND cloud_id=?',[now(),now(),type,id]) }
export async function deletionPlan(type,id){
  if(!['customers','vehicles','orders'].includes(type))throw new Error('Nieobsługiwany typ rekordu.')
  const rows={}
  for(const entity of ['customers','vehicles','orders','appointments','service_reminders_v2',...ORDER_CHILD_TYPES])rows[entity]=await list(entity)
  const root=rows[type].find(x=>sameRecordId(x.cloud_id,id))
  if(!root)throw new Error('Rekord już nie istnieje.')
  const {vehicleIds,orderIds,vehicleReminders,reminderLinks,deletions,appointments}=relatedDeletionRows(rows,type,id)
  if(type==='customers')deletions.push({type:'customers',id,payload:root.payload})
  return {type,id,label:type==='customers'?root.payload.name:type==='vehicles'?[root.payload.plate,root.payload.make,root.payload.model].filter(Boolean).join(' · '):`${root.payload.plate||''} · ${root.payload.title||'Zlecenie'}`,deletions,appointments,reminderLinks,counts:{customers:type==='customers'?1:0,vehicles:vehicleIds.size,orders:orderIds.size,attachments:deletions.filter(x=>x.type==='attachments').length,appointments:appointments.length,reminders:vehicleReminders.length+reminderLinks.length}}
}
export async function cascadeRemove(type,id){
  const plan=await deletionPlan(type,id)
  for(const row of plan.deletions.filter(x=>x.type==='attachments'))try{if(row.payload.local_uri)await FileSystem.deleteAsync(row.payload.local_uri,{idempotent:true})}catch{}
  for(const appointment of plan.appointments){
    const changes={}
    if(plan.type==='orders'&&sameRecordId(appointment.payload.order_cloud_id,id))changes.order_cloud_id=null
    if(plan.type!=='orders'){if(appointment.payload.order_cloud_id&&plan.deletions.some(x=>x.type==='orders'&&sameRecordId(x.id,appointment.payload.order_cloud_id)))changes.order_cloud_id=null;if(appointment.payload.vehicle_cloud_id&&plan.deletions.some(x=>x.type==='vehicles'&&sameRecordId(x.id,appointment.payload.vehicle_cloud_id)))changes.vehicle_cloud_id=null}
    if(Object.keys(changes).length)await patch('appointments',appointment.cloud_id,changes)
  }
  for(const reminder of plan.reminderLinks)await patch('service_reminders_v2',reminder.cloud_id,{order_cloud_id:null})
  for(const row of plan.deletions)await remove(row.type,row.id)
  return plan
}
export async function dirty(){ const d=await db(); const rows=await d.getAllAsync('SELECT * FROM records WHERE dirty=1 ORDER BY updated_at'); return rows.map(x=>({...x,payload:JSON.parse(x.payload||'{}')})) }
export async function markClean(type,id){ const d=await db(); await d.runAsync('UPDATE records SET dirty=0 WHERE entity_type=? AND cloud_id=?',[type,id]) }
export async function metaGet(key){ const d=await db(); return (await d.getFirstAsync('SELECT value FROM meta WHERE key=?',[key]))?.value||'' }
export async function metaSet(key,value){ const d=await db(); await d.runAsync('INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,String(value||'')]) }

export async function exportSnapshot(){
  const d=await db()
  const rows=await d.getAllAsync('SELECT * FROM records ORDER BY entity_type,updated_at')
  const meta=await d.getAllAsync('SELECT * FROM meta ORDER BY key')
  const dir=`${FileSystem.documentDirectory}autologika/backups/`
  await FileSystem.makeDirectoryAsync(dir,{intermediates:true})
  const stamp=new Date().toISOString().replace(/[:.]/g,'-')
  const file=`${dir}Autologika_Android_${stamp}.json`
  const data={format:'autologika-mobile-backup-v1',created_at:new Date().toISOString(),records:rows.map(x=>({...x,payload:JSON.parse(x.payload||'{}')})),meta}
  await FileSystem.writeAsStringAsync(file,JSON.stringify(data,null,2))
  return file
}
