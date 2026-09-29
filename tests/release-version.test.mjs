import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.10')
 assert.deepEqual(versions,{packageVersion:'0.30.10',expoVersion:'0.30.10',expoCode:54,nativeVersion:'0.30.10',nativeCode:54})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.31.1'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,54)
})
