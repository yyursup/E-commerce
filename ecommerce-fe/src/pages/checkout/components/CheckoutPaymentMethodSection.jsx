import { HiOutlineCreditCard, HiOutlineTruck, HiOutlineCheckCircle } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutPaymentMethodSection({
    paymentMethod = 'COD',
    setPaymentMethod,
    isDark = false
}) {
    const methods = [
        {
            id: 'COD',
            name: 'Thanh toán khi nhận hàng (COD)',
            description: 'Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận kiện hàng.',
            icon: HiOutlineTruck,
            badge: 'Phổ biến'
        },
        {
            id: 'VNPAY',
            name: 'Cổng thanh toán VNPAY',
            description: 'Thanh toán trực tuyến an toàn qua VNPAY-QR, Thẻ ATM/Tài khoản nội địa, hoặc Thẻ quốc tế.',
            icon: HiOutlineCreditCard,
            badge: 'Bảo mật'
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

                    return (
                        <div
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={cn(
                                "flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                isSelected
                                    ? isDark
                                        ? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/50"
                                        : "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                                    : isDark
                                        ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800/80"
                                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/70"
                            )}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                checked={isSelected}
                                onChange={() => setPaymentMethod(method.id)}
                                className="mt-1 text-amber-600 focus:ring-amber-500 h-4 w-4 border-stone-300 dark:border-slate-600 cursor-pointer"
                            />
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-medium text-sm", isDark ? "text-white" : "text-stone-900")}>
                                        {method.name}
                                    </span>
                                    {method.badge && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                            {method.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {method.description}
                                </p>
                            </div>
                            {isSelected && (
                                <HiOutlineCheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
