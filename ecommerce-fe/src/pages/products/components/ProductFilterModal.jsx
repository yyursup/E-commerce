import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import PriceRangeFilter from './PriceRangeFilter'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function ProductFilterModal({
  open,
  onClose,
  selectedPriceRange,
  onPriceRangeChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'absolute right-0 top-0 h-full w-80 overflow-y-auto border-l p-6',
              isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                className={cn(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Bộ lọc
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-2',
                  isDark ? 'text-slate-400 hover:text-slate-300' : 'text-stone-400 hover:text-stone-600',
                )}
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className={cn(
                  'mb-4 w-full rounded-xl py-2.5 text-sm font-medium',
                  isDark
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                )}
              >
                Xóa bộ lọc
              </button>
            )}

            {/* Price Range */}
            <div className="mb-6">
              <h3
                className={cn(
                  'mb-3 text-sm font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Khoảng giá
              </h3>
              <PriceRangeFilter
                selectedRange={selectedPriceRange}
                onChange={onPriceRangeChange}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
