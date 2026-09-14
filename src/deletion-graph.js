import {recordId,sameRecordId} from './record-id.js'

export const ORDER_CHILD_TYPES=['diagnostics','order_notes','job_part_orders','order_items','payments','work_logs','communications','approvals','quote_approvals','order_events','sales_refs','attachments','signatures','work_procedure_runs','order_qc']

export function relatedDeletionRows(rows,type,id){
 const vehicleIds=new Set(type==='customers'?rows.vehicles.filter(x=>sameRecordId(x.payload.customer_cloud_id,id)).map(x=>recordId(x.cloud_id)):type==='vehicles'?[recordId(id)]:[])
 const orderIds=new Set(type==='orders'?[recordId(id)]:rows.orders.filter(x=>vehicleIds.has(recordId(x.payload.vehicle_cloud_id))).map(x=>recordId(x.cloud_id)))
 const vehicleReminders=type==='orders'?[]:rows.service_reminders_v2.filter(x=>vehicleIds.has(recordId(x.payload.vehicle_cloud_id)))
 const reminderLinks=type==='orders'?rows.service_reminders_v2.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))):[]
 const deletions=[...ORDER_CHILD_TYPES.flatMap(entity=>rows[entity].filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))).map(x=>({type:entity,id:x.cloud_id,payload:x.payload}))),...vehicleReminders.map(x=>({type:'service_reminders_v2',id:x.cloud_id,payload:x.payload})),...rows.orders.filter(x=>orderIds.has(recordId(x.cloud_id))).map(x=>({type:'orders',id:x.cloud_id,payload:x.payload})),...rows.vehicles.filter(x=>vehicleIds.has(recordId(x.cloud_id))).map(x=>({type:'vehicles',id:x.cloud_id,payload:x.payload}))]
 const appointments=rows.appointments.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))||vehicleIds.has(recordId(x.payload.vehicle_cloud_id)))
 return{vehicleIds,orderIds,vehicleReminders,reminderLinks,deletions,appointments}
}
