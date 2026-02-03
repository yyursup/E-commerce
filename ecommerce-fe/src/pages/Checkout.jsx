import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import cartService from '../services/cart'
import orderService from '../services/order'
import { userAddressService } from '../services/userAddressService'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import { HiOutlineLocationMarker, HiArrowLeft, HiOutlineShoppingBag } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function Checkout() {
    const { isAuthenticated } = useAuthStore()
    const { state } = useLocation()
    const shopId = state?.shopId
    const navigate = useNavigate()
    const isDark = useThemeStore((state) => state.theme) === 'dark'

    const [loading, setLoading] = useState(true)
    const [cartItems, setCartItems] = useState([])
    const [shopName, setShopName] = useState('')
    const [totalPrice, setTotalPrice] = useState(0)

    const [addresses, setAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        if (!shopId) {
            toast.error("Không tìm thấy thông tin đơn hàng")
            navigate('/cart')
            return
        }
        fetchData()
    }, [isAuthenticated, shopId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch Cart
            const cartData = await cartService.getCart()
            const shopItems = cartData.items.filter(item => item.shopId === shopId)

            if (shopItems.length === 0) {
                toast.error("Không có sản phẩm nào từ Shop này trong giỏ hàng")
                navigate('/cart')
                return
            }

            setCartItems(shopItems)
            setShopName(shopItems[0].shopName || 'Shop')
            setTotalPrice(shopItems.reduce((sum, item) => sum + item.totalPrice, 0))

            // Fetch Addresses
            const addressRes = await userAddressService.listMyAddresses()
            const addressList = addressRes.data || []
            setAddresses(addressList)

            // Auto select default or first address
            const defaultAddr = addressList.find(a => a.isDefault) || addressList[0]
            if (defaultAddr) setSelectedAddressId(defaultAddr.id)

        } catch (error) {
            console.error("Failed to load checkout data", error)
            toast.error("Có lỗi xảy ra khi tải dữ liệu")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrder = async () => {
        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng")
            return
        }

        try {
            setProcessing(true)
            // 1. Create Order
            const order = await orderService.createOrder(shopId, selectedAddressId, notes)
            toast.success("Đặt hàng thành công!")

            // 2. Create Payment URL
            const paymentRes = await orderService.createPayment(order.id)
            if (paymentRes.paymentUrl) {
                window.location.href = paymentRes.paymentUrl
            } else {
                navigate(`/orders/${order.id}`)
            }

        } catch (error) {
            console.error(error)
            toast.error(error.message || "Đặt hàng thất bại")
            // If order was created but payment failed, navigate to order detail
            if (error?.orderId) { // Check if we can get orderId from error context if possible, otherwise just stay or navigate
                navigate('/orders')
            }
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className={cn("flex min-h-screen items-center justify-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen py-10 px-4 sm:px-6 lg:px-8", isDark ? "bg-slate-950" : "bg-stone-50")}>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/cart')}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <HiArrowLeft className={cn("w-6 h-6", isDark ? "text-white" : "text-stone-900")} />
                    </button>
                    <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-stone-900")}>
                        Thanh toán ({shopName})
                    </h1>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Order Info & Address */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Address Section */}
                        <div className={cn("rounded-2xl border p-6 shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineLocationMarker className="w-5 h-5 text-amber-500" />
                                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Địa chỉ nhận hàng</h2>
                            </div>

                            {addresses.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className={isDark ? "text-slate-400" : "text-stone-500"}>Bạn chưa có địa chỉ nào.</p>
                                    <Link to="/profile" className="text-amber-500 font-medium hover:underline mt-2 inline-block">Thêm địa chỉ</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((addr) => (
                                        <label
                                            key={addr.id}
                                            className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                                selectedAddressId === addr.id
                                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                                                    : "border-transparent hover:bg-stone-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="address"
                                                className="mt-1"
                                                checked={selectedAddressId === addr.id}
                                                onChange={() => setSelectedAddressId(addr.id)}
                                            />
                                            <div className="text-sm">
                                                <div className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>
                                                    {addr.recipientName} <span className="font-normal opacity-70">| {addr.phone}</span>
                                                </div>
                                                <div className={isDark ? "text-slate-400" : "text-stone-600"}>
                                                    {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.city}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className={cn("rounded-2xl border overflow-hidden shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <div className={cn("px-6 py-4 border-b flex items-center gap-2", isDark ? "border-slate-800 bg-slate-800/50" : "border-stone-100 bg-stone-50")}>
                                <HiOutlineShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Sản phẩm</h2>
                            </div>
                            <div className="divide-y divide-stone-100 dark:divide-slate-800">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="p-4 flex gap-4">
                                        <img
                                            src={item.productImageUrl || 'https://via.placeholder.com/150'}
                                            alt={item.productName}
                                            className="h-16 w-16 rounded-lg object-cover border border-stone-100 dark:border-slate-700"
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

                        {/* Notes */}
                        <div className={cn("rounded-2xl border p-6 shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <h2 className={cn("font-bold text-lg mb-4", isDark ? "text-white" : "text-stone-900")}>Ghi chú đơn hàng</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Lưu ý cho người bán..."
                                className={cn(
                                    "w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-stone-50 border-stone-200 text-stone-900"
                                )}
                                rows={3}
                            />
                        </div>

                    </div>

                    {/* Right Column: Calculations */}
                    <div className="lg:col-span-4">
                        <div className={cn(
                            "sticky top-6 rounded-2xl border p-6 shadow-sm space-y-4",
                            isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
                        )}>
                            <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Chi tiết thanh toán</h2>

                            <div className="space-y-2 text-sm pt-4 border-t border-stone-100 dark:border-slate-800">
                                <div className="flex justify-between">
                                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Tổng tiền hàng</span>
                                    <span className={isDark ? "text-white" : "text-stone-900"}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Phí vận chuyển</span>
                                    <span className={cn("text-sm italic", isDark ? "text-slate-500" : "text-stone-400")}>
                                        (Tính sau khi tạo đơn)
                                    </span>
                                </div>
                            </div>

                            <div className="py-4 border-y border-stone-100 dark:border-slate-800 flex justify-between items-center">
                                <span className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>Tổng thanh toán</span>
                                <span className="font-bold text-xl text-amber-500">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                </span>
                            </div>

                            <button
                                onClick={handleCreateOrder}
                                disabled={processing || cartItems.length === 0}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-amber-500/25 transition-all flex justify-center items-center gap-2",
                                    processing
                                        ? "bg-stone-400 cursor-not-allowed"
                                        : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                                )}
                            >
                                {processing ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Đặt hàng"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
