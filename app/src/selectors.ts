import type { Card, ID } from './types';

export function deckCardsOf(cards: Card[], deckId: ID): Card[] {
  return cards.filter((c) => c.deckId === deckId);
}

export function masteredCountOf(cards: Card[]): number {
  return cards.filter((c) => c.masteredAt != null).length;
}

export function countLine(cards: Card[], deckId: ID): string {
  const cs = deckCardsOf(cards, deckId);
  const m = masteredCountOf(cs);
  return `${cs.length} ${cs.length === 1 ? 'card' : 'cards'} · ${m} mastered`;
}
