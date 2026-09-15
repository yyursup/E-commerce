import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineViewGrid,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function DealsCategoryModal({
  isOpen = false,
  onClose,
  categories = [],
  displayCategories = [],
  selectedCategoryId = 'ALL',
  onSelectCategory,
  categoryProductCounts = {},
  categorySearch = '',
  setCategorySearch,
  onlyAvailableCategories = false,
  setOnlyAvailableCategories,
  activeCategoryCount = 0,
  totalProductsCount = 0,
  isDark = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              'relative w-full max-w-2xl max-h-[85vh] rounded-3xl border p-6 shadow-2xl z-10 flex flex-col',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HiOutlineViewGrid className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold">Tất Cả Ngành Hàng ({categories.length})</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filter inside Modal */}
            <div className="py-4 space-y-3">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Tìm tên ngành hàng..."
                  className={cn(
                    'w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                    isDark ? 'border-slate-800 bg-slate-800 text-slate-200 placeholder-slate-500' : 'border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400'
                  )}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={onlyAvailableCategories}
                    onChange={(e) => setOnlyAvailableCategories(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Chỉ hiện ngành hàng có sản phẩm ({activeCategoryCount})</span>
                </label>
                <span className="text-stone-400">
                  Hiển thị {displayCategories.length} ngành
                </span>
              </div>
            </div>

            {/* Grid of Categories */}
            <div className={cn(
              "overflow-y-auto flex-1 pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5",
              isDark ? "custom-scrollbar-dark" : "custom-scrollbar-light"
            )}>
              <button
                onClick={() => onSelectCategory('ALL')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between',
                  selectedCategoryId === 'ALL'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : isDark
                      ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                )}
              >
                <span className="text-xs font-bold">Tất Cả Ngành Hàng</span>
                <span className="text-[11px] text-stone-400 dark:text-slate-500 mt-1">
                  {totalProductsCount} sản phẩm
                </span>
              </button>

              {displayCategories.map((cat) => {
                const count = categoryProductCounts[cat.id] || 0
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={cn(
                      'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between',
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : isDark
                          ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    )}
                  >
                    <span className="text-xs font-bold line-clamp-1">{cat.name}</span>
                    <span className={cn(
                      'text-[11px] mt-1 font-medium',
                      count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-slate-500'
                    )}>
                      {count > 0 ? `${count} sản phẩm` : 'Chưa có deal'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
