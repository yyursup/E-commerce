import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { HiOutlineTruck } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { useThemeStore } from '../../../../store/useThemeStore'
import shippingFeeService from '../../../../services/shippingFees'
import AdminEscrowPagination from '../escrow/AdminEscrowPagination'
import { DIRECTION_OPTIONS, createdByLabel, directionLabel, formatVnd, payerLabel } from './shippingFeeHelpers'

export default function ShippingFeesTab() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [direction, setDirection] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [records, setRecords] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, size }
      if (direction) params.direction = direction
      const [data, sum] = await Promise.all([shippingFeeService.list(params), shippingFeeService.summary()])
      setRecords(data?.content || [])
      setTotalPages(data?.totalPages || 0)
      setTotalElements(data?.totalElements || 0)
      setSummary(sum)
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách phí vận chuyển')
    } finally {
      setLoading(false)
    }
  }, [page, size, direction])

  useEffect(() => {
    load()
  }, [load])

  const card = cn('rounded-2xl border p-4', isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200')
  const muted = isDark ? 'text-slate-400' : 'text-stone-500'

  return (
    <div className="space-y-5">
      <div className={cn('rounded-xl border p-4 text-xs leading-relaxed', isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-amber-50 border-amber-200 text-stone-700')}>
        Phí vận chuyển GHN của từng lần giao. Đây là tiền trả cho đơn vị vận chuyển, <strong>không tính vào doanh thu của sàn</strong>:
        chiều đi lấy từ phí người mua đã trả, chiều về trích từ quỹ ký quỹ của shop khi người mua thắng tranh chấp.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className={cn('text-xs', muted)}>Chiều đi ({summary?.outboundCount ?? 0} lần giao)</p>
          <p className="mt-1 text-xl font-black font-mono">{formatVnd(summary?.outboundTotal)}</p>
        </div>
        <div className={card}>
          <p className={cn('text-xs', muted)}>Chiều về ({summary?.returnCount ?? 0} lần giao)</p>
          <p className="mt-1 text-xl font-black font-mono">{formatVnd(summary?.returnTotal)}</p>
        </div>
        <div className={card}>
          <p className={cn('text-xs', muted)}>Tổng phí vận chuyển</p>
          <p className="mt-1 text-xl font-black font-mono text-indigo-500">{formatVnd(summary?.grandTotal)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <HiOutlineTruck className="h-5 w-5 text-amber-500" />
        <select
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value)
            setPage(0)
          }}
          className={cn('rounded-lg border px-3 py-2 text-xs', isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-stone-300')}
        >
          {DIRECTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={cn('overflow-x-auto rounded-2xl border', isDark ? 'border-slate-800' : 'border-stone-200')}>
        <table className="min-w-full text-xs">
          <thead className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-stone-50 text-stone-500'}>
            <tr>
              {['Đơn hàng', 'Chiều', 'Bên tạo đơn GHN', 'Mã vận đơn', 'Shop', 'Người mua', 'Phí', 'Ai chịu phí', 'Trạng thái'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className={cn('px-3 py-6 text-center', muted)}>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={9} className={cn('px-3 py-6 text-center', muted)}>
                  Chưa có lần giao hàng nào
                </td>
              </tr>
            )}
            {!loading &&
              records.map((r) => (
                <tr key={`${r.direction}-${r.orderId}-${r.trackingCode}`} className={cn('border-t', isDark ? 'border-slate-800' : 'border-stone-100')}>
                  <td className="px-3 py-2.5 font-mono font-semibold">{r.orderNumber}</td>
                  <td className="px-3 py-2.5">{directionLabel(r.direction)}</td>
                  <td className="px-3 py-2.5">{createdByLabel(r.createdBy)}</td>
                  <td className="px-3 py-2.5 font-mono">{r.trackingCode}</td>
                  <td className="px-3 py-2.5">{r.shopName || '-'}</td>
                  <td className="px-3 py-2.5">{r.buyerName || '-'}</td>
                  <td className="px-3 py-2.5 font-mono font-bold">{formatVnd(r.fee)}</td>
                  <td className="px-3 py-2.5">{payerLabel(r)}</td>
                  <td className="px-3 py-2.5">{r.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className={cn('text-xs', muted)}>Tổng cộng {totalElements} lần giao</p>
      <AdminEscrowPagination
        isDark={isDark}
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        pageSize={size}
        onPageChange={setPage}
      />
    </div>
  )
}
