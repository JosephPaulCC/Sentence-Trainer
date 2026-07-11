import type { BulkDraft, Actions } from '../store';
import { BackIcon, CheckIcon, ErrorIcon } from '../components/Icons';

interface BulkAddProps {
  bulk: BulkDraft;
  deckName: string;
  actions: Actions;
}

export function BulkAdd({ bulk, deckName, actions }: BulkAddProps) {
  const preview = bulk.preview;
  const valid = preview?.valid ?? [];
  const errors = preview?.errors ?? [];
  const previewDisabled = !bulk.text.trim();
  const importDisabled = !preview || valid.length === 0;
  const importLabel = preview ? `Import ${valid.length} ${valid.length === 1 ? 'card' : 'cards'}` : 'Import';
  const nothingToImport = !!preview && valid.length === 0 && errors.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-[6px] py-[10px] pr-[14px] pl-[10px]">
        <button
          onClick={actions.bulkBack}
          aria-label="Back"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-ink active:bg-[#E7EAF3]"
        >
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[17px] leading-[1.2] font-bold text-ink">Bulk add</div>
          <div className="font-display mt-px truncate text-xs leading-[1.3] font-medium text-muted">{deckName}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] pt-[10px] pb-[30px]">
        <div className="rounded-2xl border border-[#E3E7F0] bg-white px-4 py-[14px]">
          <div className="font-display text-[11.5px] leading-none font-bold tracking-[.08em] text-muted uppercase">Format</div>
          <div className="font-display mt-[10px] flex flex-col gap-[7px] text-[13.5px] leading-[1.5] font-medium text-[#3E4763]">
            <div className="flex items-baseline gap-2">
              <span
                className="flex-none rounded-[6px] px-[7px] py-[2px] font-mono text-xs leading-[1.4] font-bold whitespace-pre text-indigo"
                style={{ background: '#EDF0FA', border: '1px solid #D8DEF2' }}
              >
                §
              </span>
              <span>starts a new card</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="flex-none rounded-[6px] px-[7px] py-[2px] font-mono text-xs leading-[1.4] font-bold whitespace-pre text-indigo"
                style={{ background: '#EDF0FA', border: '1px solid #D8DEF2' }}
              >
                {'{ }'}
              </span>
              <span>wraps the translation</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="flex-none rounded-[6px] px-[7px] py-[2px] font-mono text-xs leading-[1.4] font-bold whitespace-pre text-indigo"
                style={{ background: '#EDF0FA', border: '1px solid #D8DEF2' }}
              >
                {'[ ]'}
              </span>
              <span>wraps the transliteration</span>
            </div>
            <div className="text-muted">Everything else in the segment is the sentence.</div>
          </div>
          <div
            dir="ltr"
            className="font-content mt-[11px] rounded-[11px] px-3 py-[10px] text-[13px] leading-[1.75] font-medium break-words text-[#3E4763]"
            style={{ background: '#F1F3F7' }}
          >
            मैं स्कूल जाता हूँ {'{I go to school}'} [main school jaata hoon] § دروازہ کھولو {'{Open the door}'} [darwaza kholo] § This one has no translation
          </div>
        </div>

        <textarea
          dir="auto"
          value={bulk.text}
          onChange={(e) => actions.bulkTextChange(e.target.value)}
          placeholder="Sentence {translation} [transliteration] § next sentence …"
          className="font-content min-h-[150px] w-full resize-y rounded-2xl bg-white px-[14px] py-[13px] text-[15px] leading-[1.75] font-medium text-ink focus:border-[#3A4A9F]"
          style={{ border: '1.5px solid #D5DBEA' }}
        />

        <div className="flex gap-[10px]">
          <button
            onClick={actions.bulkPreview}
            disabled={previewDisabled}
            className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-[13px] bg-white px-[14px] text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
            style={{ border: '1.5px solid #D5DBEA', opacity: previewDisabled ? 0.45 : 1 }}
          >
            Preview
          </button>
          <button
            onClick={actions.bulkImport}
            disabled={importDisabled}
            className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-[13px] border-none bg-indigo px-[14px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
            style={{ opacity: importDisabled ? 0.45 : 1 }}
          >
            {importLabel}
          </button>
        </div>

        {preview && (
          <>
            {valid.length > 0 && (
              <>
                <div className="font-display mt-2 mb-0 px-[2px] text-[11.5px] leading-none font-bold tracking-[.08em] uppercase" style={{ color: '#1F7A55' }}>
                  Ready to import · {valid.length}
                </div>
                {valid.map((v, i) => (
                  <div
                    key={i}
                    className="flex gap-[10px] rounded-[14px] bg-white px-[14px] py-[11px]"
                    style={{ border: '1px solid #DCEDE3' }}
                  >
                    <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full" style={{ background: '#DCF2E5' }}>
                      <CheckIcon size={11} color="#1F7A55" />
                    </span>
                    <span className="block min-w-0 flex-1">
                      <span dir="auto" className="font-content block text-[15px] leading-[1.55] font-medium break-words text-ink">
                        {v.sentence}
                      </span>
                      {v.translation !== '' && (
                        <span dir="auto" className="font-display mt-0.5 block text-[12.5px] leading-[1.5] font-medium text-muted">
                          {v.translation}
                        </span>
                      )}
                      {v.transliteration !== '' && (
                        <span dir="auto" className="font-content mt-px block text-[12.5px] leading-[1.5] font-medium text-muted-2 italic">
                          {v.transliteration}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </>
            )}
            {errors.length > 0 && (
              <>
                <div className="font-display mt-2 mb-0 px-[2px] text-[11.5px] leading-none font-bold tracking-[.08em] uppercase" style={{ color: '#C4423C' }}>
                  Problems · {errors.length}
                </div>
                {errors.map((e, i) => (
                  <div key={i} className="flex gap-[10px] rounded-[14px] bg-white px-[14px] py-[11px]" style={{ border: '1px solid #F2D7D5' }}>
                    <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full" style={{ background: '#FAE3E1' }}>
                      <ErrorIcon size={12} color="#C4423C" />
                    </span>
                    <span className="block min-w-0 flex-1">
                      <span dir="auto" className="font-content block truncate text-[13.5px] leading-[1.5] font-medium text-muted">
                        {e.raw}
                      </span>
                      <span className="font-display mt-0.5 block text-[12.5px] leading-[1.4] font-semibold" style={{ color: '#C4423C' }}>
                        {e.reason}
                      </span>
                    </span>
                  </div>
                ))}
              </>
            )}
            {nothingToImport && (
              <div className="font-display p-4 text-center text-[13px] leading-[1.5] font-medium text-muted">
                Nothing to import yet — type some sentences above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
