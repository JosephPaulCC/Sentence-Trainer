interface PlacedWordProps {
  text: string;
  done: boolean;
  /** Non-null while TTS is on: the block becomes a tap-to-speak button. */
  onSpeak: (() => void) | null;
}

export function PlacedWord({ text, done, onSpeak }: PlacedWordProps) {
  const bg = done ? '#E2F4EA' : '#EDF0FA';
  const border = done ? '#BCE0CC' : '#CBD3EE';
  const edge = done ? '#9BD1B4' : '#B4BFE8';
  const color = done ? '#14573C' : '#26325B';
  const blockStyle = {
    border: `1.5px solid ${border}`,
    borderBottom: `3.5px solid ${edge}`,
    background: bg,
    color,
    transition: 'background-color .3s, border-color .3s, color .3s',
  };
  const blockClass =
    'font-content inline-flex min-h-[46px] max-w-full items-center rounded-xl px-[13px] py-[9px] text-[19px] leading-[1.35] font-semibold break-words';
  return (
    <span className="relative inline-flex max-w-full" style={{ animation: 'sbPlace .4s cubic-bezier(.3,1.45,.55,1)' }}>
      {onSpeak ? (
        <button
          onClick={onSpeak}
          aria-label={`Speak: ${text}`}
          dir="auto"
          className={`${blockClass} cursor-pointer text-start active:translate-y-px`}
          style={blockStyle}
        >
          {text}
        </button>
      ) : (
        <span dir="auto" className={blockClass} style={blockStyle}>
          {text}
        </span>
      )}
    </span>
  );
}

interface PoolWordProps {
  text: string;
  shake: boolean;
  onTap: () => void;
}

export function PoolWord({ text, shake, onTap }: PoolWordProps) {
  const border = shake ? '#E08B86' : '#D5DBEA';
  const edge = shake ? '#D2504B' : '#C2CBE2';
  return (
    <span className="relative inline-flex max-w-full" style={{ animation: shake ? 'sbShake .4s ease' : 'none' }}>
      <button
        onClick={onTap}
        dir="auto"
        className="font-content inline-flex min-h-[52px] max-w-full cursor-pointer items-center rounded-2xl bg-white px-4 py-[11px] text-start text-xl leading-[1.35] font-semibold break-words text-ink transition-[border-color] duration-200 hover:border-[#B9C2DC] active:translate-y-[2px]"
        style={{
          border: `1.5px solid ${border}`,
          borderBottom: `4px solid ${edge}`,
          boxShadow: '0 1px 2px rgba(30,42,68,.06)',
        }}
      >
        {text}
      </button>
    </span>
  );
}
