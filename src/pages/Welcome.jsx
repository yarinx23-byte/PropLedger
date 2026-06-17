import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubscription } from '../hooks/useSubscription.js'

export default function Welcome() {
  const { user, loading: authLoading } = useAuth()
  const { isActive, loading: subLoading } = useSubscription()
  const navigate = useNavigate()
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  // The webhook may take a few seconds to write the subscription row.
  // useSubscription has a real-time listener, so isActive flips on its own.
  useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => navigate('/dashboard'), 1500)
      return () => clearTimeout(t)
    }
  }, [isActive, navigate])

  // Fallback: if activation hasn't arrived after ~25s, show a manual option.
  useEffect(() => {
    const t = setTimeout(() => setWaitedTooLong(true), 25000)
    return () => clearTimeout(t)
  }, [])

  // Not logged in at all — send them to log in.
  if (!authLoading && !user) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-8 inline-block">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
          {isActive ? (
            <>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="mt-5 text-2xl font-bold text-white">You're all set!</h1>
              <p className="mt-2 text-sm text-slate-400">
                Your subscription is active. Taking you to your dashboard…
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-block w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
              >
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto h-14 w-14">
                <svg viewBox="0 0 24 24" className="h-14 w-14 animate-spin text-brand-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="mt-5 text-2xl font-bold text-white">Payment received 🎉</h1>
              <p className="mt-2 text-sm text-slate-400">
                We're activating your subscription. This usually takes a few seconds…
              </p>

              {waitedTooLong && (
                <div className="mt-6 space-y-3">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    Taking longer than expected. Your payment went through - try refreshing, or head to your
                    dashboard in a moment.
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
                  >
                    Refresh
                  </button>
                  <Link to="/dashboard" className="block text-sm text-brand-300 hover:text-brand-200">
                    Go to dashboard
                  </Link>
                </div>
              )}

              {!waitedTooLong && subLoading && (
                <p className="mt-4 text-xs text-slate-500">Checking subscription status…</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
