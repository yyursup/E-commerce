import { useState, useEffect } from 'react'
import PriceRangeFilter from './PriceRangeFilter'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import categoryService from '../../../services/category'
import { HiOutlineTag, HiOutlineCheck } from 'react-icons/hi'

const CONDITION_OPTIONS = [
  { value: '', label: 'Tất cả tình trạng' },
  { value: 'GRADE_NEW', label: 'Mới 100% (Nguyên seal)', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { value: 'GRADE_LIKE_NEW', label: 'Like New 99% (Đẹp)', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'GRADE_FAIR', label: 'Cũ 90-95% (Đã dùng)', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'GRADE_AS_IS', label: 'Thanh lý / Xác máy', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
]

const WARRANTY_OPTIONS = [
  { value: '', label: 'Tất cả bảo hành' },
  { value: 'CHINH_HANG', label: 'Bảo hành chính hãng' },
  { value: 'SHOP', label: 'Bảo hành tại Shop' },
  { value: 'KHONG_BAO_HANH', label: 'Không BH / Bao test' },
]

export default function ProductFilterSidebar({
  selectedPriceRange,
  onPriceRangeChange,
  selectedCategoryId,
  onCategoryChange,
  selectedConditionGrade = '',
  onConditionChange,
  selectedWarrantyType = '',
  onWarrantyChange,
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
          'rounded-3xl border p-6 sticky top-24 transition-colors space-y-6',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200/90 bg-white'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
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
        <div>
          <h3
            className={cn(
              'mb-3 text-xs font-bold uppercase tracking-wider',
              isDark ? 'text-slate-400' : 'text-stone-500'
            )}
          >
            Ngành Hàng
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
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

        {/* Condition Grade Filter */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
          <h3
            className={cn(
              'mb-3 text-xs font-bold uppercase tracking-wider',
              isDark ? 'text-slate-400' : 'text-stone-500'
            )}
          >
            Tình Trạng Máy
          </h3>
          <div className="space-y-1">
            {CONDITION_OPTIONS.map((opt) => {
              const isSelected = selectedConditionGrade === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onConditionChange?.(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left',
                    isSelected
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <HiOutlineCheck className="h-4 w-4 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Warranty Type Filter */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
          <h3
            className={cn(
              'mb-3 text-xs font-bold uppercase tracking-wider',
              isDark ? 'text-slate-400' : 'text-stone-500'
            )}
          >
            Bảo Hành
          </h3>
          <div className="space-y-1">
            {WARRANTY_OPTIONS.map((w) => {
              const isSelected = selectedWarrantyType === w.value
              return (
                <button
                  key={w.value}
                  onClick={() => onWarrantyChange?.(w.value)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left',
                    isSelected
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  <span className="truncate">{w.label}</span>
                  {isSelected && <HiOutlineCheck className="h-4 w-4 shrink-0" />}
                </button>
              )
            })}
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
