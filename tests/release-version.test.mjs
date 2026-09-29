import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.5')
 assert.deepEqual(versions,{packageVersion:'0.30.5',expoVersion:'0.30.5',expoCode:49,nativeVersion:'0.30.5',nativeCode:49})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.30.6'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,49)
})
