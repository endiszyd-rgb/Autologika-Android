import test from 'node:test'
import assert from 'node:assert/strict'
import {formatVoiceTranscript,joinVoiceText,voiceErrorMessage} from '../src/voice-entry.js'

test('formats Polish voice punctuation commands',()=>{
 assert.equal(formatVoiceTranscript('silnik szarpie przecinek na zimno kropka nowa linia kontrolka miga'),'silnik szarpie, na zimno.\nkontrolka miga')
})

test('appends recognized speech without deleting existing notes',()=>{
 assert.equal(joinVoiceText('DTC P0401.','sprawdzić podciśnienie'),'DTC P0401. sprawdzić podciśnienie')
 assert.equal(joinVoiceText('','nierówna praca'),'Nierówna praca')
})

test('maps native recognition errors to useful Polish messages',()=>{
 assert.match(voiceErrorMessage('service-not-allowed'),/ustawieniach Androida/i)
 assert.match(voiceErrorMessage('unknown'),/rozpoznać mowy/i)
})
