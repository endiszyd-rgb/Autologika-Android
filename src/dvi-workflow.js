import {recordId,sameRecordId} from './record-id.js'

export const dviNeedsCustomerDecision=item=>String(item?.payload?.status||item?.status||'').toUpperCase()==='REPAIR'

export function nextDviDecisionVersion(decisions,itemId){
 const versions=(decisions||[]).filter(row=>sameRecordId(row?.payload?.dvi_item_cloud_id,itemId)).map(row=>Number(row?.payload?.version)||0)
 return Math.max(0,...versions)+1
}

export function dviInspectionProgress(items,inspectionId,decision={}){
 const linked=(items||[]).filter(row=>sameRecordId(row?.payload?.inspection_cloud_id,inspectionId))
 const recommendations=linked.filter(dviNeedsCustomerDecision)
 const pending=recommendations.filter(row=>{
  if(decision.itemId&&sameRecordId(recordId(row.cloud_id),decision.itemId))return !['APPROVED','DECLINED'].includes(String(decision.value||'').toUpperCase())
  return !['APPROVED','DECLINED'].includes(String(row?.payload?.decision||'PENDING').toUpperCase())
 })
 return{recommendations:recommendations.length,pending:pending.length,completed:recommendations.length>0&&pending.length===0}
}
