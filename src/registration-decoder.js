import {Buffer} from 'buffer'
import PolishVehicleRegistrationCertificateDecoder from 'polish-vehicle-registration-certificate-decoder'
globalThis.Buffer=globalThis.Buffer||Buffer

const clean=value=>String(value??'').trim(),field=(data,key)=>data?.[key]?.value??'',decimal=value=>Number(clean(value).replace(',','.'))||0
export function decodeRegistration(raw){
 const source=clean(raw).replace(/^\][A-Za-z][0-9]/,''),match=(source.match(/[A-Za-z0-9+/_=-]{40,}/g)||[]).sort((a,b)=>b.length-a.length)[0]||source
 const base64=match.replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/'),bytes=Buffer.from(base64,'base64')
 if(bytes.length<8)throw new Error('Skan jest zbyt krótki.')
 const outputLength=bytes.readUInt32LE(0);if(outputLength<20||outputLength>200000)throw new Error('To nie jest payload polskiego dowodu rejestracyjnego.')
 const data=new PolishVehicleRegistrationCertificateDecoder(base64).data,capacity=decimal(field(data,'pojemnoscSilnikaCm3')),fuel=clean(data?.rodzajPaliwa?.valueDescription||field(data,'rodzajPaliwa')),powerKw=decimal(field(data,'maksymalnaMocNettoSilnikaKW'))
 const form={customer_name:clean(field(data,'pelneNazwiskoLubNazwaPosiadaczaDowoduRejestracyjnego'))||clean(field(data,'nazwaPosiadaczaDowoduRejestracyjnego')),plate:clean(field(data,'numerRejestracyjnyPojazdu')).toUpperCase(),vin:clean(field(data,'numerIdentyfikacyjnyPojazdu')).toUpperCase(),make:clean(field(data,'markaPojazdu')),model:clean(field(data,'modelPojazdu')),year:clean(field(data,'rokProdukcji')),engine:[capacity?`${Math.round(capacity)} cm³`:'',fuel].filter(Boolean).join(' · '),power_hp:powerKw?String(Math.round(powerKw*1.359621617)):'',intake_notes:`Dane pojazdu odczytane z AZTEC dowodu rejestracyjnego${field(data,'seriaDr')?` · DR ${clean(field(data,'seriaDr'))}`:''}. Zweryfikuj zgodność przed zapisaniem.`}
 if(!form.vin&&!form.plate)throw new Error('W payloadzie nie znaleziono pojazdu.')
 return {ok:true,format:clean(field(data,'format'))||'STARY',form}
}
