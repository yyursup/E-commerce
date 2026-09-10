import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineFire, HiOutlineClock, HiOutlineChevronRight } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function FlashSaleSection({ products = [] }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  // Countdown timer logic (mock 6h flash sale cycle)
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 35,
    seconds: 18,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 6, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Take top 4-6 products for flash sale display
  const flashProducts = products.slice(0, 6)

  if (flashProducts.length === 0) return null

  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'rounded-3xl border p-5 sm:p-7 shadow-md overflow-hidden transition-colors',
            isDark
              ? 'border-rose-950/40 bg-gradient-to-b from-rose-950/20 via-slate-900 to-slate-900'
              : 'border-rose-100 bg-gradient-to-b from-rose-50/50 via-white to-white'
          )}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rose-500/10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/30 animate-pulse">
                <HiOutlineFire className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-rose-600 dark:text-rose-400">
                    Flash Sale
                  </h2>
                  {/* Timer Boxes */}
                  <div className="flex items-center gap-1 font-mono text-xs font-bold">
                    <span className="rounded-md bg-stone-900 text-white px-2 py-1 dark:bg-rose-950 dark:text-rose-200">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-rose-500 font-bold">:</span>
                    <span className="rounded-md bg-stone-900 text-white px-2 py-1 dark:bg-rose-950 dark:text-rose-200">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-rose-500 font-bold">:</span>
                    <span className="rounded-md bg-stone-900 text-white px-2 py-1 dark:bg-rose-950 dark:text-rose-200">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Số lượng có hạn, nhanh tay săn ngay ưu đãi giảm sâu!
                </p>
              </div>
            </div>

            <Link
              to="/deals"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
            >
              Xem tất cả Flash Sale
              <HiOutlineChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Flash Sale Product Cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {flashProducts.map((product, idx) => {
              const discountPercent = [15, 20, 30, 25, 35, 40][idx % 6]
              const soldCount = [85, 92, 78, 64, 98, 80][idx % 6]
              const originalPrice = product.price ? Math.round(product.price * (1 + discountPercent / 100)) : 0

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className={cn(
                    'group flex flex-col rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden',
                    isDark
                      ? 'border-slate-800 bg-slate-900/80 hover:border-rose-500/50'
                      : 'border-stone-200/80 bg-white hover:border-rose-400 hover:shadow-rose-500/5'
                  )}
                >
                  {/* Discount Badge */}
                  <div className="absolute top-2 right-2 z-10 rounded-lg bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                    -{discountPercent}%
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-stone-100 dark:bg-slate-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Name */}
                  <h3
                    className={cn(
                      'text-xs font-semibold line-clamp-2 min-h-[32px] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors',
                      isDark ? 'text-slate-200' : 'text-stone-800'
                    )}
                  >
                    {product.name}
                  </h3>

                  {/* Pricing */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {Number(product.price).toLocaleString('vi-VN')}₫
                    </span>
                    {originalPrice > 0 && (
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 line-through">
                        {originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (Đã bán) */}
                  <div className="mt-3">
                    <div className="relative h-4 w-full rounded-full bg-rose-100 dark:bg-rose-950/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                        style={{ width: `${soldCount}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-wider drop-shadow-sm">
                        Đã bán {soldCount}%
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
