export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 60 72" className="h-9 w-auto shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="pl-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ec4899" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="52" height="64" rx="11" fill="none" stroke="url(#pl-logo-gradient)" strokeWidth="4" />
        <path d="M12 32 L12 26 L22 21 L30 24 L40 17 L50 23 L50 32 Z" fill="url(#pl-logo-gradient)" />
        <rect x="13" y="50" width="8" height="12" rx="2" fill="url(#pl-logo-gradient)" />
        <rect x="27" y="45" width="8" height="17" rx="2" fill="url(#pl-logo-gradient)" />
        <rect x="41" y="40" width="8" height="22" rx="2" fill="url(#pl-logo-gradient)" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-white">
        Prop<span className="bg-linear-to-br from-[#ec4899] to-[#7c3aed] bg-clip-text text-transparent">Ledger</span>
      </span>
    </div>
  )
}
