export const APPROVAL_TERMS_VERSION='repair-approval-pl-v1'
export const APPROVAL_TERMS_TEXT='Potwierdzam zapoznanie się z przedstawionym zakresem prac oraz kosztami i wyrażam zgodę na wykonanie wskazanych prac.'
export const APPROVAL_PUBLIC_URL='https://endiszyd-rgb.github.io/Autologika-OS/approval/#t='

const amount=value=>Math.round((Number(value)||0)*100)/100
const text=value=>String(value??'').trim()

export function stableValue(value){
 if(Array.isArray(value))return value.map(stableValue)
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stableValue(value[key])]))
 return value
}
export function canonicalJson(value){return JSON.stringify(stableValue(value))}

export function mobileApprovalLocalId(now=Date.now(),random=0){
 return Number(now)*1000+(Math.abs(Number(random)||0)%1000)
}

export function legacyOrderLocalId(orderId){
 const value=text(orderId)
 if(/^\d+$/.test(value)){
  const numeric=Number(value)
  if(Number.isSafeInteger(numeric)&&numeric>0)return numeric
 }
 let hash=2166136261
 for(let index=0;index<value.length;index++)hash=Math.imul(hash^value.charCodeAt(index),16777619)>>>0
 return hash||1
}

export function remoteApprovalInsert({workshopId,approvalId,approvalLocalId,orderId,snapshot,tokenHash,snapshotHash,expiresAt}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
 if(!text(workshopId))throw new Error('Brak identyfikatora konta warsztatu.')
 if(!Number.isSafeInteger(Number(approvalLocalId))||Number(approvalLocalId)<=0)throw new Error('Nieprawidłowy identyfikator akceptacji.')
 if(!text(orderId))throw new Error('Nie można powiązać linku ze zleceniem.')
 if(!snapshot?.terms?.version||!snapshot?.terms?.text)throw new Error('Brak warunków akceptacji w wycenie.')
 return {workshop_id:text(workshopId),token:text(tokenHash),token_hash:text(tokenHash),approval_local_id:Number(approvalLocalId),approval_cloud_id:uuid.test(text(approvalId))?text(approvalId):null,order_local_id:legacyOrderLocalId(orderId),order_cloud_id:uuid.test(text(orderId))?text(orderId):null,snapshot,snapshot_hash:text(snapshotHash),hash_algorithm:'SHA-256',terms_version:snapshot.terms.version,terms_text:snapshot.terms.text,document_no:snapshot.approvalDocumentNo,approval_sequence:Number(snapshot.approvalSequence||1),previously_approved_total:Number(snapshot.previouslyApprovedTotal||0),expires_at:expiresAt}
}

function lineFromWork(row,index){
 const p=row?.payload||row||{},kind=String(p.kind||'ROBOCIZNA').toUpperCase(),labor=kind==='ROBOCIZNA'||kind==='LABOR'
 const quantity=amount(labor?(p.labor_hours||p.qty||1):(p.qty||1)),unitPrice=amount(p.unit_price)
 return {position:index+1,kind:labor?'ROBOCIZNA':'CZESC',name:text(p.work_name||p.name)||'Pozycja zlecenia',variant:text(p.variant_name),description:text(p.customer_description||p.notes),quantity,unit:labor?'h':'szt.',unitPrice,value:amount(quantity*unitPrice),vatRate:null,partNumber:text(p.part_no),oeNumber:text(p.oe_number),brand:text(p.brand),vehicleFitment:text(p.vehicle_fitment)}
}

function lineFromPart(row,index){
 const p=row?.payload||row||{},quantity=amount(p.qty||1),unitPrice=amount(p.unit_price)
 return {position:index+1,kind:'CZESC',name:text(p.name)||'Część',variant:'',description:'',quantity,unit:'szt.',unitPrice,value:amount(quantity*unitPrice),vatRate:null,partNumber:text(p.part_no),oeNumber:text(p.oe_number),brand:text(p.brand),vehicleFitment:text(p.vehicle_fitment)}
}

export function buildMobileApprovalSnapshot({approvalLocalId,orderId,order={},vehicle={},items=[],parts=[],total,sequence=1,previouslyApprovedTotal=0,createdAt=new Date().toISOString()}){
 const lines=[...items.map(lineFromWork),...parts.filter(row=>!['ANULOWANE','ZWROT_ZAKONCZONY'].includes(String((row.payload||row).status||''))).map((row,index)=>lineFromPart(row,items.length+index))]
 const expected=amount(total),listed=amount(lines.reduce((sum,row)=>sum+row.value,0)),difference=amount(expected-listed)
 if(Math.abs(difference)>=0.01)lines.push({position:lines.length+1,kind:'KOREKTA',name:'Korekta ceny końcowej zlecenia',variant:'',description:'Cena końcowa ustalona w zleceniu',quantity:1,unit:'szt.',unitPrice:difference,value:difference,vatRate:null,partNumber:'',oeNumber:'',brand:'',vehicleFitment:''})
 if(!lines.length)throw new Error('Nie można udostępnić pustej wyceny. Dodaj zakres prac lub części.')
 const documentId=String(approvalLocalId),previous=amount(previouslyApprovedTotal),additional=expected
 return {schemaVersion:2,approvalId:approvalLocalId,approvalSequence:Number(sequence)||1,quoteId:approvalLocalId,orderId:text(orderId),orderCloudId:text(orderId),documentNo:`AL-M-${documentId.slice(-8)}`,approvalDocumentNo:`AL-M-${documentId.slice(-8)}-A${String(sequence).padStart(2,'0')}`,createdAt,scope:`Wycena mobilna #${documentId}`,additionalScope:previous>0,previouslyApprovedTotal:previous,additionalTotal:additional,newCombinedTotal:amount(previous+additional),vehicle:{id:text(order.vehicle_cloud_id),cloudId:text(order.vehicle_cloud_id),make:text(vehicle.make||order.make),model:text(vehicle.model||order.model),year:vehicle.year||order.year||null,engine:text(vehicle.engine||order.engine),plate:text(vehicle.plate||order.plate),vin:text(vehicle.vin||order.vin)},customer:{name:text(order.customer),company:text(order.customer_company),email:text(order.email)},order:{title:text(order.title),complaint:text(order.complaint),openedAt:text(order.opened_at)},items:lines,totals:{net:null,vat:null,gross:expected,currency:'PLN'},notes:'',terms:{version:APPROVAL_TERMS_VERSION,text:APPROVAL_TERMS_TEXT}}
}

export function remoteApprovalPayload(row={}){
 return {status:String(row.status||'PENDING').toUpperCase(),note:text(row.customer_note),decided_at:row.decided_at||null,remote_id:row.id||null,remote_expires_at:row.expires_at||null,snapshot:row.snapshot||null,snapshot_hash:text(row.snapshot_hash),hash_algorithm:text(row.hash_algorithm)||'SHA-256',signature_storage_path:text(row.signature_storage_path),signature_hash:text(row.signature_hash),pdf_storage_path:text(row.pdf_storage_path),pdf_hash:text(row.pdf_hash),document_no:text(row.document_no),approval_sequence:Number(row.approval_sequence||1),previously_approved_total:amount(row.previously_approved_total)}
}
