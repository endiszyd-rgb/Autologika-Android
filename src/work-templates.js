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
  const total=value.hours*value.rate
  return {
    order_cloud_id:orderId,
    kind:'ROBOCIZNA',
    name:`${value.name} — ${value.variant}`,
    qty:value.hours,
    unit_price:value.rate,
    unit_cost:0,
    labor_hours:value.hours,
    customer_description:value.scope,
    work_name:value.name,
    variant_name:value.variant,
    hours_snapshot:value.hours,
    price_snapshot:total,
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

const jsonArray=value=>JSON.stringify(Array.isArray(value)?value:[])

export function workProcedureRunPayload(item,orderId,orderItemId){
  const procedure=item?.procedure||{},progress={}
  for(const section of ['pre','steps','qc'])for(let index=0;index<(procedure[section]||[]).length;index++)progress[`${section}:${index}`]=false
  return {order_cloud_id:orderId,order_item_cloud_id:orderItemId,template_key:item.template_key||'',title:procedure.title||item.work_name||item.name||'Procedura',variant:procedure.variant||item.variant_name||'',pre_json:jsonArray(procedure.pre),steps_json:jsonArray(procedure.steps),qc_json:jsonArray(procedure.qc),recommendations_json:jsonArray(procedure.recommendations),safety_json:jsonArray(procedure.safety),parts_json:jsonArray((procedure.parts||[]).filter(part=>part?.selected!==false)),materials_json:jsonArray((procedure.materials||[]).filter(material=>material?.selected!==false)),technical_json:jsonArray(procedure.technical),progress_json:JSON.stringify(progress),catalog_work_id:item.catalog_work_id||null,catalog_variant_id:item.catalog_variant_id||null,technical_description:item.technical_description||procedure.technicalDescription||'',technical_data_key:procedure.technicalDataKey||null}
}

export function suggestedPartPayloads(item,orderId){
  return (item?.procedure?.parts||[]).filter(part=>part?.selected!==false).map(part=>({order_cloud_id:orderId,part_no:String(part?.part_no||''),name:String(part?.name||part||'Część').trim(),qty:Math.max(1,Math.round(Number(part?.qty)||1)),unit_cost:0,unit_price:0,status:'DO_ZAMOWIENIA',notes:`Sugestia z procedury: ${item.name}${part?.note?` · ${part.note}`:''}`}))
}
