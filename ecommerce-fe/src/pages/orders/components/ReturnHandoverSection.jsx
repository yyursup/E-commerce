import { HiOutlineTruck, HiOutlineShieldCheck } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function ReturnHandoverSection({
  returnInfo,
  isDark,
  submitting,
  defaultCarrier,
  defaultTracking,
  onHandoverToCarrier,
  onConfirmDelivered,
}) {
  if (!returnInfo) return null

  return (
    <>
      {/* 1. Vận chuyển hoàn tự động qua GHN khi WAITING_FOR_SHIPMENT */}
      {returnInfo.status === 'WAITING_FOR_SHIPMENT' && (
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-3.5',
            isDark ? 'border-amber-500/30 bg-slate-800/60' : 'border-amber-300 bg-amber-50/50',
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <HiOutlineTruck className="h-4 w-4" /> Đơn vị vận chuyển hoàn hàng chỉ định
            </span>
            <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              Miễn phí (Người bán chịu phí hoàn hàng)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div
              className={cn(
                'p-3 rounded-xl border',
                isDark ? 'border-slate-700 bg-slate-800/70' : 'border-stone-200 bg-white',
              )}
            >
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Đơn vị tiếp nhận bưu kiện:
              </p>
              <p
                className={cn(
                  'font-bold text-sm mt-0.5 flex items-center gap-2',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                <span>{defaultCarrier}</span>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                    isDark
                      ? 'text-amber-400 bg-amber-500/15 border-amber-500/25'
                      : 'text-amber-800 bg-amber-50 border-amber-300',
                  )}
                >
                  Mặc định sàn
                </span>
              </p>
            </div>

            <div
              className={cn(
                'p-3 rounded-xl border',
                isDark ? 'border-slate-700 bg-slate-800/70' : 'border-stone-200 bg-white',
              )}
            >
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Mã vận đơn thu hồi (Tự động):
              </p>
              <p
                className={cn(
                  'font-bold font-mono text-sm mt-0.5 px-2 py-0.5 rounded inline-block border',
                  isDark
                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                    : 'text-amber-800 bg-amber-50 border-amber-300',
                )}
              >
                {defaultTracking}
              </p>
            </div>
          </div>

          <div
            className={cn(
              'text-[11px] leading-relaxed space-y-1',
              isDark ? 'text-slate-400' : 'text-stone-500',
            )}
          >
            <p>
              • Bưu tá GHN sẽ liên hệ lấy hàng hoàn tại địa chỉ của bạn hoặc bạn có thể gửi kiện hàng tại bưu cục GHN gần nhất.
            </p>
            <p>• Vui lòng đóng gói sản phẩm cẩn thận trước khi bàn giao cho bưu tá.</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={onHandoverToCarrier}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 transition shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <HiOutlineTruck className="h-4 w-4" />
              {submitting ? 'Đang cập nhật...' : 'Xác nhận đã bàn giao hàng cho shipper GHN'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Khi đang giao (SHIPPED): Xác nhận đã giao hàng cho Shop */}
      {returnInfo.status === 'SHIPPED' && (
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-blue-600 dark:text-blue-400">
              Kiện hàng đang trên đường vận chuyển hoàn
            </p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
              (Môi trường Sandbox): Khi kiện hàng đã được giao tới địa chỉ của Shop, bạn bấm xác nhận bên dưới để chuyển sang trạng thái <strong>Đã giao</strong> (Shop bắt đầu 72h kiểm hàng).
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirmDelivered}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shrink-0 inline-flex items-center gap-1.5"
          >
            <HiOutlineTruck className="h-4 w-4" />
            {submitting ? 'Đang xử lý...' : 'Xác nhận đã giao cho Shop'}
          </button>
        </div>
      )}

      {/* 3. Khi ĐÃ GIAO (RETURNED): Shop đang có 72h kiểm hàng */}
      {returnInfo.status === 'RETURNED' && (
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 text-xs space-y-1">
          <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <HiOutlineShieldCheck className="h-4 w-4" />
            Đã giao hàng hoàn đến Shop — Shop đang kiểm tra hàng (72 giờ)
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
            Kiện hàng đã được giao thành công cho Shop. Shop đang tiến hành kiểm tra tình trạng hàng hóa. Nếu hàng nguyên vẹn, sàn sẽ hoàn 100% tiền về ví của bạn. Nếu sau 72h Shop không phản hồi, hệ thống sẽ tự động hoàn tiền cho bạn.
          </p>
        </div>
      )}
    </>
  )
}
