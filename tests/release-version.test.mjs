import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.31.8')
 assert.deepEqual(versions,{packageVersion:'0.31.8',expoVersion:'0.31.8',expoCode:68,nativeVersion:'0.31.8',nativeCode:68})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.31.0'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,68)
})
