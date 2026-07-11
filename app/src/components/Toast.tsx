interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      className="font-display absolute right-4 bottom-[22px] left-4 z-[80] rounded-[14px] px-[15px] py-[13px] text-[13.5px] leading-[1.5] font-medium"
      style={{
        background: '#232C49',
        color: '#F5F7FD',
        boxShadow: '0 10px 28px rgba(22,30,54,.4)',
        animation: 'sbRise .28s cubic-bezier(.3,1.1,.5,1)',
      }}
    >
      {message}
    </div>
  );
}
