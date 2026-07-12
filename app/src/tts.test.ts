import { describe, it, expect } from 'vitest';
import { LANGUAGES, findVoice, speakWarning, languageLabel } from './tts';

function voice(lang: string): SpeechSynthesisVoice {
  return { lang, name: `Voice ${lang}`, default: false, localService: true, voiceURI: lang } as SpeechSynthesisVoice;
}

describe('LANGUAGES', () => {
  it('splits English into US and UK at the old single-English position', () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['hi-IN', 'te-IN', 'kn-IN', 'ml-IN', 'ta-IN', 'en-US', 'en-GB', 'ur-PK', 'fa-IR', 'ar-SA']);
    expect(codes).not.toContain('en-IN');
    expect(languageLabel('en-US')).toBe('American English');
    expect(languageLabel('en-GB')).toBe('British English');
  });
});

describe('findVoice', () => {
  const mixed = [voice('en_US'), voice('en-GB'), voice('hi-IN')];

  it('British English returns the en-GB voice exactly', () => {
    const m = findVoice(mixed, 'en-GB');
    expect(m?.voice.lang).toBe('en-GB');
    expect(m?.exact).toBe(true);
  });

  it('American English returns the en_US voice via underscore normalization', () => {
    const m = findVoice(mixed, 'en-US');
    expect(m?.voice.lang).toBe('en_US');
    expect(m?.exact).toBe(true);
  });

  it('non-English exact matching still works', () => {
    const m = findVoice(mixed, 'hi-IN');
    expect(m?.voice.lang).toBe('hi-IN');
    expect(m?.exact).toBe(true);
  });

  it('with only an en-US voice, British English falls back to it (non-exact)', () => {
    const m = findVoice([voice('en-US'), voice('hi-IN')], 'en-GB');
    expect(m?.voice.lang).toBe('en-US');
    expect(m?.exact).toBe(false);
  });

  it('returns undefined when no voice shares the primary subtag', () => {
    expect(findVoice([voice('hi-IN')], 'ta-IN')).toBeUndefined();
  });
});

describe('speakWarning', () => {
  it('English fallback produces the adapted toast with a stable once-per-language key', () => {
    const result = { available: true, matchedVoice: true, exactVoice: false };
    const first = speakWarning(result, 'en-GB');
    expect(first?.msg).toBe(
      'No British English voice on this device — using the closest English voice. Install more voices in Android Settings → Text-to-speech.',
    );
    // The store dedupes toasts by key, so a stable key means the toast fires once.
    const second = speakWarning(result, 'en-GB');
    expect(second?.key).toBe(first?.key);
    expect(first?.key).toBe('fallback:en-GB');
  });

  it('exact match warns nothing', () => {
    expect(speakWarning({ available: true, matchedVoice: true, exactVoice: true }, 'en-GB')).toBeNull();
  });

  it('missing voice keeps the existing install-voice-data toast keyed by language', () => {
    const w = speakWarning({ available: true, matchedVoice: false, exactVoice: false }, 'ta-IN');
    expect(w?.key).toBe('ta-IN');
    expect(w?.msg).toContain('No Tamil voice on this device — install it in Android Settings');
  });

  it('non-English prefix fallback stays silent (pre-existing behavior)', () => {
    expect(speakWarning({ available: true, matchedVoice: true, exactVoice: false }, 'ur-PK')).toBeNull();
  });

  it('no speech synthesis at all warns once globally', () => {
    const w = speakWarning({ available: false, matchedVoice: false, exactVoice: false }, 'en-US');
    expect(w?.key).toBe('nosynth');
  });
});
