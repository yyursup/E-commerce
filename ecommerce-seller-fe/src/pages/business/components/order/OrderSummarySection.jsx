import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineReceiptTax,
} from 'react-icons/hi'

const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED']

export default function OrderSummarySection({ order, isDark, returnInfo }) {
  const showEscrowHeld = ESCROW_HELD_STATUSES.includes(order?.status)
  const showEscrowDelivered = order?.status === 'DELIVERED'
  const showEscrowCompleted = order?.status === 'COMPLETED'
  const isRefunded =
    order?.status === 'REFUNDED' ||
    (returnInfo || order?.returnInfo)?.status === 'COMPLETED'

  const subtotal = Number(order?.subtotal || 0)
  const shopDiscount = Number(order?.shopDiscountAmount || 0)
  const platformDiscount = Number(order?.platformDiscountAmount || 0)
  const platformCommission = Number(order?.platformCommission || 0)
  
  // Tỷ lệ hoa hồng (%)
  const commissionRate = order.commissionRate != null 
    ? Number(order.commissionRate)
    : (subtotal > 0 && platformCommission > 0 ? Number(((platformCommission / subtotal) * 100).toFixed(1)) : null)

  // Shop net expected income = subtotal - shopDiscountAmount - platformCommission
  const shopNetIncome = Math.max(0, subtotal - shopDiscount - platformCommission)

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
          Tóm Tắt Chi Phí & Doanh Thu
        </h3>

        {/* 1. Tạm tính hàng hóa */}
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-stone-600'}>
            Tạm tính ({order.items?.reduce((a, b) => a + (b.quantity || 1), 0) || 0} sản phẩm)
          </span>
          <span className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* 2. Phí vận chuyển GHN */}
        <div className="flex justify-between text-sm">
          <span className={cn('flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-600')}>
            <HiOutlineTruck className="h-4 w-4 text-indigo-500" />
            <span>Phí vận chuyển (GHN Express)</span>
          </span>
          <span className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(order?.shippingFee || 0)}
          </span>
        </div>

        {/* 3. Giảm giá Voucher Shop */}
        {shopDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <HiOutlineTag className="h-3.5 w-3.5" />
                Voucher Shop {order.shopVoucherCode && `(${order.shopVoucherCode})`}
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">(Shop chịu phí giảm)</span>
            </span>
            <span className="font-bold text-rose-500">
              -{formatCurrency(shopDiscount)}
            </span>
          </div>
        )}

        {/* 4. Giảm giá Voucher Sàn */}
        {platformDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <HiOutlineTag className="h-3.5 w-3.5" />
                Voucher Sàn {order.platformVoucherCode && `(${order.platformVoucherCode})`}
              </span>
              <span className="text-xs text-emerald-500 font-medium hidden sm:inline">(Sàn E-commerce tài trợ 100%)</span>
            </span>
            <span className="font-bold text-blue-500">
              -{formatCurrency(platformDiscount)}
            </span>
          </div>
        )}

        {/* 5. Hoa hồng sàn (Phí dịch vụ nền tảng) */}
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <HiOutlineReceiptTax className="h-3.5 w-3.5" />
              Hoa hồng sàn {commissionRate != null ? `(${commissionRate}%)` : ''}
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">(Phí dịch vụ nền tảng)</span>
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            -{formatCurrency(platformCommission)}
          </span>
        </div>

        {/* 6. Phương thức thanh toán */}
        <div className="flex justify-between items-center text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-stone-600'}>
            Phương thức thanh toán
          </span>
          <div className="text-right space-y-1">
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border',
              order.paymentMethod === 'VNPAY'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                : order.paymentMethod === 'WALLET'
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            )}>
              {order.paymentMethod === 'VNPAY'
                ? 'VNPAY (Trực tuyến)'
                : order.paymentMethod === 'WALLET'
                  ? 'Ví sàn (Ký quỹ)'
                  : 'COD (Tiền mặt khi nhận)'}
            </span>
            {isRefunded && (
              <span className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                ↳ Hoàn tiền: Ví số dư người mua
              </span>
            )}
          </div>
        </div>

        {/* 7. Grand Total (Khách thanh toán) */}
        <div className="border-t border-stone-200 dark:border-slate-800 pt-3 flex items-baseline justify-between">
          <div>
            <span className={cn('text-base font-bold block', isDark ? 'text-white' : 'text-stone-900')}>
              Tổng Khách Hàng Thanh Toán
            </span>
            <span className="text-xs text-stone-400">Đã bao gồm VAT & phí giao hàng GHN</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-500">
            {formatCurrency(order?.total || 0)}
          </span>
        </div>

        {/* 7. Doanh thu dự kiến Shop nhận */}
        <div
          className={cn(
            'p-4 rounded-2xl border flex items-center justify-between',
            isRefunded
              ? (isDark ? 'border-slate-700 bg-slate-800/40' : 'border-stone-200 bg-stone-100/70')
              : (isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50/70')
          )}
        >
          <div>
            <p className={cn('text-xs font-bold uppercase tracking-wider', isRefunded ? 'text-stone-500 dark:text-slate-400' : isDark ? 'text-amber-400' : 'text-amber-800')}>
              {isRefunded ? 'Thực nhận của Shop (Đã hoàn tiền)' : 'Thực nhận dự kiến của Shop'}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {isRefunded
                ? 'Đơn hàng đã hoàn tất thủ tục hoàn tiền cho Người mua'
                : `= Tạm tính - Voucher Shop - Hoa hồng sàn ${commissionRate != null ? `(${commissionRate}%)` : ''} (Voucher Sàn không trừ tiền của Shop)`}
            </p>
          </div>
          <span className={cn('text-lg font-black', isRefunded ? 'text-stone-500 line-through' : 'text-amber-600 dark:text-amber-400')}>
            {isRefunded ? formatCurrency(0) : formatCurrency(shopNetIncome)}
          </span>
        </div>
      </div>

      {/* Escrow Status for Seller */}
      {(showEscrowHeld || showEscrowDelivered || showEscrowCompleted || isRefunded) && (
        <div className="border-t border-stone-200 dark:border-slate-800 pt-4">
          <h4 className={cn('text-xs font-bold uppercase tracking-wider mb-3 text-stone-400')}>
            Bảo Đảm Ký Quỹ Escrow (An Toàn Dòng Tiền)
          </h4>

          {isRefunded && (() => {
            const activeReturn = returnInfo || order?.returnInfo
            const isReturnProcess = Boolean(activeReturn && activeReturn.status !== 'CANCELLED')
            const outboundFee = Number(order?.shippingFee || 0)
            const returnFee = Number(activeReturn?.shippingFee || outboundFee)
            const totalReturnShipping = outboundFee + returnFee
            const merchandiseRefund = Math.max(0, Number(order?.total || 0) - outboundFee)

            return (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-2xl p-4 border',
                  isDark ? 'bg-blue-500/10 border-blue-500/25' : 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-blue-500/20 shrink-0">
                  <HiOutlineShieldCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className={cn('text-sm font-bold', isDark ? 'text-blue-400' : 'text-blue-900')}>
                    {isReturnProcess
                      ? 'Đơn hàng đã hoàn tất đổi trả & Hoàn tiền'
                      : 'Đơn hàng đã hoàn tiền hàng (Khách giữ hàng)'}
                  </p>
                  {isReturnProcess ? (
                    <div className="space-y-1 leading-relaxed">
                      <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                        Hệ thống đã bồi hoàn 100% tiền đơn ({formatCurrency(order?.total || 0)}) từ Ký quỹ Escrow về Ví người mua.
                      </p>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 space-y-0.5 font-mono text-[11px]">
                        <div className="flex justify-between font-bold">
                          <span className="font-sans">Cước 2 chiều đã trích Quỹ ký quỹ Shop:</span>
                          <span>{formatCurrency(totalReturnShipping)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-slate-400">
                          <span className="font-sans">• Chiều đi ban đầu:</span>
                          <span>{formatCurrency(outboundFee)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-slate-400">
                          <span className="font-sans">• Chiều về thu gom:</span>
                          <span>{formatCurrency(returnFee)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 leading-relaxed">
                      <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                        Đã hoàn tiền hàng <strong className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(merchandiseRefund)}</strong> về Ví người mua do Shop đồng ý thương lượng.
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        * Cước vận chuyển chiều đi ({formatCurrency(outboundFee)}) được chuyển cho Sàn thanh toán cho GHN vì chuyến giao hàng thành công. Quỹ ký quỹ của Shop không bị trích.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {!isRefunded && showEscrowHeld && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl p-4 border',
                isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              )}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-amber-500/20 shrink-0">
                <HiOutlineLockClosed className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                <p className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-900')}>
                  Tiền đang được bảo vệ trong Ký quỹ Escrow
                </p>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Số tiền thực nhận <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(shopNetIncome)}</strong> đang được khóa an toàn và sẽ được giải phóng ngay khi khách hàng xác nhận đã nhận hàng.
                </p>
              </div>
            </div>
          )}

          {!isRefunded && showEscrowDelivered && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl p-4 border',
                isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              )}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-blue-500/20 shrink-0">
                <HiOutlineClock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className={cn('text-sm font-bold', isDark ? 'text-blue-400' : 'text-blue-900')}>
                  Đã giao hàng – Chờ khách hàng xác nhận
                </p>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Tiền ký quỹ sẽ tự động được giải phóng vào ví của shop sau <strong>3 ngày</strong> kể từ khi giao thành công nếu người mua không gửi khiếu nại.
                </p>
              </div>
            </div>
          )}

          {!isRefunded && showEscrowCompleted && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl p-4 border',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-emerald-500/20 shrink-0">
                <HiOutlineShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className={cn('text-sm font-bold', isDark ? 'text-emerald-400' : 'text-emerald-900')}>
                  Ký quỹ Escrow hoàn tất – Tiền đã vào ví Shop
                </p>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Đơn hàng đã hoàn thành trọn vẹn. Tiền bán hàng đã được chuyển vào số dư khả dụng của bạn.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
