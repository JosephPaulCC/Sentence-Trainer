import { useSentenceBuilder, type State, type Actions } from './store';
import type { SheetItem } from './components/ActionSheet';
import { Home } from './screens/Home';
import { Deck } from './screens/Deck';
import { CardEditor } from './screens/CardEditor';
import { BulkAdd } from './screens/BulkAdd';
import { Practice } from './screens/Practice';
import { ActionSheet } from './components/ActionSheet';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';

function quote(x: string) {
  return `“${x}”`;
}

function buildSheet(state: State, actions: Actions): { title: string; items: SheetItem[] } | null {
  const sheet = state.sheet;
  if (!sheet) return null;

  if (sheet.kind === 'deckMenu') {
    const d = state.decks.find((x) => x.id === sheet.id);
    if (!d) return null;
    const n = state.cards.filter((c) => c.deckId === d.id).length;
    return {
      title: d.name,
      items: [
        { key: 'rename', label: 'Rename', onTap: () => actions.openInputModal('renameDeck', d.id, 'Rename deck', 'Deck name', d.name, 'Save') },
        { key: 'move', label: 'Move to folder…', onTap: () => actions.openSheet('moveDeck', d.id) },
        {
          key: 'reset',
          label: 'Reset progress',
          onTap: () =>
            actions.openConfirmModal(
              'resetDeck',
              d.id,
              'Reset progress?',
              `Every card in ${quote(d.name)} goes back to streak 0 and not mastered.`,
              'Reset',
              false,
            ),
        },
        {
          key: 'delete',
          label: 'Delete deck',
          danger: true,
          onTap: () =>
            actions.openConfirmModal(
              'deleteDeck',
              d.id,
              'Delete deck?',
              `${quote(d.name)} and its ${n} ${n === 1 ? 'card' : 'cards'} will be deleted. This can’t be undone.`,
              'Delete',
              true,
            ),
        },
      ],
    };
  }

  if (sheet.kind === 'folderMenu') {
    const f = state.folders.find((x) => x.id === sheet.id);
    if (!f) return null;
    return {
      title: f.name,
      items: [
        { key: 'rename', label: 'Rename', onTap: () => actions.openInputModal('renameFolder', f.id, 'Rename folder', 'Folder name', f.name, 'Save') },
        {
          key: 'delete',
          label: 'Delete folder',
          danger: true,
          onTap: () =>
            actions.openConfirmModal(
              'deleteFolder',
              f.id,
              'Delete folder?',
              `${quote(f.name)} will be removed. Its decks move to Ungrouped — no decks or cards are deleted.`,
              'Delete',
              true,
            ),
        },
      ],
    };
  }

  if (sheet.kind === 'cardMenu') {
    const c = state.cards.find((x) => x.id === sheet.id);
    if (!c) return null;
    return {
      title: c.sentence,
      items: [
        c.masteredAt != null
          ? { key: 'unmaster', label: 'Mark as not mastered', onTap: () => actions.setMastered(c.id, false) }
          : { key: 'master', label: 'Mark as mastered', onTap: () => actions.setMastered(c.id, true) },
        {
          key: 'delete',
          label: 'Delete card',
          danger: true,
          onTap: () => actions.openConfirmModal('deleteCard', c.id, 'Delete card?', 'This can’t be undone.', 'Delete', true),
        },
      ],
    };
  }

  if (sheet.kind === 'moveDeck') {
    const d = state.decks.find((x) => x.id === sheet.id);
    if (!d) return null;
    const items: SheetItem[] = [
      { key: 'ungrouped', label: 'Ungrouped', check: d.folderId == null, onTap: () => actions.moveDeckToFolder(d.id, null) },
      ...state.folders.map((f) => ({ key: f.id, label: f.name, check: d.folderId === f.id, onTap: () => actions.moveDeckToFolder(d.id, f.id) })),
    ];
    return { title: `Move ${quote(d.name)} to`, items };
  }

  return null;
}

function App() {
  const { state, actions } = useSentenceBuilder();
  const sheetContent = buildSheet(state, actions);
  const deck = state.deckId ? state.decks.find((d) => d.id === state.deckId) : null;
  const modal = state.modal;

  return (
    <div
      className="font-display relative mx-auto flex h-[100dvh] max-w-[480px] flex-col overflow-hidden bg-surface text-ink"
      style={{ boxShadow: '0 0 0 1px rgba(30,42,68,.07)' }}
    >
      {state.screen === 'home' && (
        <Home folders={state.folders} decks={state.decks} cards={state.cards} collapsed={state.collapsed} actions={actions} />
      )}
      {state.screen === 'deck' && deck && <Deck deck={deck} cards={state.cards} actions={actions} />}
      {state.screen === 'editor' && state.ed && <CardEditor ed={state.ed} actions={actions} />}
      {state.screen === 'bulk' && state.bulk && (
        <BulkAdd bulk={state.bulk} deckName={state.decks.find((d) => d.id === state.bulk!.deckId)?.name ?? ''} actions={actions} />
      )}
      {state.screen === 'practice' && state.session && (
        <Practice
          session={state.session}
          card={state.session.attempt ? (state.cards.find((c) => c.id === state.session!.attempt!.cardId) ?? null) : null}
          deckName={state.decks.find((d) => d.id === state.session!.deckId)?.name ?? ''}
          settings={state.settings}
          actions={actions}
        />
      )}

      <ActionSheet open={!!sheetContent} title={sheetContent?.title} items={sheetContent?.items ?? []} onClose={actions.closeSheet} />
      <Modal
        open={!!modal}
        title={modal?.title ?? ''}
        msg={modal?.msg}
        input={!!modal?.input}
        text={modal?.text}
        placeholder={modal?.placeholder}
        confirmLabel={modal?.confirmLabel ?? 'OK'}
        confirmDisabled={!!modal && modal.input && !(modal.text ?? '').trim()}
        danger={!!modal?.danger}
        onTextChange={actions.modalTextChange}
        onCancel={actions.closeModal}
        onConfirm={actions.modalConfirm}
      />
      <Toast message={state.toast} />
    </div>
  );
}

export default App;
