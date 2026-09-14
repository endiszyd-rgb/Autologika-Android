export const recordId=value=>String(value??'').trim()

export const sameRecordId=(left,right)=>{const id=recordId(left);return Boolean(id)&&id===recordId(right)}
