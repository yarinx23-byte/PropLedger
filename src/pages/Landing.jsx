import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'
import Logo from '../components/Logo.jsx'
import LegalLinks from '../components/LegalLinks.jsx'

const features = [
  {
    icon: '📒',
    title: 'Do you actually know your net profit?',
    body: 'After fees, resets, and payout splits - PropLedger shows what you actually made. Not what it looked like.',
  },
  {
    icon: '📈',
    title: 'All your prop firms. One clean dashboard.',
    body: 'Works with every prop firm. Tracks every dollar.',
  },
  {
    icon: '🎯',
    title: 'Tracked. Organized. Tax ready.',
    body: 'Stop reconstructing your year from memory. Every expense and payout is tracked from day one.',
  },
]

const mockAccounts = [
  { label: 'FTMO 200K', val: '+$12,400', good: true },
  { label: 'Apex 150K', val: '+$8,200', good: true },
  { label: 'MFF 100K', val: '-$960', good: false },
  { label: 'TopStep 50K', val: '+$5,220', good: true },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link to="/pricing" className="hidden text-sm text-slate-300 transition hover:text-white sm:inline">Pricing</Link>
          <Link to="/login" className="text-sm text-slate-300 transition hover:text-white">Log in</Link>
          <Link
            to="/signup"
            onClick={() => track('cta_click', { location: 'nav' })}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.7)] transition hover:bg-brand-500"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-8 py-6 sm:py-8 lg:gap-12 lg:py-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              P&amp;L tracking for prop traders
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl text-white">
              Your funded accounts,
              <span className="block bg-linear-to-r from-brand-300 via-brand-400 to-brand-600 bg-clip-text text-transparent">
                finally in one ledger.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium text-brand-200">
              Built by prop traders, for prop traders - because spreadsheets weren't cutting it.
            </p>
            <p className="mt-4 max-w-lg text-lg text-slate-300">
              PropLedger tracks challenge fees, payouts, resets, and business expenses across every prop firm - so you know exactly what you're really making.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                onClick={() => track('cta_click', { location: 'hero' })}
                className="inline-flex items-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.7)] transition hover:bg-brand-500 active:translate-y-px"
              >
                Start tracking free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-100 transition hover:bg-white/10"
              >
                I have an account
              </Link>
            </div>
          </div>

          {/* Mock dashboard card */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-linear-to-br from-brand-600/30 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">Net P&amp;L · This month</div>
                <div className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">+18.4%</div>
              </div>
              <div className="text-4xl font-bold tracking-tight text-white">$24,860</div>
              <div className="mt-6 space-y-3">
                {mockAccounts.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">{r.label}</span>
                    <span className={`text-sm font-semibold ${r.good ? 'text-emerald-400' : 'text-rose-400'}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 py-8 md:py-16 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{f.icon}</span>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </section>

        {/* CTA strip */}
        <section className="mt-4 mb-10 md:my-12 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8 text-center backdrop-blur md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-2xl font-bold text-white">Know your real edge.</h3>
            <p className="mt-1 text-slate-400">Stop guessing what's left after fees. Start with PropLedger.</p>
          </div>
          <Link
            to="/signup"
            onClick={() => track('cta_click', { location: 'cta_strip' })}
            className="shrink-0 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.7)] transition hover:bg-brand-500"
          >
            Create free account
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <LegalLinks className="mb-4" />
        © {new Date().getFullYear()} PropLedger. Built for funded traders.
      </footer>
    </div>
  )
}
