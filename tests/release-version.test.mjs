import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.30.3')
 assert.deepEqual(versions,{packageVersion:'0.30.3',expoVersion:'0.30.3',expoCode:47,nativeVersion:'0.30.3',nativeCode:47})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.30.4'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,47)
})
