import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import LegalLinks from '../components/LegalLinks.jsx'
import { COMPANY } from '../components/LegalLayout.jsx'

export default function Contact() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/" className="text-sm text-slate-300 transition hover:text-white">
          Back to home
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Contact us</h1>
        <p className="mt-2 text-slate-400">
          Questions, feedback, or need a hand? We'd love to hear from you - we usually reply within 24 hours.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h2 className="mt-5 text-lg font-semibold text-white">Email support</h2>
          <p className="mt-1 text-sm text-slate-400">The fastest way to reach us.</p>
          <a
            href={`mailto:${COMPANY.contactEmail}`}
            className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.7)] transition hover:bg-brand-500"
          >
            {COMPANY.contactEmail}
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Looking for plans and pricing?{' '}
          <Link to="/pricing" className="font-medium text-brand-300 hover:text-brand-200">
            See pricing
          </Link>
        </p>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <LegalLinks className="mb-4" />
        © {new Date().getFullYear()} {COMPANY.name}. Built for funded traders.
      </footer>
    </div>
  )
}
