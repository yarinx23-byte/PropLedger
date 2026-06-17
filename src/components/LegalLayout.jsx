import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

// Update these as needed for your business details.
export const COMPANY = {
  name: 'PropLedger',
  contactEmail: 'propledgerhq@gmail.com',
}

const navLinks = [
  { to: '/terms', label: 'Terms of Service' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund', label: 'Refund Policy' },
]

export function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  )
}

export default function LegalLayout({ title, lastUpdated, children }) {
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

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {lastUpdated && <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>}

        <div className="mt-10 space-y-8">{children}</div>

        <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-brand-300 transition hover:text-brand-200">
              {l.label}
            </Link>
          ))}
        </nav>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
      </footer>
    </div>
  )
}
