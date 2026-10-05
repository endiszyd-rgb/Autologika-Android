const fs=require('node:fs')
const path=require('node:path')
const babel=require('@babel/core')

const root=path.resolve(__dirname,'..')
const files=['App.js',...fs.readdirSync(path.join(root,'src')).filter(name=>name.endsWith('.js')).map(name=>`src/${name}`)]
for(const file of files){
 babel.parseSync(fs.readFileSync(path.join(root,file),'utf8'),{
  filename:path.join(root,file),sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['jsx']}
 })
}
console.log(`Składnia JavaScript/JSX: ${files.length} plików OK.`)
