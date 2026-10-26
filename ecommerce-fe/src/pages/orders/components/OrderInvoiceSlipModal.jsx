import { useRef } from 'react'
import {
  HiOutlinePrinter,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineLocationMarker,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function OrderInvoiceSlipModal({
  isOpen,
  onClose,
  order,
  isDark,
  formatCurrency,
  formatDate,
}) {
  const printRef = useRef(null)

  if (!isOpen || !order) return null

  const handlePrint = () => {
    window.print()
  }

  const breakdown = order.settlementBreakdown
  const subtotal = Number(breakdown?.merchandiseSubtotal ?? order.subtotal ?? 0)
  const shippingFee = Number(breakdown?.shippingFee ?? order.shippingFee ?? 0)
  const shopDiscount = Number(breakdown?.shopDiscount ?? order.shopDiscountAmount ?? 0)
  const platformDiscount = Number(breakdown?.platformDiscount ?? order.platformDiscountAmount ?? 0)
  const totalPaid = Number(breakdown?.buyerTotalPaid ?? order.total ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className={cn(
          'relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border my-8 transition-all',
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-stone-200 text-stone-900'
        )}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="font-bold text-sm">Phiếu Hóa Đơn Thanh Toán & Đối Soát Điện Tử</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <HiOutlinePrinter className="h-4 w-4" />
              In / Xuất PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 transition-colors"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Slip Content */}
        <div ref={printRef} className="p-8 space-y-6 print:p-0 print:text-black print:bg-white text-sm">
          {/* Slip Header */}
          <div className="border-b border-stone-200 dark:border-slate-800 pb-6 print:border-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xl font-black tracking-wider text-amber-500 uppercase">
                  E-COMMERCE MARKETPLACE
                </span>
                <p className="text-xs text-stone-400 print:text-stone-600 mt-0.5">
                  Nền Tảng Thương Mại Điện Tử Thiết Bị & Linh Kiện Điện Tử
                </p>
                <p className="text-[11px] text-stone-400 print:text-stone-600">
                  Hệ thống hạch toán dòng tiền Escrow đối soát độc lập
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 print:bg-gray-100 print:text-black border border-emerald-500/30 font-bold text-xs">
                  PHIẾU THU ĐIỆN TỬ HỢP LỆ
                </span>
                <p className="text-xs font-mono font-bold mt-1">
                  Mã đơn: #{order.orderNumber}
                </p>
                <p className="text-[11px] text-stone-400 print:text-stone-600">
                  Ngày lập: {formatDate ? formatDate(order.createdAt) : new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Party Details: Buyer, Seller, Courier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-stone-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-stone-300">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 print:text-stone-600 mb-2">
                Thông Tin Khách Hàng (Người Mua)
              </h4>
              <p className="font-bold text-stone-900 dark:text-white print:text-black">
                {order.shippingName || order.userName}
              </p>
              <p className="text-xs text-stone-600 dark:text-slate-300 print:text-stone-700">
                SĐT: {order.shippingPhone || order.userPhone}
              </p>
              <p className="text-xs text-stone-600 dark:text-slate-300 print:text-stone-700 mt-1 flex items-start gap-1">
                <HiOutlineLocationMarker className="h-3.5 w-3.5 shrink-0 mt-0.5 text-stone-400" />
                <span>
                  {order.shippingAddress}, {order.shippingWard}, {order.shippingDistrict}, {order.shippingCity}
                </span>
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 print:text-stone-600 mb-2">
                Thông Tin Gian Hàng & Vận Chuyển
              </h4>
              <p className="font-bold text-stone-900 dark:text-white print:text-black">
                {order.shopName || 'Gian Hàng Đối Tác'}
              </p>
              {order.shopPhone && (
                <p className="text-xs text-stone-600 dark:text-slate-300 print:text-stone-700">
                  Hotline Shop: {order.shopPhone}
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-stone-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-stone-500">
                  <HiOutlineTruck className="h-3.5 w-3.5 text-indigo-500" />
                  Đối tác vận chuyển:
                </span>
                <span className="font-bold font-mono">GHN Express {order.ghnOrderCode ? `(${order.ghnOrderCode})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 print:text-stone-600">
              Chi Tiết Sản Phẩm Thanh Toán
            </h4>
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-slate-800 print:border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-100/60 dark:bg-slate-800/80 print:bg-gray-100">
                    <th className="py-2.5 px-3 font-bold text-stone-600 dark:text-slate-300 print:text-black">STT</th>
                    <th className="py-2.5 px-3 font-bold text-stone-600 dark:text-slate-300 print:text-black">Tên sản phẩm</th>
                    <th className="py-2.5 px-3 font-bold text-stone-600 dark:text-slate-300 print:text-black text-center">SL</th>
                    <th className="py-2.5 px-3 font-bold text-stone-600 dark:text-slate-300 print:text-black text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 font-bold text-stone-600 dark:text-slate-300 print:text-black text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-slate-800 print:divide-black">
                  {order.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <div>{item.productName}</div>
                        {(item.variantColor || item.variantSize) && (
                          <div className="text-[10px] text-stone-400 print:text-stone-600">
                            Phân loại: {[item.variantColor, item.variantSize].filter(Boolean).join(' - ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-stone-400 print:text-stone-600 space-y-1 max-w-sm">
              <p className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400 print:text-black">
                <HiOutlineCheckCircle className="h-4 w-4" />
                Chứng nhận bảo hộ dòng tiền Escrow
              </p>
              <p className="leading-relaxed">
                Đơn hàng được bảo đảm an toàn bởi Hợp đồng Ký quỹ Escrow. Số tiền được hạch toán minh bạch giữa Người mua, Shop và GHN Express.
              </p>
              <p className="font-mono text-[11px]">
                Phương thức thanh toán: <strong>{order.paymentMethod || 'COD'}</strong>
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-slate-800/60 print:bg-transparent print:border print:border-stone-300 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Tạm tính hàng hóa:</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Cước vận chuyển GHN:</span>
                <span className="font-mono font-semibold">{formatCurrency(shippingFee)}</span>
              </div>
              {shopDiscount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Voucher giảm giá Shop:</span>
                  <span className="font-mono font-bold">-{formatCurrency(shopDiscount)}</span>
                </div>
              )}
              {platformDiscount > 0 && (
                <div className="flex justify-between text-blue-500">
                  <span>Voucher trợ giá Sàn:</span>
                  <span className="font-mono font-bold">-{formatCurrency(platformDiscount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 dark:border-slate-700 flex justify-between items-baseline font-bold">
                <span className="text-sm">Tổng thanh toán:</span>
                <span className="text-base font-black font-mono text-amber-500 print:text-black">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-dashed border-stone-200 dark:border-slate-800 text-center text-[11px] text-stone-400 print:text-stone-600">
            Cảm ơn Quý khách đã mua sắm tại Nền Tảng E-commerce! Đây là phiếu thu điện tử có giá trị kế toán đối soát giao dịch.
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="print:hidden px-6 py-3 border-t border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
