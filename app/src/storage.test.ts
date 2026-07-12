import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEY } from './types';
import { load, migrate } from './storage';

function fakeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    _map: map,
  };
}

/** Pre-update payload: settings has only ttsEnabled/ttsLang, with the removed en-IN code. */
const legacyData = {
  version: 1,
  folders: [{ id: 'f1', name: 'Basics', createdAt: 1 }],
  decks: [{ id: 'd1', name: 'Deck 1', folderId: 'f1', practiceRemainingOnly: true, createdAt: 1 }],
  cards: [
    {
      id: 'c1',
      deckId: 'd1',
      sentence: 'मैं घर जाता हूँ',
      translation: 'I go home',
      transliteration: 'main ghar jaata hoon',
      streak: 1,
      masteredAt: null,
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  settings: { ttsEnabled: true, ttsLang: 'en-IN' },
};

let ls: ReturnType<typeof fakeLocalStorage>;

beforeEach(() => {
  ls = fakeLocalStorage();
  vi.stubGlobal('window', { localStorage: ls });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('storage migration', () => {
  it('loads legacy data intact, with missing toggles defaulting to false', () => {
    ls.setItem(STORAGE_KEY, JSON.stringify(legacyData));
    const data = load();
    expect(data.folders).toEqual(legacyData.folders);
    expect(data.decks).toEqual(legacyData.decks);
    expect(data.cards).toEqual(legacyData.cards);
    expect(data.settings.ttsEnabled).toBe(true);
    expect(data.settings.hideTransliteration).toBe(false);
    expect(data.settings.revealBlocksOnTap).toBe(false);
  });

  it('collapses the two old TTS booleans into one: either true → true', () => {
    const cases: Array<[{ ttsEnabled?: boolean; autoReadOnComplete?: boolean }, boolean]> = [
      [{ ttsEnabled: false, autoReadOnComplete: true }, true],
      [{ ttsEnabled: true, autoReadOnComplete: false }, true],
      [{ ttsEnabled: true, autoReadOnComplete: true }, true],
      [{ ttsEnabled: false, autoReadOnComplete: false }, false],
      [{}, false],
    ];
    for (const [old, expected] of cases) {
      const migrated = migrate({ ...legacyData, settings: { ttsLang: 'hi-IN', ...old } } as never);
      expect(migrated.settings.ttsEnabled).toBe(expected);
    }
  });

  it('drops unknown/legacy settings keys silently', () => {
    const migrated = migrate({
      ...legacyData,
      settings: { ttsEnabled: false, autoReadOnComplete: true, ttsLang: 'hi-IN', bogus: 42 },
    } as never);
    expect(migrated.settings).toEqual({
      ttsEnabled: true,
      ttsLang: 'hi-IN',
      hideTransliteration: false,
      revealBlocksOnTap: false,
    });
    expect('autoReadOnComplete' in migrated.settings).toBe(false);
  });

  it('remaps the removed en-IN code to en-US and persists under the same key', () => {
    ls.setItem(STORAGE_KEY, JSON.stringify(legacyData));
    const data = load();
    expect(data.settings.ttsLang).toBe('en-US');
    const persisted = JSON.parse(ls.getItem(STORAGE_KEY)!);
    expect(persisted.settings.ttsLang).toBe('en-US');
    expect(persisted.cards).toEqual(legacyData.cards);
  });

  it('keeps a still-valid ttsLang untouched', () => {
    const migrated = migrate({ ...legacyData, settings: { ...legacyData.settings, ttsLang: 'ta-IN' } } as never);
    expect(migrated.settings.ttsLang).toBe('ta-IN');
  });

  it('keeps already-set new toggles instead of resetting them', () => {
    const migrated = migrate({
      ...legacyData,
      settings: { ...legacyData.settings, ttsLang: 'hi-IN', hideTransliteration: true },
    } as never);
    expect(migrated.settings.hideTransliteration).toBe(true);
  });
});
