const id=value=>String(value??'').trim()
const same=(left,right)=>Boolean(id(left))&&id(left)===id(right)
const time=row=>{for(const value of [row?.payload?.released_at,row?.payload?.archived_at,row?.payload?.opened_at,row?.payload?.created_at,row?.updated_at]){const stamp=Date.parse(value||'');if(Number.isFinite(stamp))return stamp}return 0}

export function buildCustomerDossier(customer,vehicles=[],orders=[]){
 const ownedVehicles=(vehicles||[]).filter(row=>same(row.payload?.customer_cloud_id,customer?.cloud_id))
 const vehicleIds=new Set(ownedVehicles.map(row=>id(row.cloud_id)))
 const visits=(orders||[]).filter(row=>vehicleIds.has(id(row.payload?.vehicle_cloud_id))).sort((a,b)=>time(b)-time(a))
 const active=visits.filter(row=>!['WYDANE','CLOSED','DONE'].includes(String(row.payload?.status||'').toUpperCase())&&!row.payload?.archived_at)
 const value=visits.reduce((sum,row)=>sum+Number(row.payload?.final_price??row.payload?.total??0),0)
 return {customer,vehicles:ownedVehicles,visits,active,value,lastVisit:visits[0]||null}
}

export function customerDossierSearch(dossier){
 return {...(dossier.customer?.payload||{}),vehicles:dossier.vehicles.map(row=>row.payload||{}),orders:dossier.visits.map(row=>row.payload?.title||'')}
}
