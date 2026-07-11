interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="flex h-11 w-[52px] flex-none cursor-pointer items-center justify-center border-none bg-transparent p-0"
    >
      <span
        className="relative block h-[27px] w-[46px] rounded-full transition-colors duration-200"
        style={{ background: checked ? '#3A4A9F' : '#C9D0E4' }}
      >
        <span
          className="absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-white transition-transform duration-200"
          style={{ transform: checked ? 'translateX(19px)' : 'translateX(0px)', boxShadow: '0 1px 3px rgba(30,42,68,.35)' }}
        />
      </span>
    </button>
  );
}
