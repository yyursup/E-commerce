import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'

const statusBadgeClass = (status, isDark) => {
  switch (status) {
    case 'APPROVED':
      return isDark
        ? 'bg-emerald-500/15 text-emerald-300'
        : 'bg-emerald-100 text-emerald-700'
    case 'REJECTED':
      return isDark
        ? 'bg-red-500/15 text-red-300'
        : 'bg-red-100 text-red-700'
    case 'PENDING':
    default:
      return isDark
        ? 'bg-amber-500/15 text-amber-300'
        : 'bg-amber-100 text-amber-700'
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const shortId = (value) => {
  if (!value) return '-'
  return `${String(value).slice(0, 8)}...`
}

export default function AdminRequests() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [requests, setRequests] = useState([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await requestService.getAdminRequests({ page, size })
      const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
      setRequests(content)
      setTotalPages(typeof res?.totalPages === 'number' ? res.totalPages : 0)
      setTotalElements(typeof res?.totalElements === 'number' ? res.totalElements : content.length)
    } catch (err) {
      console.error('Admin request list error:', err)
      setError(err?.message || 'Failed to load requests.')
      toast.error(err?.message || 'Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin requests</h1>
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Total: {totalElements}
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition',
            isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-white text-stone-700 hover:bg-stone-100',
          )}
        >
          Refresh
        </button>
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
          <div className="col-span-3">Request</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
            Loading requests...
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-6 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-stone-500 dark:text-slate-400">
            No requests found.
          </div>
        )}

        {!loading && !error && requests.map((req) => (
          <div
            key={req.requestId || req.id}
            className={cn(
              'grid grid-cols-12 items-center gap-3 px-6 py-4 text-sm',
              isDark ? 'border-slate-800 text-slate-200' : 'border-stone-100 text-stone-700',
              'border-b last:border-b-0',
            )}
          >
            <div className="col-span-3 font-medium">{shortId(req.requestId)}</div>
            <div className="col-span-2 text-xs font-semibold uppercase">{req.type || '-'}</div>
            <div className="col-span-2">
              <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', statusBadgeClass(req.status, isDark))}>
                {req.status || 'PENDING'}
              </span>
            </div>
            <div className="col-span-3 text-xs">{formatDate(req.createdAt)}</div>
            <div className="col-span-2 text-right">
              {req.requestId ? (
                <Link
                  to={`/admin/requests/${req.requestId}`}
                  className={cn(
                    'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                    isDark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
                  )}
                >
                  View
                </Link>
              ) : (
                <span className="text-xs text-stone-400">-</span>
              )}
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
