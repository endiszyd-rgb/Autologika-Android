const numeric=value=>Number(String(value??'').trim().replace(',','.'))

export function wholePartQuantity(value,{allowZero=false,label='Ilość części'}={}){
 const quantity=numeric(value),minimum=allowZero?0:1
 if(!Number.isFinite(quantity)||!Number.isInteger(quantity)||quantity<minimum){
  throw new Error(`${label} musi być liczbą całkowitą${allowZero?' równą zero lub większą':' większą od zera'}, np. 1, 2 lub 3 szt.`)
 }
 return quantity
}

export function isWholePartQuantity(value,{allowZero=false}={}){
 const quantity=numeric(value)
 return Number.isInteger(quantity)&&quantity>=(allowZero?0:1)
}

export function roundedPartQuantity(value,{allowZero=false}={}){
 const quantity=numeric(value),minimum=allowZero?0:1
 if(!Number.isFinite(quantity))return minimum
 return Math.max(minimum,Math.round(quantity))
}

export function normalizePartPayload(entityType,payload={}){
 const next={...payload}
 if(entityType==='inventory_parts'){
  if(Object.prototype.hasOwnProperty.call(next,'stock'))next.stock=roundedPartQuantity(next.stock,{allowZero:true})
  if(Object.prototype.hasOwnProperty.call(next,'min_stock'))next.min_stock=roundedPartQuantity(next.min_stock,{allowZero:true})
 }
 if(entityType==='job_part_orders'&&Object.prototype.hasOwnProperty.call(next,'qty'))next.qty=roundedPartQuantity(next.qty)
 if(entityType==='order_items'&&['CZESC','PART'].includes(String(next.kind||'').toUpperCase())&&Object.prototype.hasOwnProperty.call(next,'qty'))next.qty=roundedPartQuantity(next.qty)
 return next
}

export const partQuantityLabel=value=>`${roundedPartQuantity(value,{allowZero:true})} szt.`
