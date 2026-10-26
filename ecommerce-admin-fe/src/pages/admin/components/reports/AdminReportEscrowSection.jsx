import { HiOutlineCreditCard } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminReportEscrowSection({
  detail,
  isDark,
}) {
  const escrow = detail?.escrow

  // Parse số tiền từ escrow hoặc fallback từ targetInfo
  let totalAmount = Number(escrow?.amount || 0)
  if (!totalAmount && detail?.targetInfo) {
    const match = detail.targetInfo.match(/Tổng tiền:\s*([\d.]+)/)
    if (match && match[1]) {
      totalAmount = Number(match[1].replace(/\./g, ''))
    }
  }

  const formatVND = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val)
  }

  const escrowStatus = escrow?.status || (detail?.status === 'APPROVED' ? 'REFUNDED' : 'HELD')
  const paymentMethod = escrow?.paymentMethod || 'VÍ SÀN / VNPAY'

  const getEscrowStatusBadge = (status) => {
    switch (status) {
      case 'RELEASED':
        return {
          label: 'Đã giải ngân Shop',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'REFUNDED':
        return {
          label: 'Đã hoàn tiền Khách',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        }
      case 'DISPUTED':
        return {
          label: 'Đang tranh chấp Escrow',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'HELD':
      default:
        return {
          label: 'Đang tạm giữ an toàn',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
    }
  }

  const statusBadge = getEscrowStatusBadge(escrowStatus)

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        isDark
          ? 'bg-slate-800/40 border-slate-700/70 text-slate-200'
          : 'bg-amber-50/30 border-amber-200/70 text-stone-800',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
          <HiOutlineCreditCard className="h-5 w-5" />
        </span>
        <div>
          <span className="text-[11px] text-stone-400 dark:text-slate-400 block font-medium">
            Tiền đơn hàng (Ký quỹ) • Phương thức: <strong className="text-stone-700 dark:text-slate-200">{paymentMethod}</strong>
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
            {formatVND(totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase shadow-xs',
            statusBadge.className,
          )}
        >
          {statusBadge.label}
        </span>
      </div>
    </div>
  )
}
