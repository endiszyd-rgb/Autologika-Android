import assert from 'node:assert/strict'
import {readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import test from 'node:test'

const sourceFiles=['App.js','app.json',...readdirSync('src').filter(name=>name.endsWith('.js')).map(name=>join('src',name))]
const brokenUtf8=/(?:Ã|Â|Ä|Å|â|ðŸ)/u

test('interfejs nie zawiera tekstów zapisanych w uszkodzonym kodowaniu',()=>{
 const broken=sourceFiles.filter(file=>brokenUtf8.test(readFileSync(file,'utf8')))
 assert.deepEqual(broken,[])
})

test('workflow używa czytelnych polskich nazw i opisanych akcji',()=>{
 const app=readFileSync('App.js','utf8')
 for(const text of ['Przyjęcie','Diagnoza','Wycena','Akceptacja','Naprawa','QC naprawy','QC wydania','Płatność','Gotowe','Wstecz','Dalej','Wydaj'])assert.match(app,new RegExp(text))
})

test('interfejs telefonu wspiera obie orientacje bez wymuszonej szerokości',()=>{
 const app=readFileSync('App.js','utf8')
 const config=JSON.parse(readFileSync('app.json','utf8'))
 assert.equal(config.expo.orientation,'default')
 assert.doesNotMatch(readFileSync(join('android','app','src','main','AndroidManifest.xml'),'utf8'),/screenOrientation="landscape"/)
 assert.match(app,/contentCompact:\{width:'100%',minWidth:0/)
 assert.doesNotMatch(app,/ScrollView horizontal=\{compact\}/)
 assert.match(app,/WIĘCEJ/)
})

test('ekran zleceń ma zdefiniowany panel tworzenia zlecenia',()=>{
 const app=readFileSync('App.js','utf8')
 assert.match(app,/function NewOrderPanel\s*\(/)
 assert.match(app,/<NewOrderPanel refresh=\{refresh\} openCenter=\{openCenter\}\/>/)
})

test('aparat dokumentów uruchamia lampę dla podglądu i zdjęcia',()=>{
 const screen=readFileSync('src/delivery-document-screen.js','utf8')
 assert.match(screen,/<CameraView[^>]+flash="on"[^>]+enableTorch/)
 assert.match(screen,/useCameraPermissions/)
 assert.match(screen,/onCameraReady=/)
 assert.match(screen,/typeof takePicture==='function'/)
 assert.match(screen,/ImagePicker\.launchCameraAsync/)
 assert.match(screen,/typeof NativeModules\.DeliveryOcr\?\.recognize==='function'/)
})

test('magazyn pokazuje synchronizowaną historię dokumentów dostaw',()=>{
 const app=readFileSync('App.js','utf8')
 assert.match(app,/list\('delivery_document_imports'\)/)
 assert.match(app,/Dokumenty dostaw · \$\{deliveries\.length\}/)
 assert.match(app,/Szukaj dokumentu/)
 assert.match(app,/Otwórz skan/)
})
