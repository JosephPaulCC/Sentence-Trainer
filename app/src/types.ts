export type ID = string;

export interface Folder {
  id: ID;
  name: string;
  createdAt: number;
}

export interface Deck {
  id: ID;
  name: string;
  folderId: ID | null;
  practiceRemainingOnly: boolean;
  createdAt: number;
}

export interface Card {
  id: ID;
  deckId: ID;
  sentence: string;
  translation: string;
  transliteration: string;
  streak: number;
  masteredAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  ttsEnabled: boolean;
  ttsLang: string;
}

export interface AppData {
  version: 1;
  folders: Folder[];
  decks: Deck[];
  cards: Card[];
  settings: Settings;
}

export const MASTERY_THRESHOLD: number = 2;
export const AUTO_ADVANCE_MS = 900;
export const STORAGE_KEY = 'sentence-builder:v1';
export const DEFAULT_TTS_LANG = 'hi-IN';
