import {
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineTruck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { formatOrderDate } from '../../../../lib/orderStatus'

export default function SellerReturnTimeline({ returnInfo, isSettled, isDark }) {
  if (returnInfo.status === 'CANCELLED' || isSettled) return null

  const hasAnyDeadline =
    (returnInfo.buyerShipmentDeadline && returnInfo.status === 'WAITING_FOR_SHIPMENT') ||
    (returnInfo.sellerInspectionDeadline && returnInfo.status === 'RETURNED') ||
    returnInfo.returnTrackingCode

  if (!hasAnyDeadline) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
      {/* Hạn chót người mua gửi hàng (3 ngày) */}
      {returnInfo.buyerShipmentDeadline && returnInfo.status === 'WAITING_FOR_SHIPMENT' && (
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center gap-2.5',
            isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
          )}
        >
          <HiOutlineClock className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót người mua gửi hàng:</p>
            <p className="font-bold">{formatOrderDate(returnInfo.buyerShipmentDeadline)}</p>
          </div>
        </div>
      )}

      {/* Hạn chót Shop kiểm hàng (72 giờ) */}
      {returnInfo.sellerInspectionDeadline && returnInfo.status === 'RETURNED' && (
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center gap-2.5 sm:col-span-2',
            isDark ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' : 'border-purple-200 bg-purple-50 text-purple-900'
          )}
        >
          <HiOutlineShieldCheck className="h-5 w-5 text-purple-500 shrink-0" />
          <div>
            <p className="font-bold text-xs">Hạn chót Shop kiểm tra hàng (72 giờ):</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Bạn có thời hạn đến <strong>{formatOrderDate(returnInfo.sellerInspectionDeadline)}</strong> để kiểm tra bưu kiện. Sau thời gian này nếu Shop không phản hồi, hệ thống sẽ tự động hoàn 100% tiền cho Khách hàng.
            </p>
          </div>
        </div>
      )}

      {/* Vận đơn hoàn GHN */}
      {returnInfo.returnTrackingCode && (
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center gap-2.5',
            isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
          )}
        >
          <HiOutlineTruck className="h-4 w-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-[11px] text-stone-400 dark:text-slate-400">Vận đơn hoàn (GHN):</p>
            <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {returnInfo.returnTrackingCode}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
