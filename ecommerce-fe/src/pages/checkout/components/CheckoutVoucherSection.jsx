import { HiOutlineTicket, HiOutlineTag, HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutVoucherSection({
    voucherCodeInput = '',
    setVoucherCodeInput,
    onInputChange,
    onApplyVoucher,
    appliedVoucher = null,
    discountAmount = 0,
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

    return (
        <div className={cn("rounded-2xl border p-6 shadow-sm space-y-4", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HiOutlineTicket className="w-5 h-5 text-rose-500" />
                    <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Mã Giảm Giá / Voucher</h2>
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
                    placeholder="Nhập mã voucher (VD: FREESHIP50, ECOMNEW15...)"
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

            {/* Applied Voucher Card */}
            {appliedVoucher && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs">
                            <HiOutlineCheck className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                                <span>{appliedVoucher.code}</span>
                                <span className="text-xs font-normal opacity-80">({appliedVoucher.voucherTitle || appliedVoucher.title || 'Đã áp dụng'})</span>
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                Tiết kiệm: <strong>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</strong>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onRemoveVoucher}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-stone-400 hover:text-rose-500 transition-colors"
                        title="Bỏ áp dụng"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}
