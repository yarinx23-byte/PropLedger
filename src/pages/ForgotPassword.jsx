import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Failed to send reset email')
    } finally {
      setBusy(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10'

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-block">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your email and we'll send you a link to set a new password.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                If an account exists for <span className="font-semibold">{email}</span>, a password reset link is on
                its way. Check your inbox (and spam folder).
              </div>
              <Link
                to="/login"
                className="block w-full rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition hover:bg-brand-500"
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                <input
                  className={inputCls}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trader.com"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {err}
                </div>
              )}

              <button
                className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.7)] transition hover:bg-brand-500 disabled:opacity-50"
                disabled={busy}
              >
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
