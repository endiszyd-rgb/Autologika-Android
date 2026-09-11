export function normalizeBarcode(value=''){
  return String(value||'').trim().replace(/^\][A-Za-z][0-9]/,'').replace(/[\r\n\t ]+/g,'')
}

export function isGtin(value=''){
  const code=normalizeBarcode(value)
  if(!/^\d{8}$|^\d{12,14}$/.test(code))return false
  const digits=[...code].map(Number),check=digits.pop()
  let sum=0,weight=3
  for(let i=digits.length-1;i>=0;i--){sum+=digits[i]*weight;weight=weight===3?1:3}
  return (10-(sum%10))%10===check
}

function item(barcode,data,source,url){return{barcode,name:String(data.name||'').trim(),brand:String(data.brand||'').trim(),category:String(data.category||'').trim(),part_no:String(data.part_no||'').trim(),description:String(data.description||'').trim(),image_url:String(data.image_url||'').trim(),lookup_source:source,lookup_url:url}}

function mapUpcItemDb(data,barcode){const x=Array.isArray(data?.items)?data.items[0]:null;return data?.code==='OK'&&x?.title?item(barcode,{name:x.title,brand:x.brand,category:x.category,part_no:x.model||x.mpn,description:x.description,image_url:x.images?.[0]},'UPCitemDB',`https://www.upcitemdb.com/upc/${barcode}`):null}
function mapUpcDev(data,barcode){const x=data?.data;return data?.ok&&x?.name?item(barcode,{name:x.name,brand:x.brand,category:x.category,part_no:x.mpn||x.model,description:x.description,image_url:x.image_url},'upc.dev',`https://upc.dev/v1/product/${barcode}`):null}
function mapOpenProductsFacts(data,barcode){const x=data?.product;return data?.status==='success'&&x?.product_name?item(barcode,{name:x.product_name,brand:x.brands,category:x.categories,description:x.generic_name,image_url:x.image_front_url},'Open Products Facts',`https://world.openproductsfacts.org/product/${barcode}`):null}

function decodeHtml(value=''){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(parseInt(n,10))).replace(/&quot;/gi,'"').replace(/&apos;|&#39;|&#x27;/gi,"'").replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim()}
function unwrap(value=''){try{const raw=decodeHtml(value),url=new URL(raw.startsWith('//')?`https:${raw}`:raw),target=url.hostname.endsWith('duckduckgo.com')?url.searchParams.get('uddg'):url.href,parsed=new URL(target);return /^https?:$/.test(parsed.protocol)?parsed.href:''}catch{return''}}
function partNumber(title,barcode){return(String(title||'').replace(barcode,' ').match(/[A-Z0-9][A-Z0-9._/-]{3,23}/gi)||[]).find(x=>/[A-Z]/i.test(x)&&/\d/.test(x)&&normalizeBarcode(x)!==barcode)||''}
function brand(title,number){if(!number)return'';const index=String(title).toUpperCase().indexOf(number.toUpperCase()),before=String(title).slice(0,index),stop=new Set(['FOR','FITS','FIT','NEW','GENUINE','ORIGINAL','GERMANY','UK','THE','WITH']),words=(before.match(/[A-Z][A-Z0-9-]{1,15}/g)||[]).filter(x=>!stop.has(x)&&!/\d/.test(x));if(words.length)return words.at(-1);return(String(title).slice(index+number.length).match(/^\s*([A-Z][A-Z0-9-]{1,15}(?:\s+[A-Z][A-Z0-9-]{1,15})?)/)?.[1]||'').trim()}

export function mapWebSearch(html,value){
  const barcode=normalizeBarcode(value),results=[],source=String(html||'')
  const ddg=/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="result__a"|$)/gi
  for(const m of source.matchAll(ddg)){const url=unwrap(m[1]),title=decodeHtml(m[2]),snippet=decodeHtml(m[3].match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)?.[1]||''),evidence=`${title} ${snippet}`;if(!url||!evidence.includes(barcode))continue;results.push({url,title,snippet,score:(title.includes(barcode)?8:4)+(/autodoc|motora|autoparts|auto-?teile|ucando|częś|czujnik|sensor|filter|brake|pompa|pump|bearing|łożysk/i.test(`${url} ${evidence}`)?3:0)})}
  const brave=/<a[^>]*href="(https?:\/\/[^"#]+)"[^>]*class="[^"]*\bl1\b[^"]*"[^>]*>[\s\S]{0,6000}?<div[^>]*class="[^"]*\btitle\b[^"]*"[^>]*title="([^"]+)"/gi
  if(source.includes(barcode))for(const m of source.matchAll(brave)){const url=decodeHtml(m[1]),title=decodeHtml(m[2]);results.push({url,title,snippet:'',score:3+(/autodoc|motora|autoparts|auto-?teile|ucando|częś|czujnik|sensor|filter|brake|pompa|pump|bearing|łożysk/i.test(`${url} ${title}`)?5:0)})}
  const best=results.sort((a,b)=>b.score-a.score)[0];if(!best||best.score<4)return null
  const name=best.title.replaceAll(barcode,'').replace(/\s*[|–—]\s*(?:eBay.*|AUTODOC.*)$/i,'').replace(/\s*\.{3}\s*$/,'').replace(/\s+/g,' ').trim(),number=partNumber(best.title,barcode)
  return name?{...item(barcode,{name,brand:brand(best.title,number),category:'Części samochodowe',part_no:number,description:best.snippet},'Wyszukiwanie WWW',best.url),web_candidate:true}:null
}

export async function lookupBarcodeOnline(value,{fetchImpl=fetch}={}){
  const barcode=normalizeBarcode(value);if(!isGtin(barcode))throw new Error('Kod nie jest poprawnym EAN, UPC ani GTIN.')
  const jsonHeaders={Accept:'application/json','Content-Type':'application/json','User-Agent':'AutologikaAndroid/0.12.0'},browserHeaders={Accept:'text/html,application/xhtml+xml','User-Agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36'}
  const providers=[
    {url:`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,map:mapUpcItemDb},
    {url:`https://search.brave.com/search?q=${encodeURIComponent(`"${barcode}"`)}&source=web`,map:mapWebSearch,text:true,headers:browserHeaders},
    {url:`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`"${barcode}"`)}`,map:mapWebSearch,text:true,headers:browserHeaders},
    {url:`https://upc.dev/v1/product/${barcode}`,map:mapUpcDev},
    {url:`https://world.openproductsfacts.org/api/v3/product/${barcode}?fields=code,product_name,brands,categories,generic_name,image_front_url`,map:mapOpenProductsFacts}
  ]
  let available=false
  for(const p of providers)try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000),response=await fetchImpl(p.url,{headers:p.headers||jsonHeaders,signal:controller.signal});clearTimeout(timer);if(response.status===404){available=true;continue}if(!response.ok)continue;available=true;const found=p.map(p.text?await response.text():await response.json(),barcode);if(found)return{found:true,barcode,item:found,source:found.lookup_source}}catch{}
  return{found:false,barcode,unavailable:!available}
}
