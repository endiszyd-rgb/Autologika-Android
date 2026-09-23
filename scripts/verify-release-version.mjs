import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptFile=fileURLToPath(import.meta.url)
const projectRoot=path.resolve(path.dirname(scriptFile),'..')

export function readReleaseVersions(root=projectRoot){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))
 const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo
 const gradle=fs.readFileSync(path.join(root,'android','app','build.gradle'),'utf8')
 const nativeVersion=gradle.match(/versionName\s+"([^"]+)"/)?.[1]
 const nativeCode=Number(gradle.match(/versionCode\s+(\d+)/)?.[1])
 return {packageVersion:pkg.version,expoVersion:app.version,expoCode:Number(app.android?.versionCode),nativeVersion,nativeCode}
}

export function verifyReleaseVersion(expected,root=projectRoot){
 const versions=readReleaseVersions(root)
 const names=[versions.packageVersion,versions.expoVersion,versions.nativeVersion]
 if(!expected)throw new Error('Podaj oczekiwaną wersję wydania, np. 0.27.0.')
 if(names.some(version=>version!==expected))throw new Error(`Niezgodne wersje: oczekiwano ${expected}, package=${versions.packageVersion}, expo=${versions.expoVersion}, native=${versions.nativeVersion}`)
 if(!Number.isInteger(versions.expoCode)||versions.expoCode<=0||versions.expoCode!==versions.nativeCode)throw new Error(`Niezgodny versionCode: Expo=${versions.expoCode}, Gradle=${versions.nativeCode}`)
 return versions
}

if(process.argv[1]&&path.resolve(process.argv[1])===scriptFile){
 try{const versions=verifyReleaseVersion(process.argv[2]);console.log(`Wersja Android ${versions.nativeVersion} (${versions.nativeCode}) jest spójna.`)}
 catch(error){console.error(error.message);process.exit(1)}
}
