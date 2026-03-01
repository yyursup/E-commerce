import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import escrowService from '../../services/escrow'

const ESCROW_STATUSES = [
  { value: '', label: 'All status' },
  { value: 'HELD', label: 'Held' },
  { value: 'PARTIALLY_RELEASED', label: 'Partially released' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'CANCELED', label: 'Canceled' },
]

const shortId = (value) => {
  if (!value) return '-'
  const str = String(value)
  return `${str.slice(0, 8)}...${str.slice(-4)}`
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const statusBadgeClass = (status, isDark) => {
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

const canRelease = (status) => status === 'HELD' || status === 'PARTIALLY_RELEASED'

export default function AdminEscrows() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const [escrows, setEscrows] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [releaseLoadingId, setReleaseLoadingId] = useState(null)

  const fetchEscrows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { page, size }
      if (statusFilter) params.status = statusFilter

      const res = await escrowService.getAdminEscrows(params)
      const content = Array.isArray(res?.content) ? res.content : []
      setEscrows(content)
      setTotalPages(typeof res?.totalPages === 'number' ? res.totalPages : 0)
      setTotalElements(typeof res?.totalElements === 'number' ? res.totalElements : content.length)
    } catch (err) {
      console.error('Admin escrow list error:', err)
      const message = err?.message || 'Failed to load escrows.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [page, size, statusFilter])

  useEffect(() => {
    fetchEscrows()
  }, [fetchEscrows])

  const handleRelease = async (escrow) => {
    if (!escrow?.orderId) return
    try {
      setReleaseLoadingId(escrow.escrowId)
      await escrowService.releaseByOrder(escrow.orderId)
      toast.success('Escrow released.')
      fetchEscrows()
    } catch (err) {
      console.error('Release escrow error:', err)
      toast.error(err?.message || 'Failed to release escrow.')
    } finally {
      setReleaseLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin escrows</h1>
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Total: {totalElements}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm outline-none transition',
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-amber-500/60'
                : 'border-stone-300 bg-white text-stone-700 focus:border-amber-500',
            )}
          >
            {ESCROW_STATUSES.map((status) => (
              <option key={status.value || 'all'} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchEscrows}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              isDark
                ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                : 'bg-white text-stone-700 hover:bg-stone-100',
            )}
          >
            Refresh
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'overflow-hidden rounded-2xl border shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="grid grid-cols-12 gap-3 border-b px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-slate-800 dark:text-slate-400">
          <div className="col-span-2">Escrow</div>
          <div className="col-span-2">Order</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
            Loading escrows...
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-6 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && escrows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-stone-500 dark:text-slate-400">
            No escrows found.
          </div>
        )}

        {!loading && !error && escrows.map((escrow) => (
          <div
            key={escrow.escrowId}
            className={cn(
              'grid grid-cols-12 items-center gap-3 px-6 py-4 text-sm border-b last:border-b-0',
              isDark ? 'border-slate-800 text-slate-200' : 'border-stone-100 text-stone-700',
            )}
          >
            <div className="col-span-2 font-medium" title={escrow.escrowId}>
              {shortId(escrow.escrowId)}
            </div>
            <div className="col-span-2">
              {escrow.orderId ? (
                <Link
                  to={`/admin/orders/${escrow.orderId}`}
                  className={cn(
                    'text-sm font-semibold underline',
                    isDark ? 'text-amber-300' : 'text-amber-700',
                  )}
                >
                  {escrow.orderNumber || shortId(escrow.orderId)}
                </Link>
              ) : (
                '-'
              )}
            </div>
            <div className="col-span-2">
              <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', statusBadgeClass(escrow.status, isDark))}>
                {escrow.status || '-'}
              </span>
            </div>
            <div className="col-span-2 text-xs">
              <p>{formatCurrency(escrow.amount)}</p>
              <p className={cn(isDark ? 'text-slate-500' : 'text-stone-500')}>
                Fee: {formatCurrency(escrow.platformCommission)}
              </p>
            </div>
            <div className="col-span-2 text-xs">{formatDate(escrow.createdAt)}</div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleRelease(escrow)}
                disabled={!canRelease(escrow.status) || releaseLoadingId === escrow.escrowId}
                className={cn(
                  'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                  !canRelease(escrow.status) || releaseLoadingId === escrow.escrowId
                    ? 'cursor-not-allowed opacity-50 bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-500'
                    : isDark
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                )}
              >
                {releaseLoadingId === escrow.escrowId ? 'Releasing...' : 'Release'}
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={cn(
              'rounded-lg px-4 py-2 font-semibold transition',
              page <= 0
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-white text-stone-700 hover:bg-stone-100',
            )}
          >
            Prev
          </button>
          <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              'rounded-lg px-4 py-2 font-semibold transition',
              page + 1 >= totalPages
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-white text-stone-700 hover:bg-stone-100',
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
