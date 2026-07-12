import type { Settings } from '../types';
import type { Actions } from '../store';
import { LANGUAGES } from '../tts';
import { Switch } from './Switch';

interface PracticeSettingsSheetProps {
  open: boolean;
  settings: Settings;
  actions: Actions;
  onClose: () => void;
}

interface RowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Row({ label, hint, children }: RowProps) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 px-3">
      <span className="min-w-0 flex-1">
        <span className="font-display block text-[15px] leading-[1.3] font-semibold text-ink">{label}</span>
        {hint && <span className="font-display mt-0.5 block text-xs leading-[1.35] font-medium text-muted">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

/** Bottom sheet holding all five practice settings (opened from the header gear). */
export function PracticeSettingsSheet({ open, settings, actions, onClose }: PracticeSettingsSheetProps) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        onClick={onClose}
        aria-label="Close practice settings"
        className="absolute inset-0 cursor-pointer border-none p-0"
        style={{ background: 'var(--color-overlay)', animation: 'sbFade .2s ease' }}
      />
      <div
        className="relative max-h-[80%] overflow-y-auto rounded-t-[20px] bg-white px-[10px] pt-2 pb-[18px]"
        style={{ animation: 'sbRise .27s cubic-bezier(.3,1.1,.5,1)', boxShadow: '0 -10px 34px rgba(22,30,54,.2)' }}
      >
        <div className="mx-auto mt-1 mb-2 h-1 w-9 rounded-full" style={{ background: '#E3E7F0' }} />
        <div className="font-display px-3 pt-1 pb-2 text-[13px] leading-[1.35] font-bold text-muted">Practice settings</div>

        <Row label="Word speakers" hint="Speaker button on every word block">
          <Switch checked={settings.ttsEnabled} onChange={actions.toggleTts} label="Word speakers" />
        </Row>
        <Row label="Speech language">
          <select
            aria-label="Speech language"
            value={settings.ttsLang}
            onChange={(e) => actions.setTtsLang(e.target.value)}
            className="font-display h-[38px] max-w-[170px] flex-none cursor-pointer rounded-[11px] bg-white px-2 text-[12.5px] font-semibold text-ink"
            style={{ border: '1.5px solid #D5DBEA' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Auto-read sentence" hint="Read the sentence aloud when a card is completed">
          <Switch checked={settings.autoReadOnComplete} onChange={actions.toggleAutoRead} label="Auto-read sentence" />
        </Row>
        <Row label="Hide transliteration" hint="Practice from the translation alone">
          <Switch checked={settings.hideTransliteration} onChange={actions.toggleHideTransliteration} label="Hide transliteration" />
        </Row>
        <Row label="Tap to reveal words" hint="Recall the sentence before the blocks appear">
          <Switch checked={settings.revealBlocksOnTap} onChange={actions.toggleRevealBlocks} label="Tap to reveal words" />
        </Row>

        <div className="px-3 pt-3">
          <button
            onClick={onClose}
            className="font-display flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[13px] bg-white px-5 text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
            style={{ border: '1.5px solid #D5DBEA' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
