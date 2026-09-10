import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHeart, HiOutlineShoppingCart, HiStar, HiOutlineCheckCircle } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function ProductCard({ product, onQuickView, dataAos, dataAosDelay }) {
  const [hover, setHover] = useState(false)
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { name, price, oldPrice, image, badge, rating, id, shopName, categoryName } = product

  // Deterministic mock sold count based on product id length or char codes
  const mockSold = ((String(id).charCodeAt(0) * 17) % 850) + 50

  return (
    <motion.article
      data-aos={dataAos ?? 'fade-up'}
      data-aos-delay={dataAosDelay}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300',
        isDark
          ? 'border-slate-800 bg-slate-800/60 hover:border-amber-500/40 hover:shadow-xl hover:shadow-black/30'
          : 'border-stone-200/90 bg-white hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5',
      )}
    >
      {/* Badges container */}
      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
        {/* Mall / Verified badge */}
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm uppercase tracking-wider">
          Mall
        </span>
        {badge && badge !== 'Bestseller' && (
          <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {/* Image */}
      <Link to={`/products/${id}`} className="relative block aspect-square overflow-hidden bg-stone-100 dark:bg-slate-900">
        <motion.img
          src={image || '/product-placeholder.svg'}
          alt={name}
          className="h-full w-full object-cover transition duration-500"
          animate={{ scale: hover ? 1.06 : 1 }}
          onError={(e) => {
            e.target.src = '/product-placeholder.svg'
          }}
          loading="lazy"
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300',
            hover && 'opacity-100',
          )}
        />

        {/* Quick actions on hover */}
        <motion.div
          initial={false}
          animate={{
            opacity: hover ? 1 : 0,
            y: hover ? 0 : 8,
          }}
          className="absolute bottom-3 left-3 right-3 z-10 flex gap-2"
          onClick={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onQuickView?.(product)
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2 text-xs font-bold text-stone-800 shadow-lg backdrop-blur hover:bg-amber-400 hover:text-stone-900 transition-colors"
          >
            <HiOutlineShoppingCart className="h-4 w-4" />
            Xem nhanh
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="rounded-xl bg-white/95 p-2 text-stone-700 shadow-lg backdrop-blur hover:bg-white hover:text-rose-500 transition-colors"
            aria-label="Thêm vào yêu thích"
          >
            <HiOutlineHeart className="h-4 w-4" />
          </button>
        </motion.div>
      </Link>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Shop / Category Tag */}
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-400">
            <span className="truncate max-w-[140px] font-medium text-amber-600 dark:text-amber-400">
              {shopName || categoryName || 'E-commerce'}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-slate-500">
              Đã bán {mockSold}
            </span>
          </div>

          {/* Title */}
          <Link to={`/products/${id}`}>
            <h3
              className={cn(
                'text-sm font-semibold line-clamp-2 min-h-[40px] transition-colors hover:text-amber-600 dark:hover:text-amber-400 leading-snug',
                isDark ? 'text-slate-100' : 'text-stone-800',
              )}
            >
              {name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            <HiStar className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
              {rating || 4.8}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-slate-500">
              (50+ đánh giá)
            </span>
          </div>

          {/* Pricing */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
            </span>
            {oldPrice && (
              <span className="text-xs text-stone-400 line-through dark:text-slate-500">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(oldPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
