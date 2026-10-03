import test from 'node:test'
import assert from 'node:assert/strict'
import {buildInventoryImport,deliveryDocumentTotals,deliveryReviewWarnings,editDeliveryItem,parseDeliveryDocument,parseSpatialDeliveryDocument,spatialOcrLines,stableDocumentId} from '../src/delivery-document.js'

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
 assert.deepEqual(document.items.map(item=>[item.part_no,item.qty,item.unit_cost]),[['KTCZETR1345',2,22.01],['KTMANHU726/2X',1,20.01]])
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
  ['KTCZETR1345','USZCZELNIACZ PÓŁOSI F ORD',2,22.01,44.01],
  ['KTMANHU726/2X','FILTR OLEJU',1,20.01,20.01],
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
 assert.equal(document.items[1].unit_cost,167.99)
})

test('odbudowuje wiersze tabeli z pozycji słów zwróconych przez ML Kit',()=>{
 const words=[]
 const add=(text,left,top,width=70,height=20)=>words.push({text,left,top,right:left+width,bottom:top+height})
 add('Adres:',40,20);add('[kod:B10001]',1050,30,120)
 add('Adres',30,100);add('Kod',100,100);add('Nazwa',300,100);add('Ilość',650,100);add('Cena',800,100);add('Wartość',900,100);add('Kwota',1040,100);add('Wartość',1120,100);add('Brutto',1120,125)
 add('KTCZETR1345',100,160,150);add('USZCZELNIACZ',300,162,150);add('PÓŁOSI',460,162,90);add('FORD',300,185,70)
 add('2.00',650,160);add('17.89',800,161);add('35.78',900,161);add('23',1000,161);add('8.23',1060,161);add('44.01',1120,161)
 add('KTMANHU726/2X',100,220,170);add('FILTR',300,221,70);add('OLEJU',375,221,70)
 add('1.00',650,220);add('16.27',800,220);add('16.27',900,220);add('23',1000,220);add('3.74',1060,220);add('20.01',1120,220)
 assert.match(spatialOcrLines(words).find(line=>line.includes('KTCZETR1345')),/^KTCZETR1345 USZCZELNIACZ/)
 const document=parseSpatialDeliveryDocument({
  text:'XENO-ŚWIST Danuta Świst\nWydanie zewnętrzne nr: 3/WZ/2025/16969\nWartość dokumentu: 64.02',
  elements:words,
 })
 assert.deepEqual(document.items.map(item=>[item.part_no,item.qty,item.unit_cost,item.gross_total]),[
  ['KTCZETR1345',2,22.01,44.01],
  ['KTMANHU726/2X',1,20.01,20.01],
 ])
 assert.equal(document.items[0].name,'USZCZELNIACZ PÓŁOSI FORD')
})

test('przyjęcie tworzy nową kartę i aktualizuje stan istniejącej',()=>{
 const document=parseDeliveryDocument(sample)
 const stock=[{cloud_id:'existing',payload:{part_no:'KTCZETR1345',name:'Uszczelniacz',stock:3,unit_cost:15,notes:''}}]
 const operations=buildInventoryImport(stock,document)
 assert.equal(operations[0].kind,'update')
 assert.equal(operations[0].payload.stock,5)
 assert.equal(operations[0].payload.unit_cost,17.8)
 assert.equal(operations[1].kind,'create')
 assert.equal(operations[1].payload.stock,1)
 assert.equal(operations[1].payload.sell_price,29.01)
})

test('wartość brutto jest ceną całej pozycji i nie jest ponownie mnożona przez ilość',()=>{
 const document=parseDeliveryDocument(`
Wydanie zewnętrzne nr: 3/WZ/2026/12446
KTFEB22902 TARCZA HAMULC. AUDI VW 2.00 SZT 99.18 198.36 23 45.62 243.98
Wartość dokumentu: 243.98
`)
 assert.equal(document.items[0].gross_total,243.98)
 assert.equal(document.items[0].unit_cost,121.99)
 const [operation]=buildInventoryImport([],document)
 assert.equal(operation.payload.stock,2)
 assert.equal(operation.payload.unit_cost,121.99)
})

test('import dokumentu odrzuca ułamkową liczbę części',()=>{
 assert.throws(()=>buildInventoryImport([],{items:[{enabled:true,part_no:'FILTR-1',name:'Filtr',qty:'1,97',gross_total:'100'}]}),/liczbą całkowitą/)
})

test('geometria wierszy działa bez nagłówków przy zmiennym kącie i scala cenę przeciętą linią',()=>{
 const words=[]
 const add=(text,left,top,width=60,height=20)=>words.push({text,left,top,right:left+width,bottom:top+height})
 // OCR telefonu nie zwrócił nagłówków tabeli. Zostały tylko komórki w ich
 // stałych miejscach na formularzu oraz rozbita kropka w wartości brutto.
 add('KTFEB',250,300,75);add('22902',326,300,64)
 add('TARCZA',430,300,85);add('HAMULCOWA',430,326,125);add('AUDI',560,326,55)
 add('2',680,300,18);add('00',701,300,25)
 add('243',1100,300,42);add('98',1145,300,28)
 // Drugi wiersz jest przesunięty przez perspektywę zdjęcia.
 add('KTFEB16502',280,390,140)
 add('KLOCKI',460,390,85);add('HAMULCOWE',550,390,120)
 add('1.00',710,390,55);add('102,00',1130,390,65)
 add('Razem',850,520,75)
 add('Wartość',120,600,90);add('dokumentu:',215,600,100);add('345.98',1100,600,70)
 const document=parseSpatialDeliveryDocument({
  width:1200,height:1000,
  text:'XENO-ŚWIST Danuta Świst\nWydanie zewnętrzne nr: 3/WZ/2026/12446\nWartość dokumentu: 349.98',
  elements:words,
 })
 assert.deepEqual(document.items.map(item=>[item.part_no,item.name,item.qty,item.gross_total,item.unit_cost]),[
  ['KTFEB22902','TARCZA HAMULCOWA AUDI',2,243.98,121.99],
  ['KTFEB16502','KLOCKI HAMULCOWE',1,102,102],
 ])
 assert.equal(document.gross_total,345.98)
 assert.equal(document.warnings.some(warning=>warning.startsWith('Nie rozpoznano pozycji')),false)
})

test('ręczna korekta ilości i ceny końcowej przyjmuje polski przecinek',()=>{
 const [operation]=buildInventoryImport([],{items:[{enabled:true,part_no:'KTFEB22902',name:'Tarcza hamulcowa',qty:'2,00',gross_total:'243,98'}]})
 assert.equal(operation.payload.stock,2)
 assert.equal(operation.payload.unit_cost,121.99)
})

test('suma dokumentu obejmuje ceny końcowe tylko zaznaczonych pozycji',()=>{
 const totals=deliveryDocumentTotals([
  {enabled:true,qty:'2,00',gross_total:'44,01'},
  {enabled:true,qty:'1',gross_total:'20.01'},
  {enabled:false,qty:'4',gross_total:'99,99'},
 ])
 assert.deepEqual(totals,{count:2,qty:3,gross:64.02})
})

test('wartość dokumentu rozlicza jednogroszową różnicę zaokrąglenia',()=>{
 const document=parseDeliveryDocument(`
Wydanie zewnętrzne nr: 3/WZ/2026/12446
ABC100 FILTR OLEJU 1.00 SZT 81.29 81.29 23 18.70 99.99
ABC200 FILTR PALIWA 1.00 SZT 65.04 65.04 23 14.96 80.00
Wartość dokumentu: 180.00
`)
 assert.equal(document.gross_total,180)
 assert.equal(deliveryDocumentTotals(document.items).gross,180)
 assert.equal(document.items.at(-1).gross_total,80.01)
 assert.equal(document.warnings.some(warning=>warning.startsWith('Suma odczytanych pozycji')),false)
})

test('identyfikator dokumentu jest stabilny',()=>{
 const document=parseDeliveryDocument(sample)
 assert.equal(stableDocumentId(document),stableDocumentId({...document}))
 assert.notEqual(stableDocumentId(document),stableDocumentId({...document,document_no:'INNY/1/2025'}))
})

test('nie myli grupy i adresu magazynowego z numerem katalogowym',()=>{
 const words=[]
 const add=(text,left,top,width=60,height=20)=>words.push({text,left,top,right:left+width,bottom:top+height})
 const row=(top,group,address,code,name,qty,net,netTotal,vat,gross)=>{
  add(group,100,top,50);add(address,170,top,65);add(code,270,top,105);add(name,410,top,220)
  add(qty,700,top,55);add(net,810,top,65);add(netTotal,910,top,65);add('23',1000,top,30);add(vat,1060,top,60);add(gross,1150,top,70)
 }
 row(300,'0037','A01','M2H-254','KONCOWKA DRAZKA','2.00','25.20','50.40','11.59','61.99')
 row(380,'0043','LEDIL','PRO103','LAMPA INSPEKCYJNA','1.00','78.05','78.05','17.96','96.01')
 row(460,'0055','POLI4','K2-K156','PLYN DO NABLYSZCZANIA OPON','1.00','17.89','17.89','4.11','22.00')
 add('Razem',900,540,75);add('180.00',1150,540,70)
 const document=parseSpatialDeliveryDocument({
  width:1300,height:900,
  text:'XENO-SWIST Danuta Swist\nWydanie zewnetrzne nr: 3/WZ/2026/124\nWartosc dokumentu: 180.00',
  elements:words,
 })
 assert.deepEqual(document.items.map(item=>item.part_no),['M2H-254','PRO103','K2-K156'])
 assert.deepEqual(document.items.map(item=>item.qty),[2,1,1])
 assert.deepEqual(document.items.map(item=>item.gross_total),[61.99,96.01,22])
 assert.equal(deliveryDocumentTotals(document.items).gross,180)
 assert.equal(document.warnings.some(warning=>warning.startsWith('Suma odczytanych pozycji')),false)
})

test('ręczna weryfikacja pozycji usuwa nieaktualne ostrzeżenie OCR',()=>{
 const warning='Co najmniej jeden numer lub cena wymaga sprawdzenia z dokumentem.'
 const source={part_no:'PRO103',name:'Lampa',qty:1,gross_total:96.01,confidence:'CHECK'}
 assert.deepEqual(deliveryReviewWarnings([warning],[source]),[warning])
 const reviewed=editDeliveryItem(source,'part_no','PRO103')
 assert.equal(reviewed.confidence,'MANUAL')
 assert.deepEqual(deliveryReviewWarnings([warning],[reviewed]),[])
 assert.deepEqual(deliveryReviewWarnings(['Suma odczytanych pozycji (10.00 zł) różni się od wartości dokumentu (20.00 zł).'],[reviewed]),[])
})

test('pole ilości przyjmuje tylko pełne cyfry',()=>{
 const source={qty:'2',confidence:'GOOD'}
 assert.equal(editDeliveryItem(source,'qty','12').qty,'12')
 assert.equal(editDeliveryItem(source,'qty','1,5'),source)
 assert.equal(editDeliveryItem(source,'qty','1.5'),source)
})
