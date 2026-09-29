import test from 'node:test'
import assert from 'node:assert/strict'
import {buildInventoryImport,parseDeliveryDocument,stableDocumentId} from '../src/delivery-document.js'

const sample=`
XENO-ŚWIST Danuta Świst
Wydanie zewnętrzne nr: 3/WZ/2025/16969
Data dostawy/wykonania usługi 10/12/2025
1 KTCZETR1345 USZCZELNIACZ PÓŁOSI FORD 2.00 SZT 17.89 35.78 23 8.23 44.01
2 KTMANHU726/2X FILTR OLEJU 1.00 SZT 16.27 16.27 23 3.74 20.01
Wartość dokumentu: 64.02
`

test('rozpoznaje pozycje polskiego dokumentu dostawy',()=>{
 const document=parseDeliveryDocument(sample)
 assert.equal(document.supplier_name,'XENO-ŚWIST Danuta Świst')
 assert.equal(document.document_no,'3/WZ/2025/16969')
 assert.equal(document.document_date,'2025-12-10')
 assert.deepEqual(document.items.map(item=>[item.part_no,item.qty,item.unit_cost]),[['KTCZETR1345',2,17.89],['KTMANHU726/2X',1,16.27]])
})

test('przyjęcie tworzy nową kartę i aktualizuje stan istniejącej',()=>{
 const document=parseDeliveryDocument(sample)
 const stock=[{cloud_id:'existing',payload:{part_no:'KTCZETR1345',name:'Uszczelniacz',stock:3,unit_cost:15,notes:''}}]
 const operations=buildInventoryImport(stock,document)
 assert.equal(operations[0].kind,'update')
 assert.equal(operations[0].payload.stock,5)
 assert.equal(operations[0].payload.unit_cost,16.16)
 assert.equal(operations[1].kind,'create')
 assert.equal(operations[1].payload.stock,1)
 assert.equal(operations[1].payload.sell_price,23.59)
})

test('identyfikator dokumentu jest stabilny',()=>{
 const document=parseDeliveryDocument(sample)
 assert.equal(stableDocumentId(document),stableDocumentId({...document}))
 assert.notEqual(stableDocumentId(document),stableDocumentId({...document,document_no:'INNY/1/2025'}))
})
