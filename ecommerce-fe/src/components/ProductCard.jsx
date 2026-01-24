import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineHeart, HiOutlineShoppingCart, HiStar } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function ProductCard({ product, onQuickView, dataAos, dataAosDelay }) {
  const [hover, setHover] = useState(false)
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { name, price, oldPrice, image, badge, rating } = product

  return (
    <motion.article
      data-aos={dataAos ?? 'fade-up'}
      data-aos-delay={dataAosDelay}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300',
        isDark
          ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20'
          : 'border-stone-200/80 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10',
      )}
    >
      {/* Badge */}
      {badge && (
        <span
          className={cn(
            'absolute left-3 top-3 z-10 rounded-lg px-2.5 py-1 text-xs font-semibold',
            badge === 'Sale'
              ? 'bg-red-500 text-white'
              : badge === 'New'
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-500 text-white',
          )}
        >
          {badge === 'Sale' ? 'Giảm giá' : badge === 'New' ? 'Mới' : badge}
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <motion.img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500"
          animate={{ scale: hover ? 1.05 : 1 }}
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300',
            hover && 'opacity-100',
          )}
        />

        {/* Quick actions */}
        <motion.div
          initial={false}
          animate={{
            opacity: hover ? 1 : 0,
            y: hover ? 0 : 8,
          }}
          className="absolute bottom-3 left-3 right-3 flex gap-2"
        >
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-sm font-medium text-stone-800 shadow-lg backdrop-blur hover:bg-white"
          >
            <HiOutlineShoppingCart className="h-4 w-4" />
            Xem nhanh
          </button>
          <button
            type="button"
            className="rounded-xl bg-white/95 p-2.5 text-stone-700 shadow-lg backdrop-blur hover:bg-white hover:text-red-500"
            aria-label="Thêm vào yêu thích"
          >
            <HiOutlineHeart className="h-5 w-5" />
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <HiStar
              key={i}
              className={cn(
                'h-4 w-4',
                i < Math.floor(rating) ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600',
              )}
            />
          ))}
          <span className="ml-1 text-xs text-stone-500 dark:text-slate-400">
            {rating}
          </span>
        </div>
        <h3
          className={cn(
            'font-semibold line-clamp-2',
            isDark ? 'text-slate-100' : 'text-stone-800',
          )}
        >
          {name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            ${price.toFixed(2)}
          </span>
          {oldPrice && (
            <span className="text-sm text-stone-400 line-through dark:text-slate-500">
              ${oldPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
