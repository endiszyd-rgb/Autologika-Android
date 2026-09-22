import test from 'node:test'
import assert from 'node:assert/strict'
import {filterRecords,matchesSearch,normalizeSearch} from '../src/mobile-search.js'

test('wyszukiwanie ignoruje polskie znaki, wielkość liter i znaki rejestracji',()=>{
 assert.equal(normalizeSearch('  Škoda Łódź / WX-1234  '),'skoda lodz wx 1234')
 assert.equal(matchesSearch({make:'Škoda',plate:'WX-1234'},'skoda 1234'),true)
})

test('każde wpisane słowo musi pasować do rekordu',()=>{
 const rows=[{payload:{name:'Jan Kowalski',phone:'500 600 700'}},{payload:{name:'Jan Nowak',phone:'111 222 333'}}]
 assert.deepEqual(filterRecords(rows,'jan 600'),[rows[0]])
 assert.deepEqual(filterRecords(rows,'kowalski 111'),[])
})

test('przeszukuje także zagnieżdżone dane pojazdu i zlecenia',()=>{
 assert.equal(matchesSearch({order:{title:'Wymiana oleju'},vehicle:{vin:'WVWZZZ1JZXW000001'}},'oleju 000001'),true)
})
