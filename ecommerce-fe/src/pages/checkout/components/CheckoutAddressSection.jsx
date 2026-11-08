import { HiOutlineLocationMarker, HiPlus } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function CheckoutAddressSection({
    addresses = [],
    selectedAddressId,
    onSelectAddress,
    onOpenAddModal,
    onOpenAddAddress,
    isDark = false
}) {
    const handleOpenAdd = onOpenAddModal || onOpenAddAddress

    return (
        <div className={cn("rounded-lg border p-6", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <HiOutlineLocationMarker className="w-5 h-5 text-stone-950 dark:text-white" />
                    <h2 className={cn("font-bold text-xl", isDark ? "text-white" : "text-stone-900")}>Địa chỉ nhận hàng</h2>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-1 text-sm font-semibold text-stone-950 underline underline-offset-2 dark:text-white"
                >
                    <HiPlus className="w-4 h-4" /> Thêm địa chỉ
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-4">
                    <p className={isDark ? "text-slate-400" : "text-stone-500"}>Bạn chưa có địa chỉ nào.</p>
                    <button
                        onClick={handleOpenAdd}
                        className="text-stone-950 dark:text-white font-semibold underline mt-2 inline-block"
                    >
                        Thêm địa chỉ ngay
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((addr) => (
                        <label
                            key={addr.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                selectedAddressId === addr.id
                                    ? "border-2 border-stone-950 bg-stone-50 dark:border-white dark:bg-slate-800"
                                    : "border-transparent hover:bg-stone-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <input
                                type="radio"
                                name="address"
                                className="mt-1"
                                checked={selectedAddressId === addr.id}
                                onChange={() => onSelectAddress(addr.id)}
                            />
                            <div className="text-sm">
                                <div className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>
                                    {addr.receiverName || "Tên người nhận"} <span className="font-normal opacity-70">| {addr.receiverPhone || "SĐT"}</span>
                                </div>
                                <div className={isDark ? "text-slate-400" : "text-stone-600"}>
                                    {addr.addressLine}, {addr.ward}, {addr.district}, {addr.city}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}
