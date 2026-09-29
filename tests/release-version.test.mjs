import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.2')
 assert.deepEqual(versions,{packageVersion:'0.30.2',expoVersion:'0.30.2',expoCode:46,nativeVersion:'0.30.2',nativeCode:46})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.30.3'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,46)
})
