const clean=value=>String(value??'').trim()
const key=value=>clean(value).replace(/\s+/g,'').toLocaleUpperCase('pl-PL')
const id=value=>clean(value)

export function customerForVehicle(customers,vehicle){
 const customerId=id(vehicle?.payload?.customer_cloud_id)
 return customerId?(customers||[]).find(row=>id(row.cloud_id)===customerId)||null:null
}

export function intakeVehicleSearchRecord(vehicle,customers){
 const customer=customerForVehicle(customers,vehicle)
 return {...(vehicle?.payload||{}),owner:customer?.payload?.name||'',owner_phone:customer?.payload?.phone||''}
}

export function findExistingIntakeVehicle(vehicles,form){
 const vin=key(form?.vin),plate=key(form?.plate)
 if(!vin&&!plate)return null
 return (vehicles||[]).find(row=>{
  const payload=row?.payload||{}
  return Boolean((vin&&key(payload.vin)===vin)||(plate&&key(payload.plate)===plate))
 })||null
}

export function orderVehicleSnapshot(form,vehicle,customer){
 const payload=vehicle?.payload||form||{}
 return {
  plate:key(payload.plate),vin:key(payload.vin),make:clean(payload.make),model:clean(payload.model),
  generation:clean(payload.generation),year:Number(payload.year)||null,engine:clean(payload.engine),
  power_hp:Number(payload.power_hp)||null,engine_code:key(payload.engine_code),
  mileage:Number(form?.mileage||payload.mileage)||0,customer:clean(customer?.payload?.name||form?.name)
 }
}
