import { HiOutlineShoppingBag, HiOutlineLocationMarker } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutOrderItems({
    shopName = '',
    shopOrigin = null,
    cartItems = [],
    notes = '',
    setNotes,
    onNotesChange,
    isDark = false
}) {
    const handleNotesChange = onNotesChange || ((val) => setNotes && setNotes(val))

    return (
        <div className="space-y-6">
            {/* Order Items Box */}
            <div className={cn("rounded-2xl border overflow-hidden shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                <div className={cn("px-6 py-4 border-b flex flex-wrap items-center justify-between gap-2", isDark ? "border-slate-800 bg-slate-800/50" : "border-stone-100 bg-stone-50")}>
                    <div className="flex items-center gap-2">
                        <HiOutlineShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                        <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>
                            Sản phẩm ({shopName})
                        </h2>
                    </div>
                    {shopOrigin?.address && (
                        <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                            <HiOutlineLocationMarker className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Kho gửi GHN: <strong className="text-stone-800 dark:text-slate-200">{shopOrigin.address}</strong></span>
                        </div>
                    )}
                </div>
                <div className="divide-y divide-stone-100 dark:divide-slate-800">
                    {cartItems.map((item) => (
                        <div key={item.id} className="p-4 flex gap-4">
                            <img
                                src={item.productImageUrl || '/product-placeholder.svg'}
                                alt={item.productName}
                                className="h-16 w-16 rounded-lg object-cover border border-stone-100 dark:border-slate-700 bg-stone-100 dark:bg-slate-800"
                                onError={(e) => {
                                    e.target.src = '/product-placeholder.svg'
                                }}
                            />
                            <div className="flex-1">
                                <h3 className={cn("text-sm font-medium line-clamp-2", isDark ? "text-white" : "text-stone-900")}>
                                    {item.productName}
                                </h3>
                                <div className="mt-1 flex justify-between items-center text-sm">
                                    <span className={isDark ? "text-slate-400" : "text-stone-500"}>x{item.quantity}</span>
                                    <span className={cn("font-medium", isDark ? "text-amber-400" : "text-amber-600")}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes Section */}
            <div className={cn("rounded-2xl border p-6 shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                <h2 className={cn("font-bold text-lg mb-4", isDark ? "text-white" : "text-stone-900")}>Ghi chú đơn hàng</h2>
                <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Lưu ý cho người bán..."
                    className={cn(
                        "w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                        isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-stone-50 border-stone-200 text-stone-900"
                    )}
                    rows={3}
                />
            </div>
        </div>
    )
}
