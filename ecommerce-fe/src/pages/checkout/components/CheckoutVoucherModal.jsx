import { useState, useEffect } from 'react'
import { HiOutlineTicket, HiOutlineX, HiCheck, HiOutlineShoppingBag, HiOutlineSparkles } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutVoucherModal({
    isOpen = false,
    onClose,
    vouchers = [],
    availableVouchers = [],
    appliedShopVoucher = null,
    appliedPlatformVoucher = null,
    appliedVoucher = null, // legacy fallback
    totalPrice = 0,
    shippingFee = 0,
    cartItems = [],
    loading = false,
    loadingVouchers = false,
    onApplyMulti,
    onApply,
    onApplyVoucher,
    isDark = false
}) {
    const list = (vouchers && vouchers.length > 0) ? vouchers : availableVouchers
    const isLoading = loading || loadingVouchers

    const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'SHOP' | 'PLATFORM'
    const [tempSelectedShop, setTempSelectedShop] = useState(null)
    const [tempSelectedPlatform, setTempSelectedPlatform] = useState(null)

    // Sync selected vouchers when modal opens
    useEffect(() => {
        if (isOpen) {
            let initialShop = appliedShopVoucher
            let initialPlatform = appliedPlatformVoucher

            // Fallback for legacy single appliedVoucher
            if (!initialShop && !initialPlatform && appliedVoucher) {
                if (appliedVoucher.scope === 'SHOP') {
                    initialShop = appliedVoucher
                } else {
                    initialPlatform = appliedVoucher
                }
            }

            setTempSelectedShop(initialShop)
            setTempSelectedPlatform(initialPlatform)
            setActiveTab('ALL')
        }
    }, [isOpen, appliedShopVoucher, appliedPlatformVoucher, appliedVoucher])

    if (!isOpen) return null

    const shopVouchers = list.filter(v => v.scope === 'SHOP')
    const platformVouchers = list.filter(v => v.scope === 'PLATFORM' || !v.scope)

    const displayedVouchers = activeTab === 'SHOP'
        ? shopVouchers
        : activeTab === 'PLATFORM'
            ? platformVouchers
            : list

    const handleSelectVoucher = (voucher, isEligible) => {
        if (!isEligible) return

        const isShop = voucher.scope === 'SHOP'
        if (isShop) {
            if (tempSelectedShop?.code === voucher.code) {
                setTempSelectedShop(null) // Unselect
            } else {
                setTempSelectedShop(voucher) // Select (replace old shop voucher)
            }
        } else {
            if (tempSelectedPlatform?.code === voucher.code) {
                setTempSelectedPlatform(null) // Unselect
            } else {
                setTempSelectedPlatform(voucher) // Select (replace old platform voucher)
            }
        }
    }

    const handleConfirmApply = () => {
        if (onApplyMulti) {
            onApplyMulti({
                shopVoucher: tempSelectedShop,
                platformVoucher: tempSelectedPlatform
            })
        } else if (onApply) {
            // Fallback: apply selected shop or platform
            const chosen = tempSelectedShop || tempSelectedPlatform
            onApply(chosen?.code || null)
        } else if (onApplyVoucher) {
            const chosen = tempSelectedShop || tempSelectedPlatform
            onApplyVoucher(chosen?.code || null)
        }
        onClose && onClose()
    }

    const selectedCount = (tempSelectedShop ? 1 : 0) + (tempSelectedPlatform ? 1 : 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className={cn(
                "w-full max-w-xl rounded-3xl border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
            )}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <HiOutlineTicket className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={cn("text-lg font-bold leading-tight", isDark ? "text-white" : "text-stone-900")}>
                                Chọn Voucher Cho Đơn Hàng
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-slate-400">
                                Áp dụng tối đa 1 Voucher Shop và 1 Voucher Sàn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Scope Filter Tabs */}
                <div className="flex px-5 pt-3 pb-2 gap-2 border-b border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/30">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            activeTab === 'ALL'
                                ? "bg-amber-500 text-white shadow-sm"
                                : isDark ? "text-slate-400 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-200/60"
                        )}
                    >
                        Tất cả ({list.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('SHOP')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            activeTab === 'SHOP'
                                ? "bg-rose-500 text-white shadow-sm"
                                : isDark ? "text-slate-400 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-200/60"
                        )}
                    >
                        <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                        Voucher Shop ({shopVouchers.length})
                        {tempSelectedShop && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('PLATFORM')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                            activeTab === 'PLATFORM'
                                ? "bg-blue-500 text-white shadow-sm"
                                : isDark ? "text-slate-400 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-200/60"
                        )}
                    >
                        <HiOutlineSparkles className="w-3.5 h-3.5" />
                        Voucher Sàn ({platformVouchers.length})
                        {tempSelectedPlatform && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                        )}
                    </button>
                </div>

                {/* Modal Voucher List */}
                <div className={cn(
                    "p-5 overflow-y-auto space-y-3 flex-1",
                    isDark ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                )}>
                    {isLoading ? (
                        <div className="py-12 text-center">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto"></div>
                            <p className="text-xs text-stone-400 mt-2">Đang tải kho voucher...</p>
                        </div>
                    ) : displayedVouchers.length === 0 ? (
                        <div className="py-12 text-center">
                            <HiOutlineTicket className="h-12 w-12 text-stone-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-stone-500">Không có voucher phù hợp trong mục này.</p>
                        </div>
                    ) : (
                        displayedVouchers.map((v) => {
                            const isShop = v.scope === 'SHOP'
                            const isSelected = isShop
                                ? tempSelectedShop?.code === v.code
                                : tempSelectedPlatform?.code === v.code

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
                                    onClick={() => handleSelectVoucher(v, isEligible)}
                                    className={cn(
                                        "p-4 rounded-2xl border flex items-center justify-between gap-3.5 transition-all cursor-pointer select-none",
                                        isSelected
                                            ? isShop
                                                ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/30 ring-1 ring-rose-500 shadow-sm"
                                                : "border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 ring-1 ring-blue-500 shadow-sm"
                                            : !isEligible
                                                ? isDark ? "border-slate-800 bg-slate-900/40 opacity-60 cursor-not-allowed" : "border-stone-200 bg-stone-100/50 opacity-60 cursor-not-allowed"
                                                : isDark ? "border-slate-800 bg-slate-800/40 hover:border-slate-700" : "border-stone-200 bg-white hover:border-stone-300 shadow-sm"
                                    )}
                                >
                                    {/* Left: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={cn(
                                                "font-mono text-xs font-bold uppercase px-2 py-0.5 rounded border",
                                                isShop
                                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                            )}>
                                                {v.code}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                                isShop
                                                    ? "bg-rose-500 text-white"
                                                    : "bg-blue-500 text-white"
                                            )}>
                                                {isShop ? 'Voucher Shop' : 'Voucher Sàn'}
                                            </span>
                                            {v.categoryName && (
                                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                    Ngành: {v.categoryName}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className={cn("text-sm font-bold mt-1.5 line-clamp-1", isDark ? "text-white" : "text-stone-900")}>
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
                                                * Không có sản phẩm thuộc ngành {v.categoryName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: Selection Checkbox / Indicator */}
                                    <div className="shrink-0 flex items-center">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                            isSelected
                                                ? isShop ? "bg-rose-500 border-rose-500 text-white" : "bg-blue-500 border-blue-500 text-white"
                                                : isEligible
                                                    ? isDark ? "border-slate-600 hover:border-slate-400" : "border-stone-300 hover:border-stone-400"
                                                    : isDark ? "border-slate-800 bg-slate-800/40" : "border-stone-200 bg-stone-200/40"
                                        )}>
                                            {isSelected && <HiCheck className="w-4 h-4 stroke-2" />}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Modal Footer Summary */}
                <div className="p-4 border-t border-stone-100 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-900/90 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={isDark ? "text-slate-400" : "text-stone-500"}>Đang chọn:</span>
                            {tempSelectedShop ? (
                                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                                    Shop: {tempSelectedShop.code}
                                </span>
                            ) : (
                                <span className="text-stone-400 dark:text-slate-500 italic">Shop: Chưa chọn</span>
                            )}
                            {tempSelectedPlatform ? (
                                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                    <HiOutlineSparkles className="w-3.5 h-3.5" />
                                    Sàn: {tempSelectedPlatform.code}
                                </span>
                            ) : (
                                <span className="text-stone-400 dark:text-slate-500 italic">Sàn: Chưa chọn</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirmApply}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 active:scale-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                        >
                            Áp dụng {selectedCount > 0 ? `(${selectedCount} voucher)` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

