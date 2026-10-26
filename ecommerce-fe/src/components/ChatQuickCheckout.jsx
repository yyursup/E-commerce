import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiX, HiPlus } from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import productService from '../services/product'
import cartService from '../services/cart'
import orderService from '../services/order'
import { userAddressService } from '../services/userAddressService'
import AddressFormModal from './AddressFormModal'

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0)

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
  { value: 'WALLET', label: 'Ví số dư tài khoản' },
  { value: 'VNPAY', label: 'VNPay (ATM / QR)' },
]

/**
 * Mua nhanh ngay trong khung chat AI: chọn phân loại -> chọn/thêm địa chỉ -> xem phí ship -> đặt hàng & thanh toán.
 * Dùng lại API giỏ hàng/checkout có sẵn (backend tạo đơn từ giỏ theo shop).
 */
export default function ChatQuickCheckout({ productId, isDark, onClose }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateCartCount = useCartStore((s) => s.updateCartCount)

  const [product, setProduct] = useState(null)
  const [variantId, setVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addresses, setAddresses] = useState([])
  const [addressId, setAddressId] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [otherShopItems, setOtherShopItems] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [quote, setQuote] = useState(null) // có quote = đã thêm vào giỏ, đang ở bước xác nhận
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    Promise.all([
      productService.getProductById(productId),
      userAddressService.listMyAddresses(),
      cartService.getCart().catch(() => null),
    ])
      .then(([p, addrs, cart]) => {
        setProduct(p)
        const list = Array.isArray(addrs) ? addrs : []
        setAddresses(list)
        setAddressId((list.find((a) => a.isDefault) || list[0])?.id || null)
        if (list.length === 0) setShowAddressForm(true)
        // backend gộp mọi món cùng shop trong giỏ vào 1 đơn -> báo trước cho người dùng
        const count = (cart?.items || []).filter((i) => i.shopId === p.shopId && i.productId !== p.id).length
        setOtherShopItems(count)
      })
      .catch((e) => toast.error(e?.message || 'Không tải được thông tin sản phẩm'))
      .finally(() => setLoading(false))
  }, [productId, isAuthenticated])

  const variants = product?.variants || []
  const selectedVariant = variants.find((v) => v.id === variantId)
  const unitPrice = selectedVariant?.price ?? product?.basePrice
  const maxStock = selectedVariant ? selectedVariant.stock : product?.quantity

  const goToConfirm = async () => {
    if (variants.length > 0 && !variantId) return toast.error('Vui lòng chọn phân loại')
    if (!addressId) return toast.error('Vui lòng chọn địa chỉ giao hàng')
    setSubmitting(true)
    try {
      const cart = await cartService.addToCart(product.id, quantity, variantId)
      updateCartCount(cart)
      setQuote(await orderService.getQuote(product.shopId, addressId))
    } catch (e) {
      toast.error(e?.message || 'Không thể tính phí giao hàng')
    } finally {
      setSubmitting(false)
    }
  }

  const placeOrder = async () => {
    setSubmitting(true)
    try {
      const order = await orderService.createOrder(product.shopId, addressId, 'Đặt nhanh từ Trợ lý AI', null, paymentMethod)
      updateCartCount(await cartService.getCart().catch(() => null))
      if (paymentMethod === 'VNPAY') {
        const res = await orderService.createPayment(order.id)
        window.location.href = res.paymentUrl
        return
      }
      toast.success(`Đặt hàng thành công: ${order.orderNumber}`)
      onClose(order)
    } catch (e) {
      toast.error(e?.message || 'Đặt hàng thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const box = isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-white'
  const pick = (active) =>
    cn('rounded-xl border px-3 py-2 text-left text-xs transition', active ? 'border-amber-500 bg-amber-500/10' : box)

  return (
    <div className={cn('absolute inset-0 z-20 flex flex-col', isDark ? 'bg-slate-900 text-slate-100' : 'bg-stone-50 text-stone-900')}>
      <div className={cn('flex items-center justify-between border-b px-4 py-3', isDark ? 'border-slate-800' : 'border-stone-200')}>
        <h3 className="text-sm font-semibold">{quote ? 'Xác nhận đơn hàng' : 'Mua nhanh'}</h3>
        <button type="button" onClick={() => onClose(null)} aria-label="Đóng" className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10">
          <HiX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {!isAuthenticated ? (
          <p>
            Vui lòng <Link to="/login" className="font-semibold text-amber-600 underline">đăng nhập</Link> để mua hàng.
          </p>
        ) : loading || !product ? (
          <p className="text-center opacity-70">{loading ? 'Đang tải...' : 'Sản phẩm không khả dụng.'}</p>
        ) : (
          <>
            <div className={cn('flex gap-3 rounded-xl border p-2', box)}>
              {product.images?.[0]?.imageUrl && <img src={product.images[0].imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{fmt(unitPrice)}</p>
                <p className="text-[11px] opacity-70">{product.shopName}</p>
              </div>
            </div>

            {!quote && (
              <>
                {variants.length > 0 && (
                  <section>
                    <p className="mb-2 text-xs font-semibold">Phân loại</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => (
                        <button key={v.id} type="button" disabled={!v.stock} onClick={() => setVariantId(v.id)}
                          className={cn(pick(v.id === variantId), !v.stock && 'opacity-40')}>
                          {[v.color, v.size].filter(Boolean).join(' / ')} · {fmt(v.price)}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="flex items-center gap-3">
                  <p className="text-xs font-semibold">Số lượng</p>
                  <input type="number" min={1} max={maxStock || undefined} value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, maxStock || 1)))}
                    className={cn('w-16 rounded-lg border px-2 py-1 text-xs', box)} aria-label="Số lượng" />
                  {maxStock != null && <span className="text-[11px] opacity-70">Còn {maxStock}</span>}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">Địa chỉ giao hàng</p>
                    <button type="button" onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-xs text-amber-600">
                      <HiPlus /> Thêm mới
                    </button>
                  </div>
                  {addresses.length === 0 && <p className="text-xs opacity-70">Bạn chưa có địa chỉ, vui lòng thêm mới.</p>}
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <button key={a.id} type="button" onClick={() => setAddressId(a.id)} className={cn(pick(a.id === addressId), 'w-full')}>
                        <p className="font-medium">{a.receiverName} · {a.receiverPhone}</p>
                        <p className="opacity-70">{[a.addressLine, a.ward, a.district, a.city].filter(Boolean).join(', ')}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {quote && (
              <>
                {otherShopItems > 0 && (
                  <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                    Đơn này sẽ gồm cả {otherShopItems} sản phẩm khác của shop đang có trong giỏ hàng của bạn.
                  </p>
                )}
                <section className={cn('space-y-1 rounded-xl border p-3 text-xs', box)}>
                  <div className="flex justify-between"><span>Tạm tính</span><span>{fmt(quote.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Phí giao hàng (GHN)</span><span>{fmt(quote.shippingFee)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-semibold"><span>Tổng</span><span className="text-amber-600">{fmt(quote.total)}</span></div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-semibold">Phương thức thanh toán</p>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)} className={cn(pick(m.value === paymentMethod), 'w-full')}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>

      {isAuthenticated && product && (
        <div className={cn('flex gap-2 border-t p-3', isDark ? 'border-slate-800' : 'border-stone-200')}>
          <button type="button" disabled={submitting} onClick={quote ? placeOrder : goToConfirm}
            className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
            {submitting ? 'Đang xử lý...' : quote ? (paymentMethod === 'VNPAY' ? 'Thanh toán VNPay' : 'Đặt hàng') : 'Tiếp tục'}
          </button>
        </div>
      )}

      {createPortal(
        <AddressFormModal
          isOpen={showAddressForm}
          isDark={isDark}
          onClose={() => setShowAddressForm(false)}
          onSuccess={(a) => {
            setAddresses((prev) => [a, ...prev])
            setAddressId(a.id)
          }}
        />,
        document.body,
      )}
    </div>
  )
}
