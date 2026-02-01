import PriceRangeFilter from './PriceRangeFilter'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function ProductFilterSidebar({
  selectedPriceRange,
  onPriceRangeChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div
        className={cn(
          'rounded-2xl border p-6',
          isDark ? 'border-slate-700/50 bg-slate-900/80' : 'border-stone-200 bg-white',
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
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={cn(
                'text-sm font-medium',
                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
              )}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

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

        {/* Category Filter - Placeholder for future API */}
        <div className="mb-6">
          <h3
            className={cn(
              'mb-3 text-sm font-semibold',
              isDark ? 'text-slate-300' : 'text-stone-700',
            )}
          >
            Danh mục
          </h3>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
            Tính năng đang phát triển
          </p>
        </div>
      </div>
    </aside>
  )
}
