import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineClipboardList,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import sellerService from '../../services/seller'
import toast from 'react-hot-toast'

export default function ShopInventoryHistory() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const loadHistory = async (p = 0) => {
    try {
      setLoading(true)
      const data = await sellerService.getInventoryHistory(p, 15)
      setHistory(data?.content || [])
      setTotalPages(data?.totalPages || 1)
      setPage(p)
    } catch (err) {
      console.error('Load inventory history error:', err)
      toast.error(err?.message || 'Không thể tải lịch sử kho hàng.')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory(0)
  }, [])

  const filtered = history.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return item.productName?.toLowerCase().includes(q) || item.variantName?.toLowerCase().includes(q)
  })

  const getActionBadge = (action) => {
    switch (action) {
      case 'PRODUCT_CREATED':
        return { label: 'Khởi tạo', color: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' }
      case 'STOCK_UPDATED':
        return { label: 'Cập nhật', color: 'bg-blue-500/15 text-blue-500 border border-blue-500/30' }
      case 'ORDER_PLACED':
        return { label: 'Đơn hàng mới', color: 'bg-rose-500/15 text-rose-500 border border-rose-500/30' }
      case 'ORDER_CANCELLED':
        return { label: 'Hủy đơn', color: 'bg-amber-500/15 text-amber-500 border border-amber-500/30' }
      case 'MANUAL_ADJUSTMENT':
        return { label: 'Điều chỉnh', color: 'bg-purple-500/15 text-purple-500 border border-purple-500/30' }
      default:
        return { label: action, color: 'bg-slate-500/15 text-slate-500 border border-slate-500/30' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight flex items-center gap-2', isDark ? 'text-white' : 'text-stone-900')}>
            <HiOutlineClipboardList className="h-6 w-6 text-amber-500" />
            Lịch sử Kho hàng
          </h1>
          <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi mọi thay đổi về số lượng tồn kho của sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => loadHistory(page)}
            disabled={loading}
            className={cn(
              'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
              isDark
                ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
            title="Tải lại danh sách"
          >
            <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, phân loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs border outline-none transition-all focus:ring-2 focus:ring-amber-500/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
            )}
          />
          <HiOutlineSearch className={cn('absolute left-3.5 top-3 h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
        </div>
      </div>

      {/* Data Table */}
      <div className={cn(
        'rounded-3xl border shadow-sm overflow-hidden transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn(
              'text-xs uppercase border-b',
              isDark ? 'bg-slate-800/50 text-slate-400 border-slate-800' : 'bg-stone-50 text-stone-500 border-stone-200'
            )}>
              <tr>
                <th className="px-6 py-4 font-bold">Thời gian</th>
                <th className="px-6 py-4 font-bold">Sản phẩm</th>
                <th className="px-6 py-4 font-bold text-center">Tồn cũ</th>
                <th className="px-6 py-4 font-bold text-center">Thay đổi</th>
                <th className="px-6 py-4 font-bold text-center">Tồn mới</th>
                <th className="px-6 py-4 font-bold">Loại thao tác</th>
                <th className="px-6 py-4 font-bold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
                    <p className={cn('mt-2 text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-xs font-medium text-stone-500 dark:text-slate-400">
                    Không có lịch sử nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const badge = getActionBadge(item.actionType)
                  const isPositive = item.changeAmount > 0
                  const isNegative = item.changeAmount < 0

                  return (
                    <tr key={item.id} className={cn('hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors')}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-stone-900 dark:text-slate-200">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-stone-900 dark:text-slate-200 max-w-[200px] truncate" title={item.productName}>
                          {item.productName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                          {item.variantName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-stone-600 dark:text-slate-300">
                        {item.oldStock}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'inline-flex font-bold px-2 py-0.5 rounded text-xs',
                          isPositive ? 'text-emerald-500 bg-emerald-500/10' :
                          isNegative ? 'text-rose-500 bg-rose-500/10' :
                          'text-stone-500 bg-stone-500/10 dark:text-slate-300 dark:bg-slate-800'
                        )}>
                          {isPositive ? '+' : ''}{item.changeAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-stone-900 dark:text-white">
                        {item.newStock}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-1 text-[11px] font-bold rounded-lg', badge.color)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-stone-600 dark:text-slate-300 max-w-[200px] break-words">
                          {item.note || '-'}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-slate-400">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => loadHistory(page - 1)}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => loadHistory(page + 1)}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
