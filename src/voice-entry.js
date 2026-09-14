const errors={
 'not-allowed':'Brak dostępu do mikrofonu.',
 'audio-capture':'Nie znaleziono działającego mikrofonu.',
 'service-not-allowed':'Włącz usługę rozpoznawania mowy w ustawieniach Androida.',
 'language-not-supported':'Język polski nie jest dostępny w usłudze rozpoznawania.',
 'no-speech':'Nie wykryto mowy. Spróbuj ponownie.',
 'network':'Usługa rozpoznawania wymaga połączenia z internetem.',
 aborted:''
}

function formatVoiceTranscript(value=''){
 return String(value).replace(/\s+przecinek(?=\s|$)/gi,',').replace(/\s+kropka(?=\s|$)/gi,'.').replace(/\s+(?:nowa linia|nowy wiersz)(?=\s|$)/gi,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/[ \t]{2,}/g,' ').trim()
}

function joinVoiceText(base='',transcript=''){
 const left=String(base||'').trimEnd(),right=formatVoiceTranscript(transcript)
 if(!right)return left
 if(!left)return right.charAt(0).toUpperCase()+right.slice(1)
 return `${left} ${right}`
}

function voiceErrorMessage(code='unknown'){return Object.prototype.hasOwnProperty.call(errors,code)?errors[code]:'Nie udało się rozpoznać mowy.'}

export{formatVoiceTranscript,joinVoiceText,voiceErrorMessage}
