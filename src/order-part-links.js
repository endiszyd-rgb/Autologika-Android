const text=value=>String(value??'').trim()
const number=value=>Number(String(value??0).replace(',','.'))||0

export const PART_SOURCE={STOCK:'MAGAZYN',ORDER:'ZAMOWIENIE',MANUAL:'RECZNIE'}

export function inventoryAssignmentPayload({inventory={},inventoryId='',orderId='',repairItem={},repairItemId='',qty=1,vehicle={}}={}){
 const count=Math.round(number(qty)),available=Math.round(number(inventory.stock))
 if(!orderId)throw new Error('Brak zlecenia dla części.')
 if(!repairItemId)throw new Error('Wybierz pozycję naprawy, do której należy część.')
 if(!inventoryId)throw new Error('Nie wybrano części magazynowej.')
 if(!Number.isInteger(count)||count<1)throw new Error('Ilość musi być pełną liczbą sztuk.')
 if(count>available)throw new Error(`W magazynie dostępne: ${available} szt.`)
 const name=text(inventory.name)||'Część magazynowa',brand=text(inventory.brand),partNo=text(inventory.part_no),unitCost=number(inventory.unit_cost),unitPrice=number(inventory.sell_price||inventory.unit_price)
 const relation={order_cloud_id:orderId,repair_item_cloud_id:repairItemId,inventory_part_cloud_id:inventoryId,source:PART_SOURCE.STOCK}
 return {
  inventory:{...inventory,stock:available-count},
  jobPart:{...relation,name,brand,part_no:partNo,barcode:text(inventory.barcode),oe_number:text(inventory.oe_number),cross_numbers:text(inventory.cross_numbers),vehicle_fitment:text(inventory.vehicle_fitment),location:text(inventory.location),qty:count,unit_cost:unitCost,unit_price:unitPrice,status:'ODEBRANE',repair_name:text(repairItem.name||repairItem.work_name),assigned_at:new Date().toISOString(),vehicle_snapshot:JSON.stringify({plate:text(vehicle.plate),vin:text(vehicle.vin),make:text(vehicle.make),model:text(vehicle.model),engine:text(vehicle.engine),engine_code:text(vehicle.engine_code)})},
  orderItem:{...relation,kind:'CZESC',name,brand,part_no:partNo,qty:count,unit_cost:unitCost,unit_price:unitPrice,repair_name:text(repairItem.name||repairItem.work_name)}
 }
}

export function linkedPartsForRepair(parts=[],repairItemId=''){
 return parts.filter(row=>String(row?.payload?.repair_item_cloud_id||'')===String(repairItemId||''))
}

export function partModuleBucket(payload={}){
 const status=text(payload.status).toUpperCase(),source=text(payload.source).toUpperCase()
 if(['DO_ZWROTU','ZWROT_ZAKONCZONY'].includes(status))return 'ZWROTY'
 if(status==='DO_ZAMOWIENIA')return 'DO ZAMÓWIENIA'
 if(['ZAMOWIONE','W_DRODZE'].includes(status))return 'ZAMÓWIONE'
 if(source===PART_SOURCE.STOCK||payload.repair_item_cloud_id)return 'PRZYPISANE DO ZLECEŃ'
 return 'PRZYPISANE DO ZLECEŃ'
}
