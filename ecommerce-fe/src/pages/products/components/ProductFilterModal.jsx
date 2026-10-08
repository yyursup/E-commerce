import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineCheck } from 'react-icons/hi'
import PriceRangeFilter from './PriceRangeFilter'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

const CONDITION_OPTIONS = [
  { value: '', label: 'Tất cả tình trạng' },
  { value: 'GRADE_NEW', label: 'Mới 100% (Nguyên seal)' },
  { value: 'GRADE_LIKE_NEW', label: 'Like New 99% (Đẹp)' },
  { value: 'GRADE_FAIR', label: 'Cũ 90-95% (Đã dùng)' },
  { value: 'GRADE_AS_IS', label: 'Thanh lý / Xác máy' },
]

const WARRANTY_OPTIONS = [
  { value: '', label: 'Tất cả bảo hành' },
  { value: 'CHINH_HANG', label: 'Bảo hành chính hãng' },
  { value: 'SHOP', label: 'Bảo hành tại Shop' },
  { value: 'KHONG_BAO_HANH', label: 'Không BH / Bao test' },
]

export default function ProductFilterModal({
  open,
  onClose,
  selectedPriceRange,
  onPriceRangeChange,
  selectedConditionGrade = '',
  onConditionChange,
  selectedWarrantyType = '',
  onWarrantyChange,
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
              'absolute right-0 top-0 h-full w-80 overflow-y-auto border-l p-6 space-y-6',
              isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <h2
                className={cn(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Bộ lọc tìm kiếm
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
                  'w-full rounded-xl py-2.5 text-sm font-medium transition',
                  isDark
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                )}
              >
                Xóa tất cả bộ lọc
              </button>
            )}

            {/* Condition Grade */}
            <div className="pt-2 border-t border-stone-200 dark:border-slate-800">
              <h3
                className={cn(
                  'mb-3 text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-400' : 'text-stone-500',
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
                        'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition text-left',
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

            {/* Warranty Type */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
              <h3
                className={cn(
                  'mb-3 text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-400' : 'text-stone-500',
                )}
              >
                Gói Bảo Hành
              </h3>
              <div className="space-y-1">
                {WARRANTY_OPTIONS.map((w) => {
                  const isSelected = selectedWarrantyType === w.value
                  return (
                    <button
                      key={w.value}
                      onClick={() => onWarrantyChange?.(w.value)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition text-left',
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

            {/* Price Range */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
              <h3
                className={cn(
                  'mb-3 text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-400' : 'text-stone-500',
                )}
              >
                Khoảng Giá (VNĐ)
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
