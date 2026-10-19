import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineReceiptTax,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineScale,
  HiOutlineCash,
} from 'react-icons/hi'

const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED']

export default function OrderSummarySection({ order, isDark, returnInfo }) {
  const breakdown = order?.settlementBreakdown
  const subtotal = Number(breakdown?.merchandiseSubtotal ?? order?.subtotal ?? 0)
  const shippingFee = Number(breakdown?.shippingFee ?? order?.shippingFee ?? 0)
  const shopDiscount = Number(breakdown?.shopDiscount ?? order?.shopDiscountAmount ?? 0)
  const platformDiscount = Number(breakdown?.platformDiscount ?? order?.platformDiscountAmount ?? 0)
  const buyerTotalPaid = Number(breakdown?.buyerTotalPaid ?? order?.total ?? 0)
  const platformCommission = Number(breakdown?.platformCommissionFee ?? order?.platformCommission ?? 0)
  const commissionBase = Number(breakdown?.commissionBaseAmount ?? Math.max(0, subtotal - shopDiscount))

  const isRefunded =
    order?.status === 'REFUNDED' ||
    (returnInfo || order?.returnInfo)?.status === 'COMPLETED'
  const isCancelled = order?.status === 'CANCELLED'

  // Commission rate (%)
  const commissionRate =
    breakdown?.commissionRate != null
      ? Number(breakdown.commissionRate)
      : order?.commissionRate != null
        ? Number(order.commissionRate)
        : subtotal > 0 && platformCommission > 0
          ? Number(((platformCommission / subtotal) * 100).toFixed(1))
          : null

  // Shop net expected income = subtotal - shopDiscountAmount - platformCommission
  const shopNetIncome =
    breakdown?.sellerNetIncome != null
      ? Number(breakdown.sellerNetIncome)
      : isRefunded || isCancelled
        ? 0
        : Math.max(0, subtotal - shopDiscount - platformCommission)

  const settlementStatus = breakdown?.settlementStatus || (
    isCancelled ? 'CANCELLED' :
    isRefunded ? 'REFUNDED' :
    order?.hasActiveDispute ? 'DISPUTE_FROZEN' :
    order?.status === 'COMPLETED' ? 'SETTLED' :
    order?.status === 'DELIVERED' ? 'IN_EXPERIENCE_WINDOW' : 'PENDING_ESCROW'
  )

  const showEscrowHeld = ESCROW_HELD_STATUSES.includes(order?.status)
  const showEscrowDelivered = order?.status === 'DELIVERED'
  const showEscrowCompleted = order?.status === 'COMPLETED'

  const getSettlementBadge = () => {
    switch (settlementStatus) {
      case 'SETTLED':
        return {
          icon: HiOutlineCheckCircle,
          label: 'Đã giải ngân tất toán',
          subLabel: 'Tiền đã vào ví khả dụng',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'IN_EXPERIENCE_WINDOW':
        return {
          icon: HiOutlineClock,
          label: 'Trong 72h trải nghiệm',
          subLabel: 'Chờ khách xác nhận hoặc hết hạn',
          classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        }
      case 'DISPUTE_FROZEN':
        return {
          icon: HiOutlineExclamationCircle,
          label: 'Đóng băng đối soát',
          subLabel: 'Đang khiếu nại / tranh chấp',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'REFUNDED':
        return {
          icon: HiOutlineShieldCheck,
          label: 'Đã hoàn tiền 100%',
          subLabel: 'Đã trả về ví người mua',
          classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        }
      case 'CANCELLED':
        return {
          icon: HiOutlineTag,
          label: 'Đã hủy đơn hàng',
          subLabel: 'Không phát sinh đối soát',
          classes: 'bg-stone-500/10 text-stone-500 dark:text-stone-400 border-stone-500/30',
        }
      case 'PENDING_ESCROW':
      default:
        return {
          icon: HiOutlineLockClosed,
          label: 'Tạm giữ trong Escrow',
          subLabel: 'Đang bảo đảm giao hàng',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
    }
  }

  const badge = getSettlementBadge()
  const BadgeIcon = badge.icon

  return (
    <div className="p-6 space-y-6">
      {/* 1. Header with Settlement Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className={cn('text-base font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-stone-900')}>
            <HiOutlineCash className="h-5 w-5 text-amber-500" />
            Bảng Kê Đối Soát Kế Toán Đơn Hàng
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Quyết toán dòng tiền minh bạch giữa Người mua, Shop và Sàn E-commerce
          </p>
        </div>
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold', badge.classes)}>
          <BadgeIcon className="h-4 w-4 shrink-0" />
          <div className="text-left">
            <span>{badge.label}</span>
            <span className="block text-[10px] font-normal opacity-80">{badge.subLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Dòng tiền thanh toán từ Người mua (Buyer Inflow) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          1. Dòng Tiền Người Mua Thanh Toán (Buyer Inflow)
        </h4>

        {/* Merchandise Subtotal */}
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-stone-600'}>
            Tạm tính hàng hóa ({order.items?.reduce((a, b) => a + (b.quantity || 1), 0) || 0} sản phẩm)
          </span>
          <span className={cn('font-semibold font-mono', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Shipping Fee */}
        <div className="flex justify-between text-sm">
          <span className={cn('flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-600')}>
            <HiOutlineTruck className="h-4 w-4 text-indigo-500" />
            <span>Cước giao hàng (GHN Express)</span>
          </span>
          <span className={cn('font-semibold font-mono', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(shippingFee)}
          </span>
        </div>

        {/* Shop Voucher Discount */}
        {shopDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <HiOutlineTag className="h-3.5 w-3.5" />
                Voucher Shop {order.shopVoucherCode && `(${order.shopVoucherCode})`}
              </span>
              <span className="text-xs text-rose-500/80 hidden sm:inline">(Shop tự chi trả giảm giá)</span>
            </span>
            <span className="font-bold font-mono text-rose-500">
              -{formatCurrency(shopDiscount)}
            </span>
          </div>
        )}

        {/* Platform Voucher Discount */}
        {platformDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <HiOutlineTag className="h-3.5 w-3.5" />
                Voucher Sàn {order.platformVoucherCode && `(${order.platformVoucherCode})`}
              </span>
              <span className="text-xs text-blue-500/80 hidden sm:inline">(Sàn E-commerce tài trợ 100%)</span>
            </span>
            <span className="font-bold font-mono text-blue-500">
              -{formatCurrency(platformDiscount)}
            </span>
          </div>
        )}

        {/* Payment Method & Total Paid */}
        <div className="border-t border-dashed border-stone-200 dark:border-slate-800 pt-2 flex items-baseline justify-between">
          <div>
            <span className={cn('text-sm font-bold block', isDark ? 'text-white' : 'text-stone-900')}>
              Tổng Người Mua Thực Tế Thanh Toán
            </span>
            <span className="text-[11px] text-stone-400">
              Phương thức:{' '}
              <strong className="text-stone-600 dark:text-slate-300">
                {order.paymentMethod === 'VNPAY'
                  ? 'VNPAY (Trực tuyến)'
                  : order.paymentMethod === 'WALLET'
                    ? 'Ví số dư sàn'
                    : 'COD (Tiền mặt)'}
              </strong>
            </span>
          </div>
          <span className="text-lg font-black font-mono text-amber-500">
            {formatCurrency(buyerTotalPaid)}
          </span>
        </div>
      </div>

      {/* 3. Chi tiết khấu trừ & Thực nhận của Shop (Seller Settlement Outflow) */}
      <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          2. Chi Tiết Quyết Toán Thực Nhận Của Shop (Seller Net Payout)
        </h4>

        {/* Commission Base */}
        <div className="flex justify-between text-sm">
          <span className={cn('flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-600')}>
            <HiOutlineScale className="h-4 w-4 text-amber-500" />
            <span>Doanh thu tính phí hoa hồng (= Tạm tính - Voucher Shop)</span>
          </span>
          <span className={cn('font-semibold font-mono', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(commissionBase)}
          </span>
        </div>

        {/* Platform Commission Deduction */}
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <HiOutlineReceiptTax className="h-3.5 w-3.5" />
              Khấu trừ Phí hoa hồng sàn {commissionRate != null ? `(${commissionRate}%)` : ''}
            </span>
            <span className="text-xs text-stone-400 hidden sm:inline">(Phí dịch vụ nền tảng)</span>
          </span>
          <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
            -{formatCurrency(platformCommission)}
          </span>
        </div>

        {/* Platform Voucher Subsidy Credit Notice */}
        {platformDiscount > 0 && (
          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 p-2 rounded-lg border border-blue-500/15">
            <span>↳ Trợ giá Voucher Sàn bù lại cho Shop (Sàn thanh toán thay khách):</span>
            <span className="font-bold font-mono">+{formatCurrency(platformDiscount)}</span>
          </div>
        )}

        {/* Highlighted Net Payout Card */}
        <div
          className={cn(
            'p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
            isRefunded || isCancelled
              ? isDark
                ? 'border-slate-700 bg-slate-800/40'
                : 'border-stone-200 bg-stone-100/70'
              : isDark
                ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent'
                : 'border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/40 to-white'
          )}
        >
          <div>
            <p className={cn('text-xs font-bold uppercase tracking-wider', isRefunded || isCancelled ? 'text-stone-500 dark:text-slate-400' : isDark ? 'text-amber-400' : 'text-amber-800')}>
              {isRefunded
                ? 'Thực nhận của Shop (Đã hoàn tiền 100%)'
                : isCancelled
                  ? 'Thực nhận của Shop (Đơn đã hủy)'
                  : 'Số Tiền Thực Nhận Vào Ví Khả Dụng Của Shop'}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {breakdown?.payoutNote ||
                (isRefunded
                  ? 'Đơn hàng đã hoàn tất thủ tục hoàn tiền cho Người mua'
                  : isCancelled
                    ? 'Đơn hàng bị hủy trước khi hoàn tất, không phát sinh dòng tiền'
                    : `= Tạm tính (${formatCurrency(subtotal)}) - Voucher Shop (${formatCurrency(shopDiscount)}) - Phí sàn (${formatCurrency(platformCommission)})`)}
            </p>
          </div>
          <div className="text-right">
            <span className={cn('text-2xl font-black font-mono', isRefunded || isCancelled ? 'text-stone-400 line-through' : 'text-amber-600 dark:text-amber-400')}>
              {formatCurrency(shopNetIncome)}
            </span>
            <span className="block text-[10px] text-stone-400">
              {isRefunded || isCancelled ? '0đ ghi nhận' : 'Cộng trực tiếp vào Ví Shop'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Escrow Protection Details */}
      {(showEscrowHeld || showEscrowDelivered || showEscrowCompleted || isRefunded || isCancelled) && (
        <div className="border-t border-stone-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-stone-400">
            3. Bảo Đảm Ký Quỹ Escrow (An Toàn Dòng Tiền)
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

          {!isRefunded && !isCancelled && showEscrowHeld && (
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
                  Số tiền thực nhận <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(shopNetIncome)}</strong> đang được khóa an toàn và sẽ được giải phóng ngay khi khách hàng xác nhận đã nhận hàng hoặc kết thúc thời gian trải nghiệm.
                </p>
              </div>
            </div>
          )}

          {!isRefunded && !isCancelled && showEscrowDelivered && (
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
                  Đã giao hàng – Đang trong thời hạn 72h trải nghiệm
                </p>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Tiền ký quỹ sẽ tự động được giải phóng vào ví của shop sau <strong>72 giờ (3 ngày)</strong> kể từ khi giao thành công nếu người mua không gửi khiếu nại.
                </p>
              </div>
            </div>
          )}

          {!isRefunded && !isCancelled && showEscrowCompleted && (
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
                  Đơn hàng đã hoàn thành trọn vẹn. Tiền bán hàng ({formatCurrency(shopNetIncome)}) đã được chuyển vào số dư khả dụng của bạn.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
