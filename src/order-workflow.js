const CLOSED_PART_STATES=new Set(['ZAMONTOWANE','ZWROT_ZAKONCZONY','ANULOWANE'])

export const MOBILE_ORDER_STEPS=[
 ['intake','Przyjęcie','overview'],
 ['diagnosis','Diagnoza','diagnosis'],
 ['quote','Wycena · zakres i części','works'],
 ['approval','Akceptacja klienta','quote'],
 ['repairQc','QC naprawy','release'],
 ['releaseQc','QC przed wydaniem','release'],
 ['payment','Płatność','settlement'],
 ['release','Wydanie','release']
]

export const hasBasicDiagnosis=diagnosis=>['symptom_confirmed','conclusion','recommendation'].some(key=>Boolean(String(diagnosis?.[key]||'').trim()))

const newest=(rows=[])=>rows.reduce((latest,row)=>{
 const stamp=value=>Date.parse(value?.payload?.decided_at||value?.payload?.created_at||value?.updated_at||'')||Number(value?.version||0)||Number(value?.cloud_id||0)||0
 return !latest||stamp(row)>=stamp(latest)?row:latest
},null)

export function deriveMobileOrderWorkflow({order={},diagnosis={},approvals=[],parts=[],items=[],logs=[],payments=[],qc=[],notes={},total=0}={}){
 const latestApproval=newest(approvals)
 const intakeDone=Boolean(order?.status||order?.title||order?.complaint||order?.vehicle_cloud_id||order?.make||order?.plate)
 const diagnosisDone=intakeDone&&hasBasicDiagnosis(diagnosis)
 const quoteDone=diagnosisDone&&(items.length>0||parts.length>0)
 const approvalDone=quoteDone&&latestApproval?.payload?.status==='APPROVED'
 const partsDone=approvalDone&&!parts.some(row=>!CLOSED_PART_STATES.has(row.payload?.status))
 const timeDone=approvalDone&&logs.some(row=>Boolean(row.payload?.ended_at)||Number(row.payload?.duration_minutes)>0)
 const checked=key=>Boolean(qc.find(row=>(row.payload?.key||row.payload?.check_key)===key)?.payload?.checked)
 const repairQcDone=partsDone&&timeDone&&checked('documents')
 const releaseQcDone=repairQcDone&&checked('final')
 const paid=payments.reduce((sum,row)=>sum+Number(row.payload?.amount||0),0)
 const paymentDone=releaseQcDone&&(Number(total||0)<=0||paid+0.01>=Number(total||0))
 const releaseDone=paymentDone&&Boolean(String(notes?.release_notes||'').trim())&&order.status==='GOTOWE'
 const state={intake:intakeDone,diagnosis:diagnosisDone,quote:quoteDone,approval:approvalDone,repairQc:repairQcDone,releaseQc:releaseQcDone,payment:paymentDone,release:releaseDone}
 const steps=MOBILE_ORDER_STEPS.map(([key,label,tab])=>({key,label,tab,done:Boolean(state[key])}))
 const next=steps.find(step=>!step.done)||null
 const copy={intake:['Uzupełnij przyjęcie','Dodaj pojazd, temat i zgłoszenie klienta.'],diagnosis:['Opisz rozpoznaną usterkę','Podstawowy opis wystarczy, aby przygotować zakres.'],quote:['Przygotuj wycenę','Dodaj zakres prac i potrzebne części.'],approval:['Zapisz decyzję klienta','Potwierdź zaakceptowaną kwotę i zakres prac.'],repairQc:['Sprawdź wykonaną naprawę','Zakończ pracę i potwierdź kontrolę naprawy.'],releaseQc:['Wykonaj QC przed wydaniem','Potwierdź końcową kontrolę pojazdu.'],payment:['Rozlicz płatność','Zapisane wpłaty muszą pokryć wartość zlecenia.'],release:['Wydaj pojazd','Zapisz zalecenia i ustaw status zlecenia na GOTOWE.']}
 return {steps,next:next?{...next,title:copy[next.key][0],detail:copy[next.key][1]}:null,done:steps.filter(step=>step.done).length,total:steps.length,complete:steps.every(step=>step.done),paid,due:Math.max(0,Number(total||0)-paid),status:order.status||'PRZYJETE'}
}
