import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import Logo from '../components/Logo.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const CONSENT_MSG = 'Please agree to the Terms of Service and Privacy Policy to continue.'

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setNotice('')
    if (!agreed) {
      setErr(CONSENT_MSG)
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const { needsConfirmation } = await signUp(email, password)
      track('signup', { needsConfirmation })
      if (needsConfirmation) {
        setNotice('Check your inbox to confirm your email, then log in.')
      } else {
        navigate('/dashboard')
      }
    } catch (ex) {
      setErr(ex.message || 'Failed to create account')
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setErr('')
    if (!agreed) {
      setErr(CONSENT_MSG)
      return
    }
    try {
      await signInWithGoogle()
    } catch (ex) {
      setErr(ex.message || 'Google sign-in failed')
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10'

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-block">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
          <h1 className="text-2xl font-bold text-white">Create your ledger</h1>
          <p className="mt-1 text-sm text-slate-400">Track every funded account in one place.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
              <input className={inputCls} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@trader.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
              <input className={inputCls} type="password" name="new-password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Confirm password</label>
              <input className={inputCls} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
              />
              <span>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-300 underline hover:text-brand-200">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-300 underline hover:text-brand-200">Privacy Policy</a>.
              </span>
            </label>

            {err && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {err}
              </div>
            )}
            {notice && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {notice}
              </div>
            )}

            <button
              className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.7)] transition hover:bg-brand-500 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <GoogleButton onClick={onGoogle} label="Sign up with Google" />

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
