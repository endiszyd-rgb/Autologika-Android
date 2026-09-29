import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.4')
 assert.deepEqual(versions,{packageVersion:'0.30.4',expoVersion:'0.30.4',expoCode:48,nativeVersion:'0.30.4',nativeCode:48})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.30.5'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,48)
})
