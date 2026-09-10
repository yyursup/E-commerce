import { useState, useEffect } from 'react'
import PriceRangeFilter from './PriceRangeFilter'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import categoryService from '../../../services/category'
import { HiOutlineTag, HiOutlineCheck } from 'react-icons/hi'

export default function ProductFilterSidebar({
  selectedPriceRange,
  onPriceRangeChange,
  selectedCategoryId,
  onCategoryChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(false)

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setCatLoading(true)
        const data = await categoryService.getAllCategories()
        setCategories(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching categories for filter:', err)
        setCategories([])
      } finally {
        setCatLoading(false)
      }
    }
    fetchCats()
  }, [])

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div
        className={cn(
          'rounded-3xl border p-6 sticky top-24 transition-colors',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200/90 bg-white'
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <h2
            className={cn(
              'text-base font-bold tracking-tight',
              isDark ? 'text-white' : 'text-stone-900'
            )}
          >
            Bộ Lọc Tìm Kiếm
          </h2>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={cn(
                'text-xs font-semibold transition-colors',
                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
              )}
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <h3
            className={cn(
              'mb-3 text-xs font-bold uppercase tracking-wider',
              isDark ? 'text-slate-400' : 'text-stone-500'
            )}
          >
            Ngành Hàng
          </h3>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            <button
              onClick={() => onCategoryChange?.('')}
              className={cn(
                'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left',
                !selectedCategoryId
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <span>Tất cả ngành hàng</span>
              {!selectedCategoryId && <HiOutlineCheck className="h-4 w-4" />}
            </button>

            {catLoading ? (
              <div className="py-2 text-center text-xs text-stone-400">Đang tải danh mục...</div>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange?.(cat.id)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left',
                      isSelected
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <HiOutlineCheck className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
          <h3
            className={cn(
              'mb-3 text-xs font-bold uppercase tracking-wider',
              isDark ? 'text-slate-400' : 'text-stone-500'
            )}
          >
            Khoảng Giá (VNĐ)
          </h3>
          <PriceRangeFilter
            selectedRange={selectedPriceRange}
            onChange={onPriceRangeChange}
          />
        </div>
      </div>
    </aside>
  )
}
