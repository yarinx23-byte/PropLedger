export const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n || 0))

export const fmtUSDSigned = (n) => {
  const v = Number(n || 0)
  return (v >= 0 ? '+' : '') + fmtUSD(v)
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 'YYYY-MM' key for a year + 0-indexed month
export const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`

export const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
