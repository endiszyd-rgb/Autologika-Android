import test from 'node:test'
import assert from 'node:assert/strict'
import {compareVersions,releaseUpdate,shortReleaseNotes} from '../src/app-updater.js'

test('porównuje wersje liczbami zamiast tekstowo',()=>{
 assert.equal(compareVersions('0.18.0','0.9.9'),1)
 assert.equal(compareVersions('v1.2.0','1.2'),0)
 assert.equal(compareVersions('1.2.3','1.3.0'),-1)
})

test('wybiera APK z najnowszego wydania GitHub',()=>{
 const update=releaseUpdate({tag_name:'v0.18.0',html_url:'https://example.test/release',body:'- Pierwsza\n- Druga',assets:[{name:'Autologika-Android-0.18.0.apk.sha256',browser_download_url:'checksum'},{name:'Autologika-Android-0.18.0.apk',browser_download_url:'apk',size:123}]},'0.17.0')
 assert.equal(update.available,true)
 assert.equal(update.downloadUrl,'apk')
 assert.equal(update.size,123)
})

test('nie proponuje ponownej instalacji tej samej wersji',()=>{
 assert.deepEqual(releaseUpdate({tag_name:'v0.18.0',assets:[]},'0.18.0'),{available:false,version:'0.18.0',currentVersion:'0.18.0'})
})

test('skraca informacje o wydaniu do czytelnej listy',()=>{
 assert.deepEqual(shortReleaseNotes('# Zmiany\n\n- Pierwsza\n* Druga'),['Zmiany','Pierwsza','Druga'])
})
