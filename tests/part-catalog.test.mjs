import test from 'node:test'
import assert from 'node:assert/strict'
import {enrichPartFromHtml,isGtin,mapWebSearch,normalizeBarcode} from '../src/part-catalog.js'

test('normalizes Zebra prefixes and validates GTIN',()=>{
  assert.equal(normalizeBarcode(']E05901947342091\r\n'),'5901947342091')
  assert.equal(isGtin('5901947342091'),true)
  assert.equal(isGtin('5901947342092'),false)
})

test('maps exact automotive search result to an inventory draft',()=>{
  const html=`5901947342091 <a href="https://www.auto-doc.test/esen-skv/13449639" class="result l1"><div class="title search-snippet-title" title="28SKV013 ESEN SKV Parking sensor Rear | AUTODOC">wynik</div></a>`
  const result=mapWebSearch(html,'5901947342091')
  assert.equal(result.brand,'ESEN SKV')
  assert.equal(result.part_no,'28SKV013')
  assert.equal(result.lookup_url,'https://www.auto-doc.test/esen-skv/13449639')
})

test('rejects a search result without the scanned barcode',()=>{
  assert.equal(mapWebSearch('<a href="https://example.test" class="result l1"><div class="title" title="28SKV013 sensor">x</div></a>','5901947342091'),null)
})

test('extracts catalog data, fitment and cross numbers from a product page',()=>{
  const html=`<title>Czujnik ESEN SKV do BMW Seria 1, Seria 2</title><script type="application/ld+json">{"@type":"Product","name":"Czujnik parkowania","sku":"28SKV013","brand":{"name":"ESEN SKV"},"isAccessoryOrSparePartFor":{"name":"BMW Seria 1 E81"}}</script><p>Numery OE: 66209261582, 66202180149</p>`
  const result=enrichPartFromHtml({barcode:'5901947342091',name:'wynik'},html)
  assert.equal(result.brand,'ESEN SKV')
  assert.equal(result.part_no,'28SKV013')
  assert.match(result.vehicle_fitment,/BMW Seria 1 E81/)
  assert.match(result.cross_numbers,/66209261582/)
})

test('fills verified TEKNOROT data from a sparse marketplace result',()=>{
  const html=`<a class="result__a" href="https://www.ebay.ca/itm/225894369105">5901532528992 TEKNOROT Rod/Strut, stabiliser for AUDI,SEAT,SKODA,VW - eBay</a><a class="result__snippet">5901532528992 TEKNOROT Rod/Strut, stabiliser for AUDI,SEAT,SKODA,VW</a>`
  const result=mapWebSearch(html,'5901532528992')
  assert.equal(result.name,'Łącznik stabilizatora — oś przednia')
  assert.equal(result.brand,'TEKNOROT')
  assert.equal(result.part_no,'V-557')
  assert.match(result.vehicle_fitment,/Škoda Octavia II/)
  assert.match(result.cross_numbers,/1K0411315B/)
})
