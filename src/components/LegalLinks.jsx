import { Link } from 'react-router-dom'

const links = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund', label: 'Refund Policy' },
  { to: '/contact', label: 'Contact' },
]

// Inline row of legal links for use in page footers.
export default function LegalLinks({ className = '' }) {
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`}>
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="text-slate-400 transition hover:text-brand-300">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
