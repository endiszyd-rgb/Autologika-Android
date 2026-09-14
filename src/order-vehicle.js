import {recordId,sameRecordId} from './record-id.js'

const clean=recordId
const key=value=>clean(value).toLocaleUpperCase('pl-PL').replace(/[^A-Z0-9]/g,'')

export function resolveOrderVehicle(order={},vehicles=[]){
  const linked=vehicles.find(vehicle=>sameRecordId(vehicle.cloud_id,order.vehicle_cloud_id))
  let vehicle=linked||null,matchedBy=linked?'ID':''
  if(!vehicle&&key(order.vin)){
    const matches=vehicles.filter(row=>key(row.payload?.vin)===key(order.vin))
    if(matches.length===1){vehicle=matches[0];matchedBy='VIN'}
  }
  if(!vehicle&&key(order.plate)){
    const matches=vehicles.filter(row=>key(row.payload?.plate)===key(order.plate))
    if(matches.length===1){vehicle=matches[0];matchedBy='PLATE'}
  }
  const source=vehicle?.payload||{},display={
    plate:clean(source.plate)||clean(order.plate),vin:clean(source.vin)||clean(order.vin),
    make:clean(source.make)||clean(order.make),model:clean(source.model)||clean(order.model)
  }
  const hasSnapshot=Boolean(display.plate||display.vin||display.make||display.model)
  return {vehicle,display,matchedBy,missing:!vehicle&&!hasSnapshot,repairCloudId:vehicle&&vehicle.cloud_id!==clean(order.vehicle_cloud_id)?vehicle.cloud_id:''}
}

export function orderVehicleRepairs(orders=[],vehicles=[]){
  return orders.map(order=>({order,result:resolveOrderVehicle(order.payload,vehicles)})).filter(x=>x.result.repairCloudId).map(x=>({orderId:x.order.cloud_id,vehicleCloudId:x.result.repairCloudId,matchedBy:x.result.matchedBy}))
}
