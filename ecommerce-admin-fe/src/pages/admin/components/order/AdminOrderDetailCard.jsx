import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineScale,
  HiOutlineReceiptTax,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { getConditionBadge, getWarrantyBadge } from '../../../../lib/techBadges'
import {
  formatAdminOrderCurrency,
  formatAdminOrderDate,
  getAdminOrderStatusBadge,
  getAdminOrderStatusLabel,
} from './orderHelpers'

export default function AdminOrderDetailCard({ order, isDark }) {
  const statusBadge = getAdminOrderStatusBadge(order)
  const StatusIcon = statusBadge.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
    >
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Đơn hàng {order.orderNumber}
              </h1>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  order.paymentMethod === 'VNPAY'
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                    : order.paymentMethod === 'WALLET'
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                )}
              >
                {order.paymentMethod === 'VNPAY' ? 'VNPAY' : order.paymentMethod === 'WALLET' ? 'Ví sàn' : 'COD'}
              </span>
              {order.status === 'REFUNDED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Hoàn về Ví số dư người mua
                </span>
              )}
            </div>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Đặt ngày {formatAdminOrderDate(order.createdAt)}
            </p>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Shop: {order.shopName} | Khách hàng: {order.userName}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
              statusBadge.color,
            )}
          >
            <StatusIcon className="h-4 w-4" />
            {getAdminOrderStatusLabel(order)}
          </span>
        </div>
      </div>

      <div className="border-b p-6">
        <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
          Địa chỉ giao hàng
        </h2>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <HiOutlineLocationMarker className={cn('mt-0.5 h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
            <div>
              <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                {order.shippingName}
              </p>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.shippingAddress}
              </p>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.shippingWard}, {order.shippingDistrict}, {order.shippingCity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HiOutlinePhone className={cn('h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {order.shippingPhone}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b p-6">
        <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
          Sản phẩm
        </h2>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={item.productImageUrl || '/product-placeholder.svg'}
                alt={item.productName}
                className="h-20 w-20 rounded-lg bg-stone-100 object-cover dark:bg-slate-800"
                onError={(e) => {
                  e.target.src = '/product-placeholder.svg'
                }}
              />
              <div className="flex-1">
                <Link
                  to={`/products/${item.productId}`}
                  className={cn('font-medium hover:underline', isDark ? 'text-white' : 'text-stone-900')}
                >
                  {item.productName}
                </Link>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {item.conditionGrade && (
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", getConditionBadge(item.conditionGrade)?.cls)}>
                      {getConditionBadge(item.conditionGrade)?.label}
                    </span>
                  )}
                  {item.warrantyType && (
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.cls)}>
                      {getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.label}
                    </span>
                  )}
                  {(item.variantColor || item.variantSize) && (
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Phân loại: {[item.variantColor, item.variantSize].filter(Boolean).join(' - ')}
                    </span>
                  )}
                </div>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Số lượng: {item.quantity}
                </p>
                <p className={cn('mt-1 text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatAdminOrderCurrency(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform 3-Way Accounting Settlement Breakdown */}
      <div className="p-6 border-t border-stone-200 dark:border-slate-800 space-y-6">
        {(() => {
          const breakdown = order?.settlementBreakdown
          const subtotal = Number(breakdown?.merchandiseSubtotal ?? order?.subtotal ?? 0)
          const shippingFee = Number(breakdown?.shippingFee ?? order?.shippingFee ?? 0)
          const shopDiscount = Number(breakdown?.shopDiscount ?? order?.shopDiscountAmount ?? 0)
          const platformDiscount = Number(breakdown?.platformDiscount ?? order?.platformDiscountAmount ?? 0)
          const buyerTotalPaid = Number(breakdown?.buyerTotalPaid ?? order?.total ?? 0)
          const commissionBase = Number(breakdown?.commissionBaseAmount ?? Math.max(0, subtotal - shopDiscount))
          const platformCommission = Number(breakdown?.platformCommissionFee ?? order?.platformCommission ?? 0)
          const sellerNetIncome = Number(breakdown?.sellerNetIncome ?? (order.status === 'REFUNDED' || order.status === 'CANCELLED' ? 0 : Math.max(0, subtotal - shopDiscount - platformCommission)))
          const platformNetRevenue = Number(breakdown?.platformNetRevenue ?? (order.status === 'REFUNDED' || order.status === 'CANCELLED' ? 0 : platformCommission - platformDiscount))
          const carrierSettlement = Number(breakdown?.carrierSettlement ?? (order.status === 'CANCELLED' ? 0 : shippingFee))
          const settlementStatus = breakdown?.settlementStatus || order?.settlementStatus || (
            order.status === 'CANCELLED' ? 'CANCELLED' :
            order.status === 'REFUNDED' ? 'REFUNDED' :
            order.hasActiveDispute ? 'DISPUTE_FROZEN' :
            order.status === 'COMPLETED' ? 'SETTLED' :
            order.status === 'DELIVERED' ? 'IN_EXPERIENCE_WINDOW' : 'PENDING_ESCROW'
          )

          const getBadge = () => {
            switch (settlementStatus) {
              case 'SETTLED':
                return {
                  icon: HiOutlineCheckCircle,
                  label: 'Đã tất toán toàn bộ',
                  color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }
              case 'IN_EXPERIENCE_WINDOW':
                return {
                  icon: HiOutlineClock,
                  label: '72h kiểm hàng trải nghiệm',
                  color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                }
              case 'DISPUTE_FROZEN':
                return {
                  icon: HiOutlineExclamationCircle,
                  label: 'Đang phong tỏa đối soát (Khiếu nại)',
                  color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }
              case 'REFUNDED':
                return {
                  icon: HiOutlineShieldCheck,
                  label: 'Đã hoàn tiền 100% cho Buyer',
                  color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                }
              case 'CANCELLED':
                return {
                  icon: HiOutlineTag,
                  label: 'Đã hủy đơn (0đ đối soát)',
                  color: 'bg-stone-500/10 text-stone-500 border-stone-500/30'
                }
              default:
                return {
                  icon: HiOutlineLockClosed,
                  label: 'Tạm giữ an toàn trong Escrow',
                  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }
            }
          }
          const badge = getBadge()
          const BadgeIcon = badge.icon

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <h3 className={cn('text-base font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-stone-900')}>
                    <HiOutlineCash className="h-5 w-5 text-amber-500" />
                    Bảng Kê Quyết Toán Dòng Tiền 3 Chiều (Platform Settlement Breakdown)
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Hạch toán dòng tiền minh bạch: Người mua thanh toán ➔ Đơn vị VC (GHN) + Người bán (Shop) + Sàn E-commerce
                  </p>
                </div>
                <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold', badge.color)}>
                  <BadgeIcon className="h-4 w-4" />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* 1. Dòng tiền Người mua trả */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  1. Dòng Tiền Người Mua Thanh Toán (Buyer Inflow)
                </h4>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-stone-600'}>Tạm tính giá trị hàng hóa</span>
                  <span className={cn('font-medium font-mono', isDark ? 'text-white' : 'text-stone-900')}>{formatAdminOrderCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={cn('flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    <HiOutlineTruck className="h-4 w-4 text-indigo-500" />
                    <span>Cước vận chuyển GHN Express</span>
                  </span>
                  <span className={cn('font-medium font-mono', isDark ? 'text-white' : 'text-stone-900')}>{formatAdminOrderCurrency(shippingFee)}</span>
                </div>
                {shopDiscount > 0 && (
                  <div className="flex justify-between text-sm text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <HiOutlineTag className="h-3.5 w-3.5" />
                      Voucher Shop {order.shopVoucherCode ? `(${order.shopVoucherCode})` : ''}
                      <span className="text-[11px] opacity-75">(Shop chịu chi phí)</span>
                    </span>
                    <span className="font-bold font-mono">-{formatAdminOrderCurrency(shopDiscount)}</span>
                  </div>
                )}
                {platformDiscount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1">
                      <HiOutlineTag className="h-3.5 w-3.5" />
                      Voucher Sàn {order.platformVoucherCode ? `(${order.platformVoucherCode})` : ''}
                      <span className="text-[11px] opacity-75">(Sàn tài trợ giảm trừ khách)</span>
                    </span>
                    <span className="font-bold font-mono">-{formatAdminOrderCurrency(platformDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-stone-200 dark:border-slate-800">
                  <div>
                    <span className={cn('text-sm font-bold block', isDark ? 'text-white' : 'text-stone-900')}>
                      Tổng Khách Đã Thanh Toán
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Cổng thanh toán: <strong className="text-stone-600 dark:text-slate-300">{order.paymentMethod || 'COD'}</strong>
                      {order.ghnOrderCode && ` • Vận đơn: ${order.ghnOrderCode}`}
                    </span>
                  </div>
                  <span className="text-lg font-black font-mono text-amber-500">
                    {formatAdminOrderCurrency(buyerTotalPaid)}
                  </span>
                </div>
              </div>

              {/* 2. Bảng Kê Phân Bổ 3 Chiều (Golden Accounting Equation) */}
              <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    2. Phân Bổ Dòng Tiền 3 Chiều (Golden Accounting Equation)
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Cân đối 100% (Khách = GHN + Shop + Sàn)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Chiều 1: Đơn vị vận chuyển GHN */}
                  <div className={cn('p-3.5 rounded-xl border', isDark ? 'border-slate-800 bg-slate-800/50' : 'border-stone-200 bg-stone-50')}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <HiOutlineTruck className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">
                        1. Đối Tác GHN
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xl font-black font-mono block text-indigo-600 dark:text-indigo-400">
                        {formatAdminOrderCurrency(carrierSettlement)}
                      </span>
                      <p className="text-[11px] text-stone-400">
                        Cước đối soát thanh toán cho GHN Express
                      </p>
                    </div>
                  </div>

                  {/* Chiều 2: Người bán (Shop Payout) */}
                  <div className={cn('p-3.5 rounded-xl border', isDark ? 'border-slate-800 bg-slate-800/50' : 'border-stone-200 bg-stone-50')}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <HiOutlineCash className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">
                        2. Thực Nhận Shop
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xl font-black font-mono block text-amber-600 dark:text-amber-400">
                        {formatAdminOrderCurrency(sellerNetIncome)}
                      </span>
                      <p className="text-[11px] text-stone-400">
                        {order.status === 'REFUNDED'
                          ? 'Đã hoàn tiền (Shop thực nhận 0đ)'
                          : `= Hàng (${formatAdminOrderCurrency(commissionBase)}) - Hoa hồng (${formatAdminOrderCurrency(platformCommission)})`}
                      </p>
                    </div>
                  </div>

                  {/* Chiều 3: Doanh thu thuần Sàn (Platform Net) */}
                  <div className={cn('p-3.5 rounded-xl border', isDark ? 'border-slate-800 bg-slate-800/50' : 'border-stone-200 bg-stone-50')}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <HiOutlineReceiptTax className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-slate-400">
                        3. Doanh Thu Thuần Sàn
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className={cn('text-xl font-black font-mono block', platformNetRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                        {formatAdminOrderCurrency(platformNetRevenue)}
                      </span>
                      <p className="text-[11px] text-stone-400">
                        = Hoa hồng (+{formatAdminOrderCurrency(platformCommission)}) - Trợ giá Voucher (-{formatAdminOrderCurrency(platformDiscount)})
                      </p>
                    </div>
                  </div>
                </div>

                {breakdown?.payoutNote && (
                  <p className="text-xs italic text-stone-400 pt-1">
                    * Ghi chú hạch toán: {breakdown.payoutNote}
                  </p>
                )}
              </div>

              {/* Escrow Refund info if any */}
              {order.status === 'REFUNDED' && (
                <div className="rounded-xl p-3.5 bg-blue-500/10 border border-blue-500/20 text-xs">
                  <p className="font-bold text-blue-600 dark:text-blue-400">
                    Chi tiết hạch toán hoàn tiền Ký quỹ Escrow:
                  </p>
                  <p className={cn('mt-1 leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
                    {order.paymentMethod === 'COD'
                      ? 'Đơn hàng ban đầu thanh toán bằng COD. Hệ thống Ký quỹ Escrow đã hoàn trả 100% số tiền vào Ví số dư tài khoản của Người mua.'
                      : 'Toàn bộ số tiền đã được hoàn trả thành công từ Ký quỹ Escrow về Ví số dư của Người mua.'}
                  </p>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </motion.div>
  )
}
