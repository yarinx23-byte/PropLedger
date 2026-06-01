export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 shadow-[0_0_40px_-8px_rgba(139,92,246,0.7)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15l4-6 3 4 4-7" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-white">
        Prop<span className="text-brand-400">Ledger</span>
      </span>
    </div>
  )
}
