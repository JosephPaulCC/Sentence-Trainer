import type { EditorDraft, Actions } from '../store';
import { BackIcon } from '../components/Icons';

interface CardEditorProps {
  ed: EditorDraft;
  actions: Actions;
}

export function CardEditor({ ed, actions }: CardEditorProps) {
  const saveDisabled = !ed.sentence.trim();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-[6px] py-[10px] pr-[14px] pl-[10px]">
        <button
          onClick={actions.editorBack}
          aria-label="Back"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-ink active:bg-[#E7EAF3]"
        >
          <BackIcon />
        </button>
        <div className="font-display min-w-0 flex-1 text-[17px] leading-[1.2] font-bold text-ink">
          {ed.cardId ? 'Edit card' : 'New card'}
        </div>
        <button
          onClick={actions.saveCard}
          disabled={saveDisabled}
          className="font-display flex min-h-11 flex-none cursor-pointer items-center justify-center rounded-xl border-none bg-indigo px-[22px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
          style={{ opacity: saveDisabled ? 0.45 : 1 }}
        >
          Save
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-[18px] pt-3 pb-[30px]">
        <label className="block">
          <span className="font-display text-[11.5px] leading-none font-bold tracking-[.08em] text-muted uppercase">Sentence</span>
          <textarea
            dir="auto"
            rows={3}
            value={ed.sentence}
            onChange={(e) => actions.editField('sentence', e.target.value)}
            placeholder="मैं स्कूल जाता हूँ"
            className="font-content mt-2 min-h-[86px] w-full resize-y rounded-2xl bg-white px-[14px] py-3 text-[17px] leading-[1.65] font-medium text-ink focus:border-[#3A4A9F]"
            style={{ border: '1.5px solid #D5DBEA' }}
          />
        </label>
        <label className="block">
          <span className="font-display text-[11.5px] leading-none font-bold tracking-[.08em] text-muted uppercase">
            Translation <span className="text-[#A9B1C7] font-semibold tracking-normal normal-case">· optional</span>
          </span>
          <input
            dir="auto"
            value={ed.translation}
            onChange={(e) => actions.editField('translation', e.target.value)}
            placeholder="I go to school"
            className="font-content mt-2 h-[50px] w-full rounded-2xl bg-white px-[14px] text-[15.5px] leading-[1.4] font-medium text-ink focus:border-[#3A4A9F]"
            style={{ border: '1.5px solid #D5DBEA' }}
          />
        </label>
        <label className="block">
          <span className="font-display text-[11.5px] leading-none font-bold tracking-[.08em] text-muted uppercase">
            Transliteration <span className="text-[#A9B1C7] font-semibold tracking-normal normal-case">· optional</span>
          </span>
          <input
            dir="auto"
            value={ed.transliteration}
            onChange={(e) => actions.editField('transliteration', e.target.value)}
            placeholder="main school jaata hoon"
            className="font-content mt-2 h-[50px] w-full rounded-2xl bg-white px-[14px] text-[15.5px] leading-[1.4] font-medium text-ink focus:border-[#3A4A9F]"
            style={{ border: '1.5px solid #D5DBEA' }}
          />
        </label>
      </div>
    </div>
  );
}
