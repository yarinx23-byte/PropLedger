import { supabase } from './supabase.js'

// Turn a Supabase/PostgREST error into a readable, logged Error.
function dbError(context, error) {
  // Full object to the console for debugging (code, details, hint, etc.)
  console.error(`[db] ${context} failed:`, error)
  const parts = [error?.message || 'Unknown database error']
  if (error?.details) parts.push(error.details)
  if (error?.hint) parts.push(`Hint: ${error.hint}`)
  if (error?.code) parts.push(`(code ${error.code})`)
  return new Error(`${context}: ${parts.filter(Boolean).join(' - ')}`)
}

// --- row <-> app-shape mappers -------------------------------------------
function accountFromRow(r) {
  return {
    id: r.id,
    firm: r.firm,
    size: Number(r.size),
    status: r.status,
    purchaseDate: r.purchase_date,
    challengeFee: Number(r.challenge_fee),
    activationFee: Number(r.activation_fee),
    payoutSplit: Number(r.payout_split),
    resetFee: Number(r.reset_fee),
  }
}

const payoutFromRow = (r) => ({ id: r.id, date: r.date, amount: Number(r.amount) })
const expenseFromRow = (r) => ({ id: r.id, name: r.name, amount: Number(r.amount), date: r.date })

function accountToRow(userId, data) {
  return {
    user_id: userId,
    firm: data.firm,
    size: Number(data.size) || 0,
    status: data.status,
    purchase_date: data.purchaseDate || null,
    challenge_fee: Number(data.challengeFee) || 0,
    activation_fee: Number(data.activationFee) || 0,
    payout_split: Number(data.payoutSplit) || 0,
    reset_fee: Number(data.resetFee) || 0,
  }
}

// --- reads ----------------------------------------------------------------
export async function fetchDashboard(userId) {
  const [accRes, payRes, expRes] = await Promise.all([
    supabase.from('funded_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('payouts').select('*').eq('user_id', userId).order('date', { ascending: true }),
    supabase.from('business_expenses').select('*').eq('user_id', userId).order('date', { ascending: true }),
  ])
  if (accRes.error) throw accRes.error
  if (payRes.error) throw payRes.error
  if (expRes.error) throw expRes.error

  const byAccount = {}
  for (const p of payRes.data) (byAccount[p.account_id] ||= []).push(payoutFromRow(p))

  const accounts = accRes.data.map((r) => ({ ...accountFromRow(r), payouts: byAccount[r.id] || [] }))
  const expenses = expRes.data.map(expenseFromRow)
  return { accounts, expenses }
}

// --- accounts -------------------------------------------------------------
export async function createAccount(userId, data) {
  if (!userId) throw new Error('Cannot save account: no signed-in user. Try logging in again.')
  const { data: row, error } = await supabase
    .from('funded_accounts')
    .insert(accountToRow(userId, data))
    .select()
    .single()
  if (error) throw dbError('Insert account', error)
  const payouts = await replacePayouts(userId, row.id, data.payouts)
  return { ...accountFromRow(row), payouts }
}

export async function updateAccount(userId, data) {
  if (!userId) throw new Error('Cannot update account: no signed-in user. Try logging in again.')
  const { data: row, error } = await supabase
    .from('funded_accounts')
    .update(accountToRow(userId, data))
    .eq('id', data.id)
    .select()
    .single()
  if (error) throw dbError('Update account', error)
  const payouts = await replacePayouts(userId, data.id, data.payouts)
  return { ...accountFromRow(row), payouts }
}

export async function deleteAccount(accountId) {
  // Remove payouts first in case the FK cascade isn't configured, then the account.
  const { error: payErr } = await supabase.from('payouts').delete().eq('account_id', accountId)
  if (payErr) throw dbError('Delete account payouts', payErr)

  const { error } = await supabase.from('funded_accounts').delete().eq('id', accountId)
  if (error) throw dbError('Delete account', error)
}

// Simplest reliable reconciliation for a small payouts list: wipe + reinsert.
export async function replacePayouts(userId, accountId, payouts) {
  const { error: delErr } = await supabase.from('payouts').delete().eq('account_id', accountId)
  if (delErr) throw dbError('Clear old payouts', delErr)

  const rows = (payouts || []).map((p) => ({
    user_id: userId,
    account_id: accountId,
    date: p.date || null,
    amount: Number(p.amount) || 0,
  }))
  if (rows.length === 0) return []

  const { data, error } = await supabase.from('payouts').insert(rows).select()
  if (error) throw dbError('Insert payouts', error)
  return data.map(payoutFromRow)
}

// --- expenses -------------------------------------------------------------
export async function createExpense(userId, date) {
  const { data, error } = await supabase
    .from('business_expenses')
    .insert({ user_id: userId, name: '', amount: 0, date: date || null })
    .select()
    .single()
  if (error) throw error
  return expenseFromRow(data)
}

export async function updateExpense(id, patch) {
  const row = {}
  if ('name' in patch) row.name = patch.name
  if ('amount' in patch) row.amount = Number(patch.amount) || 0
  if ('date' in patch) row.date = patch.date || null
  const { error } = await supabase.from('business_expenses').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('business_expenses').delete().eq('id', id)
  if (error) throw error
}
