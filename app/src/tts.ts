export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'en-IN', label: 'English' },
  { code: 'ur-PK', label: 'Urdu' },
  { code: 'fa-IR', label: 'Persian' },
  { code: 'ar-SA', label: 'Arabic' },
];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

function primarySubtag(code: string): string {
  return code.split('-')[0].toLowerCase();
}

export function findVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string,
): SpeechSynthesisVoice | undefined {
  const primary = primarySubtag(langCode);
  return voices.find((v) => String(v.lang || '').replace(/_/g, '-').toLowerCase().startsWith(primary));
}

export function getVoices(): SpeechSynthesisVoice[] {
  const synth = window.speechSynthesis;
  return synth ? synth.getVoices() : [];
}

export function subscribeVoicesChanged(cb: () => void): () => void {
  const synth = window.speechSynthesis;
  if (!synth) return () => {};
  if (synth.addEventListener) {
    synth.addEventListener('voiceschanged', cb);
    return () => synth.removeEventListener('voiceschanged', cb);
  }
  synth.onvoiceschanged = cb;
  return () => {
    synth.onvoiceschanged = null;
  };
}

export interface SpeakResult {
  available: boolean;
  matchedVoice: boolean;
}

/** Cancels any in-flight utterance, then speaks `text` in `langCode`. */
export function speak(text: string, langCode: string, voices: SpeechSynthesisVoice[]): SpeakResult {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    return { available: false, matchedVoice: false };
  }
  try {
    synth.cancel();
  } catch {
    // ignore — best-effort cancel
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  const match = findVoice(voices, langCode);
  if (match) utterance.voice = match;
  try {
    synth.speak(utterance);
  } catch {
    // ignore — best-effort speak
  }
  return { available: true, matchedVoice: !!match };
}

export function cancelSpeech(): void {
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // ignore
  }
}
