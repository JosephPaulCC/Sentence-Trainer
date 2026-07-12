import { useEffect, useRef, useState } from 'react';
import {
  type ID,
  type Folder,
  type Deck,
  type Card,
  type Settings,
  MASTERY_THRESHOLD,
  AUTO_ADVANCE_MS,
  AUTO_READ_TAIL_MS,
  AUTO_READ_CAP_MS,
} from './types';
import * as storage from './storage';
import { tokenize, isRtl } from './tokenize';
import { parseBulk, type BulkParseResult } from './bulkParse';
import { speak as ttsSpeak, getVoices, subscribeVoicesChanged, cancelSpeech, speakWarning } from './tts';

export interface PoolBlock {
  k: string;
  text: string;
  gone: boolean;
  shake: boolean;
}

export interface CompletionResult {
  clean: boolean;
  newly: boolean;
  streak: number;
  masteredAt: number | null;
  mastered: boolean;
  mistakes: number;
}

export interface Attempt {
  cardId: ID;
  tokens: string[];
  pool: PoolBlock[];
  placed: number;
  mistakes: number;
  done: boolean;
  doneInfo: CompletionResult | null;
  /** Feature C: blocks concealed until the learner taps to reveal. */
  covered: boolean;
  rtl: boolean;
}

/** A card the session has moved past, in order. Session-only — never persisted. */
export interface HistoryEntry {
  cardId: ID;
  status: 'completed' | 'skipped';
  /**
   * Wrong word-block taps committed for this card this session: the live
   * attempt's count, plus any completed review attempt's. Abandoned review
   * partials stay forgotten (their taps discard with the attempt).
   * Display-only — never feeds mastery/streak logic.
   */
  mistakes: number;
}

export interface ReviewState {
  /** Index into Session.history. */
  pos: number;
  /** Read-only display for completed entries; a fresh attempt for skipped ones. */
  attempt: Attempt;
}

export interface Session {
  deckId: ID;
  empty: boolean;
  summary: boolean;
  queue: ID[];
  index: number;
  completed: number;
  newly: number;
  attempt: Attempt | null;
  history: HistoryEntry[];
  review: ReviewState | null;
  /** True when the user submitted via "End session" instead of finishing the queue. */
  endedEarly: boolean;
}

export interface EditorDraft {
  cardId: ID | null;
  deckId: ID;
  sentence: string;
  translation: string;
  transliteration: string;
}

export interface BulkDraft {
  deckId: ID;
  text: string;
  preview: BulkParseResult | null;
}

export type SheetKind = 'deckMenu' | 'folderMenu' | 'cardMenu' | 'moveDeck';

export interface SheetState {
  kind: SheetKind;
  id: ID;
}

export type ModalKind =
  | 'newDeck'
  | 'newFolder'
  | 'renameDeck'
  | 'renameFolder'
  | 'resetDeck'
  | 'deleteDeck'
  | 'deleteFolder'
  | 'deleteCard'
  | 'endSession';

export interface ModalState {
  kind: ModalKind;
  id: ID | null;
  title: string;
  msg?: string;
  placeholder?: string;
  text?: string;
  confirmLabel: string;
  cancelLabel?: string;
  input: boolean;
  danger: boolean;
}

export type Screen = 'home' | 'deck' | 'editor' | 'bulk' | 'practice';

export interface State {
  folders: Folder[];
  decks: Deck[];
  cards: Card[];
  settings: Settings;
  screen: Screen;
  deckId: ID | null;
  collapsed: Record<string, boolean>;
  sheet: SheetState | null;
  modal: ModalState | null;
  toast: string | null;
  ed: EditorDraft | null;
  bulk: BulkDraft | null;
  session: Session | null;
}

function uuid(): ID {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildAttempt(card: Card, covered: boolean): Attempt {
  const tokens = tokenize(card.sentence);
  let order = shuffle(tokens.map((_, i) => i));
  if (new Set(tokens).size > 1) {
    const sameAsCorrect = (o: number[]) => o.every((v, i) => tokens[v] === tokens[i]);
    let guard = 0;
    while (sameAsCorrect(order) && guard < 100) {
      order = shuffle(order);
      guard++;
    }
  }
  return {
    cardId: card.id,
    tokens,
    pool: order.map((ti) => ({ k: card.id + '-' + ti, text: tokens[ti], gone: false, shake: false })),
    placed: 0,
    mistakes: 0,
    done: false,
    doneInfo: null,
    covered,
    rtl: isRtl(card.sentence),
  };
}

/** Read-only review display for an already-completed card: assembled answer, empty pool. */
function buildCompletedDisplay(card: Card): Attempt {
  const tokens = tokenize(card.sentence);
  return {
    cardId: card.id,
    tokens,
    pool: [],
    placed: tokens.length,
    mistakes: 0,
    done: true,
    doneInfo: null,
    covered: false,
    rtl: isRtl(card.sentence),
  };
}

/** True while a just-completed card's success state is on screen (nav stays inert). */
export function inCompletionTransition(ses: Session): boolean {
  const at = ses.review ? ses.review.attempt : ses.attempt;
  return !!at && at.done && at.doneInfo != null;
}

function computeCompletion(card: Card | undefined, mistakes: number): CompletionResult {
  if (!card) return { clean: mistakes === 0, newly: false, streak: 0, masteredAt: null, mastered: false, mistakes };
  const clean = mistakes === 0;
  const streak = clean ? card.streak + 1 : 0;
  let masteredAt = card.masteredAt;
  let newly = false;
  if (clean && streak >= MASTERY_THRESHOLD && masteredAt == null) {
    masteredAt = Date.now();
    newly = true;
  }
  return { clean, newly, streak, masteredAt, mastered: masteredAt != null, mistakes };
}

function initState(): State {
  const data = storage.load();
  return {
    folders: data.folders,
    decks: data.decks,
    cards: data.cards,
    settings: data.settings,
    screen: 'home',
    deckId: null,
    collapsed: {},
    sheet: null,
    modal: null,
    toast: null,
    ed: null,
    bulk: null,
    session: null,
  };
}

type Patch = Partial<State> | null;

export function useSentenceBuilder() {
  const [state, setState] = useState<State>(initState);
  const advTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shakeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const warnedRef = useRef<Record<string, boolean>>({});
  // Auto-read bookkeeping: seq invalidates stale onend/onerror callbacks
  // (cancel() fires them asynchronously), active gates cancel-on-interrupt.
  const autoReadSeq = useRef(0);
  const autoReadActive = useRef(false);

  function update(patch: Patch | ((s: State) => Patch)) {
    setState((prev) => {
      const p = typeof patch === 'function' ? patch(prev) : patch;
      if (p == null) return prev;
      return { ...prev, ...p };
    });
  }

  // ---------------- persistence ----------------
  useEffect(() => {
    storage.save({ version: 1, folders: state.folders, decks: state.decks, cards: state.cards, settings: state.settings });
  }, [state.folders, state.decks, state.cards, state.settings]);

  // ---------------- TTS voices lifecycle ----------------
  useEffect(() => {
    voicesRef.current = getVoices();
    const unsubscribe = subscribeVoicesChanged(() => {
      voicesRef.current = getVoices();
    });
    return () => {
      unsubscribe();
      cancelSpeech();
      clearTimeout(advTimer.current);
      clearTimeout(toastTimer.current);
      Object.values(shakeTimers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  // ---------------- toast auto-hide ----------------
  useEffect(() => {
    if (!state.toast) return;
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => update({ toast: null }), 4500);
    return () => clearTimeout(toastTimer.current);
  }, [state.toast]);

  function warnOnce(key: string, msg: string) {
    if (warnedRef.current[key]) return;
    warnedRef.current[key] = true;
    update({ toast: msg });
  }

  // ---------------- folders & decks ----------------
  function toggleFolderCollapse(id: ID) {
    update((s) => ({ collapsed: { ...s.collapsed, [id]: !s.collapsed[id] } }));
  }
  function toggleRemainingOnly(deckId: ID) {
    update((s) => ({ decks: s.decks.map((d) => (d.id === deckId ? { ...d, practiceRemainingOnly: !d.practiceRemainingOnly } : d)) }));
  }
  function openDeck(deckId: ID) {
    update({ screen: 'deck', deckId });
  }
  function backHome() {
    update({ screen: 'home' });
  }

  // ---------------- sheets & modals ----------------
  function openSheet(kind: SheetKind, id: ID) {
    update({ sheet: { kind, id } });
  }
  function closeSheet() {
    update({ sheet: null });
  }
  function openInputModal(kind: ModalKind, id: ID | null, title: string, placeholder: string, initial: string, confirmLabel: string) {
    update({ modal: { kind, id, title, placeholder, text: initial, confirmLabel, input: true, danger: false }, sheet: null });
  }
  function openConfirmModal(kind: ModalKind, id: ID | null, title: string, msg: string, confirmLabel: string, danger: boolean) {
    update({ modal: { kind, id, title, msg, confirmLabel, input: false, danger }, sheet: null });
  }
  function modalTextChange(text: string) {
    update((s) => (s.modal ? { modal: { ...s.modal, text } } : null));
  }
  function closeModal() {
    update({ modal: null });
  }
  function modalConfirm() {
    update((s) => {
      const m = s.modal;
      if (!m) return null;
      const text = (m.text ?? '').trim();
      if (m.input && !text) return null;
      switch (m.kind) {
        case 'newDeck':
          return {
            decks: s.decks.concat([{ id: uuid(), name: text, folderId: null, practiceRemainingOnly: false, createdAt: Date.now() }]),
            modal: null,
          };
        case 'newFolder':
          return { folders: s.folders.concat([{ id: uuid(), name: text, createdAt: Date.now() }]), modal: null };
        case 'renameDeck':
          return { decks: s.decks.map((d) => (d.id === m.id ? { ...d, name: text } : d)), modal: null };
        case 'renameFolder':
          return { folders: s.folders.map((f) => (f.id === m.id ? { ...f, name: text } : f)), modal: null };
        case 'resetDeck':
          return { cards: s.cards.map((c) => (c.deckId === m.id ? { ...c, streak: 0, masteredAt: null } : c)), modal: null };
        case 'deleteDeck':
          return { decks: s.decks.filter((d) => d.id !== m.id), cards: s.cards.filter((c) => c.deckId !== m.id), modal: null };
        case 'deleteFolder':
          return {
            folders: s.folders.filter((f) => f.id !== m.id),
            decks: s.decks.map((d) => (d.folderId === m.id ? { ...d, folderId: null } : d)),
            modal: null,
          };
        case 'deleteCard':
          return { cards: s.cards.filter((c) => c.id !== m.id), modal: null };
        case 'endSession': {
          const ses = s.session;
          if (!ses || ses.summary || ses.empty) return { modal: null };
          clearTimeout(advTimer.current);
          interruptAutoRead();
          cancelSpeech();
          // The on-screen card follows the same end-state rules: its partial
          // progress is discarded, only its wrong-tap count is kept.
          const at = ses.attempt;
          const history = at
            ? ses.history.concat([{ cardId: at.cardId, status: at.done ? ('completed' as const) : ('skipped' as const), mistakes: at.mistakes }])
            : ses.history;
          return { modal: null, session: { ...ses, history, summary: true, attempt: null, review: null, endedEarly: true } };
        }
        default:
          return { modal: null };
      }
    });
  }
  function moveDeckToFolder(deckId: ID, folderId: ID | null) {
    update((s) => ({ decks: s.decks.map((d) => (d.id === deckId ? { ...d, folderId } : d)), sheet: null }));
  }
  function setMastered(cardId: ID, on: boolean) {
    update((s) => ({
      cards: s.cards.map((c) => (c.id === cardId ? { ...c, streak: on ? MASTERY_THRESHOLD : 0, masteredAt: on ? Date.now() : null } : c)),
      sheet: null,
    }));
  }

  // ---------------- card editor ----------------
  function openEditor(deckId: ID, cardId: ID | null) {
    update((s) => {
      const c = cardId ? s.cards.find((x) => x.id === cardId) : null;
      return {
        screen: 'editor',
        deckId,
        sheet: null,
        ed: { cardId: cardId ?? null, deckId, sentence: c?.sentence ?? '', translation: c?.translation ?? '', transliteration: c?.transliteration ?? '' },
      };
    });
  }
  function editField(field: 'sentence' | 'translation' | 'transliteration', value: string) {
    update((s) => (s.ed ? { ed: { ...s.ed, [field]: value } } : null));
  }
  function editorBack() {
    update({ screen: 'deck', ed: null });
  }
  function saveCard() {
    update((s) => {
      const ed = s.ed;
      if (!ed) return null;
      const sentence = ed.sentence.trim();
      if (!sentence) return null;
      const now = Date.now();
      if (ed.cardId) {
        return {
          cards: s.cards.map((c) => {
            if (c.id !== ed.cardId) return c;
            const changed = sentence !== c.sentence;
            return {
              ...c,
              sentence,
              translation: ed.translation.trim(),
              transliteration: ed.transliteration.trim(),
              updatedAt: now,
              streak: changed ? 0 : c.streak,
              masteredAt: changed ? null : c.masteredAt,
            };
          }),
          screen: 'deck',
          ed: null,
        };
      }
      const card: Card = {
        id: uuid(),
        deckId: ed.deckId,
        sentence,
        translation: ed.translation.trim(),
        transliteration: ed.transliteration.trim(),
        streak: 0,
        masteredAt: null,
        createdAt: now,
        updatedAt: now,
      };
      return { cards: s.cards.concat([card]), screen: 'deck', ed: null };
    });
  }

  // ---------------- bulk add ----------------
  function openBulk(deckId: ID) {
    update({ screen: 'bulk', bulk: { deckId, text: '', preview: null } });
  }
  function bulkTextChange(text: string) {
    update((s) => (s.bulk ? { bulk: { ...s.bulk, text, preview: null } } : null));
  }
  function bulkPreview() {
    update((s) => (s.bulk ? { bulk: { ...s.bulk, preview: parseBulk(s.bulk.text) } } : null));
  }
  function bulkBack() {
    update({ screen: 'deck', bulk: null });
  }
  function bulkImport() {
    update((s) => {
      const b = s.bulk;
      if (!b || !b.preview || !b.preview.valid.length) return null;
      const now = Date.now();
      const rows: Card[] = b.preview.valid.map((v, i) => ({
        id: uuid(),
        deckId: b.deckId,
        sentence: v.sentence,
        translation: v.translation,
        transliteration: v.transliteration,
        streak: 0,
        masteredAt: null,
        createdAt: now + i,
        updatedAt: now + i,
      }));
      const n = rows.length;
      return { cards: s.cards.concat(rows), screen: 'deck', bulk: null, toast: `Added ${n} ${n === 1 ? 'card' : 'cards'}` };
    });
  }

  // ---------------- practice settings ----------------
  function toggleTts() {
    update((s) => ({ settings: { ...s.settings, ttsEnabled: !s.settings.ttsEnabled } }));
  }
  function setTtsLang(lang: string) {
    update((s) => ({ settings: { ...s.settings, ttsLang: lang } }));
  }
  function toggleAutoRead() {
    update((s) => ({ settings: { ...s.settings, autoReadOnComplete: !s.settings.autoReadOnComplete } }));
  }
  function toggleHideTransliteration() {
    update((s) => ({ settings: { ...s.settings, hideTransliteration: !s.settings.hideTransliteration } }));
  }
  function toggleRevealBlocks() {
    update((s) => {
      const on = !s.settings.revealBlocksOnTap;
      let session = s.session;
      // OFF reveals immediately; ON only affects cards built from now on.
      if (!on && session) {
        const attempt = session.attempt?.covered ? { ...session.attempt, covered: false } : session.attempt;
        const review = session.review?.attempt.covered
          ? { ...session.review, attempt: { ...session.review.attempt, covered: false } }
          : session.review;
        session = { ...session, attempt, review };
      }
      return { settings: { ...s.settings, revealBlocksOnTap: on }, session };
    });
  }
  function revealBlocks() {
    update((s) => {
      const ses = s.session;
      if (!ses) return null;
      if (ses.review) {
        if (!ses.review.attempt.covered) return null;
        return { session: { ...ses, review: { ...ses.review, attempt: { ...ses.review.attempt, covered: false } } } };
      }
      if (!ses.attempt?.covered) return null;
      return { session: { ...ses, attempt: { ...ses.attempt, covered: false } } };
    });
  }
  function speakBlock(text: string) {
    const langCode = state.settings.ttsLang;
    const voices = voicesRef.current.length ? voicesRef.current : getVoices();
    const result = ttsSpeak(text, langCode, voices);
    const warning = speakWarning(result, langCode);
    if (warning) warnOnce(warning.key, warning.msg);
  }

  // ---------------- auto-read on completion (Feature A) ----------------
  function interruptAutoRead() {
    if (!autoReadActive.current) return;
    autoReadActive.current = false;
    autoReadSeq.current++;
    cancelSpeech();
  }
  /**
   * Runs the post-completion pause: plain AUTO_ADVANCE_MS delay, or — when
   * auto-read is on and a voice exists — speak the sentence and proceed on
   * end/error + AUTO_READ_TAIL_MS, hard-capped at AUTO_READ_CAP_MS so a
   * missing onend (Android Chrome) can never hang the session.
   */
  function scheduleCompletionAdvance(settings: Settings, sentence: string, inReview: boolean) {
    const proceed = inReview ? reviewReturn : () => advance(false);
    clearTimeout(advTimer.current);
    if (!settings.autoReadOnComplete) {
      advTimer.current = setTimeout(proceed, AUTO_ADVANCE_MS);
      return;
    }
    const seq = ++autoReadSeq.current;
    const voices = voicesRef.current.length ? voicesRef.current : getVoices();
    const result = ttsSpeak(sentence, settings.ttsLang, voices, () => {
      if (autoReadSeq.current !== seq || !autoReadActive.current) return;
      autoReadActive.current = false;
      clearTimeout(advTimer.current);
      advTimer.current = setTimeout(proceed, AUTO_READ_TAIL_MS);
    });
    const warning = speakWarning(result, settings.ttsLang);
    if (warning) warnOnce(warning.key, warning.msg);
    if (!result.available || !result.matchedVoice) {
      advTimer.current = setTimeout(proceed, AUTO_ADVANCE_MS);
      return;
    }
    autoReadActive.current = true;
    advTimer.current = setTimeout(() => {
      autoReadActive.current = false;
      autoReadSeq.current++;
      cancelSpeech();
      proceed();
    }, AUTO_READ_CAP_MS);
  }

  // ---------------- practice session ----------------
  function startSession(deckId: ID, forceAll: boolean) {
    clearTimeout(advTimer.current);
    update((s) => {
      const deck = s.decks.find((d) => d.id === deckId);
      if (!deck) return null;
      const all = s.cards.filter((c) => c.deckId === deckId);
      if (!all.length) return null;
      const pool = deck.practiceRemainingOnly && !forceAll ? all.filter((c) => c.masteredAt == null) : all;
      if (!pool.length) {
        return {
          screen: 'practice',
          deckId,
          sheet: null,
          modal: null,
          session: { deckId, empty: true, summary: false, queue: [], index: 0, completed: 0, newly: 0, attempt: null, history: [], review: null, endedEarly: false },
        };
      }
      const queue = shuffle(pool.map((c) => c.id));
      const first = s.cards.find((c) => c.id === queue[0]);
      if (!first) return null;
      return {
        screen: 'practice',
        deckId,
        sheet: null,
        modal: null,
        session: {
          deckId,
          empty: false,
          summary: false,
          queue,
          index: 0,
          completed: 0,
          newly: 0,
          attempt: buildAttempt(first, s.settings.revealBlocksOnTap),
          history: [],
          review: null,
          endedEarly: false,
        },
      };
    });
  }
  function resetAndRestart(deckId: ID) {
    update((s) => ({ cards: s.cards.map((c) => (c.deckId === deckId ? { ...c, streak: 0, masteredAt: null } : c)) }));
    startSession(deckId, false);
  }
  function advance(force: boolean) {
    clearTimeout(advTimer.current);
    interruptAutoRead();
    update((s) => {
      const ses = s.session;
      if (!ses || ses.summary || ses.empty || ses.review) return null;
      if (!force && ses.attempt && !ses.attempt.done) return null;
      const at = ses.attempt;
      const history = at
        ? ses.history.concat([{ cardId: at.cardId, status: at.done ? ('completed' as const) : ('skipped' as const), mistakes: at.mistakes }])
        : ses.history;
      const next = ses.index + 1;
      if (next >= ses.queue.length) {
        return { session: { ...ses, history, summary: true, attempt: null } };
      }
      const card = s.cards.find((c) => c.id === ses.queue[next]);
      if (!card) {
        return { session: { ...ses, history, summary: true, attempt: null } };
      }
      return { session: { ...ses, history, index: next, attempt: buildAttempt(card, s.settings.revealBlocksOnTap) } };
    });
  }

  // ---------------- review mode (Feature F) ----------------
  function openReviewAt(s: State, pos: number): Patch {
    const ses = s.session;
    if (!ses || pos < 0 || pos >= ses.history.length) return null;
    const entry = ses.history[pos];
    const card = s.cards.find((c) => c.id === entry.cardId);
    if (!card) return null;
    // Entering an entry always builds fresh — partial review attempts are discarded.
    const attempt = entry.status === 'completed' ? buildCompletedDisplay(card) : buildAttempt(card, s.settings.revealBlocksOnTap);
    return { session: { ...ses, review: { pos, attempt } } };
  }
  function reviewBack() {
    update((s) => {
      const ses = s.session;
      if (!ses || !ses.history.length || inCompletionTransition(ses)) return null;
      const pos = ses.review ? ses.review.pos - 1 : ses.history.length - 1;
      return openReviewAt(s, pos);
    });
  }
  function reviewForward() {
    update((s) => {
      const ses = s.session;
      if (!ses || !ses.review || inCompletionTransition(ses)) return null;
      if (ses.review.pos >= ses.history.length - 1) {
        return { session: { ...ses, review: null } };
      }
      return openReviewAt(s, ses.review.pos + 1);
    });
  }
  /** "Current" / Next-in-review: jump straight back to the live card (or summary). */
  function reviewReturn() {
    clearTimeout(advTimer.current);
    interruptAutoRead();
    update((s) => (s.session?.review ? { session: { ...s.session, review: null } } : null));
  }
  /** "End session" button: confirm dialog before submitting for the scorecard. */
  function openEndSession() {
    update((s) => {
      const ses = s.session;
      if (!ses || ses.summary || ses.empty) return null;
      const remaining = ses.queue.length - ses.completed;
      return {
        modal: {
          kind: 'endSession' as const,
          id: null,
          title: 'End session?',
          msg: `${remaining} of ${ses.queue.length} cards not yet completed.`,
          confirmLabel: 'End & view results',
          cancelLabel: 'Keep practicing',
          input: false,
          danger: false,
        },
      };
    });
  }

  /** Summary's "Review skipped (N)": opens review at the earliest skipped entry. */
  function reviewSkipped() {
    update((s) => {
      const ses = s.session;
      if (!ses) return null;
      const pos = ses.history.findIndex((e) => e.status === 'skipped');
      if (pos < 0) return null;
      return openReviewAt(s, pos);
    });
  }
  /** Writes the active attempt back into the session, whichever mode owns it. */
  function withAttempt(ses: Session, attempt: Attempt): Session {
    if (ses.review) return { ...ses, review: { ...ses.review, attempt } };
    return { ...ses, attempt };
  }
  function tapBlock(k: string) {
    update((s) => {
      const ses = s.session;
      if (!ses) return null;
      const review = ses.review;
      const at = review ? review.attempt : ses.attempt;
      if (!at || at.done || at.covered) return null;
      const block = at.pool.find((x) => x.k === k && !x.gone);
      if (!block) return null;
      const expected = at.tokens[at.placed];
      if (block.text === expected) {
        const placed = at.placed + 1;
        const isComplete = placed === at.tokens.length;
        const pool = at.pool.map((x) => (x.k === k ? { ...x, gone: true, shake: false } : x));
        if (isComplete) {
          const card = s.cards.find((c) => c.id === at.cardId);
          const completion = computeCompletion(card, at.mistakes);
          const attempt: Attempt = { ...at, placed, pool, done: true, doneInfo: completion };
          scheduleCompletionAdvance(s.settings, card ? card.sentence : at.tokens.join(' '), !!review);
          const cards = card
            ? s.cards.map((c) => (c.id === card.id ? { ...c, streak: completion.streak, masteredAt: completion.masteredAt } : c))
            : s.cards;
          const counted = {
            completed: ses.completed + 1,
            newly: ses.newly + (completion.newly ? 1 : 0),
          };
          if (review) {
            return {
              cards,
              session: {
                ...ses,
                ...counted,
                review: { ...review, attempt },
                history: ses.history.map((e, i) =>
                  i === review.pos ? { ...e, status: 'completed' as const, mistakes: e.mistakes + at.mistakes } : e,
                ),
              },
            };
          }
          return { cards, session: { ...ses, ...counted, attempt } };
        }
        return { session: withAttempt(ses, { ...at, placed, pool }) };
      }
      if (navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore — vibration is a nicety, not a requirement
        }
      }
      clearTimeout(shakeTimers.current[k]);
      shakeTimers.current[k] = setTimeout(() => {
        update((s2) => {
          const ses2 = s2.session;
          if (!ses2) return null;
          const at2 = ses2.review ? ses2.review.attempt : ses2.attempt;
          if (!at2) return null;
          return { session: withAttempt(ses2, { ...at2, pool: at2.pool.map((x) => (x.k === k ? { ...x, shake: false } : x)) }) };
        });
      }, 430);
      return {
        session: withAttempt(ses, { ...at, mistakes: at.mistakes + 1, pool: at.pool.map((x) => (x.k === k ? { ...x, shake: true } : x)) }),
      };
    });
  }
  function exitPractice() {
    clearTimeout(advTimer.current);
    interruptAutoRead();
    cancelSpeech();
    update({ screen: 'home', session: null });
  }

  return {
    state,
    actions: {
      toggleFolderCollapse,
      toggleRemainingOnly,
      openDeck,
      backHome,
      openSheet,
      closeSheet,
      openInputModal,
      openConfirmModal,
      modalTextChange,
      closeModal,
      modalConfirm,
      moveDeckToFolder,
      setMastered,
      openEditor,
      editField,
      editorBack,
      saveCard,
      openBulk,
      bulkTextChange,
      bulkPreview,
      bulkBack,
      bulkImport,
      toggleTts,
      setTtsLang,
      toggleAutoRead,
      toggleHideTransliteration,
      toggleRevealBlocks,
      revealBlocks,
      speakBlock,
      startSession,
      resetAndRestart,
      advance,
      tapBlock,
      openEndSession,
      reviewBack,
      reviewForward,
      reviewReturn,
      reviewSkipped,
      exitPractice,
    },
  };
}

export type Actions = ReturnType<typeof useSentenceBuilder>['actions'];
