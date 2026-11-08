import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart, HiStar } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useWishlistStore } from '../store/useWishlistStore'
import { cn } from '../lib/cn'

const getConditionBadge = (grade) => {
  switch (grade) {
    case 'GRADE_NEW':
      return { label: 'Mới 100%', color: 'bg-emerald-600 text-white' }
    case 'GRADE_OPEN_BOX':
      return { label: 'Like New 99%', color: 'bg-sky-600 text-white' }
    case 'GRADE_LIKE_NEW':
      return { label: 'Like New 99%', color: 'bg-amber-600 text-white' }
    case 'GRADE_FAIR':
      return { label: 'Cũ 90-95%', color: 'bg-orange-600 text-white' }
    case 'GRADE_AS_IS':
      return { label: 'As-is', color: 'bg-rose-600 text-white' }
    default:
      return null
  }
}

export default function ProductCard({ product, onQuickView, dataAos, dataAosDelay }) {
  const [hover, setHover] = useState(false)
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const { isWishlisted, toggleWishlist } = useWishlistStore()
  const navigate = useNavigate()

  if (!product) return null

  const { name, price, oldPrice, image, badge, rating, id, shopName, categoryName, shopId } = product
  const wishlisted = isWishlisted(id)

  const handleWishlistClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sản phẩm yêu thích')
      navigate('/login')
      return
    }

    try {
      const res = await toggleWishlist(id)
      if (res?.wishlisted) {
        toast.success(`Đã thêm "${name}" vào mục yêu thích!`, { id: 'wishlist-toast' })
      } else {
        toast.success(`Đã bỏ yêu thích "${name}"`, { id: 'wishlist-toast' })
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err)
      const msg = err?.message || err?.response?.data?.message || err?.error || 'Không thể cập nhật yêu thích'
      toast.error(typeof msg === 'string' ? msg : 'Không thể cập nhật yêu thích', { id: 'wishlist-toast' })
    }
  }

  // Robustly resolve thumbnail image from direct prop or images array
  const thumbnailImg =
    image ||
    product.images?.find((img) => img.isThumbnail)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    (typeof product.images?.[0] === 'string' ? product.images[0] : null) ||
    product.thumbnail ||
    '/product-placeholder.svg'

  // Robustly resolve price
  const variants = product.variants || []
  const prices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0)
  const baseOrPropPrice =
    price !== undefined && price !== null
      ? Number(price)
      : product.basePrice !== undefined && product.basePrice !== null
      ? Number(product.basePrice)
      : 0

  const minPrice = prices.length > 0 ? Math.min(...prices) : baseOrPropPrice
  const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice
  const isRangePrice = variants.length > 0 && minPrice !== maxPrice
  const displayPrice = minPrice

  const displayOldPrice =
    oldPrice !== undefined && oldPrice !== null
      ? Number(oldPrice)
      : product.originalPrice
      ? Number(product.originalPrice)
      : null

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const condition = product.conditionGrade ? getConditionBadge(product.conditionGrade) : null
  const discountPct =
    displayOldPrice && displayOldPrice > displayPrice
      ? Math.round((1 - displayPrice / displayOldPrice) * 100)
      : 0
  const openQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.({ ...product, image: thumbnailImg, price: displayPrice, oldPrice: displayOldPrice })
  }

  return (
    <motion.article
      data-aos={dataAos ?? 'fade-up'}
      data-aos-delay={dataAosDelay}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border p-3 transition-colors duration-200',
        product.featured && 'ring-2 ring-amber-500',
        isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-400' : 'border-stone-200 bg-white hover:border-stone-950',
      )}
    >
      {/* Stage */}
      <Link
        to={`/products/${id}`}
        className={cn('relative block aspect-[4/3] overflow-hidden rounded', isDark ? 'bg-slate-800' : 'bg-stone-100')}
      >
        <motion.img
          src={thumbnailImg}
          alt={name}
          className={cn('h-full w-full object-contain p-3', !isDark && 'mix-blend-multiply')}
          animate={{ scale: hover ? 1.04 : 1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => {
            e.target.src = '/product-placeholder.svg'
          }}
          loading="lazy"
        />

        <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discountPct > 0 && (
            <span className="rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-stone-950">
              −{discountPct}%
            </span>
          )}
          {product.featured && (
            <span className="rounded bg-stone-950 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
              Nổi bật
            </span>
          )}
          {condition && (
            <span className="rounded border border-stone-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-950">
              {condition.label}
            </span>
          )}
          {badge && badge !== 'Bestseller' && (
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-950">
              {badge}
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={handleWishlistClick}
          className={cn(
            'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md bg-white transition-colors hover:bg-stone-100',
            wishlisted ? 'text-rose-600' : 'text-stone-950',
          )}
          title={wishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          aria-label={wishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          aria-pressed={wishlisted}
        >
          {wishlisted ? <HiHeart className="h-4 w-4" /> : <HiOutlineHeart className="h-4 w-4" />}
        </button>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 pt-3">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wide text-stone-500 dark:text-slate-400">
          {shopId ? (
            <Link
              to={`/shop/${shopId}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:text-stone-950 hover:underline dark:hover:text-white"
            >
              {shopName || categoryName || 'E-Commerce'}
            </Link>
          ) : (
            <span className="truncate">{shopName || categoryName || 'E-Commerce'}</span>
          )}
          {product.sold > 0 && <span className="shrink-0 normal-case tracking-normal">Đã bán {product.sold}</span>}
        </div>

        <Link to={`/products/${id}`}>
          <h3
            className={cn(
              'line-clamp-2 min-h-[40px] font-sans text-[15px] font-semibold leading-snug tracking-normal hover:underline',
              isDark ? 'text-slate-100' : 'text-stone-950',
            )}
          >
            {name}
          </h3>
        </Link>

        {(product.batteryHealth || (product.warrantyType && product.warrantyType !== 'NONE') || product.warrantyMonths > 0) && (
          <span className="font-mono text-[11px] text-stone-500 dark:text-slate-400">
            {[
              product.batteryHealth && `PIN ${product.batteryHealth}%`,
              product.warrantyType && product.warrantyType !== 'NONE' && (product.warrantyType === 'OFFICIAL' ? 'BH HÃNG' : 'BH SHOP'),
              product.warrantyMonths > 0 && `${product.warrantyMonths} THÁNG`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}

        {Number(rating) > 0 && (
          <span className="flex items-center gap-1 text-xs text-stone-600 dark:text-slate-400">
            <HiStar className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            {Number(rating).toFixed(1)}
            {product.reviewCount > 0 && <span>· {product.reviewCount} đánh giá</span>}
          </span>
        )}

        <div
          className={cn(
            'mt-auto flex items-end justify-between gap-2 border-t pt-2.5',
            isDark ? 'border-slate-800' : 'border-stone-100',
          )}
        >
          <span className="flex min-w-0 flex-col">
            <strong className={cn('font-mono text-base font-semibold tracking-tight', isDark ? 'text-white' : 'text-stone-950')}>
              {isRangePrice ? `từ ${formatVND(minPrice)}` : formatVND(displayPrice)}
            </strong>
            {discountPct > 0 && (
              <s className="font-mono text-xs text-stone-500 dark:text-slate-500">{formatVND(displayOldPrice)}</s>
            )}
          </span>
          <button
            type="button"
            onClick={openQuickView}
            aria-label={`Xem nhanh và thêm ${name} vào giỏ`}
            title="Xem nhanh"
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors',
              isDark ? 'bg-white text-stone-950 hover:bg-amber-500' : 'bg-stone-950 text-white hover:bg-amber-500 hover:text-stone-950',
            )}
          >
            <HiOutlineShoppingCart className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
