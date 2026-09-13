const arrayValue=value=>{
  if(Array.isArray(value))return value
  if(typeof value!=='string'||!value.trim())return []
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch{return []}
}

export function normalizeWorkTemplate(record){
  const payload=record?.payload||record||{}
  const id=String(record?.cloud_id||payload.cloud_id||payload.id||'')
  return {
    id,
    name:String(payload.name||'Własna procedura').trim(),
    group:String(payload.group_name||'Własne').trim(),
    variant:String(payload.variant||'standard').trim(),
    scope:String(payload.scope||'').trim(),
    hours:Number(payload.hours)||1,
    rate:Number(payload.rate)||0,
    pre:arrayValue(payload.pre??payload.pre_json),
    steps:arrayValue(payload.steps??payload.steps_json),
    qc:arrayValue(payload.qc??payload.qc_json),
    parts:arrayValue(payload.parts??payload.parts_json),
    materials:arrayValue(payload.materials??payload.materials_json),
    recommendations:arrayValue(payload.recommendations??payload.recommendations_json),
    safety:arrayValue(payload.safety??payload.safety_json)
  }
}

export function workTemplateOrderItem(template,orderId){
  const value=normalizeWorkTemplate(template)
  return {
    order_cloud_id:orderId,
    kind:'LABOR',
    name:`${value.name} — ${value.variant}`,
    qty:1,
    unit_price:value.hours*value.rate,
    unit_cost:0,
    labor_hours:value.hours,
    customer_description:value.scope,
    template_key:`custom:${value.id}`,
    procedure:{
      title:value.name,
      variant:value.variant,
      scope:value.scope,
      pre:value.pre,
      steps:value.steps,
      qc:value.qc,
      parts:value.parts,
      materials:value.materials,
      recommendations:value.recommendations,
      safety:value.safety
    }
  }
}
