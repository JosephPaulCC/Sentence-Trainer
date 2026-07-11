interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function PlusIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5.5 V18.5 M5.5 12 H18.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function FolderPlusIcon({ size = 15, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.5 7.2 a2 2 0 0 1 2 -2 h4.2 l2 2.4 h6.8 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 h-13 a2 2 0 0 1 -2 -2 z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({ size = 15, color = '#8891AB', open }: IconProps & { open: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transition: 'transform .18s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flex: 'none' }}
    >
      <path d="M9 5.5 L16 12 L9 18.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KebabIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <circle cx="12" cy="5.4" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="12" cy="18.6" r="1.9" />
    </svg>
  );
}

export function BackIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14.5 5.5 L8 12 L14.5 18.5" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" stroke={color} strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon({ size = 12, color = '#FFFFFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path
        d="M8 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.4 0-1.8L9.6 4.9c-.7-.4-1.6.1-1.6.9z"
        fill={color}
      />
    </svg>
  );
}

export function CheckIcon({ size = 10, color = '#1F7A55', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12.5 L10 17.5 L19 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ListIcon({ size = 15, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 7 H19 M5 12 H19 M5 17 H12.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorIcon({ size = 12, color = '#C4423C', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 6.5 V13" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="1.5" fill={color} />
    </svg>
  );
}

export function SpeakerIcon({ size = 16, color = '#6B7590', big = false }: IconProps & { big?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M4 9.5v5h3.2L12 18.7V5.3L7.2 9.5H4z" fill={color} />
      <path d="M15.5 8.7a4.6 4.6 0 0 1 0 6.6" stroke={color} strokeWidth="1.9" fill="none" strokeLinecap="round" />
      {big && <path d="M18 6.4a8 8 0 0 1 0 11.2" stroke={color} strokeWidth="1.9" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
