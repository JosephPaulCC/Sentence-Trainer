interface ModalProps {
  open: boolean;
  title: string;
  msg?: string;
  input: boolean;
  text?: string;
  placeholder?: string;
  confirmLabel: string;
  confirmDisabled: boolean;
  danger: boolean;
  onTextChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function Modal({
  open,
  title,
  msg,
  input,
  text,
  placeholder,
  confirmLabel,
  confirmDisabled,
  danger,
  onTextChange,
  onCancel,
  onConfirm,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-[26px]">
      <button
        onClick={onCancel}
        aria-label="Cancel"
        className="absolute inset-0 cursor-pointer border-none p-0"
        style={{ background: 'var(--color-overlay)', animation: 'sbFade .2s ease' }}
      />
      <div
        className="relative w-full max-w-[330px] rounded-[20px] bg-white px-[18px] pt-5 pb-4"
        style={{ animation: 'sbRise .24s cubic-bezier(.3,1.1,.5,1)', boxShadow: '0 14px 44px rgba(22,30,54,.28)' }}
      >
        <div className="font-display text-[17px] leading-[1.25] font-bold text-ink">{title}</div>
        {msg && <div className="font-display mt-[7px] text-[13.5px] leading-[1.55] font-medium text-muted">{msg}</div>}
        {input && (
          <input
            dir="auto"
            autoFocus
            value={text ?? ''}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
              }
            }}
            placeholder={placeholder}
            className="font-content mt-[14px] h-[47px] w-full rounded-[13px] px-[13px] text-[15.5px] leading-[1.3] font-medium text-ink focus:border-[#3A4A9F] focus:bg-white"
            style={{ border: '1.5px solid #D5DBEA', background: '#FAFBFE' }}
          />
        )}
        <div className="mt-[17px] flex gap-[10px]">
          <button
            onClick={onCancel}
            className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-[13px] bg-white px-[14px] text-[14.5px] font-semibold text-[#2B3A7E] hover:bg-[#F7F9FD] active:translate-y-px"
            style={{ border: '1.5px solid #D5DBEA' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="font-display flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-[13px] border-none px-[14px] text-[14.5px] font-semibold text-white active:translate-y-px"
            style={{ background: danger ? '#C4423C' : '#3A4A9F', opacity: confirmDisabled ? 0.45 : 1 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
