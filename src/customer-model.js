const clean=value=>String(value??'').trim()
const phoneKey=value=>{const digits=clean(value).replace(/\D/g,'').replace(/^0048/,'');return digits.length===11&&digits.startsWith('48')?digits.slice(2):digits}
const emailKey=value=>clean(value).toLocaleLowerCase('pl-PL')

export function customerPayload(input={}){
 const payload={name:clean(input.name),phone:clean(input.phone),email:clean(input.email).toLocaleLowerCase('pl-PL'),company:clean(input.company),notes:clean(input.notes)}
 if(!payload.name)throw new Error('Wpisz nazwę lub imię klienta.')
 if(payload.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))throw new Error('Podaj prawidłowy adres e-mail.')
 return payload
}

export function duplicateCustomer(customers,input,excludeId=''){
 const phone=phoneKey(input?.phone),email=emailKey(input?.email)
 if(!phone&&!email)return null
 return (customers||[]).find(row=>String(row.cloud_id)!==String(excludeId)&&((phone&&phoneKey(row.payload?.phone)===phone)||(email&&emailKey(row.payload?.email)===email)))||null
}

export function customerSearchRecord(row){
 return {...(row?.payload||{}),id:row?.cloud_id||''}
}
