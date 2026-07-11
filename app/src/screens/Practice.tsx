import type { Card, Settings } from '../types';
import type { Session, CompletionResult, Actions } from '../store';
import { MASTERY_THRESHOLD } from '../types';
import { LANGUAGES } from '../tts';
import { CloseIcon, SpeakerIcon } from '../components/Icons';
import { Switch } from '../components/Switch';
import { PlacedWord, PoolWord } from '../components/WordBlock';

interface PracticeProps {
  session: Session;
  card: Card | null;
  deckName: string;
  settings: Settings;
  actions: Actions;
}

function doneMessage(di: CompletionResult) {
  if (di.newly) {
    return {
      title: 'Mastered!',
      titleColor: '#8A6210',
      circle: '#FAEFD8',
      icon: '#B07A18',
      sub: MASTERY_THRESHOLD === 1 ? 'Mastered on a clean run.' : `That’s ${MASTERY_THRESHOLD} clean runs in a row.`,
    };
  }
  if (di.clean && di.mastered) {
    return { title: 'Correct!', titleColor: '#1F7A55', circle: '#DCF2E5', icon: '#1F7A55', sub: 'Clean run.' };
  }
  if (di.clean) {
    return {
      title: 'Correct!',
      titleColor: '#1F7A55',
      circle: '#DCF2E5',
      icon: '#1F7A55',
      sub: `Clean run — streak ${di.streak} of ${MASTERY_THRESHOLD}.`,
    };
  }
  return {
    title: 'Completed',
    titleColor: '#46506B',
    circle: '#E7EAF3',
    icon: '#6B7590',
    sub: `${di.mistakes} ${di.mistakes === 1 ? 'mistake' : 'mistakes'} — streak reset.`,
  };
}

export function Practice({ session, card, deckName, settings, actions }: PracticeProps) {
  const isActive = !session.empty && !session.summary && !!session.attempt;
  const showSpeaker = settings.ttsEnabled;

  const barWidth = session.summary
    ? '100%'
    : session.attempt
      ? `${Math.round(((session.index + (session.attempt.done ? 1 : 0)) / session.queue.length) * 100)}%`
      : '0%';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-[6px] px-3 pt-2 pb-[6px] pl-[10px]">
        <button
          onClick={actions.exitPractice}
          aria-label="End session"
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] border-none bg-transparent p-0 text-ink active:bg-[#E7EAF3]"
        >
          <CloseIcon size={18} />
        </button>
        {isActive && (
          <span className="font-display flex-none text-[13.5px] leading-none font-bold tracking-[.02em] text-muted">
            {session.index + 1} / {session.queue.length}
          </span>
        )}
        <span className="flex-1" />
        <select
          aria-label="Speech language"
          value={settings.ttsLang}
          onChange={(e) => actions.setTtsLang(e.target.value)}
          className="font-display h-[38px] max-w-[110px] flex-none cursor-pointer rounded-[11px] bg-white px-2 text-[12.5px] font-semibold text-ink"
          style={{ border: '1.5px solid #D5DBEA' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="flex flex-none items-center gap-px">
          <SpeakerIcon size={16} color="#6B7590" />
          <Switch checked={settings.ttsEnabled} onChange={actions.toggleTts} label="Speak words aloud" />
        </span>
      </div>

      <div className="mx-[18px] h-[3px] flex-none overflow-hidden rounded-full" style={{ background: '#E3E7F0' }}>
        <div className="h-full rounded-full bg-indigo transition-[width] duration-250 ease-out" style={{ width: barWidth }} />
      </div>

      {isActive && session.attempt && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-4 pb-2">
            <div key={session.index} style={{ animation: 'sbRise .32s cubic-bezier(.25,.9,.35,1)' }}>
              {card && card.translation !== '' && (
                <div dir="auto" className="font-content mb-[5px] text-[19px] leading-[1.45] font-semibold text-ink">
                  {card.translation}
                </div>
              )}
              {card && card.transliteration !== '' && (
                <div dir="auto" className="font-content mb-[5px] text-sm leading-[1.5] font-medium text-muted">
                  {card.transliteration}
                </div>
              )}

              <div
                dir={session.attempt.rtl ? 'rtl' : 'ltr'}
                className="mt-3 flex min-h-[90px] flex-wrap items-start content-start gap-[9px] rounded-[18px] p-3"
                style={{
                  border: `1.5px solid ${session.attempt.done ? '#9CCFB4' : '#DDE2EF'}`,
                  background: session.attempt.done ? '#F3FBF6' : '#FFFFFF',
                  transition: 'background-color .3s, border-color .3s',
                  animation: session.attempt.done ? 'sbGlow .8s ease' : 'none',
                }}
              >
                {session.attempt.tokens.slice(0, session.attempt.placed).map((t, i) => (
                  <PlacedWord
                    key={i}
                    text={t}
                    done={session.attempt!.done}
                    showSpeaker={showSpeaker}
                    onSpeak={() => actions.speakBlock(t)}
                  />
                ))}
                {session.attempt.placed === 0 && (
                  <span className="font-display px-[6px] py-[15px] text-[13.5px] leading-[1.4] font-medium text-[#A9B1C7]">
                    Tap the words in order
                  </span>
                )}
              </div>

              {session.attempt.done &&
                session.attempt.doneInfo &&
                (() => {
                  const dm = doneMessage(session.attempt.doneInfo);
                  return (
                    <div className="mt-[13px] flex items-center gap-[11px]" style={{ animation: 'sbRise .32s ease' }}>
                      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: dm.circle }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12.5 L10 17.5 L19 7" stroke={dm.icon} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="block min-w-0">
                        <span className="font-display block text-[15.5px] leading-[1.2] font-bold" style={{ color: dm.titleColor }}>
                          {dm.title}
                        </span>
                        <span className="font-display mt-0.5 block text-[12.5px] leading-[1.35] font-medium text-muted">{dm.sub}</span>
                      </span>
                    </div>
                  );
                })()}

              <div dir={session.attempt.rtl ? 'rtl' : 'ltr'} className="mt-5 flex flex-wrap content-start gap-[11px] px-0 pt-0.5 pb-[10px]">
                {session.attempt.pool
                  .filter((p) => !p.gone)
                  .map((p) => (
                    <PoolWord
                      key={p.k}
                      text={p.text}
                      shake={p.shake}
                      showSpeaker={showSpeaker}
                      onTap={() => actions.tapBlock(p.k)}
                      onSpeak={() => actions.speakBlock(p.text)}
                    />
                  ))}
              </div>
            </div>
          </div>
          <div className="flex flex-none gap-[10px] px-[18px] pt-[10px] pb-4">
            {!session.attempt.done && (
              <button
                onClick={() => actions.advance(true)}
                className="font-display flex min-h-[48px] flex-1 cursor-pointer items-center justify-center rounded-[13px] bg-white px-[14px] text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
                style={{ border: '1.5px solid #D5DBEA' }}
              >
                Skip
              </button>
            )}
            {session.attempt.done && (
              <button
                onClick={() => actions.advance(false)}
                className="font-display flex min-h-[48px] flex-1 cursor-pointer items-center justify-center rounded-[13px] border-none bg-indigo px-[14px] text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
              >
                Next
              </button>
            )}
          </div>
        </>
      )}

      {session.empty && (
        <div className="flex flex-1 flex-col items-center justify-center px-7 pt-6 pb-[60px] text-center" style={{ animation: 'sbRise .3s ease' }}>
          <div className="font-display text-xl leading-[1.3] font-bold text-ink">All cards mastered 🎉</div>
          <div className="font-display mt-2 max-w-[270px] text-[13.5px] leading-[1.55] font-medium text-muted">
            Every card in “{deckName}” is mastered, so Remaining only has nothing left.
          </div>
          <button
            onClick={() => actions.startSession(session.deckId, true)}
            className="font-display mt-[22px] flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-[13px] border-none bg-indigo px-5 text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
          >
            Practice all anyway
          </button>
          <button
            onClick={() => actions.resetAndRestart(session.deckId)}
            className="font-display mt-[10px] flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-[13px] bg-white px-5 text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
            style={{ border: '1.5px solid #D5DBEA' }}
          >
            Reset progress
          </button>
        </div>
      )}

      {session.summary && (
        <div className="flex flex-1 flex-col items-center justify-center px-7 pt-6 pb-[60px] text-center" style={{ animation: 'sbRise .3s ease' }}>
          <div className="font-display text-[11.5px] leading-none font-bold tracking-[.11em] text-muted-2 uppercase">Session complete</div>
          <div className="font-display mt-4 text-[56px] leading-none font-extrabold tracking-[-.02em] text-ink">{session.completed}</div>
          <div className="font-display mt-[7px] text-sm leading-[1.3] font-medium text-muted">
            {session.completed === 1 ? 'card completed' : 'cards completed'}
          </div>
          {session.newly > 0 && (
            <span
              className="font-display mt-[15px] rounded-full px-[14px] py-[9px] text-[12.5px] leading-none font-bold"
              style={{ background: '#FBF0DB', color: '#8A6210' }}
            >
              +{session.newly} newly mastered
            </span>
          )}
          <button
            onClick={() => actions.startSession(session.deckId, false)}
            className="font-display mt-6 flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-[13px] border-none bg-indigo px-5 text-[14.5px] font-semibold text-white hover:bg-[#33418F] active:translate-y-px"
          >
            Practice again
          </button>
          <button
            onClick={actions.exitPractice}
            className="font-display mt-[10px] flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-[13px] bg-white px-5 text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
            style={{ border: '1.5px solid #D5DBEA' }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
