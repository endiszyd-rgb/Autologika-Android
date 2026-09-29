import test from 'node:test'
import assert from 'node:assert/strict'
import {layoutMode,responsiveColumns} from '../src/responsive.js'

test('telefon, tablet i pulpit mają osobne progi układu',()=>{
 assert.equal(layoutMode(360),'phone')
 assert.equal(layoutMode(599),'phone')
 assert.equal(layoutMode(600),'tablet')
 assert.equal(layoutMode(899),'tablet')
 assert.equal(layoutMode(900),'desktop')
})

test('liczba kolumn skaluje się do szerokości urządzenia',()=>{
 assert.equal(responsiveColumns(390),1)
 assert.equal(responsiveColumns(800),2)
 assert.equal(responsiveColumns(1280),3)
})
