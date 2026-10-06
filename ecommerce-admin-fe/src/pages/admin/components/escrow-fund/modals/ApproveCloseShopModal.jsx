import { useState } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../../store/useThemeStore'
import { cn } from '../../../../../lib/cn'
import trustConfigService from '../../../../../services/trustConfig'

export default function ApproveCloseShopModal({ shop, onClose, onSuccess, formatVND }) {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const [submitting, setSubmitting] = useState(false)

  if (!shop) return null

  const handleApprove = async () => {
    try {
      setSubmitting(true)
      await trustConfigService.approveCloseShopRefund(shop.shopId)
      toast.success(`Đã phê duyệt đóng shop và hoàn ${formatVND(shop.balance)} về ví của gian hàng!`)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('Lỗi phê duyệt đóng shop:', err)
      toast.error(err?.message || 'Phê duyệt đóng shop thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        <h2 className="text-lg sm:text-xl font-bold text-emerald-500 flex items-center gap-2">
          <HiOutlineCheckCircle className="h-6 w-6 shrink-0" />
          Phê Duyệt Đóng Shop & Hoàn Quỹ
        </h2>
        <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Gian hàng yêu cầu: <span className="font-bold text-amber-500">{shop.shopName}</span>
        </p>

        <div className="mt-4 space-y-3 text-xs leading-relaxed">
          <div className={cn(
            'rounded-xl border p-3.5',
            isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50/90'
          )}>
            <p className={cn('font-bold text-xs sm:text-sm mb-1', isDark ? 'text-emerald-300' : 'text-emerald-900')}>
              Số tiền hoàn trả về Ví Người Bán:
            </p>
            <p className={cn('text-2xl font-black', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              {formatVND(shop.balance)}
            </p>
          </div>

          <div className={cn('rounded-xl border p-3.5 space-y-1.5', isDark ? 'border-slate-800 bg-slate-950/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-700')}>
            <p className="font-bold text-amber-500 flex items-center gap-1">
              <HiOutlineShieldCheck className="h-4 w-4" /> Hệ thống sẽ tự động re-validate:
            </p>
            <ul className={cn('list-disc pl-4 space-y-1 text-[11px]', isDark ? 'text-slate-400' : 'text-stone-600')}>
              <li>Không còn đơn hàng đang xử lý / vận chuyển / chờ giao.</li>
              <li>Tất cả đơn hoàn thành đã qua 7 ngày cooling period.</li>
              <li>Không có Escrow, Đổi trả hàng, Báo cáo hay Kháng cáo nào đang chờ giải quyết.</li>
              <li>Quỹ ký quỹ không ở trạng thái Thâm hụt (DEFICIT) hay Bị khóa (LOCKED).</li>
            </ul>
          </div>

          <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Sau khi phê duyệt, Quỹ chuyển sang <strong>REFUNDED</strong> và Trạng thái gian hàng chính thức chuyển sang <strong>CLOSED</strong>.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            )}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleApprove}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Đang duyệt...' : 'Xác nhận duyệt đóng shop'}
          </button>
        </div>
      </div>
    </div>
  )
}
