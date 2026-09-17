import { HiOutlineTicket, HiOutlineTag, HiOutlineCheck, HiOutlineX, HiOutlineShoppingBag, HiOutlineSparkles } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutVoucherSection({
    voucherCodeInput = '',
    setVoucherCodeInput,
    onInputChange,
    onApplyVoucher,
    appliedShopVoucher = null,
    appliedPlatformVoucher = null,
    appliedVoucher = null, // fallback
    shopDiscountAmount = 0,
    platformDiscountAmount = 0,
    discountAmount = 0,
    onRemoveShopVoucher,
    onRemovePlatformVoucher,
    onRemoveVoucher,
    onOpenVoucherModal,
    onOpenModal,
    availableCount = 0,
    isApplyingVoucher = false,
    isApplying = false,
    isDark = false
}) {
    const handleInputChange = onInputChange || ((val) => setVoucherCodeInput && setVoucherCodeInput(val))
    const handleOpenModal = onOpenVoucherModal || onOpenModal
    const applying = isApplyingVoucher || isApplying

    // Determine shop and platform vouchers to render
    let shopV = appliedShopVoucher
    let platV = appliedPlatformVoucher

    if (!shopV && !platV && appliedVoucher) {
        if (appliedVoucher.scope === 'SHOP') {
            shopV = appliedVoucher
        } else {
            platV = appliedVoucher
        }
    }

    const hasAnyApplied = Boolean(shopV || platV)

    return (
        <div className={cn("rounded-2xl border p-6 shadow-sm space-y-4", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HiOutlineTicket className="w-5 h-5 text-amber-500" />
                    <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>
                        Mã Giảm Giá / Voucher
                    </h2>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                >
                    <HiOutlineTag className="w-4 h-4" />
                    Chọn Voucher Có Sẵn ({availableCount})
                </button>
            </div>

            {/* Voucher Input Bar */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => handleInputChange(e.target.value.toUpperCase())}
                    placeholder="Nhập mã voucher (Sàn hoặc Shop)..."
                    className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm uppercase font-mono tracking-wider outline-none transition-all focus:ring-2 focus:ring-amber-500",
                        isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-stone-50 border-stone-200 text-stone-900"
                    )}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            onApplyVoucher && onApplyVoucher()
                        }
                    }}
                />
                <button
                    onClick={() => onApplyVoucher && onApplyVoucher()}
                    disabled={applying || !voucherCodeInput.trim()}
                    className={cn(
                        "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all",
                        applying || !voucherCodeInput.trim()
                            ? "bg-stone-300 dark:bg-slate-700 cursor-not-allowed text-stone-500"
                            : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                    )}
                >
                    {applying ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
            </div>

            {/* Applied Vouchers Cards List */}
            {hasAnyApplied && (
                <div className="space-y-2.5 pt-1">
                    {/* Shop Voucher Card */}
                    {shopV && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white font-bold text-xs shadow-sm">
                                    <HiOutlineShoppingBag className="w-5 h-5" />
                                </span>
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                        <span className="font-mono">{shopV.code}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500 text-white">
                                            Voucher Shop
                                        </span>
                                    </div>
                                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                                        Giảm: <strong>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shopDiscountAmount || shopV.discountAmount || 0)}</strong>
                                        {shopV.title && <span className="opacity-75 font-normal ml-1.5">({shopV.title})</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onRemoveShopVoucher || onRemoveVoucher}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-600 transition-colors"
                                title="Bỏ áp dụng Voucher Shop"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Platform Voucher Card */}
                    {platV && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-xs shadow-sm">
                                    <HiOutlineSparkles className="w-5 h-5" />
                                </span>
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                        <span className="font-mono">{platV.code}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500 text-white">
                                            Voucher Sàn
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                        Giảm: <strong>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(platformDiscountAmount || platV.discountAmount || 0)}</strong>
                                        {platV.title && <span className="opacity-75 font-normal ml-1.5">({platV.title})</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onRemovePlatformVoucher || onRemoveVoucher}
                                className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-600 transition-colors"
                                title="Bỏ áp dụng Voucher Sàn"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

