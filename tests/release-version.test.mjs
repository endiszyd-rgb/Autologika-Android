import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.28.0')
 assert.deepEqual(versions,{packageVersion:'0.28.0',expoVersion:'0.28.0',expoCode:42,nativeVersion:'0.28.0',nativeCode:42})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.28.1'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,42)
})
