import { HiOutlineTicket } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutOrderSummary({
    totalPrice = 0,
    shippingFee = 0,
    isCalculatingFee = false,
    appliedShopVoucher = null,
    appliedPlatformVoucher = null,
    appliedVoucher = null,
    shopDiscountAmount = 0,
    platformDiscountAmount = 0,
    discountAmount = 0,
    voucherCodeInput = '',
    finalTotal = 0,
    onCreateOrder,
    onOrder,
    processing = false,
    cartItemsCount = 0,
    isDisabled = false,
    isDark = false
}) {
    const handleOrder = onCreateOrder || onOrder
    const disabled = processing || isCalculatingFee || isDisabled || (cartItemsCount === 0)

    return (
        <div className={cn(
            "sticky top-6 rounded-2xl border p-6 shadow-sm space-y-4",
            isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
        )}>
            <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>
                Chi tiết thanh toán
            </h2>

            <div className="space-y-2.5 text-sm pt-4 border-t border-stone-100 dark:border-slate-800">
                <div className="flex justify-between">
                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Tổng tiền hàng</span>
                    <span className={isDark ? "text-white" : "text-stone-900"}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Phí vận chuyển</span>
                    {isCalculatingFee ? (
                        <span className="text-amber-500 animate-pulse">Đang tính...</span>
                    ) : (
                        <span className={cn("font-medium", isDark ? "text-white" : "text-stone-900")}>
                            {shippingFee > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee) : '---'}
                        </span>
                    )}
                </div>

                {/* Shop Voucher Discount Row */}
                {shopDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                        <span className="flex items-center gap-1 font-medium">
                            <HiOutlineTicket className="w-4 h-4" />
                            Voucher Shop ({appliedShopVoucher?.code || 'Shop'})
                        </span>
                        <span className="font-bold">
                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shopDiscountAmount)}
                        </span>
                    </div>
                )}

                {/* Platform Voucher Discount Row */}
                {platformDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                        <span className="flex items-center gap-1 font-medium">
                            <HiOutlineTicket className="w-4 h-4" />
                            Voucher Sàn ({appliedPlatformVoucher?.code || 'Sàn'})
                        </span>
                        <span className="font-bold">
                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(platformDiscountAmount)}
                        </span>
                    </div>
                )}

                {/* Fallback Single Voucher Discount Row */}
                {discountAmount > 0 && shopDiscountAmount === 0 && platformDiscountAmount === 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1 font-medium">
                            <HiOutlineTicket className="w-4 h-4" />
                            Giảm giá voucher ({appliedVoucher?.code || appliedVoucher?.voucherCode || voucherCodeInput})
                        </span>
                        <span className="font-bold">
                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                        </span>
                    </div>
                )}
            </div>

            <div className="py-4 border-y border-stone-100 dark:border-slate-800 flex justify-between items-center">
                <span className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>Tổng thanh toán</span>
                <span className="font-bold text-xl text-amber-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}
                </span>
            </div>

            <button
                onClick={handleOrder}
                disabled={disabled}
                className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-amber-500/25 transition-all flex justify-center items-center gap-2",
                    disabled
                        ? "bg-stone-400 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                )}
            >
                {processing ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Đang xử lý...
                    </>
                ) : (
                    "Đặt hàng"
                )}
            </button>
        </div>
    )
}
