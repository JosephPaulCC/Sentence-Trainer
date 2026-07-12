import { STORAGE_KEY, DEFAULT_SETTINGS, type AppData, type Settings } from './types';
import { LANGUAGES } from './tts';

function freshDefaults(): AppData {
  return {
    version: 1,
    folders: [],
    decks: [],
    cards: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isValid(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.folders) &&
    Array.isArray(d.decks) &&
    Array.isArray(d.cards) &&
    !!d.settings &&
    typeof d.settings === 'object'
  );
}

/**
 * Additive migration: older payloads lack the newer settings fields, and may
 * carry a ttsLang code that no longer exists in the selector (e.g. `en-IN`).
 * Everything else is passed through untouched.
 */
export function migrate(data: AppData): AppData {
  const settings: Settings = { ...DEFAULT_SETTINGS, ...data.settings };
  if (!LANGUAGES.some((l) => l.code === settings.ttsLang)) {
    settings.ttsLang = 'en-US';
  }
  return { ...data, version: 1, settings };
}

/** Loads persisted state. Missing key or corrupt JSON never crashes the app. */
export function load(): AppData {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return freshDefaults();
  }
  if (raw == null) return freshDefaults();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) throw new Error('malformed sentence-builder state');
    const migrated = migrate(parsed);
    save(migrated);
    return migrated;
  } catch {
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:corrupt`, raw);
    } catch {
      // best effort only — still fall back to fresh defaults below
    }
    return freshDefaults();
  }
}

/** Write-through save; the sole place that touches localStorage for writes. */
export function save(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable/full — never crash the app over persistence
  }
}
