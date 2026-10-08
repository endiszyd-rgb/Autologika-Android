import test from 'node:test'
import assert from 'node:assert/strict'
import {readReleaseVersions,verifyReleaseVersion} from '../scripts/verify-release-version.mjs'

test('wersja wydania jest zgodna w package, Expo i natywnym Gradle',()=>{
 const versions=verifyReleaseVersion('0.31.5')
 assert.deepEqual(versions,{packageVersion:'0.31.5',expoVersion:'0.31.5',expoCode:65,nativeVersion:'0.31.5',nativeCode:65})
})

test('kontrola odrzuca tag inny niż wersja aplikacji',()=>{
 assert.throws(()=>verifyReleaseVersion('0.31.0'),/Niezgodne wersje/)
 assert.equal(readReleaseVersions().nativeCode,65)
})
