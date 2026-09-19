import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineShoppingCart, HiStar, HiCheck } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { cn } from '../lib/cn'
import cartService from '../services/cart'
import productService from '../services/product'

export default function ProductQuickView({ product, onAddToCart }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const { updateCartCount } = useCartStore()
  const navigate = useNavigate()

  const [fullProduct, setFullProduct] = useState(product)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch full details (with all variants) if not provided
  useEffect(() => {
    if (product?.id && (!product.variants || product.variants.length === 0)) {
      let isMounted = true
      setLoadingDetail(true)
      productService
        .getProductById(product.id)
        .then((data) => {
          if (isMounted && data) {
            setFullProduct(data)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingDetail(false)
        })
      return () => {
        isMounted = false
      }
    } else {
      setFullProduct(product)
    }
  }, [product])

  const target = fullProduct || product || {}
  const { name, rating, id } = target

  const variants = target.variants || []
  const hasVariants = variants.length > 0

  const displayImage =
    target.image ||
    target.images?.find((img) => img.isThumbnail)?.imageUrl ||
    target.images?.[0]?.imageUrl ||
    (typeof target.images?.[0] === 'string' ? target.images[0] : null) ||
    '/product-placeholder.svg'

  // Calculate pricing
  const prices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : (Number(target.basePrice || target.price) || 0)
  const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice

  let displayPrice = minPrice
  let isRangePrice = false

  if (selectedVariant) {
    displayPrice = Number(selectedVariant.price) || minPrice
  } else if (hasVariants && minPrice !== maxPrice) {
    isRangePrice = true
  }

  // Real old price only (no fake calculation)
  const displayOldPrice =
    target.oldPrice !== undefined && target.oldPrice !== null
      ? Number(target.oldPrice)
      : target.originalPrice
      ? Number(target.originalPrice)
      : null

  const totalStock = hasVariants
    ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
    : (target.quantity ?? target.stockQuantity ?? 0)

  const displayStock = selectedVariant ? (selectedVariant.stock ?? 0) : totalStock

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const handleAddToCartClick = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      navigate('/login')
      return
    }

    if (!target || !target.id) {
      toast.error('Thông tin sản phẩm không hợp lệ')
      return
    }

    if (hasVariants && !selectedVariant) {
      toast.error('Vui lòng chọn phân loại hàng (màu sắc / kích cỡ...) trước khi thêm vào giỏ!', {
        icon: '⚠️',
      })
      return
    }

    if (displayStock <= 0) {
      toast.error('Phân loại hàng này hiện đã hết hàng trong kho!')
      return
    }

    if (quantity > displayStock) {
      toast.error(`Số lượng chọn (${quantity}) vượt quá tồn kho còn lại (${displayStock})`)
      return
    }

    try {
      setAddingToCart(true)
      const cartResponse = await cartService.addToCart(target.id, quantity, selectedVariant?.id || null)

      updateCartCount(cartResponse)
      onAddToCart?.(target)

      setShowAddAnimation(true)
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`)

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* Product Image Column */}
      <div className="sm:col-span-5 w-full">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-slate-800 shadow-sm border border-stone-200/70 dark:border-slate-800">
          <img
            src={displayImage}
            alt={name}
            onError={(e) => {
              e.target.src = '/product-placeholder.svg'
            }}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </div>

      {/* Info & Options Column */}
      <div className="sm:col-span-7 flex flex-col justify-between space-y-3.5">
        <div className="space-y-3">
          {/* Rating & Sold info (real data only) */}
          {(rating || target.sold !== undefined) && (
            <div className="flex items-center gap-2 text-xs">
              {rating ? (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={cn(
                          'h-3.5 w-3.5',
                          i < Math.floor(rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300 dark:text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-stone-700 dark:text-slate-300">
                    {Number(rating).toFixed(1)}
                  </span>
                </div>
              ) : null}
              {target.sold !== undefined && target.sold !== null && (
                <span className="text-stone-500 dark:text-slate-400 font-medium">
                  Đã bán {target.sold}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <Link to={`/products/${id}`}>
            <h3
              className={cn(
                'text-lg font-bold transition hover:text-amber-600 dark:hover:text-amber-400 leading-snug',
                isDark ? 'text-white' : 'text-stone-900'
              )}
            >
              {name}
            </h3>
          </Link>

          {/* Price Box */}
          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tight leading-tight">
              {isRangePrice ? `${formatVND(minPrice)} - ${formatVND(maxPrice)}` : formatVND(displayPrice)}
            </span>
            {displayOldPrice && displayOldPrice > displayPrice && (
              <>
                <span className="text-xs text-stone-400 line-through dark:text-slate-500">
                  {formatVND(displayOldPrice)}
                </span>
                <span className="rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[10px] font-black uppercase">
                  -{Math.round((1 - displayPrice / displayOldPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Variants Selector */}
          {hasVariants && (
            <div className="pt-2 border-t border-stone-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-slate-300">
                <span>Chọn phân loại hàng:</span>
                {selectedVariant && (
                  <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                    Đã chọn: {[selectedVariant.color, selectedVariant.size].filter(Boolean).join(' - ')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {variants.map((v) => {
                  const label = [v.color, v.size].filter(Boolean).join(' - ') || 'Loại khác'
                  const isSelected = selectedVariant?.id === v.id
                  const isOut = v.stock !== undefined && v.stock <= 0

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOut}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedVariant(null)
                        } else {
                          setSelectedVariant(v)
                          setQuantity(1)
                        }
                      }}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-bold transition-all text-left flex items-center gap-1.5',
                        isOut && 'opacity-40 cursor-not-allowed border-stone-200 line-through',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
                          : isDark
                          ? 'border-slate-700 hover:border-slate-600 text-slate-300 bg-slate-800/40'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                      )}
                    >
                      <span>{label}</span>
                      {v.price && (
                        <span className="text-[10px] font-normal opacity-80">
                          ({formatVND(v.price)})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Stock */}
          <div className="flex items-center gap-4 pt-2 border-t border-stone-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-stone-600 dark:text-slate-300">Số lượng:</span>
            <div className="flex items-center rounded-xl border border-stone-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                className="px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 font-bold text-stone-600 dark:text-slate-300"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-stone-900 dark:text-white text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => (q < displayStock ? q + 1 : q))}
                className="px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 font-bold text-stone-600 dark:text-slate-300"
              >
                +
              </button>
            </div>
            <span className="text-[11px] text-stone-400 dark:text-slate-500">
              Còn {displayStock} sản phẩm
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-stone-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={addingToCart || displayStock <= 0}
            className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:opacity-95 active:scale-95 disabled:opacity-50"
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
                  <span>Đã thêm vào giỏ hàng</span>
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
                  {addingToCart
                    ? 'Đang thêm...'
                    : displayStock <= 0
                    ? 'Tạm hết hàng'
                    : 'Thêm vào giỏ hàng'}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  )
}
