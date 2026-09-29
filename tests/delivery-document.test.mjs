import test from 'node:test'
import assert from 'node:assert/strict'
import {buildInventoryImport,parseDeliveryDocument,parseSpatialDeliveryDocument,spatialOcrLines,stableDocumentId} from '../src/delivery-document.js'

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

test('składa pozycje, gdy mobilny OCR rozdzieli kolumny tabeli na linie',()=>{
 const wrapped=`
XENO-ŚWIST Danuta Świst
Wydanie zewnętrzne nr: 3/WZ/2025/16969
Kod towaru
Nazwa towaru/usługi
Ilość towaru/usł
Cena jedn. Netto
KTCZETR1345
USZCZELNIACZ PÓŁOSI F
ORD
2 00
SZT
17 89
35 78
23
8 23
44 01
KTMANHU726/2X
FILTR OLEJU
1.00
SZT
16.27
16.27
23
3.74
20.01
Razem: 51.99
`
 const document=parseDeliveryDocument(wrapped)
 assert.deepEqual(document.items.map(item=>[item.part_no,item.name,item.qty,item.unit_cost,item.gross_total]),[
  ['KTCZETR1345','USZCZELNIACZ PÓŁOSI F ORD',2,17.89,44.01],
  ['KTMANHU726/2X','FILTR OLEJU',1,16.27,20.01],
 ])
 assert.equal(document.warnings.some(warning=>warning.startsWith('Nie rozpoznano pozycji')),false)
})

test('nie gubi zawiniętej pozycji, gdy poprzedni wiersz OCR był kompletny',()=>{
 const mixed=`
Wydanie zewnętrzne nr: 3/WZ/2025/16969
Kod towaru Nazwa towaru Ilość Cena Netto Wartość Brutto
1 KTCZETR1345 USZCZELNIACZ PÓŁOSI 2.00 SZT 17.89 35.78 23 8.23 44.01
VLV5W30 XL III 5L
OLEJ VALVOLINE XL-III SYN POWER 5W30 5L
1.00
136.58
136.58
23
31.41
167.99
Razem: 212.00
`
 const document=parseDeliveryDocument(mixed)
 assert.deepEqual(document.items.map(item=>item.part_no),['KTCZETR1345','VLV5W30'])
 assert.equal(document.items[1].name,'XL III 5L OLEJ VALVOLINE XL-III SYN POWER 5W30 5L')
 assert.equal(document.items[1].unit_cost,136.58)
})

test('odbudowuje wiersze tabeli z pozycji słów zwróconych przez ML Kit',()=>{
 const words=[]
 const add=(text,left,top,width=70,height=20)=>words.push({text,left,top,right:left+width,bottom:top+height})
 add('Kod',100,100);add('Nazwa',300,100);add('Ilość',650,100);add('Cena',800,100);add('Netto',900,100);add('VAT',1000,100);add('Brutto',1120,100)
 add('KTCZETR1345',100,160,150);add('USZCZELNIACZ',300,162,150);add('PÓŁOSI',460,162,90);add('FORD',555,162,70)
 add('2.00',650,160);add('17.89',800,161);add('35.78',900,161);add('23',1000,161);add('8.23',1060,161);add('44.01',1120,161)
 add('KTMANHU726/2X',100,220,170);add('FILTR',300,221,70);add('OLEJU',375,221,70)
 add('1.00',650,220);add('16.27',800,220);add('16.27',900,220);add('23',1000,220);add('3.74',1060,220);add('20.01',1120,220)
 assert.match(spatialOcrLines(words)[1],/^KTCZETR1345 USZCZELNIACZ/)
 const document=parseSpatialDeliveryDocument({
  text:'XENO-ŚWIST Danuta Świst\nWydanie zewnętrzne nr: 3/WZ/2025/16969\nWartość dokumentu: 64.02',
  elements:words,
 })
 assert.deepEqual(document.items.map(item=>[item.part_no,item.qty,item.unit_cost,item.gross_total]),[
  ['KTCZETR1345',2,17.89,44.01],
  ['KTMANHU726/2X',1,16.27,20.01],
 ])
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
