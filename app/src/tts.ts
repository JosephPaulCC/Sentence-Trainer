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
  { code: 'en-US', label: 'American English' },
  { code: 'en-GB', label: 'British English' },
  { code: 'ur-PK', label: 'Urdu' },
  { code: 'fa-IR', label: 'Persian' },
  { code: 'ar-SA', label: 'Arabic' },
];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

function normalizeTag(tag: string): string {
  return String(tag || '').replace(/_/g, '-').toLowerCase();
}

function primarySubtag(code: string): string {
  return normalizeTag(code).split('-')[0];
}

export interface VoiceMatch {
  voice: SpeechSynthesisVoice;
  /** true = full-tag match (en-GB → en-GB); false = primary-subtag fallback (en-GB → en-US). */
  exact: boolean;
}

/**
 * Shared voice matcher for per-word speakers and auto-read:
 * (1) exact match on the full normalized tag (`_`→`-`, lowercased),
 * (2) primary-subtag prefix fallback, (3) no match.
 */
export function findVoice(voices: SpeechSynthesisVoice[], langCode: string): VoiceMatch | undefined {
  const target = normalizeTag(langCode);
  const exact = voices.find((v) => normalizeTag(v.lang) === target);
  if (exact) return { voice: exact, exact: true };
  const primary = primarySubtag(langCode);
  const prefix = voices.find((v) => normalizeTag(v.lang).startsWith(primary));
  if (prefix) return { voice: prefix, exact: false };
  return undefined;
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
  /** false while matchedVoice is true means the primary-subtag fallback was used. */
  exactVoice: boolean;
}

/**
 * Cancels any in-flight utterance, then speaks `text` in `langCode`.
 * `onFinish` fires once on the utterance's end OR error (whichever comes
 * first) — callers must not rely on it firing at all (Android Chrome bug).
 */
export function speak(
  text: string,
  langCode: string,
  voices: SpeechSynthesisVoice[],
  onFinish?: () => void,
): SpeakResult {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    return { available: false, matchedVoice: false, exactVoice: false };
  }
  try {
    synth.cancel();
  } catch {
    // ignore — best-effort cancel
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  const match = findVoice(voices, langCode);
  if (match) utterance.voice = match.voice;
  if (onFinish) {
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      onFinish();
    };
    utterance.onend = fire;
    utterance.onerror = fire;
  }
  try {
    synth.speak(utterance);
  } catch {
    // ignore — best-effort speak
  }
  return { available: true, matchedVoice: !!match, exactVoice: !!match && match.exact };
}

export interface SpeakWarning {
  /** warnOnce dedupe key — stable per language, so each toast shows once per session. */
  key: string;
  msg: string;
}

/**
 * Maps a speak() outcome to the toast the user should see (or null).
 * The fallback warning only applies to English, where two selector variants
 * (en-US / en-GB) can silently resolve to the same device voice.
 */
export function speakWarning(result: SpeakResult, langCode: string): SpeakWarning | null {
  if (!result.available) {
    return { key: 'nosynth', msg: 'Speech is not available in this browser.' };
  }
  if (!result.matchedVoice) {
    return {
      key: langCode,
      msg: `No ${languageLabel(langCode)} voice on this device — install it in Android Settings → Text-to-speech (Speech Services by Google).`,
    };
  }
  if (!result.exactVoice && primarySubtag(langCode) === 'en') {
    return {
      key: `fallback:${langCode}`,
      msg: `No ${languageLabel(langCode)} voice on this device — using the closest English voice. Install more voices in Android Settings → Text-to-speech.`,
    };
  }
  return null;
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
