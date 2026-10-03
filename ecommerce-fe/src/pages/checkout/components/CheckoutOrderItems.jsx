import { HiOutlineShoppingBag, HiOutlineLocationMarker } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

const getConditionBadge = (grade) => {
    switch (grade) {
        case 'GRADE_NEW':
            return { label: 'Mới 100% Seal', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
        case 'GRADE_LIKE_NEW':
            return { label: 'Like New 99%', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
        case 'GRADE_FAIR':
            return { label: 'Cũ 90-95%', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
        case 'GRADE_AS_IS':
            return { label: 'Xác máy / Thanh lý', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
        default:
            return null
    }
}

const getWarrantyBadge = (type, months) => {
    if (!type || type === 'KHONG_BAO_HANH') {
        return { label: 'Bao test', cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
    }
    const duration = months ? ` ${months}T` : ''
    if (type === 'CHINH_HANG') {
        return { label: `BH Hãng${duration}`, cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' }
    }
    return { label: `BH Shop${duration}`, cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
}

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
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    {item.conditionGrade && (
                                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getConditionBadge(item.conditionGrade)?.cls)}>
                                            {getConditionBadge(item.conditionGrade)?.label}
                                        </span>
                                    )}
                                    {item.warrantyType && (
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.cls)}>
                                            {getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.label}
                                        </span>
                                    )}
                                    {(item.variantColor || item.variantSize) && (
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                                            isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-stone-100 text-stone-600 border border-stone-200"
                                        )}>
                                            Phân loại: {[item.variantColor, item.variantSize].filter(Boolean).join(' - ')}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex justify-between items-center text-sm">
                                    <span className={isDark ? "text-slate-400" : "text-stone-500"}>Số lượng: x{item.quantity}</span>
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
