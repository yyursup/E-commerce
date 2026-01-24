import { HiOutlineShoppingCart, HiStar } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function ProductQuickView({ product, onAddToCart }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { name, price, oldPrice, image, rating } = product

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex-shrink-0 overflow-hidden rounded-xl sm:w-48">
        <img
          src={image}
          alt={name}
          className="h-48 w-full object-cover sm:h-56 sm:w-48"
        />
      </div>
      <div className="flex-1">
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
          <span className="ml-1 text-sm text-stone-500 dark:text-slate-400">
            {rating} đánh giá
          </span>
        </div>
        <h3
          className={cn(
            'text-lg font-semibold',
            isDark ? 'text-white' : 'text-stone-900',
          )}
        >
          {name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            ${price.toFixed(2)}
          </span>
          {oldPrice && (
            <span className="text-sm text-stone-400 line-through dark:text-slate-500">
              ${oldPrice.toFixed(2)}
            </span>
          )}
        </div>
        <p
          className={cn(
            'mt-3 text-sm',
            isDark ? 'text-slate-400' : 'text-stone-600',
          )}
        >
          Thêm vào giỏ để thanh toán. Miễn phí giao hàng đơn từ $50. AirPods & tai nghe Apple chính hãng.
        </p>
        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          <HiOutlineShoppingCart className="h-5 w-5" />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}
