import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.31.4')
 assert.deepEqual(versions,{packageVersion:'0.31.4',expoVersion:'0.31.4',expoCode:64,nativeVersion:'0.31.4',nativeCode:64})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.31.0'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,64)
})
