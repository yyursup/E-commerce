import { HiOutlineTicket, HiOutlineX } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutVoucherModal({
    isOpen = false,
    onClose,
    vouchers = [],
    availableVouchers = [],
    appliedVoucher = null,
    totalPrice = 0,
    cartItems = [],
    loading = false,
    loadingVouchers = false,
    onApply,
    onApplyVoucher,
    isDark = false
}) {
    if (!isOpen) return null

    const list = (vouchers && vouchers.length > 0) ? vouchers : availableVouchers
    const isLoading = loading || loadingVouchers
    const handleApply = onApply || onApplyVoucher

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={cn(
                "w-full max-w-lg rounded-3xl border p-6 shadow-2xl max-h-[85vh] flex flex-col",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
            )}>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <HiOutlineTicket className="w-6 h-6 text-amber-500" />
                        <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-stone-900")}>
                            Kho Voucher Khả Dụng
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal List */}
                <div className={cn(
                    "py-4 overflow-y-auto space-y-3 flex-1 pr-2",
                    isDark ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                )}>
                    {isLoading ? (
                        <div className="py-8 text-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto"></div>
                            <p className="text-xs text-stone-400 mt-2">Đang tải kho voucher...</p>
                        </div>
                    ) : list.length === 0 ? (
                        <div className="py-8 text-center">
                            <HiOutlineTicket className="h-10 w-10 text-stone-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-stone-500">Chưa có mã voucher khả dụng cho đơn này.</p>
                        </div>
                    ) : (
                        list.map((v) => {
                            const isCurrentApplied = (appliedVoucher?.code === v.code || appliedVoucher?.voucherCode === v.code)
                            const minRequired = Number(v.minOrderAmount || v.minOrderValue || 0)
                            const isMinOrderSatisfied = totalPrice >= minRequired

                            // Check category match if voucher is category-restricted
                            const hasCategoryRestriction = Boolean(v.categoryName || v.categoryId)
                            let isCategorySatisfied = true
                            if (hasCategoryRestriction) {
                                isCategorySatisfied = cartItems.some(item =>
                                    (v.categoryId && item.categoryId === v.categoryId) ||
                                    (v.categoryName && item.categoryName?.toLowerCase().includes(v.categoryName.toLowerCase()))
                                )
                            }

                            const isEligible = isMinOrderSatisfied && isCategorySatisfied

                            return (
                                <div
                                    key={v.id || v.code}
                                    className={cn(
                                        "p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all",
                                        isCurrentApplied
                                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                                            : isDark ? "border-slate-800 bg-slate-800/40" : "border-stone-200 bg-stone-50/50"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="font-mono text-xs font-bold text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                                {v.code}
                                            </span>
                                            <span className={cn(
                                                "text-[11px] font-bold px-2 py-0.5 rounded",
                                                v.scope === 'PLATFORM'
                                                    ? "bg-blue-500/10 text-blue-500"
                                                    : "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {v.scope === 'PLATFORM' ? 'Voucher Sàn' : 'Voucher Shop'}
                                            </span>
                                            {v.categoryName && (
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                    Ngành: {v.categoryName}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className={cn("text-sm font-bold mt-1.5", isDark ? "text-white" : "text-stone-900")}>
                                            {v.title || v.description}
                                        </h4>
                                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                                            {v.description || `Đơn tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minRequired)}`}
                                        </p>
                                        {!isMinOrderSatisfied && (
                                            <p className="text-[11px] text-rose-500 font-medium mt-1">
                                                * Cần mua thêm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minRequired - totalPrice)} để áp dụng
                                            </p>
                                        )}
                                        {isMinOrderSatisfied && !isCategorySatisfied && (
                                            <p className="text-[11px] text-rose-500 font-medium mt-1">
                                                * Đơn hàng không có sản phẩm thuộc ngành {v.categoryName}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleApply && handleApply(v.code)}
                                        disabled={!isEligible || isCurrentApplied}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0",
                                            isCurrentApplied
                                                ? "bg-emerald-500 text-white cursor-default"
                                                : isEligible
                                                    ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95"
                                                    : "bg-stone-200 dark:bg-slate-700 text-stone-400 cursor-not-allowed"
                                        )}
                                    >
                                        {isCurrentApplied ? 'Đang dùng' : 'Dùng ngay'}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-slate-800 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
