import type { Folder, Deck, Card } from '../types';
import type { Actions } from '../store';
import { deckCardsOf, countLine } from '../selectors';
import { PlusIcon, FolderPlusIcon, ChevronIcon, KebabIcon, PlayIcon } from '../components/Icons';
import { Switch } from '../components/Switch';

interface HomeProps {
  folders: Folder[];
  decks: Deck[];
  cards: Card[];
  collapsed: Record<string, boolean>;
  actions: Actions;
}

function DeckRow({ deck, cards, actions }: { deck: Deck; cards: Card[]; actions: Actions }) {
  const empty = deckCardsOf(cards, deck.id).length === 0;
  return (
    <div className="rounded-2xl border border-[#E3E7F0] bg-white px-2 pt-[13px] pb-3 pl-4" style={{ boxShadow: '0 1px 2px rgba(30,42,68,.04)' }}>
      <div className="flex items-start gap-1">
        <button
          onClick={() => actions.openDeck(deck.id)}
          className="block min-h-[44px] min-w-0 flex-1 rounded-[10px] border-none bg-transparent py-0 pt-[3px] pr-1 pb-0 pl-0 text-start text-ink cursor-pointer"
        >
          <span className="font-display block truncate text-[16.5px] leading-[1.25] font-semibold">{deck.name}</span>
          <span className="font-display mt-[3px] block text-[12.5px] leading-[1.4] font-medium text-muted">{countLine(cards, deck.id)}</span>
        </button>
        <button
          onClick={() => actions.openSheet('deckMenu', deck.id)}
          aria-label="Deck menu"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-muted active:bg-[#E7EAF3]"
        >
          <KebabIcon size={18} />
        </button>
      </div>
      <div className="mt-[9px] flex items-center gap-2 pr-2">
        <button
          onClick={() => actions.startSession(deck.id, false)}
          disabled={empty}
          className="flex min-h-[44px] flex-none cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-indigo px-[18px] font-display text-sm font-semibold text-white active:translate-y-px"
          style={{ opacity: empty ? 0.45 : 1 }}
        >
          <PlayIcon size={12} />
          Practice
        </button>
        <span className="flex-1" />
        <span className="font-display flex-none text-[12.5px] leading-[1.2] font-medium text-muted">Remaining only</span>
        <Switch checked={deck.practiceRemainingOnly} onChange={() => actions.toggleRemainingOnly(deck.id)} label="Practice remaining cards only" />
      </div>
    </div>
  );
}

export function Home({ folders, decks, cards, collapsed, actions }: HomeProps) {
  const ungrouped = decks.filter((d) => d.folderId == null);
  const noDecks = decks.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-[11px] px-[18px] pt-5">
        <div
          className="font-display flex h-[37px] w-[37px] flex-none items-center justify-center rounded-[11px] bg-white text-[17px] font-semibold text-indigo"
          style={{ border: '1.5px solid #D5DBEA', borderBottom: '4px solid #3A4A9F' }}
        >
          S
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[19px] leading-[1.15] font-bold tracking-[-0.01em] text-ink">Sentence Trainer</div>
          <div className="font-display mt-px text-xs leading-[1.3] font-medium text-muted">Rebuild sentences word by word</div>
        </div>
      </div>

      <div className="flex gap-[10px] px-[18px] pt-[14px] pb-3">
        <button
          onClick={() => actions.openInputModal('newDeck', null, 'New deck', 'Deck name', '', 'Create')}
          className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-[13px] border-none bg-indigo px-[14px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
        >
          <PlusIcon size={14} color="#FFFFFF" />
          New deck
        </button>
        <button
          onClick={() => actions.openInputModal('newFolder', null, 'New folder', 'Folder name', '', 'Create')}
          className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-[13px] bg-white px-[14px] text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
          style={{ border: '1.5px solid #D5DBEA' }}
        >
          <FolderPlusIcon size={15} color="#2B3A7E" />
          New folder
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-[18px] pt-[2px] pb-9">
        {folders.map((f) => {
          const folderDecks = decks.filter((d) => d.folderId === f.id);
          const open = !collapsed[f.id];
          return (
            <div key={f.id} className="mt-[10px]">
              <div className="flex items-center gap-[2px]">
                <button
                  onClick={() => actions.toggleFolderCollapse(f.id)}
                  aria-expanded={open}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[10px] border-none bg-transparent px-[2px] text-start text-ink cursor-pointer"
                >
                  <ChevronIcon open={open} />
                  <span className="font-display truncate text-[15.5px] leading-[1.2] font-bold">{f.name}</span>
                  <span className="font-display flex-none text-[12.5px] font-semibold text-muted-2">{folderDecks.length}</span>
                </button>
                <button
                  onClick={() => actions.openSheet('folderMenu', f.id)}
                  aria-label="Folder menu"
                  className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-muted active:bg-[#E7EAF3]"
                >
                  <KebabIcon size={18} />
                </button>
              </div>
              {open && (
                <div className="flex flex-col gap-[10px] pt-[2px]">
                  {folderDecks.map((d) => (
                    <DeckRow key={d.id} deck={d} cards={cards} actions={actions} />
                  ))}
                  {folderDecks.length === 0 && (
                    <div className="font-display rounded-xl bg-[#EAEDF5] px-[13px] py-[11px] text-[13px] leading-[1.5] font-medium text-muted-2">
                      No decks here yet — use a deck's menu to move one in.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {ungrouped.length > 0 && (
          <div className="mt-3">
            <div className="flex min-h-[38px] items-center px-[2px]">
              <span className="font-display text-[11.5px] leading-none font-bold tracking-[.09em] text-muted-2 uppercase">Ungrouped</span>
            </div>
            <div className="flex flex-col gap-[10px]">
              {ungrouped.map((d) => (
                <DeckRow key={d.id} deck={d} cards={cards} actions={actions} />
              ))}
            </div>
          </div>
        )}

        {noDecks && (
          <div className="flex flex-1 flex-col items-center justify-center px-[10px] pt-10 pb-[50px] text-center">
            <div className="flex flex-wrap justify-center gap-[7px]">
              <span
                className="font-display inline-flex min-h-[42px] items-center rounded-xl bg-white px-[13px] py-2 text-[15px] font-semibold text-ink"
                style={{ border: '1.5px solid #D5DBEA', borderBottom: '4px solid #C2CBE2' }}
              >
                Add
              </span>
              <span
                className="font-display inline-flex min-h-[42px] items-center rounded-xl bg-white px-[13px] py-2 text-[15px] font-semibold text-ink"
                style={{ border: '1.5px solid #D5DBEA', borderBottom: '4px solid #C2CBE2' }}
              >
                your
              </span>
              <span
                className="font-display inline-flex min-h-[42px] items-center rounded-xl bg-indigo px-[13px] py-2 text-[15px] font-semibold text-white"
                style={{ border: '1.5px solid #33418F', borderBottom: '4px solid #28346F' }}
              >
                first deck
              </span>
            </div>
            <div className="font-display mt-[18px] max-w-[260px] text-[13.5px] leading-[1.6] font-medium text-muted">
              Store sentences in decks, then rebuild them word by word — like a puzzle.
            </div>
            <button
              onClick={() => actions.openInputModal('newDeck', null, 'New deck', 'Deck name', '', 'Create')}
              className="font-display mt-[18px] flex min-h-[46px] cursor-pointer items-center justify-center gap-[7px] rounded-[13px] border-none bg-indigo px-[22px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
            >
              <PlusIcon size={14} color="#FFFFFF" />
              New deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
