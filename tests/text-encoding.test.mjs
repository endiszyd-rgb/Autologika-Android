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
 for(const text of ['Przyjęte','Diagnoza','Akceptacja','Naprawa','Gotowe','Wstecz','Dalej','Wydaj'])assert.match(app,new RegExp(text))
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
