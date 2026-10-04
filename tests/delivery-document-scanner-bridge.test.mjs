import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const gradle=readFileSync(new URL('../android/app/build.gradle',import.meta.url),'utf8')
const nativeModule=readFileSync(new URL('../android/app/src/main/java/pl/autologika/mobile/DeliveryOcrModule.kt',import.meta.url),'utf8')
const screen=readFileSync(new URL('../src/delivery-document-screen.js',import.meta.url),'utf8')

test('aplikacja używa skanera dokumentów przed OCR tabeli',()=>{
 assert.match(gradle,/play-services-mlkit-document-scanner:16\.0\.0/)
 assert.match(nativeModule,/fun scanDocument\(promise: Promise\)/)
 assert.match(nativeModule,/SCANNER_MODE_FULL/)
 assert.match(nativeModule,/RESULT_FORMAT_JPEG/)
 assert.match(screen,/NativeModules\.DeliveryOcr\?\.scanDocument/)
 assert.match(screen,/await analyze\(asset\)/)
})

test('pozostawia aparat z lampą jako tryb awaryjny',()=>{
 assert.match(screen,/flash="on" enableTorch/)
 assert.match(screen,/Aparat z lampą/)
})
