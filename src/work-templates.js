const arrayValue=value=>{
  if(Array.isArray(value))return value
  if(typeof value!=='string'||!value.trim())return []
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch{return []}
}

const lineText=value=>arrayValue(value).map(item=>typeof item==='string'?item:item?.name||item?.text||item?.title||'').filter(Boolean).join('\n')
const lines=value=>String(value||'').split(/\r?\n/).map(item=>item.trim()).filter(Boolean)
const decimal=value=>Number(String(value??'').trim().replace(',','.'))

export function workTemplateForm(record){
  if(!record)return {id:'',name:'',group_name:'Własne',variant:'standard',scope:'',hours:'1',rate:'220',pre:'',steps:'',qc:'',parts:'',materials:'',recommendations:'',safety:''}
  const value=normalizeWorkTemplate(record)
  return {id:value.id,name:value.name,group_name:value.group,variant:value.variant,scope:value.scope,hours:String(value.hours),rate:String(value.rate),pre:lineText(value.pre),steps:lineText(value.steps),qc:lineText(value.qc),parts:lineText(value.parts),materials:lineText(value.materials),recommendations:lineText(value.recommendations),safety:lineText(value.safety)}
}

export function workTemplatePayload(form){
  const name=String(form?.name||'').trim(),hours=decimal(form?.hours),rate=decimal(form?.rate)
  if(!name)throw new Error('Podaj nazwę szablonu.')
  if(!Number.isFinite(hours)||hours<=0)throw new Error('Czas pracy musi być większy od zera.')
  if(!Number.isFinite(rate)||rate<0)throw new Error('Stawka nie może być ujemna.')
  const json=value=>JSON.stringify(lines(value))
  const itemJson=value=>JSON.stringify(lines(value).map(item=>({name:item,qty:1,selected:true})))
  return {name,group_name:String(form?.group_name||'Własne').trim()||'Własne',variant:String(form?.variant||'standard').trim()||'standard',scope:String(form?.scope||'').trim(),hours,rate,pre_json:json(form?.pre),steps_json:json(form?.steps),qc_json:json(form?.qc),parts_json:itemJson(form?.parts),materials_json:itemJson(form?.materials),recommendations_json:json(form?.recommendations),safety_json:json(form?.safety),active:1}
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
    kind:'ROBOCIZNA',
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
