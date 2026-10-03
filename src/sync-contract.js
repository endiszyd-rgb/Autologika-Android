const ENTITY_ALIASES={quote_approvals:'approvals',attachments_mobile:'attachments'}

export function canonicalEntityType(type=''){
 const value=String(type||'').trim()
 return ENTITY_ALIASES[value]||value
}

export function normalizeSyncPayload(type,payload={}){
 const entity=canonicalEntityType(type),next={...(payload||{})}
 if(entity==='order_items'){
  const kind=String(next.kind||'').trim().toUpperCase()
  if(kind==='LABOR')next.kind='ROBOCIZNA'
  if(kind==='CZĘŚĆ')next.kind='CZESC'
 }
 if(entity==='order_qc'){
  const key=String(next.key||next.check_key||'').trim()
  if(key){next.key=key;next.check_key=key}
 }
 if(entity==='approvals'){
  next.status=String(next.status||'PENDING').toUpperCase()
  if(next.source==='ANDROID'){
   next.scope=String(next.scope||'Akceptacja zakresu w aplikacji mobilnej')
   next.channel=String(next.channel||'OSOBISCIE')
  }
 }
 return next
}

export function normalizeSyncRecord(record={}){
 const entityType=canonicalEntityType(record.entity_type)
 return {...record,entity_type:entityType,payload:normalizeSyncPayload(entityType,record.payload)}
}
