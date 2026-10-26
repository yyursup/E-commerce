import { useState, useMemo } from 'react'
import {
  HiOutlineDocumentReport,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineCash,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'
import { exportSellerSettlementCsv } from '../../../../utils/exportSettlementReport'
import toast from 'react-hot-toast'

export default function ExportSettlementModal({
  isOpen,
  onClose,
  orders = [],
  shopName = 'Gian Hàng Của Bạn',
  isDark,
}) {
  const [timePreset, setTimePreset] = useState('ALL') // ALL | TODAY | 7DAYS | THIS_MONTH | LAST_MONTH | CUSTOM
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Filter orders based on user selection
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const now = new Date()

    return orders.filter((order) => {
      // 1. Time filter
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt)

        if (timePreset === 'TODAY') {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          if (!isToday) return false
        } else if (timePreset === '7DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (orderDate < sevenDaysAgo) return false
        } else if (timePreset === 'THIS_MONTH') {
          const isThisMonth =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          if (!isThisMonth) return false
        } else if (timePreset === 'LAST_MONTH') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
          const isLastMonth =
            orderDate.getMonth() === lastMonth &&
            orderDate.getFullYear() === lastMonthYear
          if (!isLastMonth) return false
        } else if (timePreset === 'CUSTOM') {
          if (customStartDate) {
            const start = new Date(customStartDate)
            start.setHours(0, 0, 0, 0)
            if (orderDate < start) return false
          }
          if (customEndDate) {
            const end = new Date(customEndDate)
            end.setHours(23, 59, 59, 999)
            if (orderDate > end) return false
          }
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        const breakdown = order.settlementBreakdown
        const sStatus = breakdown?.settlementStatus || (
          order.status === 'CANCELLED' ? 'CANCELLED' :
          order.status === 'REFUNDED' ? 'REFUNDED' :
          order.status === 'COMPLETED' ? 'SETTLED' :
          order.status === 'DELIVERED' ? 'IN_EXPERIENCE_WINDOW' : 'PENDING_ESCROW'
        )

        if (statusFilter === 'SETTLED' && sStatus !== 'SETTLED') return false
        if (statusFilter === 'IN_EXPERIENCE_WINDOW' && sStatus !== 'IN_EXPERIENCE_WINDOW') return false
        if (statusFilter === 'PENDING_ESCROW' && sStatus !== 'PENDING_ESCROW') return false
        if (statusFilter === 'REFUNDED' && sStatus !== 'REFUNDED') return false
        if (statusFilter === 'CANCELLED' && sStatus !== 'CANCELLED') return false
      }

      return true
    })
  }, [orders, timePreset, customStartDate, customEndDate, statusFilter])

  // Aggregate stats of filtered orders
  const stats = useMemo(() => {
    let subtotal = 0
    let commission = 0
    let netIncome = 0

    filteredOrders.forEach((o) => {
      const b = o.settlementBreakdown
      const st = Number(b?.merchandiseSubtotal ?? o.subtotal ?? 0)
      const com = Number(b?.platformCommissionFee ?? o.platformCommission ?? 0)
      const isRefunded = o.status === 'REFUNDED' || o.returnInfo?.status === 'COMPLETED'
      const isCancelled = o.status === 'CANCELLED'
      const net = Number(b?.sellerNetIncome ?? (isRefunded || isCancelled ? 0 : Math.max(0, st - Number(o.shopDiscountAmount || 0) - com)))

      subtotal += st
      commission += com
      netIncome += net
    })

    return {
      count: filteredOrders.length,
      subtotal,
      commission,
      netIncome,
    }
  }, [filteredOrders])

  if (!isOpen) return null

  const getRangeLabel = () => {
    switch (timePreset) {
      case 'TODAY':
        return 'Hôm nay'
      case '7DAYS':
        return '7 ngày gần nhất'
      case 'THIS_MONTH':
        return 'Tháng này'
      case 'LAST_MONTH':
        return 'Tháng trước'
      case 'CUSTOM':
        return `Từ ${customStartDate || 'đầu'} đến ${customEndDate || 'nay'}`
      case 'ALL':
      default:
        return 'Toàn bộ thời gian'
    }
  }

  const handleExport = () => {
    try {
      if (filteredOrders.length === 0) {
        toast.error('Không có đơn hàng nào khớp với bộ lọc đã chọn!')
        return
      }

      exportSellerSettlementCsv({
        orders: filteredOrders,
        shopName,
        filterRangeLabel: `${getRangeLabel()} (${statusFilter === 'ALL' ? 'Tất cả trạng thái' : statusFilter})`,
      })

      toast.success(`Đã xuất báo cáo đối soát (${filteredOrders.length} đơn hàng) thành công!`)
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi khi xuất file báo cáo')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className={cn(
          'relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border my-8 transition-all',
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-stone-200 text-stone-900'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <HiOutlineDocumentReport className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Xuất Báo Cáo Đối Soát Kế Toán</h3>
              <p className="text-xs text-stone-400">Định dạng file Excel / CSV chuẩn kế toán dòng tiền</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 transition-colors"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <HiOutlineCalendar className="h-4 w-4 text-amber-500" />
              1. Chọn Kỳ Đối Soát (Thời Gian)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'TODAY', label: 'Hôm nay' },
                { id: '7DAYS', label: '7 ngày' },
                { id: 'THIS_MONTH', label: 'Tháng này' },
                { id: 'LAST_MONTH', label: 'Tháng trước' },
                { id: 'CUSTOM', label: 'Tùy chọn' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTimePreset(preset.id)}
                  className={cn(
                    'py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all',
                    timePreset === preset.id
                      ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                      : isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {timePreset === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700">
                <div>
                  <span className="block text-xs text-stone-500 mb-1">Từ ngày:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={cn(
                      'w-full px-3 py-1.5 rounded-lg border text-xs',
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    )}
                  />
                </div>
                <div>
                  <span className="block text-xs text-stone-500 mb-1">Đến ngày:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={cn(
                      'w-full px-3 py-1.5 rounded-lg border text-xs',
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <HiOutlineFilter className="h-4 w-4 text-amber-500" />
              2. Lọc Trạng Thái Đối Soát
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-xl border text-xs font-medium',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
              )}
            >
              <option value="ALL">Tất cả trạng thái (Bao gồm hoàn tất, đang giao, hoàn tiền)</option>
              <option value="SETTLED">Đã giải ngân tất toán vào Ví Shop (SETTLED)</option>
              <option value="IN_EXPERIENCE_WINDOW">Đang trong 72h trải nghiệm kiểm hàng</option>
              <option value="PENDING_ESCROW">Đang tạm giữ an toàn trong Escrow</option>
              <option value="REFUNDED">Đã hoàn trả 100% cho Người mua</option>
              <option value="CANCELLED">Đã hủy đơn hàng</option>
            </select>
          </div>

          {/* Quick Summary Preview */}
          <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">Số đơn thỏa mãn bộ lọc:</span>
              <span className="font-bold font-mono text-amber-500">{stats.count} đơn hàng</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">Tổng doanh thu hàng hóa niêm yết:</span>
              <span className="font-bold font-mono">{formatCurrency(stats.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">Tổng phí hoa hồng sàn ước tính:</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400">-{formatCurrency(stats.commission)}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="font-bold text-xs">Tổng thực nhận về ví Shop:</span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredOrders.length === 0}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95',
              filteredOrders.length === 0
                ? 'bg-stone-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-amber-500/30'
            )}
          >
            <HiOutlineDownload className="h-4 w-4" />
            Tải Xuất File Excel / CSV ({filteredOrders.length} đơn)
          </button>
        </div>
      </div>
    </div>
  )
}
