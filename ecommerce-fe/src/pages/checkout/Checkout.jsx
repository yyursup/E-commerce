import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import cartService from '../../services/cart'
import orderService from '../../services/order'
import voucherService from '../../services/voucher'
import { userAddressService } from '../../services/userAddressService'
import { shippingService } from '../../services/shippingService'
import shopService from '../../services/shop'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import { HiArrowLeft } from 'react-icons/hi'
import toast from 'react-hot-toast'
import AddressFormModal from '../../components/AddressFormModal'
import Footer from '../../components/Footer'
import CheckoutAddressSection from './components/CheckoutAddressSection'
import CheckoutOrderItems from './components/CheckoutOrderItems'
import CheckoutVoucherSection from './components/CheckoutVoucherSection'
import CheckoutVoucherModal from './components/CheckoutVoucherModal'
import CheckoutOrderSummary from './components/CheckoutOrderSummary'

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

    // Dual Voucher States (1 Shop Voucher + 1 Platform Voucher)
    const [voucherCodeInput, setVoucherCodeInput] = useState('')
    const [selectedShopVoucher, setSelectedShopVoucher] = useState(null)
    const [selectedPlatformVoucher, setSelectedPlatformVoucher] = useState(null)
    const [shopDiscountAmount, setShopDiscountAmount] = useState(0)
    const [platformDiscountAmount, setPlatformDiscountAmount] = useState(0)
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

            // Prefer Backend Quote API (SSOT)
            const voucherParams = {
                shopVoucherCode: selectedShopVoucher?.code || null,
                platformVoucherCode: selectedPlatformVoucher?.code || null
            }

            try {
                const quoteRes = await orderService.getQuote(shopId, selectedAddressId, voucherParams)
                if (quoteRes) {
                    const fee = Number(quoteRes.shippingFee || 0)
                    setShippingFee(fee)
                    if (quoteRes.discountAmount !== undefined) {
                        setDiscountAmount(Number(quoteRes.discountAmount || 0))
                        setShopDiscountAmount(Number(quoteRes.shopDiscountAmount || 0))
                        setPlatformDiscountAmount(Number(quoteRes.platformDiscountAmount || 0))
                    }
                    return
                }
            } catch (quoteErr) {
                console.warn("Quote API error, fallback to direct calculation", quoteErr)
            }

            // Fallback calculation matching backend quoteFee parameters (service_type_id: 2)
            const FROM_DISTRICT_ID = shopOrigin?.districtId || 1442;
            const FROM_WARD_CODE = shopOrigin?.wardCode || "20101";
            const totalWeight = cartItems.reduce((sum, item) => sum + (item.quantity * 500), 0)

            const feeData = await shippingService.calculateFee({
                from_district_id: FROM_DISTRICT_ID,
                from_ward_code: FROM_WARD_CODE,
                to_district_id: selectedAddr.districtId,
                to_ward_code: selectedAddr.wardCode,
                weight: totalWeight,
                service_type_id: 2, // Standard
            })

            const calculatedFee = feeData.total || 0
            setShippingFee(calculatedFee)

            // If vouchers are already applied, recalculate discount with new shipping fee
            if (selectedShopVoucher || selectedPlatformVoucher) {
                recalculateAppliedVouchers(selectedShopVoucher, selectedPlatformVoucher, calculatedFee)
            }
        } catch (error) {
            console.error("Failed to calculate shipping fee", error)
            setShippingFee(0)
        } finally {
            setIsCalculatingFee(false)
        }
    }

    const recalculateAppliedVouchers = async (shopV, platformV, curShippingFee = shippingFee) => {
        if (!shopV && !platformV) {
            setShopDiscountAmount(0)
            setPlatformDiscountAmount(0)
            setDiscountAmount(0)
            return
        }

        try {
            const res = await voucherService.calculateDiscount({
                shopVoucherCode: shopV?.code || null,
                platformVoucherCode: platformV?.code || null,
                shopId: shopId,
                subtotal: totalPrice,
                shippingFee: curShippingFee
            })

            if (res?.valid) {
                const sDiscount = Number(res.shopDiscountAmount || 0)
                const pDiscount = Number(res.platformDiscountAmount || 0)
                const tDiscount = Number(res.discountAmount || (sDiscount + pDiscount))

                setShopDiscountAmount(sDiscount)
                setPlatformDiscountAmount(pDiscount)
                setDiscountAmount(tDiscount)
            } else {
                setSelectedShopVoucher(null)
                setSelectedPlatformVoucher(null)
                setShopDiscountAmount(0)
                setPlatformDiscountAmount(0)
                setDiscountAmount(0)
                toast.error(res?.message || "Voucher không còn thỏa mãn điều kiện đơn hàng")
            }
        } catch (err) {
            console.warn("Recalculate vouchers failed", err)
        }
    }

    // Modal Confirmation handler
    const handleApplyMultiVouchers = async ({ shopVoucher, platformVoucher }) => {
        if (!shopVoucher && !platformVoucher) {
            setSelectedShopVoucher(null)
            setSelectedPlatformVoucher(null)
            setShopDiscountAmount(0)
            setPlatformDiscountAmount(0)
            setDiscountAmount(0)
            toast("Đã bỏ áp dụng tất cả voucher", { icon: 'ℹ️' })
            return
        }

        try {
            setIsApplyingVoucher(true)
            const res = await voucherService.calculateDiscount({
                shopVoucherCode: shopVoucher?.code || null,
                platformVoucherCode: platformVoucher?.code || null,
                shopId: shopId,
                subtotal: totalPrice,
                shippingFee: shippingFee
            })

            if (res?.valid) {
                setSelectedShopVoucher(shopVoucher ? { ...shopVoucher, title: res.shopVoucherTitle || shopVoucher.title } : null)
                setSelectedPlatformVoucher(platformVoucher ? { ...platformVoucher, title: res.platformVoucherTitle || platformVoucher.title } : null)

                const sDiscount = Number(res.shopDiscountAmount || 0)
                const pDiscount = Number(res.platformDiscountAmount || 0)
                const tDiscount = Number(res.discountAmount || (sDiscount + pDiscount))

                setShopDiscountAmount(sDiscount)
                setPlatformDiscountAmount(pDiscount)
                setDiscountAmount(tDiscount)

                const appliedNames = [shopVoucher?.code, platformVoucher?.code].filter(Boolean).join(' + ')
                toast.success(`Áp dụng voucher (${appliedNames}) thành công! -${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tDiscount)}`)
            } else {
                toast.error(res?.message || "Không thể áp dụng các voucher đã chọn")
            }
        } catch (err) {
            console.error("Apply vouchers error:", err)
            toast.error(err?.message || err?.response?.data?.message || "Không thể áp dụng voucher")
        } finally {
            setIsApplyingVoucher(false)
        }
    }

    // Input bar quick apply handler
    const handleApplyVoucher = async (codeToApply) => {
        const targetCode = (codeToApply || voucherCodeInput || '').trim().toUpperCase()
        if (!targetCode) {
            toast.error("Vui lòng nhập mã giảm giá")
            return
        }

        try {
            setIsApplyingVoucher(true)

            // 1. Try to classify the entered code
            const foundInAvailable = availableVouchers.find(v => v.code?.toUpperCase() === targetCode)
            let isShop = false
            if (foundInAvailable) {
                isShop = foundInAvailable.scope === 'SHOP'
            }

            // Determine prospective slots
            let prospectiveShopCode = isShop ? targetCode : (selectedShopVoucher?.code || null)
            let prospectivePlatformCode = !isShop ? targetCode : (selectedPlatformVoucher?.code || null)

            let res = await voucherService.calculateDiscount({
                shopVoucherCode: prospectiveShopCode,
                platformVoucherCode: prospectivePlatformCode,
                shopId: shopId,
                subtotal: totalPrice,
                shippingFee: shippingFee
            })

            // If failed due to classification guess, try alternative assignment
            if (!res?.valid && !foundInAvailable) {
                res = await voucherService.calculateDiscount({
                    code: targetCode,
                    shopId: shopId,
                    subtotal: totalPrice,
                    shippingFee: shippingFee
                })
            }

            if (res?.valid) {
                if (res.shopVoucherCode) {
                    setSelectedShopVoucher({
                        code: res.shopVoucherCode,
                        title: res.shopVoucherTitle || 'Voucher Shop',
                        scope: 'SHOP'
                    })
                }
                if (res.platformVoucherCode) {
                    setSelectedPlatformVoucher({
                        code: res.platformVoucherCode,
                        title: res.platformVoucherTitle || 'Voucher Sàn',
                        scope: 'PLATFORM'
                    })
                }

                const sDiscount = Number(res.shopDiscountAmount || 0)
                const pDiscount = Number(res.platformDiscountAmount || 0)
                const tDiscount = Number(res.discountAmount || (sDiscount + pDiscount))

                setShopDiscountAmount(sDiscount)
                setPlatformDiscountAmount(pDiscount)
                setDiscountAmount(tDiscount)
                setVoucherCodeInput('')
                setShowVoucherModal(false)

                toast.success(`Áp dụng mã ${targetCode} thành công! -${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tDiscount)}`)
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

    const handleRemoveShopVoucher = () => {
        setSelectedShopVoucher(null)
        setShopDiscountAmount(0)
        recalculateAppliedVouchers(null, selectedPlatformVoucher)
        toast("Đã bỏ áp dụng Voucher Shop", { icon: 'ℹ️' })
    }

    const handleRemovePlatformVoucher = () => {
        setSelectedPlatformVoucher(null)
        setPlatformDiscountAmount(0)
        recalculateAppliedVouchers(selectedShopVoucher, null)
        toast("Đã bỏ áp dụng Voucher Sàn", { icon: 'ℹ️' })
    }

    const handleRemoveAllVouchers = () => {
        setSelectedShopVoucher(null)
        setSelectedPlatformVoucher(null)
        setShopDiscountAmount(0)
        setPlatformDiscountAmount(0)
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

            // 1. Create Order with Multi-Voucher params
            const voucherParams = {
                shopVoucherCode: selectedShopVoucher?.code || null,
                platformVoucherCode: selectedPlatformVoucher?.code || null,
                voucherCode: selectedShopVoucher?.code || selectedPlatformVoucher?.code || null
            }

            const order = await orderService.createOrder(
                shopId,
                selectedAddressId,
                notes,
                voucherParams
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
            <div className={cn("min-h-screen flex flex-col justify-between transition-colors", isDark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-stone-900")}>
                <div className="flex-1 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                </div>
                <Footer />
            </div>
        )
    }

    const finalTotal = Math.max(0, totalPrice + shippingFee - discountAmount)

    return (
        <div className={cn("min-h-screen flex flex-col justify-between transition-colors", isDark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-stone-900")}>
            <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
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
                        <CheckoutAddressSection
                            addresses={addresses}
                            selectedAddressId={selectedAddressId}
                            onSelectAddress={setSelectedAddressId}
                            onOpenAddModal={() => setShowAddAddress(true)}
                            isDark={isDark}
                        />

                        {/* Order Items & Notes */}
                        <CheckoutOrderItems
                            shopName={shopName}
                            shopOrigin={shopOrigin}
                            cartItems={cartItems}
                            notes={notes}
                            setNotes={setNotes}
                            isDark={isDark}
                        />

                        {/* Voucher Section */}
                        <CheckoutVoucherSection
                            voucherCodeInput={voucherCodeInput}
                            setVoucherCodeInput={setVoucherCodeInput}
                            appliedShopVoucher={selectedShopVoucher}
                            appliedPlatformVoucher={selectedPlatformVoucher}
                            shopDiscountAmount={shopDiscountAmount}
                            platformDiscountAmount={platformDiscountAmount}
                            discountAmount={discountAmount}
                            isApplyingVoucher={isApplyingVoucher}
                            availableCount={availableVouchers.length}
                            onApplyVoucher={handleApplyVoucher}
                            onRemoveShopVoucher={handleRemoveShopVoucher}
                            onRemovePlatformVoucher={handleRemovePlatformVoucher}
                            onRemoveVoucher={handleRemoveAllVouchers}
                            onOpenVoucherModal={() => setShowVoucherModal(true)}
                            isDark={isDark}
                        />
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="lg:col-span-4">
                        <CheckoutOrderSummary
                            totalPrice={totalPrice}
                            shippingFee={shippingFee}
                            appliedShopVoucher={selectedShopVoucher}
                            appliedPlatformVoucher={selectedPlatformVoucher}
                            shopDiscountAmount={shopDiscountAmount}
                            platformDiscountAmount={platformDiscountAmount}
                            discountAmount={discountAmount}
                            voucherCodeInput={voucherCodeInput}
                            finalTotal={finalTotal}
                            isCalculatingFee={isCalculatingFee}
                            processing={processing}
                            cartItemsCount={cartItems.length}
                            onCreateOrder={handleCreateOrder}
                            isDark={isDark}
                        />
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
            <CheckoutVoucherModal
                isOpen={showVoucherModal}
                onClose={() => setShowVoucherModal(false)}
                loading={loadingVouchers}
                vouchers={availableVouchers}
                appliedShopVoucher={selectedShopVoucher}
                appliedPlatformVoucher={selectedPlatformVoucher}
                totalPrice={totalPrice}
                shippingFee={shippingFee}
                cartItems={cartItems}
                onApplyMulti={handleApplyMultiVouchers}
                onApply={handleApplyVoucher}
                isDark={isDark}
            />
            </div>
            <Footer />
        </div>
    )
}


