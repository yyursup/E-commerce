import { useState } from 'react'
import {
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineScale,
  HiOutlineDocumentText,
  HiOutlinePrinter,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import OrderInvoiceSlipModal from './OrderInvoiceSlipModal'

export default function OrderSummaryCard({
  order,
  report,
  isDark,
  formatCurrency,
  onPayNow,
}) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  if (!order) return null

  const breakdown = order.settlementBreakdown
  const subtotal = Number(breakdown?.merchandiseSubtotal ?? order.subtotal ?? 0)
  const shippingFee = Number(breakdown?.shippingFee ?? order.shippingFee ?? 0)
  const shopDiscount = Number(breakdown?.shopDiscount ?? order.shopDiscountAmount ?? 0)
  const platformDiscount = Number(breakdown?.platformDiscount ?? order.platformDiscountAmount ?? 0)
  const total = Number(breakdown?.buyerTotalPaid ?? order.total ?? 0)

  const hasShopDiscount = shopDiscount > 0
  const hasPlatformDiscount = platformDiscount > 0
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
        <div className="border-t pt-3 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Tổng cộng
            </span>
            <span className={cn('text-lg font-bold font-mono text-rose-500 dark:text-rose-400')}>
              {formatCurrency(order.total)}
            </span>
          </div>

          {(order.status === 'REFUNDED' || order.returnInfo?.status === 'COMPLETED') && (() => {
            const isReturnProcess = Boolean(order.returnInfo && order.returnInfo.status !== 'CANCELLED')
            const shippingFee = Number(order.shippingFee || 0)
            const orderTotal = Number(order.total || 0)
            const actualRefund = isReturnProcess ? orderTotal : Math.max(0, orderTotal - shippingFee)

            return (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed border-stone-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-medium">
                <span>Tiền hoàn thực nhận vào ví:</span>
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(actualRefund)}
                </span>
              </div>
            )
          })()}

          {/* Invoice Slip Trigger Button */}
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-bold text-stone-700 dark:text-slate-200 transition-all active:scale-[0.98]"
          >
            <HiOutlineDocumentText className="h-4 w-4 text-amber-500" />
            Xem & In Phiếu Hóa Đơn Đối Soát (Invoice Slip)
          </button>
        </div>

        {/* Payment Status / Escrow Protection Section */}
        {(order.status === 'REFUNDED' || order.returnInfo?.status === 'COMPLETED') ? (
          <div className="border-t pt-4 mt-4">
            <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-slate-300' : 'text-stone-700')}>
              Trạng thái hoàn tiền
            </h3>
            {(() => {
              const isReturnProcess = Boolean(order.returnInfo && order.returnInfo.status !== 'CANCELLED')
              const shippingFee = Number(order.shippingFee || 0)
              const orderTotal = Number(order.total || 0)
              const actualRefund = isReturnProcess ? orderTotal : Math.max(0, orderTotal - shippingFee)

              return (
                <div className="flex items-start gap-3 rounded-xl p-4 bg-blue-500/10 border border-blue-500/25">
                  <div className="p-2 rounded-full bg-blue-500/15 shrink-0 text-blue-500 mt-0.5">
                    <HiOutlineShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {isReturnProcess
                        ? 'Đã hoàn 100% tiền đơn hàng về ví số dư tài khoản'
                        : 'Đã hoàn tiền hàng về ví số dư tài khoản'}
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-slate-300' : 'text-stone-700')}>
                      Số tiền hoàn thực tế:{' '}
                      <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                        {formatCurrency(actualRefund)}
                      </strong>
                    </p>
                    {!isReturnProcess && shippingFee > 0 && (
                      <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        * Cước vận chuyển chiều đi ({formatCurrency(shippingFee)}) không hoàn lại do Quý khách tiếp tục giữ sản phẩm (chuyến giao hàng của bưu tá GHN đã hoàn thành nhiệm vụ).
                      </p>
                    )}
                    {isReturnProcess && (
                      <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        * Đã bồi hoàn 100% gồm cả tiền hàng và cước vận chuyển ban đầu do đơn hàng đã hoàn tất quy trình trả hàng cho Shop.
                      </p>
                    )}

                    {(report?.policyClauseTitle || report?.policyClauseCode) && (
                      <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                        <HiOutlineScale className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <span className="font-bold">Căn cứ Điều khoản: </span>
                          <span>{report.policyClauseTitle || report.policyClauseCode}</span>
                          {report.adminNote && (
                            <p className="mt-1 text-[11px] font-normal italic opacity-90">
                              Phán quyết BQT: &ldquo;{report.adminNote}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
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
                        Số tiền <span className="font-semibold">{formatCurrency(order.total)}</span> đang được giữ bởi hệ thống Escrow sàn.
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

      {/* Printable Invoice Slip Modal */}
      <OrderInvoiceSlipModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
        isDark={isDark}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}
