export const ANDROID_RELEASE_API='https://api.github.com/repos/endiszyd-rgb/Autologika-Android/releases/latest'

export const versionParts=value=>{const parts=String(value||'0').trim().replace(/^v/i,'').split(/[.-]/);return Array.from({length:3},(_,index)=>Number.parseInt(parts[index],10)||0)}

export function compareVersions(left,right){
 const a=versionParts(left),b=versionParts(right)
 for(let index=0;index<3;index+=1){
  if(a[index]!==b[index])return a[index]>b[index]?1:-1
 }
 return 0
}

export function releaseUpdate(release,currentVersion){
 const version=String(release?.tag_name||release?.name||'').trim().replace(/^v/i,'')
 const assets=Array.isArray(release?.assets)?release.assets:[]
 const apk=assets.find(asset=>/\.apk$/i.test(asset?.name||'')&&!/\.sha256$/i.test(asset?.name||''))
 if(!version)throw new Error('Najnowsze wydanie nie zawiera numeru wersji.')
 if(compareVersions(version,currentVersion)<=0)return {available:false,version,currentVersion}
 if(!apk?.browser_download_url)throw new Error(`Wydanie ${version} nie zawiera instalatora APK.`)
 return {available:true,version,currentVersion,downloadUrl:apk.browser_download_url,size:Number(apk.size||0),notes:String(release?.body||''),pageUrl:String(release?.html_url||'')}
}

export const shortReleaseNotes=value=>String(value||'').split(/\r?\n/).map(line=>line.replace(/^\s*[-*#]+\s*/, '').trim()).filter(Boolean).slice(0,4)
