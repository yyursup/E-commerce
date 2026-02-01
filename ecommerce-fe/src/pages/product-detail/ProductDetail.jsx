import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineShare,
  HiStar,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiCheck,
} from 'react-icons/hi'
import ProductImageGallery from './components/ProductImageGallery'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useCartStore } from '../../store/useCartStore'
import { cn } from '../../lib/cn'
import productService from '../../services/product'
import cartService from '../../services/cart'

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { updateCartCount, incrementCount } = useCartStore()
  const addButtonRef = useRef(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productService.getProductById(productId)
        setProduct(data)
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
    }
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
      const cartResponse = await cartService.addToCart(product.id, quantity)
      
      // Update cart count in store
      updateCartCount(cartResponse)
      
      // Show success animation
      setShowAddAnimation(true)
      toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`)
      
      // Hide animation after 1.5s
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

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    toast.success('Chức năng đang phát triển')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép link sản phẩm')
    }
  }

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
              <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Đang tải sản phẩm...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
                {error || 'Sản phẩm không tồn tại'}
              </p>
              <button
                onClick={() => navigate('/products')}
                className={cn(
                  'mt-4 rounded-xl px-4 py-2 text-sm font-medium',
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
                )}
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const price = product.basePrice ? Number(product.basePrice) : 0
  const images = product.images || []

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'mb-6 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
            isDark
              ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              : 'bg-white text-stone-700 hover:bg-stone-50',
            isDark ? 'border border-slate-700' : 'border border-stone-200',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductImageGallery images={images} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Category & Shop */}
            <div className="space-y-2">
              {product.categoryName && (
                <Link
                  to={`/products?categoryId=${product.categoryId}`}
                  className={cn(
                    'inline-block text-sm font-medium',
                    isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
                  )}
                >
                  {product.categoryName}
                </Link>
              )}
              {product.shopName && (
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Cửa hàng:
                  </span>
                  <Link
                    to={`/products?shopId=${product.shopId}`}
                    className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
                    )}
                  >
                    {product.shopName}
                  </Link>
                </div>
              )}
            </div>

            {/* Product Name */}
            <h1
              className={cn(
                'text-3xl font-bold tracking-tight sm:text-4xl',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <HiStar
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < 4 ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600',
                    )}
                  />
                ))}
                <span className={cn('ml-2 text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  4.5
                </span>
              </div>
              <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                (128 đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                </span>
              </div>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Giá đã bao gồm VAT
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <HiOutlineCheckCircle className={cn('h-5 w-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Chính hãng 100%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineTruck className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Miễn phí vận chuyển
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineShieldCheck className={cn('h-5 w-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Bảo hành chính hãng
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineCheckCircle className={cn('h-5 w-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Đổi trả trong 7 ngày
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Số lượng
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decreaseQuantity}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border font-medium transition',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
                  )}
                >
                  −
                </button>
                <span
                  className={cn(
                    'flex h-10 w-16 items-center justify-center rounded-lg border font-medium',
                    isDark ? 'border-slate-600 bg-slate-800 text-slate-300' : 'border-stone-300 bg-white text-stone-700',
                  )}
                >
                  {quantity}
                </span>
                <button
                  onClick={increaseQuantity}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border font-medium transition',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
                  )}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                ref={addButtonRef}
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition',
                  isDark
                    ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50'
                    : 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50',
                )}
              >
                <AnimatePresence mode="wait">
                  {showAddAnimation ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <HiCheck className="h-5 w-5" />
                      <span>Đã thêm</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cart"
                      initial={{ scale: 1 }}
                      animate={{ scale: addingToCart ? 0.95 : 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <HiOutlineShoppingCart className="h-5 w-5" />
                      {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={handleBuyNow}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition',
                  isDark
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100',
                )}
              >
                Mua ngay
              </button>
            </div>

            {/* Share & Wishlist */}
            <div className="flex items-center gap-4 border-t pt-4">
              <button
                onClick={handleShare}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <HiOutlineShare className="h-5 w-5" />
                Chia sẻ
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <HiOutlineHeart className="h-5 w-5" />
                Yêu thích
              </button>
            </div>
          </motion.div>
        </div>

        {/* Product Description */}
        {product.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-12"
          >
            <div
              className={cn(
                'rounded-2xl border p-6',
                isDark ? 'border-slate-700/50 bg-slate-900/80' : 'border-stone-200 bg-white',
              )}
            >
              <h2
                className={cn(
                  'mb-4 text-xl font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Mô tả sản phẩm
              </h2>
              <div
                className={cn(
                  'prose prose-sm max-w-none',
                  isDark ? 'prose-invert text-slate-300' : 'text-stone-700',
                )}
              >
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Product Info Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-8"
        >
          <div
            className={cn(
              'rounded-2xl border p-6',
              isDark ? 'border-slate-700/50 bg-slate-900/80' : 'border-stone-200 bg-white',
            )}
          >
            <h2
              className={cn(
                'mb-4 text-xl font-semibold',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              Thông tin sản phẩm
            </h2>
            <div className="space-y-3">
              {product.sku && (
                <div className="flex justify-between border-b pb-3">
                  <span className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Mã sản phẩm
                  </span>
                  <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    {product.sku}
                  </span>
                </div>
              )}
              {product.categoryName && (
                <div className="flex justify-between border-b pb-3">
                  <span className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Danh mục
                  </span>
                  <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    {product.categoryName}
                  </span>
                </div>
              )}
              {product.shopName && (
                <div className="flex justify-between border-b pb-3">
                  <span className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Cửa hàng
                  </span>
                  <Link
                    to={`/products?shopId=${product.shopId}`}
                    className={cn(
                      'text-sm',
                      isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
                    )}
                  >
                    {product.shopName}
                  </Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Trạng thái
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    product.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400',
                  )}
                >
                  {product.status === 'PUBLISHED' ? 'Đang bán' : product.status}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
