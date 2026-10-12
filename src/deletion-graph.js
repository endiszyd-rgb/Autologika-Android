import {recordId,sameRecordId} from './record-id.js'

export const ORDER_CHILD_TYPES=['diagnostics','order_notes','job_part_orders','order_items','payments','work_logs','communications','approvals','order_events','sales_refs','attachments','signatures','work_procedure_runs','order_qc','order_repair_operations','repair_parts','repair_part_events','dvi_inspections','dvi_items','dvi_media','dvi_decisions','appointment_resources','schedule_conflict_overrides']

export function relatedDeletionRows(rows,type,id){
 const vehicleIds=new Set(type==='customers'?rows.vehicles.filter(x=>sameRecordId(x.payload.customer_cloud_id,id)).map(x=>recordId(x.cloud_id)):type==='vehicles'?[recordId(id)]:[])
 const orderIds=new Set(type==='orders'?[recordId(id)]:rows.orders.filter(x=>vehicleIds.has(recordId(x.payload.vehicle_cloud_id))).map(x=>recordId(x.cloud_id)))
 const vehicleReminders=type==='orders'?[]:rows.service_reminders_v2.filter(x=>vehicleIds.has(recordId(x.payload.vehicle_cloud_id)))
 const reminderLinks=type==='orders'?rows.service_reminders_v2.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))):[]
 const appointments=rows.appointments.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))||vehicleIds.has(recordId(x.payload.vehicle_cloud_id)))
 const operationIds=new Set(rows.order_repair_operations.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))).map(x=>recordId(x.cloud_id)))
 const repairPartIds=new Set(rows.repair_parts.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))||operationIds.has(recordId(x.payload.repair_operation_cloud_id))).map(x=>recordId(x.cloud_id)))
 const inspectionIds=new Set(rows.dvi_inspections.filter(x=>orderIds.has(recordId(x.payload.order_cloud_id))).map(x=>recordId(x.cloud_id)))
 const dviItemIds=new Set(rows.dvi_items.filter(x=>inspectionIds.has(recordId(x.payload.inspection_cloud_id))).map(x=>recordId(x.cloud_id)))
 const appointmentIds=new Set(appointments.map(x=>recordId(x.cloud_id)))
 const linked=(entity,row)=>orderIds.has(recordId(row.payload.order_cloud_id))||(entity==='repair_parts'&&operationIds.has(recordId(row.payload.repair_operation_cloud_id)))||(entity==='repair_part_events'&&repairPartIds.has(recordId(row.payload.repair_part_cloud_id)))||(entity==='dvi_items'&&inspectionIds.has(recordId(row.payload.inspection_cloud_id)))||(['dvi_media','dvi_decisions'].includes(entity)&&dviItemIds.has(recordId(row.payload.dvi_item_cloud_id)))||(['appointment_resources','schedule_conflict_overrides'].includes(entity)&&appointmentIds.has(recordId(row.payload.appointment_cloud_id)))
 const deletions=[...ORDER_CHILD_TYPES.flatMap(entity=>rows[entity].filter(row=>linked(entity,row)).map(x=>({type:entity,id:x.cloud_id,payload:x.payload}))),...vehicleReminders.map(x=>({type:'service_reminders_v2',id:x.cloud_id,payload:x.payload})),...rows.orders.filter(x=>orderIds.has(recordId(x.cloud_id))).map(x=>({type:'orders',id:x.cloud_id,payload:x.payload})),...rows.vehicles.filter(x=>vehicleIds.has(recordId(x.cloud_id))).map(x=>({type:'vehicles',id:x.cloud_id,payload:x.payload}))]
 return{vehicleIds,orderIds,vehicleReminders,reminderLinks,deletions,appointments}
}
