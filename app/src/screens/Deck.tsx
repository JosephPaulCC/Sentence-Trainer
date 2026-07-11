import type { Deck as DeckType, Card } from '../types';
import type { Actions } from '../store';
import { deckCardsOf, countLine } from '../selectors';
import { BackIcon, PlusIcon, ListIcon, KebabIcon, CheckIcon } from '../components/Icons';

interface DeckProps {
  deck: DeckType;
  cards: Card[];
  actions: Actions;
}

export function Deck({ deck, cards, actions }: DeckProps) {
  const deckCards = deckCardsOf(cards, deck.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-[6px] px-[10px] pt-[10px] pb-1">
        <button
          onClick={actions.backHome}
          aria-label="Back"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-ink active:bg-[#E7EAF3]"
        >
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[17px] leading-[1.2] font-bold text-ink">{deck.name}</div>
          <div className="font-display mt-px text-xs leading-[1.3] font-medium text-muted">{countLine(cards, deck.id)}</div>
        </div>
      </div>

      <div className="flex gap-[10px] px-[18px] pt-2 pb-3">
        <button
          onClick={() => actions.openEditor(deck.id, null)}
          className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-[13px] border-none bg-indigo px-[14px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
        >
          <PlusIcon size={14} color="#FFFFFF" />
          Add card
        </button>
        <button
          onClick={() => actions.openBulk(deck.id)}
          className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-[13px] bg-white px-[14px] text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
          style={{ border: '1.5px solid #D5DBEA' }}
        >
          <ListIcon size={15} color="#2B3A7E" />
          Bulk add
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto px-[18px] pt-[2px] pb-9">
        {deckCards.map((c) => (
          <div key={c.id} className="flex items-stretch rounded-2xl border border-[#E3E7F0] bg-white" style={{ boxShadow: '0 1px 2px rgba(30,42,68,.04)' }}>
            <button
              onClick={() => actions.openEditor(deck.id, c.id)}
              className="flex min-w-0 flex-1 flex-col items-start gap-2 rounded-l-2xl border-none bg-transparent py-[13px] pr-[2px] pl-4 text-start text-ink cursor-pointer active:bg-[#F7F9FD]"
            >
              <span dir="auto" className="font-content line-clamp-2 w-full text-[16px] leading-[1.55] font-medium break-words">
                {c.sentence}
              </span>
              {c.masteredAt != null && (
                <span
                  className="font-display inline-flex items-center gap-[5px] rounded-full px-[9px] py-[5px] text-[11px] leading-none font-bold tracking-[.02em]"
                  style={{ background: '#FBF0DB', color: '#8A6210' }}
                >
                  <CheckIcon size={10} color="#B07A18" />
                  Mastered
                </span>
              )}
            </button>
            <button
              onClick={() => actions.openSheet('cardMenu', c.id)}
              aria-label="Card menu"
              className="flex min-h-[44px] w-11 flex-none cursor-pointer items-center justify-center self-center rounded-[13px] border-none bg-transparent p-0 text-muted active:bg-[#E7EAF3]"
            >
              <KebabIcon size={18} />
            </button>
          </div>
        ))}
        {deckCards.length === 0 && (
          <div className="font-display px-5 py-[46px] text-center text-[13.5px] leading-[1.65] font-medium text-muted">
            No cards yet.
            <br />
            Add one above, or paste many at once with Bulk add.
          </div>
        )}
      </div>
    </div>
  );
}
