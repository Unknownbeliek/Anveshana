/**
 * Text-to-Speech Voice Synthesis Engine for Regional Language Farmer Accessibility
 */
export function speakDepositSummary({
  farmerName,
  volumeLiters,
  fat,
  snf,
  payout,
  purityGrade,
  language = 'hi' // 'hi' for Hindi, 'en' for English
}) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  let message = '';
  if (language === 'hi') {
    message = `नमस्ते ${farmerName || 'किसान भाई'}. आपका ${volumeLiters} लीटर दूध जमा हुआ है. फैट ${fat} प्रतिशत, एस एन एफ ${snf} प्रतिशत. आपका कुल भुगतान ${payout} रुपये बनता है. आपकी फार्म पवित्रता श्रेणी ${purityGrade || 'ए'} है. धन्यवाद.`;
  } else {
    message = `Hello ${farmerName || 'Farmer'}. Your deposit of ${volumeLiters} liters has been recorded. Fat ${fat} percent, SNF ${snf} percent. Total payout is Rupees ${payout}. Your purity grade is ${purityGrade || 'Grade A'}. Thank you.`;
  }

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Attempt to select a regional Hindi or English voice
  const voices = window.speechSynthesis.getVoices();
  if (language === 'hi') {
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('India'));
    if (hindiVoice) utterance.voice = hindiVoice;
  } else {
    const indianEngVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'));
    if (indianEngVoice) utterance.voice = indianEngVoice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
