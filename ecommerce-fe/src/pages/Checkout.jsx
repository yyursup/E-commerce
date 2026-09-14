import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import cartService from '../services/cart'
import orderService from '../services/order'
import voucherService from '../services/voucher'
import { userAddressService } from '../services/userAddressService'
import { shippingService } from '../services/shippingService'
import shopService from '../services/shop'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import {
    HiOutlineLocationMarker,
    HiArrowLeft,
    HiOutlineShoppingBag,
    HiPlus,
    HiOutlineTicket,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineTag
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import AddressFormModal from '../components/AddressFormModal'

export default function Checkout() {
    const { isAuthenticated } = useAuthStore()
    const { state } = useLocation()
    const shopId = state?.shopId
    const navigate = useNavigate()
    const isDark = useThemeStore((state) => state.theme) === 'dark'

    const [loading, setLoading] = useState(true)
    const [cartItems, setCartItems] = useState([])
    const [shopName, setShopName] = useState('')
    const [shopOrigin, setShopOrigin] = useState(null)
    const [totalPrice, setTotalPrice] = useState(0)
    const [shippingFee, setShippingFee] = useState(0)
    const [isCalculatingFee, setIsCalculatingFee] = useState(false)

    // Voucher States
    const [voucherCodeInput, setVoucherCodeInput] = useState('')
    const [appliedVoucher, setAppliedVoucher] = useState(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)
    const [availableVouchers, setAvailableVouchers] = useState([])
    const [showVoucherModal, setShowVoucherModal] = useState(false)
    const [loadingVouchers, setLoadingVouchers] = useState(false)

    const [addresses, setAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [notes, setNotes] = useState('')
    const [processing, setProcessing] = useState(false)
    const [showAddAddress, setShowAddAddress] = useState(false)

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
            const calculatedTotal = shopItems.reduce((sum, item) => sum + item.totalPrice, 0)
            setTotalPrice(calculatedTotal)

            // Load Shop warehouse origin for GHN shipping calculation
            try {
                const confirmData = await orderService.getCheckoutConfirm(shopId)
                if (confirmData?.shopDistrictId) {
                    setShopOrigin({
                        districtId: confirmData.shopDistrictId,
                        wardCode: confirmData.shopWardCode || "20101",
                        address: confirmData.shopAddress || confirmData.shopName || "Kho hàng Shop",
                    })
                } else {
                    const sData = await shopService.getShopById(shopId)
                    setShopOrigin({
                        districtId: sData?.districtId || (sData?.city === 'Hà Nội' ? 1542 : sData?.city === 'Đà Nẵng' ? 1530 : 1442),
                        wardCode: sData?.wardCode || (sData?.city === 'Hà Nội' ? "1B1507" : sData?.city === 'Đà Nẵng' ? "40101" : "20101"),
                        address: sData?.location || sData?.address || "Kho hàng Shop",
                    })
                }
            } catch (err) {
                console.warn("Could not get confirm shop origin, fallback to shopService", err)
                const sData = await shopService.getShopById(shopId)
                setShopOrigin({
                    districtId: sData?.districtId || (sData?.city === 'Hà Nội' ? 1542 : sData?.city === 'Đà Nẵng' ? 1530 : 1442),
                    wardCode: sData?.wardCode || (sData?.city === 'Hà Nội' ? "1B1507" : sData?.city === 'Đà Nẵng' ? "40101" : "20101"),
                    address: sData?.location || sData?.address || "Kho hàng Shop",
                })
            }

            // Fetch Addresses
            await loadAddresses()

            // Fetch Available Vouchers (Shop vouchers + Platform vouchers)
            await loadAvailableVouchers(shopId)

        } catch (error) {
            console.error("Failed to load checkout data", error)
            toast.error("Có lỗi xảy ra khi tải dữ liệu")
        } finally {
            setLoading(false)
        }
    }

    const loadAvailableVouchers = async (targetShopId) => {
        try {
            setLoadingVouchers(true)
            const [shopVouchersRes, platformVouchersRes] = await Promise.allSettled([
                voucherService.getShopVouchers(targetShopId),
                voucherService.listVouchers({ scope: 'PLATFORM' })
            ])

            const list = []
            if (shopVouchersRes.status === 'fulfilled' && Array.isArray(shopVouchersRes.value)) {
                list.push(...shopVouchersRes.value)
            }
            if (platformVouchersRes.status === 'fulfilled' && Array.isArray(platformVouchersRes.value)) {
                list.push(...platformVouchersRes.value)
            }
            setAvailableVouchers(list)
        } catch (e) {
            console.warn("Could not load vouchers", e)
        } finally {
            setLoadingVouchers(false)
        }
    }

    const loadAddresses = async (newAddressId = null) => {
        try {
            const addressRes = await userAddressService.listMyAddresses()
            const addressList = Array.isArray(addressRes) ? addressRes : (addressRes?.data || [])
            setAddresses(addressList)

            if (newAddressId) {
                setSelectedAddressId(newAddressId)
            } else if (!selectedAddressId) {
                // Auto select default or first address if none selected
                const defaultAddr = addressList.find(a => a.isDefault) || addressList[0]
                if (defaultAddr) setSelectedAddressId(defaultAddr.id)
            }
        } catch (error) {
            console.error("Failed to load addresses", error)
        }
    }

    // Calculate shipping fee whenever address or shop warehouse changes
    useEffect(() => {
        if (selectedAddressId && addresses.length > 0 && shopOrigin) {
            calculateShippingFee()
        }
    }, [selectedAddressId, addresses, shopOrigin])

    const calculateShippingFee = async () => {
        const selectedAddr = addresses.find(a => a.id === selectedAddressId)
        if (!selectedAddr) return

        if (!selectedAddr.districtId || !selectedAddr.wardCode) {
            return
        }

        try {
            setIsCalculatingFee(true)

            // Real Shop Dispatch Warehouse from backend
            const FROM_DISTRICT_ID = shopOrigin?.districtId || 1442;
            const FROM_WARD_CODE = shopOrigin?.wardCode || "20101";

            // Calculate weight (500g per item * quantity)
            const totalWeight = cartItems.reduce((sum, item) => sum + (item.quantity * 500), 0)

            const feeData = await shippingService.calculateFee({
                from_district_id: FROM_DISTRICT_ID,
                from_ward_code: FROM_WARD_CODE,
                to_district_id: selectedAddr.districtId,
                to_ward_code: selectedAddr.wardCode,
                weight: totalWeight,
                service_type_id: 2, // Standard
                insurance_value: totalPrice > 5000000 ? 5000000 : totalPrice
            })

            const calculatedFee = feeData.total || 0
            setShippingFee(calculatedFee)

            // If a voucher is already applied, recalculate discount with new shipping fee
            if (appliedVoucher?.code) {
                recalculateAppliedVoucher(appliedVoucher.code, calculatedFee)
            }
        } catch (error) {
            console.error("Failed to calculate shipping fee", error)
            setShippingFee(0)
        } finally {
            setIsCalculatingFee(false)
        }
    }

    const recalculateAppliedVoucher = async (code, curShippingFee = shippingFee) => {
        try {
            const res = await voucherService.calculateDiscount({
                code: code.trim(),
                shopId: shopId,
                subtotal: totalPrice,
                shippingFee: curShippingFee
            })
            if (res?.valid) {
                setAppliedVoucher(res)
                setDiscountAmount(Number(res.discountAmount || 0))
            } else {
                setAppliedVoucher(null)
                setDiscountAmount(0)
                toast.error(res?.message || "Voucher không còn thỏa mãn điều kiện đơn hàng")
            }
        } catch (err) {
            console.warn("Recalculate voucher failed", err)
        }
    }

    const handleApplyVoucher = async (codeToApply) => {
        const targetCode = (codeToApply || voucherCodeInput || '').trim().toUpperCase()
        if (!targetCode) {
            toast.error("Vui lòng nhập mã giảm giá")
            return
        }

        try {
            setIsApplyingVoucher(true)
            const res = await voucherService.calculateDiscount({
                code: targetCode,
                shopId: shopId,
                subtotal: totalPrice,
                shippingFee: shippingFee
            })

            if (res?.valid) {
                setAppliedVoucher(res)
                setDiscountAmount(Number(res.discountAmount || 0))
                setVoucherCodeInput(targetCode)
                setShowVoucherModal(false)
                toast.success(`Áp dụng mã ${targetCode} thành công! -${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(res.discountAmount)}`)
            } else {
                toast.error(res?.message || "Mã giảm giá không hợp lệ hoặc không áp dụng được cho đơn này")
            }
        } catch (err) {
            console.error("Apply voucher error:", err)
            toast.error(err?.message || err?.response?.data?.message || "Không thể áp dụng mã giảm giá này")
        } finally {
            setIsApplyingVoucher(false)
        }
    }

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null)
        setDiscountAmount(0)
        setVoucherCodeInput('')
        toast("Đã bỏ áp dụng mã giảm giá", { icon: 'ℹ️' })
    }

    const handleCreateOrder = async () => {
        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng")
            return
        }

        if (isCalculatingFee) {
            toast.error("Đang tính phí vận chuyển, vui lòng chờ...")
            return
        }

        try {
            setProcessing(true)
            // 1. Create Order with Voucher Code (if applied)
            const order = await orderService.createOrder(
                shopId,
                selectedAddressId,
                notes,
                appliedVoucher?.code || null
            )
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
            if (error?.orderId) {
                navigate('/orders')
            }
        } finally {
            setProcessing(false)
        }
    }

    const handleAddressAdded = (newAddress) => {
        // Reload addresses and select the new one
        loadAddresses(newAddress.id)
    }

    if (loading) {
        return (
            <div className={cn("flex min-h-screen items-center justify-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        )
    }

    const finalTotal = Math.max(0, totalPrice + shippingFee - discountAmount)

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
                    {/* Left Column: Order Info, Address & Voucher */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Address Section */}
                        <div className={cn("rounded-2xl border p-6 shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <HiOutlineLocationMarker className="w-5 h-5 text-amber-500" />
                                    <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Địa chỉ nhận hàng</h2>
                                </div>
                                <button
                                    onClick={() => setShowAddAddress(true)}
                                    className="flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors"
                                >
                                    <HiPlus className="w-4 h-4" /> Thêm địa chỉ
                                </button>
                            </div>

                            {addresses.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className={isDark ? "text-slate-400" : "text-stone-500"}>Bạn chưa có địa chỉ nào.</p>
                                    <button
                                        onClick={() => setShowAddAddress(true)}
                                        className="text-amber-500 font-medium hover:underline mt-2 inline-block"
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

                        {/* Order Items */}
                        <div className={cn("rounded-2xl border overflow-hidden shadow-sm", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <div className={cn("px-6 py-4 border-b flex flex-wrap items-center justify-between gap-2", isDark ? "border-slate-800 bg-slate-800/50" : "border-stone-100 bg-stone-50")}>
                                <div className="flex items-center gap-2">
                                    <HiOutlineShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                    <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Sản phẩm ({shopName})</h2>
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

                        {/* VOUCHER SECTION (Shopee Style) */}
                        <div className={cn("rounded-2xl border p-6 shadow-sm space-y-4", isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white")}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HiOutlineTicket className="w-5 h-5 text-rose-500" />
                                    <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>Mã Giảm Giá / Voucher</h2>
                                </div>
                                <button
                                    onClick={() => setShowVoucherModal(true)}
                                    className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                                >
                                    <HiOutlineTag className="w-4 h-4" />
                                    Chọn Voucher Có Sẵn ({availableVouchers.length})
                                </button>
                            </div>

                            {/* Voucher Input Bar */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={voucherCodeInput}
                                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Nhập mã voucher (VD: FREESHIP50, ECOMNEW15...)"
                                    className={cn(
                                        "flex-1 rounded-xl border px-4 py-2.5 text-sm uppercase font-mono tracking-wider outline-none transition-all focus:ring-2 focus:ring-amber-500",
                                        isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-stone-50 border-stone-200 text-stone-900"
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleApplyVoucher()
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleApplyVoucher()}
                                    disabled={isApplyingVoucher || !voucherCodeInput.trim()}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all",
                                        isApplyingVoucher || !voucherCodeInput.trim()
                                            ? "bg-stone-300 dark:bg-slate-700 cursor-not-allowed text-stone-500"
                                            : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                                    )}
                                >
                                    {isApplyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
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
                                                <span className="text-xs font-normal opacity-80">({appliedVoucher.voucherTitle || 'Đã áp dụng'})</span>
                                            </div>
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                Tiết kiệm: <strong>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveVoucher}
                                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-stone-400 hover:text-rose-500 transition-colors"
                                        title="Bỏ áp dụng"
                                    >
                                        <HiOutlineX className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
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

                            <div className="space-y-2.5 text-sm pt-4 border-t border-stone-100 dark:border-slate-800">
                                <div className="flex justify-between">
                                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Tổng tiền hàng</span>
                                    <span className={isDark ? "text-white" : "text-stone-900"}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={isDark ? "text-slate-400" : "text-stone-600"}>Phí vận chuyển</span>
                                    {isCalculatingFee ? (
                                        <span className="text-amber-500 animate-pulse">Đang tính...</span>
                                    ) : (
                                        <span className={cn("font-medium", isDark ? "text-white" : "text-stone-900")}>
                                            {shippingFee > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee) : '---'}
                                        </span>
                                    )}
                                </div>

                                {/* Voucher Discount Row */}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                        <span className="flex items-center gap-1 font-medium">
                                            <HiOutlineTicket className="w-4 h-4" />
                                            Giảm giá voucher ({appliedVoucher?.code})
                                        </span>
                                        <span className="font-bold">
                                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="py-4 border-y border-stone-100 dark:border-slate-800 flex justify-between items-center">
                                <span className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>Tổng thanh toán</span>
                                <span className="font-bold text-xl text-amber-500">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}
                                </span>
                            </div>

                            <button
                                onClick={handleCreateOrder}
                                disabled={processing || cartItems.length === 0 || isCalculatingFee}
                                className={cn(
                                    "w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-amber-500/25 transition-all flex justify-center items-center gap-2",
                                    (processing || isCalculatingFee)
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

            {/* Address Modal */}
            <AddressFormModal
                isOpen={showAddAddress}
                onClose={() => setShowAddAddress(false)}
                onSuccess={handleAddressAdded}
                isDark={isDark}
            />

            {/* Voucher Selection Modal */}
            {showVoucherModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={cn(
                        "w-full max-w-lg rounded-3xl border p-6 shadow-2xl max-h-[85vh] flex flex-col",
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
                    )}>
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <HiOutlineTicket className="w-6 h-6 text-amber-500" />
                                <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-stone-900")}>
                                    Kho Voucher Khả Dụng
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowVoucherModal(false)}
                                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal List */}
                        <div className="py-4 overflow-y-auto space-y-3 flex-1">
                            {loadingVouchers ? (
                                <div className="py-8 text-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto"></div>
                                    <p className="text-xs text-stone-400 mt-2">Đang tải kho voucher...</p>
                                </div>
                            ) : availableVouchers.length === 0 ? (
                                <div className="py-8 text-center">
                                    <HiOutlineTicket className="h-10 w-10 text-stone-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-stone-500">Chưa có mã voucher khả dụng cho đơn này.</p>
                                </div>
                            ) : (
                                availableVouchers.map((v) => {
                                    const isCurrentApplied = appliedVoucher?.code === v.code
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
                                            className={cn(
                                                "p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all",
                                                isCurrentApplied
                                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                                                    : isDark ? "border-slate-800 bg-slate-800/40" : "border-stone-200 bg-stone-50/50"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                                        {v.code}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[11px] font-bold px-2 py-0.5 rounded",
                                                        v.scope === 'PLATFORM'
                                                            ? "bg-blue-500/10 text-blue-500"
                                                            : "bg-rose-500/10 text-rose-500"
                                                    )}>
                                                        {v.scope === 'PLATFORM' ? 'Voucher Sàn' : 'Voucher Shop'}
                                                    </span>
                                                    {v.categoryName && (
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                            Ngành: {v.categoryName}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={cn("text-sm font-bold mt-1.5", isDark ? "text-white" : "text-stone-900")}>
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
                                                        * Đơn hàng không có sản phẩm thuộc ngành {v.categoryName}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleApplyVoucher(v.code)}
                                                disabled={!isEligible || isCurrentApplied}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0",
                                                    isCurrentApplied
                                                        ? "bg-emerald-500 text-white cursor-default"
                                                        : isEligible
                                                        ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95"
                                                        : "bg-stone-200 dark:bg-slate-700 text-stone-400 cursor-not-allowed"
                                                )}
                                            >
                                                {isCurrentApplied ? 'Đang dùng' : 'Dùng ngay'}
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 text-right">
                            <button
                                onClick={() => setShowVoucherModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

