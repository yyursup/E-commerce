import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import escrowService from '../../../../services/escrow'
import { ADMIN_ESCROW_STATUSES } from '../escrow/escrowHelpers'
import AdminEscrowTable from '../escrow/AdminEscrowTable'
import AdminEscrowPagination from '../escrow/AdminEscrowPagination'

export default function OrderEscrowsTab() {
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
      const message = err?.message || 'Không thể tải danh sách escrow đơn hàng.'
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
      toast.success('Đã giải ngân cưỡng chế Escrow đơn hàng thành công.')
      fetchEscrows()
    } catch (err) {
      console.error('Release escrow error:', err)
      toast.error(err?.message || 'Giải phóng escrow thất bại.')
    } finally {
      setReleaseLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Danh Sách Tiền Tạm Giữ Đơn Hàng (Order Escrow)</h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tổng số: {totalElements} khoản thanh toán đang được giữ bảo lãnh giữa Người Mua và Người Bán
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
              'rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition',
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-amber-500'
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
              'rounded-xl px-4 py-2 text-xs font-semibold transition border shadow-sm',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
            )}
          >
            Làm mới
          </button>
        </div>
      </div>

      <div
        className={cn(
          'rounded-2xl border shadow-sm overflow-hidden',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <AdminEscrowTable
          escrows={escrows}
          loading={loading}
          error={error}
          onRelease={handleRelease}
          releaseLoadingId={releaseLoadingId}
          isDark={isDark}
        />
        <AdminEscrowPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isDark={isDark}
        />
      </div>
    </div>
  )
}
