import {recordId,sameRecordId} from './record-id.js'

const clean=recordId
const key=value=>clean(value).toLocaleUpperCase('pl-PL').replace(/[^A-Z0-9]/g,'')
const first=(...values)=>values.map(clean).find(Boolean)||''
const payload=row=>row?.payload&&typeof row.payload==='object'?row.payload:row||{}
const snapshot=order=>{
  const value=order?.vehicle_snapshot||order?.vehicle
  if(value&&typeof value==='object')return value
  if(typeof value==='string')try{const parsed=JSON.parse(value);return parsed&&typeof parsed==='object'?parsed:{}}catch{}
  return {}
}
const vehicleIds=row=>[row?.cloud_id,row?.id,row?.local_id,payload(row).cloud_id,payload(row).id].map(clean).filter(Boolean)
const orderVehicleIds=order=>[order?.vehicle_cloud_id,order?.vehicle_id,order?.vehicleId,order?.vehicle?.cloud_id,order?.vehicle?.id].map(clean).filter(Boolean)

export function resolveOrderVehicle(order={},vehicles=[]){
  const relationIds=orderVehicleIds(order)
  const linked=vehicles.find(vehicle=>vehicleIds(vehicle).some(id=>relationIds.some(relation=>sameRecordId(id,relation))))
  let vehicle=linked||null,matchedBy=linked?'ID':''
  const saved=snapshot(order),orderVin=first(order.vin,order.vehicle_vin,saved.vin),orderPlate=first(order.plate,order.registration,order.registration_number,order.license_plate,saved.plate,saved.registration,saved.registration_number,saved.license_plate)
  if(!vehicle&&key(orderVin)){
    const matches=vehicles.filter(row=>key(first(payload(row).vin,payload(row).vehicle_vin))===key(orderVin))
    if(matches.length===1){vehicle=matches[0];matchedBy='VIN'}
  }
  if(!vehicle&&key(orderPlate)){
    const matches=vehicles.filter(row=>key(first(payload(row).plate,payload(row).registration,payload(row).registration_number,payload(row).license_plate))===key(orderPlate))
    if(matches.length===1){vehicle=matches[0];matchedBy='PLATE'}
  }
  const source=payload(vehicle),display={
    plate:first(source.plate,source.registration,source.registration_number,source.license_plate,orderPlate),
    vin:first(source.vin,source.vehicle_vin,orderVin),
    make:first(source.make,source.brand,source.manufacturer,order.make,order.brand,saved.make,saved.brand),
    model:first(source.model,source.vehicle_model,order.model,order.vehicle_model,saved.model),
    generation:first(source.generation,order.generation,saved.generation),year:first(source.year,order.year,saved.year),
    engine:first(source.engine,order.engine,saved.engine),engine_code:first(source.engine_code,order.engine_code,saved.engine_code),
    power_hp:first(source.power_hp,order.power_hp,saved.power_hp),mileage:first(source.mileage,order.mileage,saved.mileage)
  }
  const hasSnapshot=Boolean(display.plate||display.vin||display.make||display.model)
  const linkedCloudId=clean(vehicle?.cloud_id)
  return {vehicle,display,matchedBy,missing:!vehicle&&!hasSnapshot,repairCloudId:linkedCloudId&&!sameRecordId(linkedCloudId,order.vehicle_cloud_id)?linkedCloudId:''}
}

export function orderVehicleRepairs(orders=[],vehicles=[]){
  return orders.map(order=>({order,result:resolveOrderVehicle(order.payload,vehicles)})).filter(x=>x.result.repairCloudId).map(x=>({orderId:x.order.cloud_id,vehicleCloudId:x.result.repairCloudId,matchedBy:x.result.matchedBy}))
}
