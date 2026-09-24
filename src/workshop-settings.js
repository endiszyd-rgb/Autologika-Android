export const WORKSHOP_LAYOUT_KEY='workshop_layout_v1'
export const WORKSHOP_LAYOUT_ID='workshop-layout-v1'
export const DEFAULT_WORKSHOP_LAYOUT={bays:['Stanowisko 1','Stanowisko 2','Diagnostyka','Plac / oczekuje'],openingHour:8,closingHour:18,defaultAppointmentMinutes:60}

const clamp=(value,min,max,fallback)=>{const number=Math.round(Number(value));return Number.isFinite(number)?Math.max(min,Math.min(max,number)):fallback}

export function normalizeWorkshopLayout(input={}){
 const source=input&&typeof input==='object'?input:{},names=Array.isArray(source.bays)?source.bays.map(value=>String(value||'').trim()).filter(Boolean):DEFAULT_WORKSHOP_LAYOUT.bays
 const bays=[...new Set(names)].slice(0,20),openingHour=clamp(source.openingHour,0,22,DEFAULT_WORKSHOP_LAYOUT.openingHour)
 return {bays:bays.length?bays:[...DEFAULT_WORKSHOP_LAYOUT.bays],openingHour,closingHour:clamp(source.closingHour,openingHour+1,24,DEFAULT_WORKSHOP_LAYOUT.closingHour),defaultAppointmentMinutes:clamp(source.defaultAppointmentMinutes,15,480,DEFAULT_WORKSHOP_LAYOUT.defaultAppointmentMinutes)}
}

export function workshopLayoutFromRows(rows=[]){
 const row=rows.find(item=>item.cloud_id===WORKSHOP_LAYOUT_ID||item.payload?.setting_key===WORKSHOP_LAYOUT_KEY)
 try{return normalizeWorkshopLayout(typeof row?.payload?.value==='string'?JSON.parse(row.payload.value):row?.payload?.value)}catch{return normalizeWorkshopLayout()}
}

export function workshopLayoutPayload(value){return {setting_key:WORKSHOP_LAYOUT_KEY,value:JSON.stringify(normalizeWorkshopLayout(value))}}
