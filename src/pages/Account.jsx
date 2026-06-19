import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubscription } from '../hooks/useSubscription.js'
import { supabase } from '../lib/supabase.js'

const PLAN_LABELS = { early_bird: 'Early Bird', monthly: 'Monthly', annual: 'Annual' }

const STATUS_STYLES = {
  trialing: { label: 'Trial', cls: 'bg-amber-500/15 text-amber-300' },
  active: { label: 'Active', cls: 'bg-emerald-500/15 text-emerald-300' },
  canceled: { label: 'Canceled', cls: 'bg-rose-500/15 text-rose-300' },
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Account() {
  const { user, loading: authLoading } = useAuth()
  const { subscription, loading: subLoading } = useSubscription()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // This page only requires login (not an active subscription), so a user can
  // still manage billing after canceling.
  if (!authLoading && !user) {
    navigate('/login', { replace: true })
    return null
  }

  async function openPortal() {
    setErr('')
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('paddle-portal')
      if (error) {
        // Surface the function's own error message instead of the generic one.
        let msg = error.message
        try {
          const body = await error.context.json()
          if (body?.error) msg = body.error
        } catch {
          // ignore - fall back to the generic message
        }
        throw new Error(msg)
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error(data?.error || 'Could not open the billing portal')
      }
    } catch (e) {
      setErr(e.message || 'Could not open the billing portal. Please try again.')
      setBusy(false)
    }
  }

  const status = subscription?.status
  const statusStyle = STATUS_STYLES[status] || { label: status || 'None', cls: 'bg-white/10 text-slate-300' }
  const planLabel = PLAN_LABELS[subscription?.plan] || subscription?.plan || '-'
  const dateLabel = status === 'trialing' ? 'First charge on' : 'Renews on'

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Account</h1>
        <p className="mt-1 text-slate-400">Manage your profile and subscription.</p>

        {/* Profile */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-100">{user?.email}</span>
          </div>
        </section>

        {/* Subscription */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Subscription</h2>
            {!subLoading && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.cls}`}>
                {statusStyle.label}
              </span>
            )}
          </div>

          {subLoading ? (
            <p className="mt-4 text-sm text-slate-400">Loading…</p>
          ) : subscription ? (
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="text-slate-100">{planLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{dateLabel}</span>
                <span className="text-slate-100">{formatDate(subscription.current_period_end)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm text-slate-400">You don't have an active subscription.</p>
              <Link
                to="/pricing"
                className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
              >
                View plans
              </Link>
            </div>
          )}

          {err && (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {err}
            </div>
          )}

          {subscription && (
            <button
              onClick={openPortal}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {busy ? 'Opening…' : 'Manage subscription'}
            </button>
          )}
          <p className="mt-3 text-center text-xs text-slate-500">
            Cancel, update your payment method, or download invoices via the secure Paddle portal.
          </p>
        </section>
      </main>
    </div>
  )
}
