import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineMusicNote, HiOutlineArrowRight } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import ProductSequence from './ProductSequence'

export default function Hero() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-[#020617]', // Deep navy-black base
      )}
    >
      {/* Decorative */}
      <div
        className={cn(
          'absolute inset-0 opacity-40',
          'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950',
        )}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-amber-400/50 bg-amber-50 text-amber-700',
              )}
            >
              <HiOutlineMusicNote className="h-4 w-4" />
              AirPods & Tai nghe Apple
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn(
                'mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl',
                'text-white',
              )}
            >
              Âm thanh Apple.{' '}
              <span className="text-amber-500">Chính hãng.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={cn(
                'mt-4 max-w-xl text-lg',
                'text-slate-400',
              )}
            >
              AirPods, AirPods Pro, AirPods Max. Giao nhanh, bảo hành toàn quốc. Sàn chuyên AirPods & tai nghe Apple.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 active:scale-[0.98]"
              >
                Xem AirPods & Tai nghe
                <HiOutlineArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/deals"
                className={cn(
                  'inline-flex items-center rounded-xl border px-6 py-3.5 text-sm font-semibold transition',
                  'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                Ưu đãi hôm nay
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative flex justify-center"
          >
            <div
              className={cn(
                'relative aspect-square w-full max-w-2xl overflow-hidden',
              )}
            >
              <ProductSequence />

            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="absolute -bottom-4 -right-4 rounded-2xl border bg-slate-900/90 px-5 py-3 shadow-xl backdrop-blur border-slate-700"
            >
              <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
                Giao nhanh
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                Đơn từ $50
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
