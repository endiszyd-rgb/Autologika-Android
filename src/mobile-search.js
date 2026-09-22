export const normalizeSearch=value=>String(value??'').replace(/[łŁ]/g,'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl-PL').replace(/[^a-z0-9]+/g,' ').trim()

const values=value=>{
 if(value===null||value===undefined)return []
 if(Array.isArray(value))return value.flatMap(values)
 if(typeof value==='object')return Object.values(value).flatMap(values)
 return [value]
}

export function matchesSearch(value,query){
 const tokens=normalizeSearch(query).split(' ').filter(Boolean)
 if(!tokens.length)return true
 const haystack=normalizeSearch(values(value).join(' '))
 return tokens.every(token=>haystack.includes(token))
}

export function filterRecords(rows,query,project=row=>row?.payload||row){
 return (rows||[]).filter(row=>matchesSearch(project(row),query))
}
