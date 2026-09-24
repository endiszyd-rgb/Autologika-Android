import test from 'node:test'
import assert from 'node:assert/strict'
import {DEFAULT_WORKSHOP_LAYOUT,WORKSHOP_LAYOUT_ID,normalizeWorkshopLayout,workshopLayoutFromRows,workshopLayoutPayload} from '../src/workshop-settings.js'

test('Android odczytuje konfigurację stanowisk zsynchronizowaną z PC',()=>{
 const layout=workshopLayoutFromRows([{cloud_id:WORKSHOP_LAYOUT_ID,payload:{setting_key:'workshop_layout_v1',value:'{"bays":["Podnośnik A","Geometria"],"openingHour":7,"closingHour":20,"defaultAppointmentMinutes":90}'}}])
 assert.deepEqual(layout,{bays:['Podnośnik A','Geometria'],openingHour:7,closingHour:20,defaultAppointmentMinutes:90})
})

test('zapis Androida używa formatu app_settings zgodnego z PC',()=>{
 const payload=workshopLayoutPayload({bays:[' A ','A','B'],openingHour:5,closingHour:23,defaultAppointmentMinutes:45})
 assert.equal(payload.setting_key,'workshop_layout_v1')
 assert.deepEqual(JSON.parse(payload.value),{bays:['A','B'],openingHour:5,closingHour:23,defaultAppointmentMinutes:45})
})

test('brak rekordu daje domyślną konfigurację warsztatu',()=>{
 assert.deepEqual(workshopLayoutFromRows([]).bays,DEFAULT_WORKSHOP_LAYOUT.bays)
 assert.equal(normalizeWorkshopLayout({openingHour:22,closingHour:4}).closingHour,23)
})
