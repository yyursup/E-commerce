import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiStar,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiCheck,
  HiOutlineFlag,
  HiOutlineShoppingBag,
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineChat,
  HiOutlineTicket,
  HiOutlineRefresh,
} from 'react-icons/hi'
import ProductImageGallery from './components/ProductImageGallery'
import ProductCard from '../../components/ProductCard'
import ReportActionButton from '../../components/ReportActionButton'
import ProductReviews from './components/ProductReviews'
import Footer from '../../components/Footer'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useCartStore } from '../../store/useCartStore'
import { useChatStore } from '../../store/useChatStore'
import { cn } from '../../lib/cn'
import productService from '../../services/product'
import cartService from '../../services/cart'
import shopService, { FALLBACK_SHOPS } from '../../services/shop'

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [product, setProduct] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(384)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const [shopProducts, setShopProducts] = useState([])
  const [similarProducts, setSimilarProducts] = useState([])
  const [similarLoading, setSimilarLoading] = useState(true)
  const [savedVoucher, setSavedVoucher] = useState({})

  const { isAuthenticated } = useAuthStore()
  const { updateCartCount } = useCartStore()
  const addButtonRef = useRef(null)

  // 1. Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.getProductById(productId)
        setProduct(data)

        // Fetch Shop info
        if (data?.shopId) {
          const shopData = await shopService.getShopById(data.shopId)
          setShop(shopData)

          // Fetch other products from same shop
          try {
            const spRes = await productService.getProducts({
              shopId: data.shopId,
              page: 0,
              size: 6,
            })
            const currentId = String(productId).toLowerCase()
            const filtered = (spRes?.content || [])
              .filter((p) => String(p.id).toLowerCase() !== currentId)
              .map((p) => {
                const thumb = p.images?.find((img) => img.isThumbnail) || p.images?.[0]
                const imageUrl = thumb?.imageUrl || (typeof thumb === 'string' ? thumb : '/product-placeholder.svg')
                const parsedPrice =
                  p.basePrice !== undefined && p.basePrice !== null
                    ? Number(p.basePrice)
                    : p.price !== undefined && p.price !== null
                    ? Number(p.price)
                    : 0

                return {
                  ...p,
                  id: p.id,
                  name: p.name,
                  image: imageUrl,
                  price: parsedPrice,
                  basePrice: p.basePrice,
                  badge: p.status === 'PUBLISHED' ? 'Cùng shop' : null,
                  rating: p.rating || 4.8,
                  shopName: p.shopName || shopData?.name || data?.shopName || 'Shop',
                  shopId: p.shopId || data?.shopId,
                  originalProduct: p,
                }
              })
            setShopProducts(filtered)
          } catch (e) {
            console.warn('Error fetching shop other products', e)
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.message || 'Không thể tải thông tin sản phẩm')
        toast.error('Không thể tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
      window.scrollTo(0, 0)
    }
  }, [productId])

  // 2. Fetch Similar Products
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!productId) return
      try {
        setSimilarLoading(true)
        const list = await productService.getSimilarProducts(productId, 6)
        const currentId = productId.toLowerCase()
        const mapped = (list || [])
          .filter((p) => p.id && String(p.id).toLowerCase() !== currentId)
          .map((p) => {
            const thumb = p.images?.find((img) => img.isThumbnail) || p.images?.[0]
            return {
              id: p.id,
              name: p.name,
              price: p.basePrice ? Number(p.basePrice) : 0,
              image: thumb?.imageUrl || '/product-placeholder.svg',
              badge: p.status === 'PUBLISHED' ? 'Gợi ý AI' : null,
              rating: 4.8,
              description: p.description,
              basePrice: p.basePrice,
              shopName: p.shopName,
              categoryName: p.categoryName,
              originalProduct: p,
            }
          })
        setSimilarProducts(mapped)
      } catch (err) {
        console.error('Error fetching similar products:', err)
        setSimilarProducts([])
      } finally {
        setSimilarLoading(false)
      }
    }
    fetchSimilar()
  }, [productId])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      navigate('/login')
      return
    }

    if (!product || !product.id) {
      toast.error('Thông tin sản phẩm không hợp lệ')
      return
    }

    try {
      setAddingToCart(true)
      const cartResponse = await cartService.addToCart(product.id, quantity, selectedVariant?.id || null)
      updateCartCount(cartResponse)

      setShowAddAnimation(true)
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)

      setTimeout(() => {
        setShowAddAnimation(false)
      }, 1500)
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      toast.error(errorMessage)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua sản phẩm')
      navigate('/login')
      return
    }

    if (!product || !product.id) {
      toast.error('Thông tin sản phẩm không hợp lệ')
      return
    }

    try {
      setAddingToCart(true)
      const cartResponse = await cartService.addToCart(product.id, quantity, selectedVariant?.id || null)
      updateCartCount(cartResponse)
      navigate('/checkout', { state: { shopId: product.shopId } })
    } catch (error) {
      console.error('Error buy now:', error)
      toast.error(error?.message || 'Không thể tiến hành đặt mua')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết sản phẩm!')
    }
  }

  const handleLikeToggle = () => {
    setIsLiked((prev) => {
      const next = !prev
      setLikeCount((c) => (next ? c + 1 : c - 1))
      toast.success(next ? 'Đã thêm vào mục Yêu thích' : 'Đã bỏ yêu thích')
      return next
    })
  }

  const handleSaveVoucher = (code) => {
    setSavedVoucher((prev) => ({ ...prev, [code]: true }))
    toast.success(`Đã lưu voucher ${code} thành công!`)
  }

  const increaseQuantity = () => setQuantity((prev) => prev + 1)
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen py-24 flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className={cn('mt-4 text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Đang tải thông tin chi tiết sản phẩm...
          </p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={cn('min-h-screen py-24 flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center max-w-md p-8 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <p className="text-rose-500 font-bold mb-4">{error || 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh'}</p>
          <button
            onClick={() => navigate('/products')}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
          >
            Quay lại sàn mua sắm
          </button>
        </div>
      </div>
    )
  }

  const variants = product.variants || []
  const hasVariants = variants.length > 0

  let price = 0
  let isFromPrice = false

  if (selectedVariant) {
    price = Number(selectedVariant.price)
  } else if (hasVariants) {
    const prices = variants.map(v => Number(v.price) || 0).filter(p => p > 0)
    price = prices.length > 0 ? Math.min(...prices) : (Number(product.basePrice) || 0)
    isFromPrice = true
  } else {
    price = Number(product.basePrice) || 0
  }
  const originalPrice = Math.round(price * 1.22) // Giá gốc trước giảm (giống Shopee gạch ngang)
  const displayStock = selectedVariant ? (selectedVariant.stock || 0) : (product.quantity || 0)
  const images = product.images || []
  const currentShopId = product.shopId || 'shop-1'
  const shopData = shop || FALLBACK_SHOPS[0]

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-100 text-stone-900')}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-5">
        {/* 1. SHOPEE BREADCRUMB */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 overflow-x-auto py-1">
          <Link to="/" className="hover:text-amber-600 dark:hover:text-amber-400 shrink-0">
            Trang chủ
          </Link>
          <HiOutlineChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/products" className="hover:text-amber-600 dark:hover:text-amber-400 shrink-0">
            Tất cả sản phẩm
          </Link>
          {product.categoryName && (
            <>
              <HiOutlineChevronRight className="h-3 w-3 shrink-0" />
              <Link
                to={`/products?categoryId=${product.categoryId}`}
                className="hover:text-amber-600 dark:hover:text-amber-400 shrink-0 font-medium"
              >
                {product.categoryName}
              </Link>
            </>
          )}
          <HiOutlineChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-md text-stone-800 dark:text-slate-200 font-semibold">
            {product.name}
          </span>
        </nav>

        {/* 2. MAIN PRODUCT CARD (Shopee 2-Column Showcase) */}
        <div
          className={cn(
            'rounded-3xl border p-5 sm:p-7 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left: Image Gallery & Social Actions */}
            <div className="lg:col-span-5 space-y-4">
              <ProductImageGallery images={images} />

              {/* Social Share & Likes */}
              <div className="flex items-center justify-between border-t pt-4 border-stone-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400">
                  <span className="font-medium">Chia sẻ:</span>
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
                    title="Sao chép liên kết"
                  >
                    <HiOutlineShare className="h-4 w-4 text-amber-500" />
                  </button>
                </div>

                <button
                  onClick={handleLikeToggle}
                  className="flex items-center gap-1.5 font-semibold text-rose-500 hover:opacity-80 transition-opacity"
                >
                  {isLiked ? (
                    <HiHeart className="h-5 w-5 fill-rose-500" />
                  ) : (
                    <HiOutlineHeart className="h-5 w-5" />
                  )}
                  <span>Đã thích ({likeCount})</span>
                </button>
              </div>
            </div>

            {/* Right: Product Info & Actions */}
            <div className="lg:col-span-7 space-y-5">
              {/* Product Title & Badges */}
              <div>
                <div className="flex items-start gap-2.5">
                  <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-black uppercase text-white tracking-wider shrink-0 mt-1">
                    E-Mall
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white leading-snug">
                    {product.name}
                  </h1>
                </div>

                {/* Rating, Reviews & Sold Bar (Shopee Style) */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold border-r pr-4 border-stone-200 dark:border-slate-800">
                    <span className="underline text-sm">4.9</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <HiStar key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <div className="border-r pr-4 border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400">
                    <span className="font-bold text-stone-900 dark:text-white underline text-sm mr-1">382</span>
                    Đánh Giá
                  </div>

                  <div className="text-stone-600 dark:text-slate-400">
                    <span className="font-bold text-stone-900 dark:text-white text-sm mr-1">1.5k</span>
                    Đã Bán
                  </div>

                  <div className="ml-auto">
                    <ReportActionButton
                      targetId={product.id}
                      targetType="PRODUCT"
                      targetName={product.name}
                      label="Tố cáo"
                      variant="chip"
                    />
                  </div>
                </div>
              </div>

              {/* Shopee Price Box */}
              <div
                className={cn(
                  'rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-4 transition-colors',
                  isDark ? 'bg-slate-800/70 border border-slate-700/50' : 'bg-stone-50 border border-stone-200/80'
                )}
              >
                <span className="text-sm line-through text-stone-400 dark:text-slate-500">
                  {formatVND(originalPrice)}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-500">
                    {isFromPrice ? `Từ ${formatVND(price)}` : formatVND(price)}
                  </span>
                  <span className="rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-xs font-black uppercase">
                    -18% Giảm
                  </span>
                </div>
                <div className="sm:ml-auto">
                  <span className="rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-[11px] font-bold border border-amber-500/20">
                    Gì Cũng Rẻ - Bao Giá Tốt Nhất
                  </span>
                </div>
              </div>

              {/* Escrow Guarantee Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs py-1">
                <span className="w-28 shrink-0 text-stone-500 dark:text-slate-400 font-semibold">
                  Bảo Hiểm Sàn
                </span>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                  <HiOutlineShieldCheck className="h-5 w-5 shrink-0" />
                  <span>Ký Quỹ Escrow An Toàn 100% (Đổi trả 7 ngày / Hoàn tiền nếu hàng lỗi)</span>
                </div>
              </div>

              {/* Shipping Row (GHN Express) */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 text-xs border-t pt-3 border-stone-100 dark:border-slate-800">
                <span className="w-28 shrink-0 text-stone-500 dark:text-slate-400 font-semibold mt-1">
                  Vận Chuyển
                </span>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
                    <HiOutlineTruck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>Giao Hàng Nhanh (GHN Express) - Toàn Quốc</span>
                  </div>
                  <div className="text-stone-500 dark:text-slate-400">
                    Phí vận chuyển dự kiến: <span className="font-bold text-stone-900 dark:text-white">18.000₫ - 32.000₫</span>
                    <span className="ml-2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">
                      Freeship Xtra
                    </span>
                  </div>
                </div>
              </div>

              {/* Variants Selector */}
              {hasVariants && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs border-t pt-3 border-stone-100 dark:border-slate-800">
                  <span className="w-28 shrink-0 text-stone-500 dark:text-slate-400 font-semibold">
                    Phân Loại
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const label = [variant.color, variant.size].filter(Boolean).join(' - ') || 'Loại khác'
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            if (selectedVariant?.id === variant.id) {
                              setSelectedVariant(null)
                            } else {
                              setSelectedVariant(variant)
                              setQuantity(1)
                            }
                          }}
                          className={cn(
                            'rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                            selectedVariant?.id === variant.id
                              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
                              : isDark
                              ? 'border-slate-700 hover:border-slate-600 text-slate-300'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Stock */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs border-t pt-3 border-stone-100 dark:border-slate-800">
                <span className="w-28 shrink-0 text-stone-500 dark:text-slate-400 font-semibold">
                  Số Lượng
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border border-stone-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      onClick={decreaseQuantity}
                      className="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-slate-700 font-bold text-stone-600 dark:text-slate-300"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-stone-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      className="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-slate-700 font-bold text-stone-600 dark:text-slate-300"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-stone-400 dark:text-slate-500 text-xs">
                    Còn {displayStock} sản phẩm có sẵn
                  </span>
                </div>
              </div>

              {/* Action Buttons (Shopee Style: Outline Cam + Solid Cam) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  ref={addButtonRef}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={cn(
                    'w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-500 bg-amber-500/10 px-6 py-3.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all active:scale-95 shadow-sm'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {showAddAnimation ? (
                      <motion.span
                        key="added"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <HiCheck className="h-5 w-5" />
                        Đã Thêm Vào Giỏ
                      </motion.span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <HiOutlineShoppingCart className="h-5 w-5" />
                        {addingToCart ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
                      </span>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-amber-500/25 flex items-center justify-center"
                >
                  Mua Ngay
                </button>
              </div>

              {/* Shopee Badges Strip */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-[11px] text-stone-500 dark:text-slate-400 text-center font-medium">
                <div className="flex items-center justify-center gap-1">
                  <HiOutlineRefresh className="h-4 w-4 text-rose-500" />
                  <span>7 Ngày Đổi Trả</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>100% Chính Hãng</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <HiOutlineTruck className="h-4 w-4 text-blue-500" />
                  <span>Freeship Mọi Nơi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CARD GIAN HÀNG (Shopee Shop Overview Banner Card) */}
        <div
          className={cn(
            'rounded-3xl border p-5 sm:p-6 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Shop Left Box */}
            <div className="lg:col-span-5 flex items-center gap-4 lg:border-r border-stone-200 dark:border-slate-800 pr-4">
              <Link to={`/shop/${currentShopId}`} className="relative shrink-0 group">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-slate-700 bg-white shadow-md">
                  <img src={shopData?.logo} alt={product.shopName} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                {shopData?.mallBadge && (
                  <span className="absolute -bottom-1 -right-1 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                    E-Mall
                  </span>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/shop/${currentShopId}`}
                  className="text-base font-bold text-stone-900 dark:text-white hover:text-amber-500 transition-colors flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{product.shopName || shopData?.name}</span>
                  <HiOutlineBadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                </Link>
                <div className="text-xs text-stone-400 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Online 5 phút trước</span>
                  <span>•</span>
                  <span className="truncate">{shopData?.city || 'Hà Nội'}</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/shop/${currentShopId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <HiOutlineShoppingBag className="h-3.5 w-3.5" />
                    Xem Shop
                  </Link>

                  <button
                    onClick={() => {
                      if (!currentShopId) return
                      useChatStore.getState().openShopChat(
                        {
                          id: currentShopId,
                          name: product.shopName || shopData?.name || 'Cửa hàng',
                          logo: shopData?.logo,
                          city: shopData?.city,
                          mallBadge: shopData?.mallBadge,
                          ekycVerified: shopData?.ekycVerified,
                        },
                        {
                          id: product.id,
                          name: product.name,
                          price: product.price || product.basePrice,
                          image: product.images?.[0]?.imageUrl || product.images?.[0] || product.thumbnailUrl,
                        }
                      )
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors',
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                    )}
                  >
                    <HiOutlineChat className="h-3.5 w-3.5 text-amber-500" />
                    Chat Ngay
                  </button>
                </div>
              </div>
            </div>

            {/* Shop Right Metrics */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Đánh Giá:</span>
                <span className="font-bold text-amber-500">{shopData?.rating || '4.9'} ({shopData?.reviewCount || '1.2k'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Sản Phẩm:</span>
                <span className="font-bold text-stone-900 dark:text-white">{shopData?.productCount || '42'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Tỉ Lệ Phản Hồi:</span>
                <span className="font-bold text-stone-900 dark:text-white">{shopData?.responseRate || '99%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Thời Gian Phản Hồi:</span>
                <span className="font-bold text-stone-900 dark:text-white">{shopData?.responseTime || 'trong vài phút'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Tham Gia Sàn:</span>
                <span className="font-bold text-stone-900 dark:text-white">{shopData?.joinedTime || '1 năm trước'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-slate-400">Người Theo Dõi:</span>
                <span className="font-bold text-stone-900 dark:text-white">{shopData?.followerCount || '24.5k'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CHI TIẾT SẢN PHẨM & MÔ TẢ (Shopee Specifications & Description) */}
        <div
          className={cn(
            'rounded-3xl border p-6 sm:p-8 shadow-sm transition-colors space-y-8',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          {/* Specifications Table */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4 pb-2 border-b border-stone-100 dark:border-slate-800">
              CHI TIẾT SẢN PHẨM
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-xs">
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Danh Mục:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right truncate">
                  {product.categoryName || 'Sản phẩm đa ngành'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Thương Hiệu:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right">Chính Hãng Phân Phối</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Mã SKU:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right">{product.sku || 'SKU-STANDARD'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Kho Hàng:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right">{product.quantity || 48}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Bảo Hành:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right">12 Tháng (Bảo hành điện tử)</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800/80">
                <span className="text-stone-500 dark:text-slate-400 w-32 shrink-0">Gửi Từ:</span>
                <span className="font-medium text-stone-900 dark:text-white text-right">{shopData?.city || 'Hà Nội / TP.HCM'}</span>
              </div>
            </div>
          </div>

          {/* Description Content */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4 pb-2 border-b border-stone-100 dark:border-slate-800">
              MÔ TẢ SẢN PHẨM
            </h2>
            <div className="prose prose-sm max-w-none text-stone-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p className="whitespace-pre-line">{product.description}</p>
              <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2 text-xs">
                <div className="font-bold text-amber-600 dark:text-amber-400">CHÍNH SÁCH BẢO VỆ NGƯỜI MUA TẠI E-COMMERCE:</div>
                <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-slate-400">
                  <li>Tiền thanh toán được bảo vệ 100% trong ví ký quỹ Escrow cho đến khi bạn xác nhận hài lòng.</li>
                  <li>Được đồng kiểm tra hàng cùng nhân viên GHN Express khi nhận bưu phẩm.</li>
                  <li>Đổi trả miễn phí trong 7 ngày nếu sản phẩm có lỗi từ nhà sản xuất hoặc người bán.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 5. REVIEWS & RATINGS SECTION */}
        <div
          className={cn(
            'rounded-3xl border p-6 sm:p-8 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <ProductReviews productId={productId} />
        </div>

        {/* 6. CÁC SẢN PHẨM KHÁC CỦA SHOP (Shop's Other Products) */}
        {shopProducts.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Sản Phẩm Khác Của Gian Hàng
              </h3>
              <Link
                to={`/shop/${currentShopId}`}
                className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
              >
                Xem tất cả ({shopData?.productCount || shopProducts.length})
                <HiOutlineChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {shopProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 7. SẢN PHẨM TƯƠNG TỰ (AI Recommendation) */}
        {(similarLoading || similarProducts.length > 0) && (
          <section className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Gợi Ý Sản Phẩm Tương Tự
            </h3>

            {similarLoading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {similarProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <Footer />
    </div>
  )
}
