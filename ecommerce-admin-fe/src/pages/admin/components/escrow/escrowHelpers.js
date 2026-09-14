export const ADMIN_ESCROW_STATUSES = [
  { value: '', label: 'All status' },
  { value: 'HELD', label: 'Held' },
  { value: 'PARTIALLY_RELEASED', label: 'Partially released' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'CANCELED', label: 'Canceled' },
]

export const shortEscrowId = (value) => {
  if (!value) return '-'
  const str = String(value)
  return `${str.slice(0, 8)}...${str.slice(-4)}`
}

export const formatEscrowDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export const formatEscrowCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export const escrowStatusBadgeClass = (status, isDark) => {
  switch (status) {
    case 'HELD':
      return isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'
    case 'PARTIALLY_RELEASED':
      return isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
    case 'RELEASED':
      return isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    case 'PARTIALLY_REFUNDED':
      return isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700'
    case 'REFUNDED':
      return isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
    case 'DISPUTED':
      return isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-700'
    case 'CANCELED':
      return isDark ? 'bg-slate-500/15 text-slate-300' : 'bg-slate-100 text-slate-700'
    default:
      return isDark ? 'bg-slate-500/15 text-slate-300' : 'bg-slate-100 text-slate-700'
  }
}

export const canReleaseEscrow = (status) => status === 'HELD' || status === 'PARTIALLY_RELEASED'
