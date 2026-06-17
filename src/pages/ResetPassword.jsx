import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // 'checking' | 'ready' | 'invalid' — is there a valid recovery session?
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    if (!supabase) {
      setStatus('invalid')
      return
    }
    // The recovery token in the URL is exchanged for a session by the client.
    // Accept either an existing session or the PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setStatus('ready')
    })
    supabase.auth.getSession().then(({ data }) => {
      setStatus((s) => (s === 'ready' ? s : data.session ? 'ready' : 'invalid'))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (ex) {
      setErr(ex.message || 'Failed to update password')
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
          <h1 className="text-2xl font-bold text-white">Set a new password</h1>

          {status === 'checking' && (
            <p className="mt-4 text-sm text-slate-400">Verifying your reset link…</p>
          )}

          {status === 'invalid' && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                This reset link is invalid or has expired. Please request a new one.
              </div>
              <Link
                to="/forgot-password"
                className="block w-full rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition hover:bg-brand-500"
              >
                Request a new link
              </Link>
            </div>
          )}

          {status === 'ready' && (
            done ? (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                Password updated. Redirecting you to your dashboard…
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">New password</label>
                  <input
                    className={inputCls}
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Confirm new password</label>
                  <input
                    className={inputCls}
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
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
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
