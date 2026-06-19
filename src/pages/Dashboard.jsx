import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { fmtUSD, fmtUSDSigned, todayISO, monthKey, monthLabel } from '../lib/format.js'
import {
  fetchDashboard,
  createAccount,
  updateAccount as updateAccountDb,
  deleteAccount as deleteAccountDb,
  createExpense,
  updateExpense as updateExpenseDb,
  deleteExpense as deleteExpenseDb,
} from '../lib/db.js'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [expenseRows, setExpenseRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    fetchDashboard(user.id)
      .then(({ accounts, expenses }) => {
        if (!active) return
        setAccounts(accounts)
        setExpenseRows(expenses)
        setError('')
      })
      .catch((e) => active && setError(e.message || 'Failed to load your data'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  // Period filter: view 'month' | 'all'; cursor = focused month
  const now = new Date()
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const key = monthKey(cursor.year, cursor.month)
  const inPeriod = (dateStr) => view === 'all' || (dateStr || '').slice(0, 7) === key

  // Attribute each account's money to the selected period
  const derived = useMemo(() => {
    return accounts.map((a) => {
      const split = Number(a.payoutSplit) || 0
      const periodPayouts = (a.payouts || []).filter((p) => inPeriod(p.date))
      const grossPayouts = periodPayouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
      const netPayouts = grossPayouts * split / 100
      const splitFees = grossPayouts - netPayouts
      const purchaseHere = inPeriod(a.purchaseDate)
      const challenge = purchaseHere ? (a.challengeFee || 0) : 0
      const activation = purchaseHere ? (a.activationFee || 0) : 0
      const reset = purchaseHere ? (a.resetFee || 0) : 0
      const cost = splitFees + challenge + activation + reset
      const active = view === 'all' || purchaseHere || periodPayouts.length > 0
      return {
        ...a,
        _payouts: grossPayouts,
        _payoutFees: splitFees,
        _challenge: challenge,
        _activation: activation,
        _reset: reset,
        _net: grossPayouts - cost,
        _active: active,
      }
    })
  }, [accounts, view, key])

  const visibleAccounts = derived.filter((a) => a._active)

  const periodExpenses = expenseRows.filter((e) => inPeriod(e.date))
  const expensesTotal = periodExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  const totals = useMemo(() => {
    const sum = (k) => derived.reduce((s, a) => s + a[k], 0)
    const payouts = sum('_payouts')
    const challenge = sum('_challenge')
    const activation = sum('_activation')
    const payoutFees = sum('_payoutFees')
    const reset = sum('_reset')
    const accountCosts = challenge + activation + payoutFees + reset
    return { payouts, challenge, activation, payoutFees, reset, accountCosts, net: payouts - accountCosts - expensesTotal }
  }, [derived, expensesTotal])

  function shiftMonth(delta) {
    setView('month')
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // These throw on failure so the modal can show the error in-place
  // (a dashboard-level banner would be hidden behind the modal overlay).
  async function addAccount(data) {
    const acc = await createAccount(user?.id, data)
    setAccounts((prev) => [...prev, acc])
    setShowAdd(false)
    // Make the new account visible: jump the filter to its purchase month
    // (otherwise an account dated outside the current period looks "lost").
    const pd = parseISO(acc.purchaseDate)
    if (pd) setCursor({ year: pd.y, month: pd.m })
    else setView('all')
    if (pd) setView('month')
  }

  async function updateAccount(data) {
    const acc = await updateAccountDb(user?.id, data)
    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)))
    setEditing(null)
  }

  async function deleteAccount(id) {
    await deleteAccountDb(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
    setEditing(null)
  }

  const defaultExpenseDate = view === 'all' ? todayISO() : `${key}-01`
  async function addExpenseRow() {
    try {
      const row = await createExpense(user.id, defaultExpenseDate)
      setExpenseRows((prev) => [...prev, row])
    } catch (e) {
      setError(e.message || 'Failed to add expense')
    }
  }
  // Update local state for snappy typing; persistence happens via saveExpenseRow.
  function updateExpenseRow(id, patch) {
    setExpenseRows((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }
  const saveExpenseRow = useCallback((id, patch) => {
    updateExpenseDb(id, patch).catch((e) => setError(e.message || 'Failed to save expense'))
  }, [])
  async function removeExpenseRow(id) {
    const prev = expenseRows
    setExpenseRows((rows) => rows.filter((e) => e.id !== id))
    try {
      await deleteExpenseDb(id)
    } catch (e) {
      setError(e.message || 'Failed to delete expense')
      setExpenseRows(prev)
    }
  }

  const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur'
  const isThisMonth = view === 'month' && cursor.year === now.getFullYear() && cursor.month === now.getMonth()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">{user?.email}</span>
            <Link
              to="/account"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              Account
            </Link>
            <button
              onClick={() => setConfirmSignOut(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-slate-400">Your funded accounts P&amp;L at a glance.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_-6px_rgba(139,92,246,0.6)] transition hover:bg-brand-500"
          >
            + Add account
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button onClick={() => setError('')} className="shrink-0 text-rose-200/70 hover:text-rose-100">Dismiss</button>
          </div>
        )}
        {loading && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
            Loading your data…
          </div>
        )}

        {!loading && accounts.length === 0 ? (
          <EmptyDashboard onAdd={() => setShowAdd(true)} />
        ) : (
        <>
        {/* Date filter bar */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className={`flex-1 sm:min-w-44 sm:flex-none rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
              view === 'month' ? 'bg-brand-600 text-white' : 'text-slate-300'
            }`}>
              {view === 'all' ? 'All time' : monthLabel(cursor.year, cursor.month)}
            </div>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { setView('month'); setCursor({ year: now.getFullYear(), month: now.getMonth() }) }}
              className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-medium transition ${
                isThisMonth ? 'bg-brand-600 text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              This month
            </button>
            <button
              onClick={() => setView('all')}
              className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-medium transition ${
                view === 'all' ? 'bg-brand-600 text-white' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              All time
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Net profit"
            value={fmtUSDSigned(totals.net)}
            color={totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            highlight
          />
          <StatCard label="Total payouts"  value={fmtUSD(totals.payouts)} color="text-emerald-300" />
          <StatCard label="Account costs"  value={`-${fmtUSD(totals.accountCosts)}`} color="text-rose-300" />
          <StatCard label="Business expenses" value={`-${fmtUSD(expensesTotal)}`} color="text-rose-300" />
        </section>

        {/* Accounts table */}
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Funded accounts</h2>
            <span className="text-sm text-slate-500">
              {visibleAccounts.length} {visibleAccounts.length === 1 ? 'account' : 'accounts'}
              {view === 'month' && ' active'}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Firm</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Challenge</th>
                    <th className="px-4 py-3 text-right">Activation</th>
                    <th className="px-4 py-3 text-right">Payout fees</th>
                    <th className="px-4 py-3 text-right">Reset</th>
                    <th className="px-4 py-3 text-right">Payouts</th>
                    <th className="px-4 py-3 text-right">Net</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visibleAccounts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                        No account activity in {monthLabel(cursor.year, cursor.month)}.
                      </td>
                    </tr>
                  )}
                  {visibleAccounts.map((a) => (
                    <tr key={a.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-medium text-white">{a.firm}</td>
                      <td className="px-4 py-4 text-slate-300">{fmtUSD(a.size)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === 'Funded'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : a.status === 'Closed'
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <Cost value={a._challenge} />
                      <Cost value={a._activation} />
                      <Cost value={a._payoutFees} />
                      <Cost value={a._reset} />
                      <td className="px-4 py-4 text-right text-emerald-300">
                        {a._payouts ? `+${fmtUSD(a._payouts)}` : '-'}
                      </td>
                      <td className={`px-4 py-4 text-right font-semibold ${a._net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtUSDSigned(a._net)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setEditing(a)}
                          aria-label={`Edit ${a.firm}`}
                          className="inline-grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-200"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom panels */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Expenses */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Business expenses</h3>
              <button
                onClick={addExpenseRow}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                + Add expense
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-400">General costs not tied to one account - coaching, education, etc.</p>

            <div className="mt-4 space-y-2">
              {periodExpenses.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
                  No expenses in this period.
                </p>
              )}
              {periodExpenses.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={e.name}
                    onChange={(ev) => updateExpenseRow(e.id, { name: ev.target.value })}
                    onBlur={(ev) => saveExpenseRow(e.id, { name: ev.target.value })}
                    placeholder="Expense name"
                    className="min-w-0 w-full sm:w-auto sm:flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10"
                  />
                  <DatePicker
                    value={e.date}
                    onChange={(d) => { updateExpenseRow(e.id, { date: d }); saveExpenseRow(e.id, { date: d }) }}
                    className="flex-1 sm:w-44 sm:flex-none"
                  />
                  <input
                    type="number"
                    value={e.amount}
                    onChange={(ev) => updateExpenseRow(e.id, { amount: ev.target.value })}
                    onBlur={(ev) => saveExpenseRow(e.id, { amount: ev.target.value })}
                    placeholder="0"
                    className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10"
                  />
                  <button
                    onClick={() => removeExpenseRow(e.id)}
                    aria-label="Delete expense"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
              <span className="text-slate-400">Total</span>
              <span className="font-semibold text-rose-300">-{fmtUSD(expensesTotal)}</span>
            </div>
          </div>

          {/* Quick math */}
          <div className={card}>
            <h3 className="text-lg font-semibold text-white">Quick math</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <Row label="Payouts"          val={`+${fmtUSD(totals.payouts)}`}     color="text-emerald-300" />
              <Row label="Payout split fees" val={`-${fmtUSD(totals.payoutFees)}`} color="text-rose-300" />
              <Row label="Challenge costs"  val={`-${fmtUSD(totals.challenge)}`}  color="text-rose-300" />
              <Row label="Activation fees"  val={`-${fmtUSD(totals.activation)}`} color="text-rose-300" />
              <Row label="Reset fees"       val={`-${fmtUSD(totals.reset)}`}      color="text-rose-300" />
              <Row label="Business expenses" val={`-${fmtUSD(expensesTotal)}`}    color="text-rose-300" />
              <li className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                <span>Net profit</span>
                <span className={totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {fmtUSDSigned(totals.net)}
                </span>
              </li>
            </ul>
          </div>
        </section>
        </>
        )}
      </main>

      {showAdd && <AccountModal onClose={() => setShowAdd(false)} onSubmit={addAccount} />}
      {editing && <AccountModal initial={editing} onClose={() => setEditing(null)} onSubmit={updateAccount} onDelete={deleteAccount} />}

      {confirmSignOut && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur"
          onClick={() => setConfirmSignOut(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-white">Sign out?</h4>
            <p className="mt-1 text-sm text-slate-400">
              Are you sure you want to sign out of your account?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={signOut}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Cost({ value }) {
  return (
    <td className="px-4 py-4 text-right text-slate-300">
      {value ? `-${fmtUSD(value)}` : '-'}
    </td>
  )
}

function StatCard({ label, value, color, highlight }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-6 backdrop-blur ${
      highlight
        ? 'border-brand-400/40 bg-brand-500/[0.08]'
        : 'border-white/10 bg-white/[0.04]'
    }`}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`mt-1 sm:mt-2 text-xl sm:text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function Row({ label, val, color }) {
  return (
    <li className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={color}>{val}</span>
    </li>
  )
}

function EmptyDashboard({ onAdd }) {
  return (
    <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center backdrop-blur">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-white">Welcome to PropLedger 👋</h2>
      <p className="mt-2 max-w-md text-slate-400">
        Add your first funded account to start tracking payouts, fees, and your real net profit -
        all in one clean ledger.
      </p>
      <button
        onClick={onAdd}
        className="mt-8 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.7)] transition hover:bg-brand-500 active:translate-y-px"
      >
        + Add your first account
      </button>
      <p className="mt-4 text-xs text-slate-500">It only takes a minute - firm, size, fees, and payouts.</p>
    </div>
  )
}

function AccountModal({ initial, onClose, onSubmit, onDelete }) {
  const isEdit = Boolean(initial)
  const [firm, setFirm] = useState(initial?.firm ?? '')
  const [size, setSize] = useState(fmtUSD(initial?.size ?? 100000))
  const [status, setStatus] = useState(initial?.status ?? 'In challenge')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayISO())
  const [challengeFee, setChallengeFee] = useState(initial?.challengeFee ?? 540)
  const [activationFee, setActivationFee] = useState(initial?.activationFee ?? 0)
  const [payoutSplit, setPayoutSplit] = useState(initial?.payoutSplit ?? 90)
  const [resetFee, setResetFee] = useState(initial?.resetFee ?? 0)
  const [payouts, setPayouts] = useState(initial?.payouts ?? [])

  const split = Number(payoutSplit) || 0
  const grossTotal = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const netTotal = grossTotal * split / 100

  function addPayout() {
    setPayouts((prev) => [...prev, { id: Date.now(), date: todayISO(), amount: 0 }])
  }
  function updatePayout(id, patch) {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  function removePayout(id) {
    setPayouts((prev) => prev.filter((p) => p.id !== id))
  }

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!firm.trim()) {
      setErr('Firm name is required.')
      return
    }
    if (busy) return // guard against double-submit
    setErr('')
    setBusy(true)
    try {
      await onSubmit({
        ...(isEdit ? { id: initial.id } : {}),
        firm: firm.trim(),
        size: Number(String(size).replace(/[^0-9.]/g, '')),
        status,
        purchaseDate,
        challengeFee: Number(challengeFee),
        activationFee: Number(activationFee),
        payoutSplit: Number(payoutSplit),
        resetFee: Number(resetFee),
        payouts: payouts.map((p) => ({ id: p.id, date: p.date, amount: Number(p.amount) || 0 })),
      })
      // On success the parent unmounts this modal; nothing else to do.
    } catch (ex) {
      setErr(ex?.message || 'Failed to save account. Please try again.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    setErr('')
    setBusy(true)
    try {
      await onDelete(initial.id)
      // On success the parent unmounts this modal.
    } catch (ex) {
      setConfirmOpen(false)
      setErr(ex?.message || 'Failed to delete account. Please try again.')
      setBusy(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10'

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8 backdrop-blur overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit funded account' : 'Add funded account'}</h3>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Firm">
            <input className={inputCls} value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="FTMO, Apex, TopStep…" required />
          </Field>
          <Field label="Account size">
            <Select value={size} onChange={setSize} options={['$25,000', '$50,000', '$100,000', '$150,000', '$200,000']} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} options={['In challenge', 'Funded', 'Closed']} />
          </Field>
          <Field label="Purchase date">
            <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
          </Field>
          <Field label="Payout split (%)" hint="Trader keeps">
            <input className={inputCls} type="number" min="0" max="100" value={payoutSplit} onChange={(e) => setPayoutSplit(e.target.value)} />
          </Field>
          <Field label="Challenge fee ($)" hint="One-time">
            <input className={inputCls} type="number" value={challengeFee} onChange={(e) => setChallengeFee(e.target.value)} />
          </Field>
          <Field label="Activation fee ($)" hint="One-time">
            <input className={inputCls} type="number" value={activationFee} onChange={(e) => setActivationFee(e.target.value)} />
          </Field>
          <Field label="Reset fee ($)" hint="Per reset">
            <input className={inputCls} type="number" value={resetFee} onChange={(e) => setResetFee(e.target.value)} />
          </Field>

          {/* Payouts list */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Payouts received <span className="text-slate-500">(gross → net @ {split}%)</span></label>
              <button
                type="button"
                onClick={addPayout}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                + Add payout
              </button>
            </div>
            <div className="space-y-2">
              {payouts.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-center text-sm text-slate-500">
                  No payouts yet.
                </p>
              )}
              {payouts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2">
                  <DatePicker
                    value={p.date}
                    onChange={(d) => updatePayout(p.id, { date: d })}
                    className="w-full sm:flex-1"
                  />
                  <input
                    type="number"
                    value={p.amount}
                    onChange={(ev) => updatePayout(p.id, { amount: ev.target.value })}
                    placeholder="0"
                    className="flex-1 sm:w-28 sm:flex-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-400 focus:bg-white/10"
                  />
                  <span className="w-20 sm:w-24 shrink-0 text-right text-sm font-medium text-emerald-300">
                    {fmtUSD((Number(p.amount) || 0) * split / 100)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePayout(p.id)}
                    aria-label="Delete payout"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Gross payouts</span>
                <span className="font-medium text-slate-200">{fmtUSD(grossTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net after {split}% split</span>
                <span className="font-semibold text-emerald-300">+{fmtUSD(netTotal)}</span>
              </div>
            </div>
          </div>

          {err && (
            <div className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {err}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                Delete account
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="ml-auto rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add account'}
            </button>
          </div>
        </form>

        {confirmOpen && (
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4 backdrop-blur"
            onClick={() => !busy && setConfirmOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-lg font-bold text-white">Delete account?</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Are you sure you want to delete this account? This cannot be undone.
                  </p>
                </div>
              </div>

              {err && (
                <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {err}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={busy}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {busy ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Select({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 outline-none transition focus:border-brand-400 focus:bg-white/10"
      >
        <span>{value}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl shadow-black/40">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  opt === value
                    ? 'bg-brand-600/20 text-brand-200'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {opt}
                {opt === value && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseISO(s) {
  if (!s || typeof s !== 'string') return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

function DatePicker({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const now = new Date()
  const parsed = parseISO(value)
  const [viewYM, setViewYM] = useState(
    parsed ? { y: parsed.y, m: parsed.m } : { y: now.getFullYear(), m: now.getMonth() }
  )

  useEffect(() => {
    if (!open) return
    const p = parseISO(value)
    if (p) setViewYM({ y: p.y, m: p.m })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = parsed ? `${MONTHS[parsed.m]} ${parsed.d}, ${parsed.y}` : 'Select date'

  const firstWeekday = new Date(viewYM.y, viewYM.m, 1).getDay()
  const daysInMonth = new Date(viewYM.y, viewYM.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function shiftMonth(delta) {
    setViewYM((c) => {
      const dt = new Date(c.y, c.m + delta, 1)
      return { y: dt.getFullYear(), m: dt.getMonth() }
    })
  }

  function pick(d) {
    onChange(`${viewYM.y}-${String(viewYM.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    setOpen(false)
  }

  const isSelected = (d) => parsed && parsed.y === viewYM.y && parsed.m === viewYM.m && parsed.d === d
  const isToday = (d) =>
    now.getFullYear() === viewYM.y && now.getMonth() === viewYM.m && now.getDate() === d

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 outline-none transition focus:border-brand-400 focus:bg-white/10"
      >
        <span className={parsed ? '' : 'text-slate-500'}>{label}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl shadow-black/40">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="text-sm font-semibold text-white">{MONTHS[viewYM.m]} {viewYM.y}</span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="grid h-8 place-items-center text-xs font-medium text-slate-500">{w}</div>
            ))}
            {cells.map((d, i) => (
              <div key={i} className="grid place-items-center">
                {d && (
                  <button
                    type="button"
                    onClick={() => pick(d)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${
                      isSelected(d)
                        ? 'bg-brand-600 font-semibold text-white'
                        : isToday(d)
                        ? 'text-brand-300 ring-1 ring-brand-400/40 hover:bg-white/10'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-300">
        {label}
        {hint && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
