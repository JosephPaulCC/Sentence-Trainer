import { CheckIcon } from './Icons';

export interface SheetItem {
  key: string;
  label: string;
  danger?: boolean;
  check?: boolean;
  onTap: () => void;
}

interface ActionSheetProps {
  open: boolean;
  title?: string;
  items: SheetItem[];
  onClose: () => void;
}

export function ActionSheet({ open, title, items, onClose }: ActionSheetProps) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 cursor-pointer border-none p-0"
        style={{ background: 'var(--color-overlay)', animation: 'sbFade .2s ease' }}
      />
      <div
        className="relative max-h-[70%] overflow-y-auto rounded-t-[20px] bg-white px-[10px] pt-2 pb-[18px]"
        style={{ animation: 'sbRise .27s cubic-bezier(.3,1.1,.5,1)', boxShadow: '0 -10px 34px rgba(22,30,54,.2)' }}
      >
        <div className="mx-auto mt-1 mb-2 h-1 w-9 rounded-full" style={{ background: '#E3E7F0' }} />
        {title && (
          <div className="font-display truncate px-3 pt-1 pb-2 text-[13px] leading-[1.35] font-bold text-muted">{title}</div>
        )}
        {items.map((it) => (
          <button
            key={it.key}
            onClick={it.onTap}
            className="font-display flex min-h-[52px] w-full items-center gap-[10px] rounded-[13px] border-none bg-transparent px-3 text-start text-[15px] leading-[1.3] font-semibold cursor-pointer hover:bg-[#F7F9FD] active:bg-[#F1F3F7]"
            style={{ color: it.danger ? '#C4423C' : '#1E2A44' }}
          >
            <span className="min-w-0 flex-1">{it.label}</span>
            {it.check && <CheckIcon size={17} color="#3A4A9F" />}
          </button>
        ))}
      </div>
    </div>
  );
}
