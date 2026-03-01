import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import escrowService from '../../services/escrow'
import { ADMIN_ESCROW_STATUSES } from './components/escrow/escrowHelpers'
import AdminEscrowTable from './components/escrow/AdminEscrowTable'
import AdminEscrowPagination from './components/escrow/AdminEscrowPagination'

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
            {ADMIN_ESCROW_STATUSES.map((status) => (
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

      <AdminEscrowTable
        isDark={isDark}
        loading={loading}
        error={error}
        escrows={escrows}
        releaseLoadingId={releaseLoadingId}
        onRelease={handleRelease}
      />

      <AdminEscrowPagination
        isDark={isDark}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  )
}
