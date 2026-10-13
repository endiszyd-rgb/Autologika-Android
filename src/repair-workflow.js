import {recordId,sameRecordId} from './record-id.js'

export function reservedInventoryTotals(repairParts=[]){
 return repairParts.reduce((totals,row)=>{const payload=row.payload||row,key=recordId(payload.inventory_part_cloud_id);if(key)totals[key]=(totals[key]||0)+Math.max(0,Math.round(Number(payload.reserved_qty)||0));return totals},{})
}

export function availableInventoryQuantity(inventoryRow,repairParts=[]){
 const payload=inventoryRow.payload||inventoryRow,reserved=reservedInventoryTotals(repairParts)[recordId(inventoryRow.cloud_id||inventoryRow.id)]||0
 return Math.max(0,Math.floor(Number(payload.stock)||0)-reserved)
}

export function calculateMobileRepairEstimates(operations=[],repairParts=[]){
 return operations.map(operation=>{const payload=operation.payload||operation,linked=repairParts.filter(part=>sameRecordId((part.payload||part).repair_operation_cloud_id,operation.cloud_id||operation.id)),labor=Number(payload.planned_hours||0)*Number(payload.labor_rate||0),partsSale=linked.reduce((sum,part)=>{const row=part.payload||part;return sum+Number(row.qty||0)*Number(row.unit_price||0)},0),before=labor+partsSale+Number(payload.other_price||0),discount=before*Math.max(0,Math.min(100,Number(payload.discount_percent||0)))/100,net=before-discount,vat=net*Number(payload.vat_rate||0)/100,cost=Number(payload.planned_hours||0)*Number(payload.labor_cost_rate||0)+linked.reduce((sum,part)=>{const row=part.payload||part;return sum+Number(row.qty||0)*Number(row.unit_cost||0)},0)+Number(payload.other_cost||0);return{operation,linked,labor,partsSale,net,vat,gross:net+vat,cost,margin:net-cost}})
}

export function cancelReservationTransition(part={}){
 const amount=Math.max(0,Math.round(Number(part.reserved_qty)||0))
 if(!amount)throw new Error('Brak aktywnej rezerwacji do anulowania.')
 return{amount,payload:{...part,reserved_qty:0,status:'CANCELLED'}}
}

export function installIssuedTransition(part={}){
 const amount=Math.max(0,Math.round(Number(part.issued_qty||0)-Number(part.returned_qty||0)-Number(part.installed_qty||0)))
 if(!amount)throw new Error('Brak wydanych części oczekujących na montaż.')
 return{amount,payload:{...part,installed_qty:Number(part.installed_qty||0)+amount,status:'INSTALLED'}}
}
