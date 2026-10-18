import {
  HiOutlineCash,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineScale,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
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

  const commissionFee = Number(escrow?.platformCommission || (totalAmount * 0.05))
  const netSellerAmount = Math.max(0, totalAmount - commissionFee)

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
        'rounded-2xl border p-4 sm:p-5 transition-all shadow-xs',
        isDark
          ? 'bg-slate-800/40 border-slate-700/70 text-slate-200'
          : 'bg-amber-50/30 border-amber-200/70 text-stone-800',
      )}
    >
      {/* Tiêu đề & Trạng thái Escrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b dark:border-slate-700/60 border-amber-200/60">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
            <HiOutlineShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
              Ký Quỹ Escrow & Điều Phối Dòng Tiền Đơn Hàng
            </h4>
            <p className="text-[11px] text-stone-400 dark:text-slate-400">
              Cơ chế ký quỹ bảo vệ giao dịch kép (Dual Escrow Engine)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase shadow-xs',
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Lưới số liệu tài chính đối soát */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5">
        <div
          className={cn(
            'p-3 rounded-xl border',
            isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-stone-200/80',
          )}
        >
          <span className="text-[11px] text-stone-400 dark:text-slate-400 block font-medium">
            Tiền ký quỹ tạm giữ
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
            {formatVND(totalAmount)}
          </span>
        </div>

        <div
          className={cn(
            'p-3 rounded-xl border',
            isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-stone-200/80',
          )}
        >
          <span className="text-[11px] text-stone-400 dark:text-slate-400 block font-medium">
            Phương thức thanh toán
          </span>
          <span className="text-xs sm:text-sm font-bold text-stone-700 dark:text-slate-200 mt-1 block truncate">
            {paymentMethod}
          </span>
        </div>

        <div
          className={cn(
            'p-3 rounded-xl border',
            isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-stone-200/80',
          )}
        >
          <span className="text-[11px] text-stone-400 dark:text-slate-400 block font-medium">
            Phí hoa hồng sàn (5%)
          </span>
          <span className="text-xs sm:text-sm font-semibold font-mono text-stone-600 dark:text-slate-300 mt-0.5 block">
            {formatVND(commissionFee)}
          </span>
        </div>

        <div
          className={cn(
            'p-3 rounded-xl border',
            isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-stone-200/80',
          )}
        >
          <span className="text-[11px] text-stone-400 dark:text-slate-400 block font-medium">
            Shop thực nhận (nếu giải ngân)
          </span>
          <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {formatVND(netSellerAmount)}
          </span>
        </div>
      </div>

      {/* Cơ chế thi hành dòng tiền tự động gắn liền với phán quyết */}
      <div
        className={cn(
          'p-3 rounded-xl border text-[11px] space-y-1.5',
          isDark
            ? 'bg-slate-900/40 border-slate-700/50 text-slate-300'
            : 'bg-white/80 border-amber-200/50 text-stone-700',
        )}
      >
        <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
          <HiOutlineInformationCircle className="h-4 w-4 shrink-0" />
          <span>Cơ chế xử lý ký quỹ tự động từ Phán quyết Quản trị viên:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-stone-500 dark:text-slate-400">
          <li>
            <strong className="text-stone-700 dark:text-slate-200">Xác nhận vi phạm (Phạt Shop):</strong> Khi Admin chọn <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200">Hoàn tiền ngay</code>, hệ thống tự động hoàn 100% {formatVND(totalAmount)} từ Escrow về ví Khách hàng. Nếu chọn <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200">Trả hàng & hoàn tiền</code>, tiền tiếp tục được giữ đến khi Shop nhận lại hàng.
          </li>
          <li>
            <strong className="text-stone-700 dark:text-slate-200">Bác bỏ (Bảo vệ Shop):</strong> Khiếu nại kết thúc, hệ thống tự động giải ngân {formatVND(netSellerAmount)} (đã trừ 5% hoa hồng) vào Ví của Shop.
          </li>
        </ul>
      </div>
    </div>
  )
}
