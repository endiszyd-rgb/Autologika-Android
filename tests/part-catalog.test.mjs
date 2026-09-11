import test from 'node:test'
import assert from 'node:assert/strict'
import {isGtin,mapWebSearch,normalizeBarcode} from '../src/part-catalog.js'

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
