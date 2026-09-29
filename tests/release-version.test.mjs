import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.1')
 assert.deepEqual(versions,{packageVersion:'0.30.1',expoVersion:'0.30.1',expoCode:45,nativeVersion:'0.30.1',nativeCode:45})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.30.2'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,45)
})
