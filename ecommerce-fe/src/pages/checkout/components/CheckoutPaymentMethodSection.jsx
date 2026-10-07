import { HiOutlineCreditCard, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineCurrencyDollar } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutPaymentMethodSection({
    paymentMethod = 'COD',
    setPaymentMethod,
    walletBalance = 0,
    loadingWallet = false,
    finalTotal = 0,
    isDark = false
}) {
    const isWalletInsufficient = Number(walletBalance) < Number(finalTotal)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0)
    }

    const methods = [
        {
            id: 'COD',
            name: 'Thanh toán khi nhận hàng (COD)',
            description: 'Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận kiện hàng.',
            icon: HiOutlineTruck,
            badge: 'Phổ biến',
            disabled: false
        },
        {
            id: 'WALLET',
            name: 'Ví số dư tài khoản',
            description: loadingWallet
                ? 'Đang kiểm tra số dư ví...'
                : `Số dư khả dụng: ${formatCurrency(walletBalance)}. Trừ trực tiếp từ ví sàn, ký quỹ an toàn.`,
            icon: HiOutlineCurrencyDollar,
            badge: isWalletInsufficient ? 'Không đủ số dư' : 'Nhanh chóng',
            disabled: isWalletInsufficient,
            insufficientAmount: isWalletInsufficient ? Math.max(0, finalTotal - walletBalance) : 0
        },
        {
            id: 'VNPAY',
            name: 'Cổng thanh toán VNPAY',
            description: 'Thanh toán trực tuyến an toàn qua VNPAY-QR, Thẻ ATM/Tài khoản nội địa, hoặc Thẻ quốc tế.',
            icon: HiOutlineCreditCard,
            badge: 'Bảo mật',
            disabled: false
        }
    ]

    return (
        <div className={cn("rounded-2xl border p-6 shadow-sm space-y-4", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
            <div className="flex items-center justify-between">
                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>
                    Phương thức thanh toán
                </h2>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                    Vui lòng chọn 1 phương thức
                </span>
            </div>

            <div className="space-y-3">
                {methods.map((method) => {
                    const Icon = method.icon
                    const isSelected = paymentMethod === method.id
                    const isDisabled = method.disabled

                    return (
                        <div
                            key={method.id}
                            onClick={() => {
                                if (!isDisabled) {
                                    setPaymentMethod(method.id)
                                }
                            }}
                            className={cn(
                                "flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200",
                                isDisabled
                                    ? isDark
                                        ? "opacity-60 bg-slate-900/50 border-slate-800 cursor-not-allowed"
                                        : "opacity-60 bg-stone-100/50 border-stone-200 cursor-not-allowed"
                                    : "cursor-pointer",
                                !isDisabled && isSelected
                                    ? isDark
                                        ? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/50"
                                        : "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                                    : !isDisabled && (isDark
                                        ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800/80"
                                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/70")
                            )}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => {
                                    if (!isDisabled) setPaymentMethod(method.id)
                                }}
                                className={cn(
                                    "mt-1 text-amber-600 focus:ring-amber-500 h-4 w-4 border-stone-300 dark:border-slate-600",
                                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                )}
                            />
                            <div className={cn(
                                "p-2 rounded-lg shrink-0",
                                isDisabled
                                    ? isDark ? "bg-slate-800 text-slate-500" : "bg-stone-200 text-stone-400"
                                    : method.id === 'WALLET'
                                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                        : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("font-medium text-sm", isDark ? "text-white" : "text-stone-900")}>
                                        {method.name}
                                    </span>
                                    {method.badge && (
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                            method.disabled
                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                : method.id === 'WALLET'
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                            {method.badge}
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-xs mt-0.5 leading-relaxed",
                                    isDisabled ? "text-rose-500 dark:text-rose-400" : "text-stone-500 dark:text-slate-400"
                                )}>
                                    {method.description}
                                </p>
                                {isDisabled && method.insufficientAmount > 0 && (
                                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                                        Cần thêm {formatCurrency(method.insufficientAmount)} để thanh toán bằng phương thức này.
                                    </p>
                                )}
                            </div>
                            {isSelected && !isDisabled && (
                                <HiOutlineCheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
