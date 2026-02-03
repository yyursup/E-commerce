import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import cartService from '../services/cart'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineTrash, HiMinus, HiPlus, HiArrowRight, HiOutlineShoppingBag, HiTicket } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Cart() {
    const { isAuthenticated } = useAuthStore()
    const { updateCartCount } = useCartStore() // Only use available methods
    const isDark = useThemeStore((state) => state.theme) === 'dark'
    const navigate = useNavigate()

    // Local state management
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)

    const items = cart?.items || []
    const total = cart?.totalPrice || 0

    const fetchCart = async () => {
        try {
            setLoading(true)
            const data = await cartService.getCart()
            setCart(data)
            updateCartCount(data) // Sync with Navbar
        } catch (error) {
            console.error("Failed to fetch cart", error)
            toast.error("Không thể tải giỏ hàng")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart()
        }
    }, [isAuthenticated])

    const handleQuantityChange = async (itemId, currentQty, change) => {
        const newQty = currentQty + change
        if (newQty < 1) return
        if (newQty > 10) {
            toast.error("Số lượng tối đa là 10 sản phẩm")
            return
        }

        try {
            // Optimistic update (optional) or just wait for reload
            // For simplicity, wait for API
            let data;
            if (change > 0) {
                data = await cartService.increaseQuantity(itemId)
            } else {
                data = await cartService.decreaseQuantity(itemId)
            }
            setCart(data)
            updateCartCount(data)
        } catch (error) {
            toast.error('Không thể cập nhật số lượng')
        }
    }

    const handleRemoveItem = async (itemId) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                const data = await cartService.removeItem(itemId)
                setCart(data)
                updateCartCount(data)
                toast.success('Đã xóa sản phẩm')
            } catch (error) {
                toast.error('Không thể xóa sản phẩm')
            }
        }
    }

    const handleCheckout = (shopId) => {
        navigate('/checkout', { state: { shopId } });
    }

    if (!isAuthenticated) {
        return (
            <div className={cn("flex min-h-[60vh] flex-col items-center justify-center p-4 text-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
                <div className="mb-6 rounded-full bg-amber-100 p-6 dark:bg-amber-900/20">
                    <HiOutlineShoppingBag className="h-12 w-12 text-amber-600 dark:text-amber-500" />
                </div>
                <h2 className={cn("mb-2 text-2xl font-bold", isDark ? "text-white" : "text-stone-900")}>
                    Bạn chưa đăng nhập
                </h2>
                <p className={cn("mb-8 max-w-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                    Vui lòng đăng nhập để xem giỏ hàng và thực hiện mua sắm
                </p>
                <Link
                    to="/login"
                    className="rounded-full bg-amber-500 px-8 py-3 font-bold text-white transition hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/25"
                >
                    Đăng nhập ngay
                </Link>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={cn("flex min-h-screen items-center justify-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        )
    }

    // Handle Empty Cart
    if (!items || items.length === 0) {
        return (
            <div className={cn("flex min-h-[60vh] flex-col items-center justify-center p-4 text-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6"
                >
                    <img
                        src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png"
                        alt="Empty Cart"
                        className="w-64 opacity-80 grayscale mix-blend-luminosity hover:grayscale-0 transition-all duration-500"
                    />
                </motion.div>

                <h2 className={cn("mb-2 text-xl font-bold", isDark ? "text-white" : "text-stone-900")}>
                    Giỏ hàng trống
                </h2>
                <p className={cn("mb-8 text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                    Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.
                </p>
                <Link
                    to="/"
                    className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                >
                    Tiếp tục mua sắm
                </Link>
            </div>
        )
    }

    // Group items by Shop
    const groupedItems = items.reduce((groups, item) => {
        const shopName = item.shopName || 'Unknown Shop';
        const shopId = item.shopId;
        if (!groups[shopName]) {
            groups[shopName] = {
                shopId,
                shopName,
                items: []
            };
        }
        groups[shopName].items.push(item);
        return groups;
    }, {});

    return (
        <div className={cn("min-h-screen py-10 px-4 sm:px-6 lg:px-8", isDark ? "bg-slate-950" : "bg-stone-50")}>
            <div className="mx-auto max-w-7xl">
                <h1 className={cn("mb-8 text-3xl font-bold", isDark ? "text-white" : "text-stone-900")}>
                    Giỏ hàng của bạn
                    <span className="ml-3 text-lg font-normal text-stone-500">
                        ({items.length} sản phẩm)
                    </span>
                </h1>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Cart Items List */}
                    <div className="lg:col-span-8 space-y-6">
                        <AnimatePresence>
                            {Object.values(groupedItems).map((group) => (
                                <motion.div
                                    key={group.shopName}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={cn(
                                        "overflow-hidden rounded-2xl border shadow-sm transition-all",
                                        isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
                                    )}
                                >
                                    {/* Header: Shop Name */}
                                    <div className={cn("px-6 py-4 border-b flex justify-between items-center", isDark ? "border-slate-800 bg-slate-800/50" : "border-stone-100 bg-stone-50")}>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-100 rounded-lg dark:bg-amber-900/30">
                                                <HiOutlineShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                            </div>
                                            <span className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-800")}>
                                                {group.shopName}
                                            </span>
                                        </div>
                                        {/* Checkout Button for this shop */}
                                        <button
                                            onClick={() => handleCheckout(group.shopId)}
                                            disabled={!group.shopId}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
                                                group.shopId
                                                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                                            )}
                                        >
                                            Mua từ Shop này <HiArrowRight />
                                        </button>
                                    </div>

                                    {/* Items List */}
                                    <div className="divide-y divide-stone-100 dark:divide-slate-800">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="p-6 transition-colors hover:bg-stone-50/50 dark:hover:bg-slate-800/50">
                                                <div className="flex gap-4 sm:gap-6">
                                                    {/* Product Image */}
                                                    <div className="shrink-0">
                                                        <img
                                                            src={item.productImageUrl || '/product-placeholder.svg'}
                                                            alt={item.productName}
                                                            className="h-24 w-24 rounded-xl object-cover border border-stone-100 shadow-sm dark:border-slate-700 bg-stone-100 dark:bg-slate-800"
                                                            onError={(e) => {
                                                              e.target.src = '/product-placeholder.svg'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex flex-1 flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className={cn("text-base font-medium line-clamp-2 pr-4", isDark ? "text-white" : "text-stone-900")}>
                                                                    <Link to={`/products/${item.productId}`} className="hover:text-amber-500 transition-colors">
                                                                        {item.productName}
                                                                    </Link>
                                                                </h3>
                                                                <button
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all dark:hover:bg-red-900/20"
                                                                    title="Xóa sản phẩm"
                                                                >
                                                                    <HiOutlineTrash className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                            <p className={cn("mt-1 text-sm font-medium", isDark ? "text-amber-400" : "text-amber-600")}>
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                                            {/* Quantity Control */}
                                                            <div className={cn(
                                                                "flex items-center rounded-lg border",
                                                                isDark ? "border-slate-700 bg-slate-800" : "border-stone-200 bg-white"
                                                            )}>
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                                                    disabled={item.quantity <= 1}
                                                                    className="p-2 hover:text-amber-600 disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                                                                >
                                                                    <HiMinus className="h-3 w-3" />
                                                                </button>
                                                                <span className={cn("w-10 text-center text-sm font-semibold", isDark ? "text-white" : "text-stone-900")}>
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                                                    className="p-2 hover:text-amber-600 transition-colors"
                                                                >
                                                                    <HiPlus className="h-3 w-3" />
                                                                </button>
                                                            </div>

                                                            {/* Item Total */}
                                                            <div className={cn("text-right font-bold", isDark ? "text-white" : "text-stone-900")}>
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Order Summary (Global) */}
                    <div className="lg:col-span-4">
                        <div className={cn(
                            "sticky top-24 rounded-2xl border p-6 shadow-sm",
                            isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
                        )}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <HiTicket className="w-5 h-5 text-amber-500" />
                                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Tóm tắt giỏ hàng</h2>
                            </div>

                            <div className="space-y-3 pb-4 border-b border-stone-100 dark:border-slate-800">
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Tổng số lượng</span>
                                    <span className={isDark ? "text-white" : "text-stone-900"}>{items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-4">
                                <span className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Tổng tiền tạm tính</span>
                                <span className="font-bold text-xl text-amber-500">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                </span>
                            </div>

                            <div className={cn("mt-4 p-4 rounded-xl text-sm", isDark ? "bg-slate-800 text-slate-300" : "bg-stone-50 text-stone-600")}>
                                <p>
                                    * Phí vận chuyển và mã giảm giá sẽ được tính ở bước thanh toán. <br />
                                    * Vui lòng chọn "Mua từ Shop này" ở từng danh sách sản phẩm để tiến hành đặt hàng theo từng Shop.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
