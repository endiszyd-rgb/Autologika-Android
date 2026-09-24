import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.29.0')
 assert.deepEqual(versions,{packageVersion:'0.29.0',expoVersion:'0.29.0',expoCode:43,nativeVersion:'0.29.0',nativeCode:43})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.29.1'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,43)
})
