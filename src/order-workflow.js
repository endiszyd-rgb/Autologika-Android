const CLOSED_PART_STATES=new Set(['ZAMONTOWANE','ZWROT_ZAKONCZONY','ANULOWANE'])

export const MOBILE_ORDER_STEPS=[
 ['diagnosis','Diagnoza','diagnosis'],
 ['approval','Akceptacja','settlement'],
 ['parts','Części','parts'],
 ['scope','Zakres prac','work'],
 ['time','Czas pracy','work'],
 ['qc','Kontrola jakości','settlement'],
 ['payment','Płatność','settlement'],
 ['release','Wydanie','docs']
]

export const hasBasicDiagnosis=diagnosis=>['symptom_confirmed','conclusion','recommendation'].some(key=>Boolean(String(diagnosis?.[key]||'').trim()))

const newest=(rows=[])=>rows.reduce((latest,row)=>{
 const stamp=value=>Date.parse(value?.payload?.decided_at||value?.payload?.created_at||value?.updated_at||'')||Number(value?.version||0)||Number(value?.cloud_id||0)||0
 return !latest||stamp(row)>=stamp(latest)?row:latest
},null)

export function deriveMobileOrderWorkflow({order={},diagnosis={},approvals=[],parts=[],items=[],logs=[],payments=[],qc=[],notes={},total=0}={}){
 const latestApproval=newest(approvals)
 const diagnosisDone=hasBasicDiagnosis(diagnosis)
 const approvalDone=diagnosisDone&&latestApproval?.payload?.status==='APPROVED'
 const partsDone=approvalDone&&!parts.some(row=>!CLOSED_PART_STATES.has(row.payload?.status))
 const scopeDone=partsDone&&items.length>0
 const timeDone=scopeDone&&logs.some(row=>Boolean(row.payload?.ended_at)||Number(row.payload?.duration_minutes)>0)
 const checked=key=>Boolean(qc.find(row=>row.payload?.key===key)?.payload?.checked)
 const qcDone=timeDone&&checked('documents')&&checked('final')
 const paid=payments.reduce((sum,row)=>sum+Number(row.payload?.amount||0),0)
 const paymentDone=qcDone&&(Number(total||0)<=0||paid+0.01>=Number(total||0))
 const releaseDone=paymentDone&&Boolean(String(notes?.release_notes||'').trim())&&order.status==='GOTOWE'
 const state={diagnosis:diagnosisDone,approval:approvalDone,parts:partsDone,scope:scopeDone,time:timeDone,qc:qcDone,payment:paymentDone,release:releaseDone}
 const steps=MOBILE_ORDER_STEPS.map(([key,label,tab])=>({key,label,tab,done:Boolean(state[key])}))
 const next=steps.find(step=>!step.done)||null
 const copy={diagnosis:['Opisz rozpoznaną usterkę','Podstawowa diagnoza wystarczy, aby przygotować zakres.'],approval:['Zapisz decyzję klienta','Potwierdź zaakceptowaną kwotę i zakres prac.'],parts:['Rozlicz zamówione części','Zamontuj, zwróć lub anuluj wszystkie otwarte pozycje.'],scope:['Dodaj zakres wykonanych prac','Wybierz pracę z katalogu albo dodaj własną pozycję.'],time:['Zarejestruj czas pracy','Zakończ co najmniej jeden wpis czasu mechanika.'],qc:['Wykonaj kontrolę jakości','Potwierdź dokumentację i kontrolę końcową.'],payment:['Rozlicz płatność','Zapisane wpłaty muszą pokryć wartość zlecenia.'],release:['Przygotuj pojazd do wydania','Zapisz zalecenia i ustaw status zlecenia na GOTOWE.']}
 return {steps,next:next?{...next,title:copy[next.key][0],detail:copy[next.key][1]}:null,done:steps.filter(step=>step.done).length,total:steps.length,complete:steps.every(step=>step.done),paid,due:Math.max(0,Number(total||0)-paid),status:order.status||'PRZYJETE'}
}
