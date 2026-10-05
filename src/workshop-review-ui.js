import React,{useEffect,useState} from 'react'
import {Alert,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native'
import {list,put,patch,uid} from './db'
import {resolveOrderVehicle} from './order-vehicle'
import {sameRecordId} from './record-id'
import {StatusBadge} from './mobile-ui'
import {vehicleTitle,vehicleMeta} from './workshop-logic'
import {SYSTEMS} from './vehicle-health'
import {findingPayload,orderAmount,repairHistory,searchWorkCatalog,appointmentsOnDay,weekDates} from './workshop-review'
import {WORK_CATALOG,jobsForGroup} from './work-catalog'
import {procedureFor} from './work-procedures'
import {localDate,appointmentStatusLabel} from './schedule-model'
import {normalizeWorkTemplate} from './work-templates'

const money=value=>`${Number(value||0).toFixed(2)} zł`
const date=value=>value?new Date(value).toLocaleDateString('pl-PL'):'—'
const time=value=>new Date(value).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})

export function OrderTiles({orders,vehicles=[],items=[],value,onOpen,actions,showAmount=true}){
 const {width}=useWindowDimensions()
 return <View style={r.grid}>{orders.map(order=>{const car=resolveOrderVehicle(order.payload,vehicles).display,p=order.payload;return <View key={order.cloud_id} style={[r.tile,width<700?r.full:r.half,sameRecordId(value,order.cloud_id)&&r.selected]}>
  <Pressable accessibilityRole="button" onPress={()=>onOpen(order.cloud_id)} style={r.tileBody}>
   <View style={r.top}><Text style={r.plate}>{car.plate||'BEZ REJ.'}</Text><StatusBadge value={p.status||'PRZYJETE'} compact/></View>
   <Text style={r.title}>{vehicleTitle(car)}</Text><Text style={r.text}>{p.customer||'Właściciel nieprzypisany'}</Text>
   <Text style={r.subject} numberOfLines={2}>{p.title||'Zlecenie warsztatowe'}</Text>
   {!!p.complaint&&<Text style={r.text} numberOfLines={2}>{p.complaint}</Text>}
   {!!p.wait_state&&p.wait_state!=='BRAK'&&<Text style={r.warning}>Oczekuje: {p.wait_state.replaceAll('_',' ')}</Text>}
   <View style={r.bottom}><Text style={r.text}>{date(p.opened_at||p.created_at||order.updated_at)}</Text>{showAmount&&<Text style={r.amount}>{money(orderAmount(order,items))}</Text>}</View>
   <Text style={r.link}>Otwórz szczegóły →</Text>
  </Pressable>{actions&&<View style={r.tileActions}>{actions(order)}</View>}
 </View>})}</View>
}

export function RepairLibrary({tick,SearchBar,SelectField,Button}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState('Wszystkie grupy'),[open,setOpen]=useState(''),[page,setPage]=useState(1),[mode,setMode]=useState('Gotowe szablony'),[templates,setTemplates]=useState([]),[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;setLoading(true);list('work_templates').then(rows=>{if(active)setTemplates(rows.map(normalizeWorkTemplate).filter(x=>x.id&&x.name))}).catch(error=>Alert.alert('Szablony prac',error.message)).finally(()=>active&&setLoading(false));return()=>{active=false}},[tick])
 const jobs=searchWorkCatalog(WORK_CATALOG,query).filter(job=>group==='Wszystkie grupy'||job.group===group)
 const needle=String(query||'').trim().toLocaleLowerCase('pl-PL'),own=templates.filter(item=>!needle||[item.group,item.name,item.variant,item.scope,...item.steps,...item.qc].join(' ').toLocaleLowerCase('pl-PL').includes(needle))
 useEffect(()=>{setPage(1);setOpen('')},[query,group,mode])
 return <View><Text style={r.heading}>Szablony prac</Text><Text style={r.intro}>Gotowe procedury napraw i diagnostyki oraz własne szablony zsynchronizowane z aplikacją PC.</Text>
  <View style={r.wrap}><Chip selected={mode==='Gotowe szablony'} onPress={()=>setMode('Gotowe szablony')}>Gotowe szablony</Chip><Chip selected={mode==='Moje szablony'} onPress={()=>setMode('Moje szablony')}>Moje szablony ({templates.length})</Chip></View>
  <SearchBar value={query} onChange={setQuery} count={mode==='Gotowe szablony'?jobs.length:own.length} placeholder="Nazwa naprawy, układ lub wariant"/>
  {mode==='Gotowe szablony'?<>
   <SelectField label="Układ / grupa napraw" value={group} items={['Wszystkie grupy',...WORK_CATALOG.map(x=>x.group)]} onChange={x=>x!=='__manual__'&&setGroup(x)} manualLabel="Anuluj"/>
   {jobs.slice(0,page*20).map(job=>{const key=`${job.group}:${job.name}`,expanded=open===key,variants=jobsForGroup(job.group).find(x=>x.name===job.name)?.variants||[];return <View key={key} style={r.procedure}>
    <Pressable onPress={()=>setOpen(expanded?'':key)} accessibilityRole="button"><Text style={r.kicker}>{job.group}</Text><Text style={r.title}>{job.name}</Text><View style={r.bottom}><Text style={r.text}>{variants.length} wariantów · od {money(Math.min(...variants.map(v=>Number(v.price)||0),Number(job.price)||0))}</Text><Text style={r.link}>{expanded?'Zwiń −':'Szczegóły +'}</Text></View></Pressable>
    {expanded&&<View style={r.details}><Text style={r.text}>{job.scope||'Wybierz wariant, aby zobaczyć procedurę.'}</Text>{variants.map(variant=>{const procedure=procedureFor(job,variant);return <View key={variant.id} style={r.variant}><Text style={r.subject}>{variant.name}</Text><Text style={r.highlight}>{variant.hours} h · {money(variant.price)}</Text><Text style={r.text}>{variant.customer_description}</Text><Text style={r.kicker}>PRZEBIEG NAPRAWY</Text>{procedure.steps.map((step,index)=><Text key={index} style={r.text}>{index+1}. {typeof step==='string'?step:step.text||step.title||JSON.stringify(step)}</Text>)}<Text style={r.kicker}>KONTROLA JAKOŚCI</Text>{procedure.qc.map((check,index)=><Text key={index} style={r.text}>• {typeof check==='string'?check:check.text||check.title||JSON.stringify(check)}</Text>)}</View>})}</View>}
   </View>})}{jobs.length>page*20&&<Button onPress={()=>setPage(x=>x+1)}>Pokaż kolejne 20 prac</Button>}{!jobs.length&&<Text style={r.text}>Brak prac pasujących do wyszukiwania.</Text>}
  </>:<>{loading?<Text style={r.text}>Ładowanie własnych szablonów…</Text>:own.map(template=>{const key=`template:${template.id}`,expanded=open===key;return <View key={key} style={r.procedure}><Pressable onPress={()=>setOpen(expanded?'':key)} accessibilityRole="button"><Text style={r.kicker}>{template.group}</Text><Text style={r.title}>{template.name}</Text><View style={r.bottom}><Text style={r.text}>{template.variant} · {template.hours} h · {money(template.hours*template.rate)}</Text><Text style={r.link}>{expanded?'Zwiń −':'Szczegóły +'}</Text></View></Pressable>{expanded&&<View style={r.details}><Text style={r.text}>{template.scope||'Brak opisu zakresu.'}</Text><Text style={r.kicker}>PRZEBIEG NAPRAWY</Text>{template.steps.map((step,index)=><Text key={index} style={r.text}>{index+1}. {typeof step==='string'?step:step?.name||JSON.stringify(step)}</Text>)}<Text style={r.kicker}>KONTROLA JAKOŚCI</Text>{template.qc.map((check,index)=><Text key={index} style={r.text}>• {typeof check==='string'?check:check?.name||JSON.stringify(check)}</Text>)}</View>}</View>})}{!loading&&!own.length&&<View style={r.empty}><Text style={r.subject}>Brak własnych szablonów</Text><Text style={r.text}>Utwórz szablon na komputerze i uruchom synchronizację. Pojawi się tutaj oraz w zakresie zlecenia.</Text></View>}</>}
 </View>
}

export function VehicleInspection({vehicleId,orderId,findings,refresh,Field,SelectField,Button,Section}){
 const blank={category:'Hamulce',title:'',details:'',severity:'INFO',status:'OPEN'}
 const [form,setForm]=useState(blank),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false)
 useEffect(()=>{setForm(blank);setEditing(null)},[vehicleId,orderId])
 const rows=findings.filter(row=>sameRecordId(row.payload.vehicle_cloud_id,vehicleId))
 const save=async()=>{try{setBusy(true);const payload=findingPayload(form,vehicleId,orderId);if(editing)await patch('vehicle_findings',editing.cloud_id,payload);else await put('vehicle_findings',uid(),payload);setForm(blank);setEditing(null);refresh()}catch(error){Alert.alert('Kontrola pojazdu',error.message)}finally{setBusy(false)}}
 return <Section title="Kontrola pojazdu"><Text style={r.intro}>Zapisz usterkę, obserwację lub prawidłowy wynik kontroli. Te zapisy aktualizują ocenę pojazdu.</Text>
  {!vehicleId?<Text style={r.warning}>Przypisz pojazd, aby zapisać kontrolę.</Text>:<>
   <SelectField label="Sprawdzony układ" value={form.category} items={SYSTEMS.map(x=>x.label)} onChange={category=>category!=='__manual__'&&setForm({...form,category})} manualLabel="Anuluj"/>
   <Field label="Wynik kontroli" value={form.title} onChangeText={title=>setForm({...form,title})} placeholder="Np. wyciek płynu hamulcowego"/>
   <Field label="Pomiary i uwagi" value={form.details} onChangeText={details=>setForm({...form,details})} multiline/>
   <Text style={r.kicker}>WAGA USTERKI</Text><View style={r.wrap}>{[['INFO','Informacja'],['MEDIUM','Umiarkowana'],['HIGH','Poważna'],['CRITICAL','Krytyczna']].map(([key,label])=><Chip key={key} selected={form.severity===key} onPress={()=>setForm({...form,severity:key})}>{label}</Chip>)}</View>
   <Text style={r.kicker}>WYNIK / STAN</Text><View style={r.wrap}>{[['OPEN','Do naprawy'],['MONITOR','Obserwować'],['RESOLVED','Sprawne / naprawione']].map(([key,label])=><Chip key={key} selected={form.status===key} onPress={()=>setForm({...form,status:key})}>{label}</Chip>)}</View>
   <View style={r.wrap}><Button primary disabled={busy} onPress={save}>{busy?'Zapisuję…':editing?'Zapisz zmiany kontroli':'Zapisz kontrolę'}</Button>{editing&&<Button onPress={()=>{setEditing(null);setForm(blank)}}>Anuluj edycję</Button>}</View>
   {rows.map(row=><View key={row.cloud_id} style={r.procedure}><Text style={r.kicker}>{row.payload.category} · {row.payload.severity}</Text><Text style={r.subject}>{row.payload.title}</Text><Text style={r.text}>{row.payload.details}</Text><Text style={row.payload.status==='RESOLVED'?r.highlight:r.warning}>{({OPEN:'Do naprawy',MONITOR:'Obserwować',RESOLVED:'Sprawne / naprawione'})[row.payload.status]||row.payload.status}</Text><View style={r.wrap}><Button small onPress={()=>{setEditing(row);setForm(row.payload)}}>Edytuj</Button>{row.payload.status!=='RESOLVED'&&<Button small onPress={async()=>{await patch('vehicle_findings',row.cloud_id,{status:'RESOLVED',resolved_at:new Date().toISOString()});refresh()}}>Oznacz jako naprawione</Button>}</View></View>)}
  </>}
 </Section>
}

export function RepairHistory({orders,vehicleId,items,onOpen,Section}){
 const rows=repairHistory(orders,vehicleId,items)
 return <Section title="Historia napraw pojazdu"><Text style={r.intro}>Wszystkie zlecenia tego pojazdu, od najnowszego. Jedna karta odpowiada jednej wizycie.</Text>{rows.map(row=><Pressable key={row.cloud_id} style={r.procedure} onPress={()=>onOpen(row.cloud_id)}><View style={r.top}><Text style={r.text}>{date(row.payload.opened_at||row.payload.created_at||row.updated_at)}</Text><StatusBadge value={row.payload.status} compact/></View><Text style={r.title}>{row.payload.title||'Naprawa'}</Text><Text style={r.text}>{row.payload.complaint}</Text>{row.work.length>0&&<Text style={r.text}>{row.work.join(' · ')}</Text>}<View style={r.bottom}><Text style={r.amount}>{money(row.amount)}</Text><Text style={r.link}>Otwórz naprawę →</Text></View></Pressable>)}{!rows.length&&<Text style={r.text}>Brak historii dla przypisanego pojazdu.</Text>}</Section>
}

export function QcPanel({kind,orderId,qc,refresh,Section,Button}){
 const repair=kind==='repair',key=repair?'documents':'final',title=repair?'QC naprawy':'QC wydania',row=qc.find(x=>(x.payload.key||x.payload.check_key)===key)
 const [busy,setBusy]=useState(false)
 const toggle=async()=>{try{setBusy(true);await put('order_qc',row?.cloud_id||uid(),{...row?.payload,order_cloud_id:orderId,key,check_key:key,label:title,checked:!row?.payload.checked,checked_at:row?.payload.checked?null:new Date().toISOString()},{version:(row?.version||0)+1});refresh()}catch(error){Alert.alert(title,error.message)}finally{setBusy(false)}}
 const checklist=repair?['Sprawdź poprawność wykonanych prac.','Zweryfikuj pomiary i działanie naprawianych układów.','Sprawdź szczelność, mocowania i dokumentację naprawy.']:['Sprawdź pojazd po zakończeniu naprawy.','Sprawdź wyposażenie, czystość i komplet dokumentów.','Przekaż klientowi zalecenia oraz informacje o naprawie.']
 return <Section title={title}><Text style={r.intro}>{repair?'Kontrola techniczna wykonanej naprawy.':'Ostatnia kontrola przed przekazaniem auta klientowi.'}</Text>{checklist.map(text=><Text key={text} style={r.subject}>• {text}</Text>)}<View style={r.procedure}><Text style={row?.payload.checked?r.highlight:r.warning}>{row?.payload.checked?'✓ Kontrola potwierdzona':'Kontrola jeszcze niepotwierdzona'}</Text>{row?.payload.checked_at&&<Text style={r.text}>{date(row.payload.checked_at)}</Text>}</View><Button primary disabled={busy} onPress={toggle}>{row?.payload.checked?'Cofnij potwierdzenie':'Potwierdź kontrolę'}</Button></Section>
}

function Chip({children,selected,onPress}){return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={[r.chip,selected&&r.chipOn]}><Text style={[r.chipText,selected&&r.chipTextOn]}>{children}</Text></Pressable>}

export function ScheduleAgenda({rows,orders,vehicles,items,workshop,query,setQuery,SearchBar,Button,onEdit,onDelete,onStatus,onOpen}){
 const [selected,setSelected]=useState(localDate()),[mode,setMode]=useState('Dzień'),[bay,setBay]=useState('Wszystkie'),[expanded,setExpanded]=useState('')
 const days=weekDates(selected),move=amount=>{const day=new Date(`${selected}T12:00:00`);day.setDate(day.getDate()+amount);setSelected(localDate(day))}
 const filtered=rows.filter(row=>bay==='Wszystkie'||row.payload.bay===bay)
 const groups=mode==='Tydzień'?days:mode==='Lista'?[...new Set(filtered.map(row=>localDate(row.payload.start_at)))].sort():[selected]
 const dayLabel=key=>new Date(`${key}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long'})
 return <View style={r.agenda}><Text style={r.heading}>Plan warsztatu</Text><View style={r.wrap}>{['Dzień','Tydzień','Lista'].map(label=><Chip key={label} selected={mode===label} onPress={()=>setMode(label)}>{label}</Chip>)}</View>
  <View style={r.top}><Button small onPress={()=>move(mode==='Dzień'?-1:-7)}>←</Button><Text style={r.subject}>{new Date(`${selected}T12:00:00`).toLocaleDateString('pl-PL',{month:'long',year:'numeric'})}</Text><Button small onPress={()=>move(mode==='Dzień'?1:7)}>→</Button><Button small onPress={()=>setSelected(localDate())}>Dziś</Button></View>
  {mode!=='Lista'&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={r.wrap}>{days.map(day=><Pressable key={day} onPress={()=>setSelected(day)} style={[r.dateTile,day===selected&&r.chipOn]}><Text style={[r.chipText,day===selected&&r.chipTextOn]}>{new Date(`${day}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'short'})}</Text><Text style={[r.dayNumber,day===selected&&r.chipTextOn]}>{Number(day.slice(-2))}</Text><Text style={[r.chipText,day===selected&&r.chipTextOn]}>{appointmentsOnDay(rows,day).filter(row=>row.payload.status!=='ANULOWANY').length} wiz.</Text></Pressable>)}</ScrollView>}
  <SearchBar value={query} onChange={setQuery} count={rows.length} placeholder="Auto, klient, temat lub stanowisko"/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={r.wrap}>{['Wszystkie',...new Set([...workshop.bays,...rows.map(row=>row.payload.bay)].filter(Boolean))].map(label=><Chip key={label} selected={bay===label} onPress={()=>setBay(label)}>{label}</Chip>)}</ScrollView>
  {groups.map(day=>{const visits=mode==='Lista'?filtered.filter(row=>localDate(row.payload.start_at)===day).sort((a,b)=>Date.parse(a.payload.start_at)-Date.parse(b.payload.start_at)):appointmentsOnDay(filtered,day);return <View key={day} style={r.dayGroup}><Text style={r.dayHeading}>{dayLabel(day)}</Text><Text style={r.text}>{visits.length} wizyt</Text>{visits.map(row=>{const p=row.payload,order=orders.find(x=>sameRecordId(x.cloud_id,p.order_cloud_id)),car=resolveOrderVehicle(order?.payload||{},vehicles).display,work=items.filter(x=>sameRecordId(x.payload.order_cloud_id,p.order_cloud_id)).map(x=>x.payload.name||x.payload.work_name).filter(Boolean),open=expanded===row.cloud_id;return <View key={row.cloud_id} style={[r.visit,p.status==='ANULOWANY'&&{opacity:.6}]}><Pressable accessibilityRole="button" onPress={()=>setExpanded(open?'':row.cloud_id)}><View style={r.top}><Text style={r.visitTime}>{time(p.start_at)} – {time(p.end_at)}</Text><StatusBadge value={p.status} label={appointmentStatusLabel(p.status)} compact/></View>{localDate(p.start_at)!==localDate(p.end_at)&&<Text style={r.warning}>{date(p.start_at)} → {date(p.end_at)}</Text>}<Text style={r.kicker}>{p.bay||'Bez stanowiska'}</Text><Text style={r.title}>{order?`${car.plate||'Bez rej.'} · ${vehicleTitle(car)}`:p.title}</Text>{order&&<Text style={r.subject}>{p.title}</Text>}<Text style={r.text}>{order?.payload.customer||'Klient nieprzypisany'}</Text>{work.length>0&&<Text style={r.text} numberOfLines={open?undefined:2}>{work.join(' · ')}</Text>}<Text style={r.link}>{open?'Zwiń szczegóły −':'Szczegóły i działania +'}</Text></Pressable>{open&&<View style={r.details}><Text style={r.text}>{p.notes||'Brak dodatkowych uwag.'}</Text><View style={r.wrap}>{order&&<Button small primary onPress={()=>onOpen(order.cloud_id)}>Zlecenie</Button>}<Button small onPress={()=>onEdit(row)}>Edytuj wizytę</Button><Button small disabled={['ZAKONCZONY','ANULOWANY'].includes(p.status)} onPress={()=>onStatus(row)}>Następny status</Button><Button small danger onPress={()=>onDelete(row)}>Usuń</Button></View></View>}</View>})}{!visits.length&&<View style={r.empty}><Text style={r.text}>Brak wizyt {bay==='Wszystkie'?'na ten dzień':'na wybranym stanowisku'}.</Text></View>}</View>})}
  {!groups.length&&<Text style={r.text}>Brak wizyt pasujących do wyszukiwania.</Text>}
 </View>
}

const r=StyleSheet.create({
 grid:{flexDirection:'row',flexWrap:'wrap',gap:12},tile:{backgroundColor:'#141d19',borderColor:'#34443a',borderWidth:1,borderRadius:16,overflow:'hidden'},full:{width:'100%'},half:{width:'48.5%',flexGrow:1},selected:{borderColor:'#b9ef79',borderWidth:2},tileBody:{padding:18,gap:8},tileActions:{padding:14,borderTopWidth:1,borderColor:'#34443a'},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10},plate:{color:'#edf3e9',fontSize:22,fontWeight:'800',letterSpacing:1},title:{color:'#f2f6f0',fontSize:18,fontWeight:'700',lineHeight:25},text:{color:'#b8c5bd',fontSize:14,lineHeight:21},subject:{color:'#e5ede7',fontSize:15,fontWeight:'600',lineHeight:23},warning:{color:'#f0c47a',fontSize:14,lineHeight:21},bottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginTop:8},amount:{color:'#c4ed9d',fontSize:18,fontWeight:'700'},link:{color:'#c4ed9d',fontSize:13,fontWeight:'700',paddingVertical:6},heading:{color:'#f2f6f0',fontSize:26,fontWeight:'700',marginBottom:8},intro:{color:'#b8c5bd',fontSize:15,lineHeight:23,marginBottom:16},kicker:{color:'#a9bdb0',fontSize:12,fontWeight:'700',marginTop:8,marginBottom:6},procedure:{backgroundColor:'#141d19',borderWidth:1,borderColor:'#34443a',borderRadius:14,padding:16,marginBottom:12,gap:6},details:{borderTopWidth:1,borderColor:'#34443a',marginTop:12,paddingTop:12,gap:10},variant:{borderLeftWidth:3,borderColor:'#b9ef79',paddingLeft:12,gap:7,marginVertical:10},highlight:{color:'#c4ed9d',fontSize:15,fontWeight:'600'},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:8},chip:{backgroundColor:'#19231d',borderWidth:1,borderColor:'#425648',borderRadius:10,paddingHorizontal:14,paddingVertical:12},chipOn:{backgroundColor:'#c4ed9d',borderColor:'#c4ed9d'},chipText:{color:'#d8e4db',fontSize:14,fontWeight:'600'},chipTextOn:{color:'#182415'},agenda:{gap:12},dateTile:{padding:12,minWidth:68,alignItems:'center',gap:6,borderRadius:12,backgroundColor:'#19231d',borderWidth:1,borderColor:'#425648'},dayNumber:{fontSize:23,fontWeight:'800',color:'#edf3e9'},dayGroup:{marginTop:10,gap:10},dayHeading:{color:'#edf3e9',fontSize:19,fontWeight:'700'},visit:{padding:18,backgroundColor:'#141d19',borderColor:'#34443a',borderWidth:1,borderLeftWidth:4,borderLeftColor:'#b9ef79',borderRadius:14,gap:8},visitTime:{color:'#c4ed9d',fontSize:20,fontWeight:'800'},empty:{padding:20,borderWidth:1,borderStyle:'dashed',borderColor:'#34443a',borderRadius:14}
})
