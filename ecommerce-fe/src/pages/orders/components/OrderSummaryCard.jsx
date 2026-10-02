import {
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function OrderSummaryCard({
  order,
  isDark,
  formatCurrency,
  onPayNow,
}) {
  if (!order) return null

  const hasShopDiscount = Number(order.shopDiscountAmount) > 0
  const hasPlatformDiscount = Number(order.platformDiscountAmount) > 0
  const hasGeneralDiscount =
    Number(order.discountAmount) > 0 && !hasShopDiscount && !hasPlatformDiscount

  return (
    <div className="p-6">
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Tạm tính
          </span>
          <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(order.subtotal)}
          </span>
        </div>

        {/* Shipping Fee */}
        <div className="flex justify-between">
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Phí vận chuyển
          </span>
          <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(order.shippingFee || 0)}
          </span>
        </div>

        {/* Shop Voucher Discount */}
        {hasShopDiscount && (
          <div className="flex justify-between text-rose-600 dark:text-rose-400">
            <span className="text-sm flex items-center gap-1 font-medium">
              <HiOutlineTag className="h-4 w-4" />
              Voucher Shop {order.shopVoucherCode ? `(${order.shopVoucherCode})` : ''}
            </span>
            <span className="text-sm font-bold">
              -{formatCurrency(order.shopDiscountAmount)}
            </span>
          </div>
        )}

        {/* Platform Voucher Discount */}
        {hasPlatformDiscount && (
          <div className="flex justify-between text-blue-600 dark:text-blue-400">
            <span className="text-sm flex items-center gap-1 font-medium">
              <HiOutlineTag className="h-4 w-4" />
              Voucher Sàn {order.platformVoucherCode ? `(${order.platformVoucherCode})` : ''}
            </span>
            <span className="text-sm font-bold">
              -{formatCurrency(order.platformDiscountAmount)}
            </span>
          </div>
        )}

        {/* General Voucher Discount */}
        {hasGeneralDiscount && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-sm flex items-center gap-1 font-medium">
              <HiOutlineTag className="h-4 w-4" />
              Giảm giá voucher {order.voucherCode ? `(${order.voucherCode})` : ''}
            </span>
            <span className="text-sm font-bold">
              -{formatCurrency(order.discountAmount)}
            </span>
          </div>
        )}

        {/* GHN Tracking Code */}
        {order.ghnOrderCode && (
          <div className="flex justify-between">
            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Mã vận đơn GHN
            </span>
            <span className={cn('text-sm font-medium font-mono', isDark ? 'text-white' : 'text-stone-900')}>
              {order.ghnOrderCode}
            </span>
          </div>
        )}

        {/* Total Price */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-baseline">
            <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Tổng cộng
            </span>
            <span className={cn('text-lg font-bold font-mono text-rose-500 dark:text-rose-400')}>
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Payment Status / Escrow Protection Section */}
        {(order.status === 'REFUNDED' || order.returnInfo?.status === 'COMPLETED') ? (
          <div className="border-t pt-4 mt-4">
            <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-slate-300' : 'text-stone-700')}>
              Trạng thái hoàn tiền
            </h3>
            <div className="flex items-center gap-3 rounded-xl p-4 bg-blue-500/10 border border-blue-500/25">
              <div className="p-2 rounded-full bg-blue-500/15 shrink-0 text-blue-500">
                <HiOutlineShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Đã hoàn tiền về ví số dư tài khoản
                </p>
                <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Số tiền hoàn: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(order.total)}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : !['PENDING_PAYMENT', 'CANCELLED'].includes(order.status) && (
          <div className="border-t pt-4 mt-4">
            <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-slate-300' : 'text-stone-700')}>
              {order.paymentMethod === 'COD' ? 'Phương thức & Thanh toán' : 'Trạng thái thanh toán (Ký quỹ Escrow)'}
            </h3>

            {order.paymentMethod === 'COD' ? (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl p-4',
                  isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-stone-50 border border-stone-200',
                )}
              >
                <div className="mt-0.5 p-2 rounded-full bg-emerald-500/10 shrink-0">
                  <HiOutlineTruck className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    {order.status === 'COMPLETED'
                      ? 'Đã thanh toán tiền mặt khi nhận hàng'
                      : 'Thanh toán khi nhận hàng'}
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {order.status === 'COMPLETED'
                      ? `Bạn đã thanh toán ${formatCurrency(order.total)} cho nhân viên giao hàng khi nhận kiện hàng.`
                      : `Vui lòng chuẩn bị sẵn số tiền mặt ${formatCurrency(order.total)} để thanh toán trực tiếp cho nhân viên giao hàng khi nhận hàng.`}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                  <div
                    className={cn(
                      'flex items-start gap-3 rounded-xl p-4',
                      isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100',
                    )}
                  >
                    <div className="mt-0.5 p-2 rounded-full bg-amber-500/10 shrink-0">
                      <HiOutlineLockClosed className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                        Tiền đang được giữ an toàn (Ký quỹ Escrow)
                      </p>
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Số tiền <span className="font-semibold">{formatCurrency(order.subtotal || order.total)}</span> đang được giữ bởi hệ thống Escrow sàn.
                        Tiền sẽ chỉ giải ngân cho Người bán sau khi bạn xác nhận đã nhận hàng hài lòng.
                      </p>
                      {order.status === 'DELIVERED' && (
                        <p className={cn('mt-2 text-xs font-medium', isDark ? 'text-amber-300' : 'text-amber-600')}>
                          ⏱ Nếu bạn không xác nhận trong 3 ngày và không khiếu nại, hệ thống sẽ tự động giải ngân cho Người bán.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {order.status === 'COMPLETED' && order.paymentMethod !== 'COD' && (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl p-4 mt-3',
                  isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-100',
                )}
              >
                <div className="mt-0.5 p-2 rounded-full bg-emerald-500/10 shrink-0">
                  <HiOutlineShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    Giao dịch hoàn tất – Tiền đã giải ngân cho Người bán
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Tiền ký quỹ đã được giải ngân thành công cho gian hàng. Cảm ơn bạn đã mua sắm trên sàn!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Button for PENDING_PAYMENT */}
        {order.status === 'PENDING_PAYMENT' && onPayNow && (
          <div className="border-t pt-4 mt-4">
            <button
              type="button"
              onClick={onPayNow}
              className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
            >
              Thanh toán ngay ({formatCurrency(order.total)})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
