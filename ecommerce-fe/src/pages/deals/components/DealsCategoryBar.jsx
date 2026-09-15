import {
  HiOutlineTag,
  HiOutlineSearch,
  HiOutlineViewGrid,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function DealsCategoryBar({
  categories = [],
  displayCategories = [],
  selectedCategoryId = 'ALL',
  setSelectedCategoryId,
  categoryProductCounts = {},
  categorySearch = '',
  setCategorySearch,
  categoryScrollRef,
  onScrollCategories,
  onOpenCategoryModal,
  totalProductsCount = 0,
  isDark = false,
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 mb-8 backdrop-blur-md bg-stone-50/90 dark:bg-slate-950/90 border-b border-stone-200/80 dark:border-slate-800/80 transition-all">
      <div className="flex flex-col gap-3">
        {/* Top Toolbar: Heading & Quick Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <HiOutlineTag className="h-4 w-4" />
            </span>
            <h2 className={cn('text-base sm:text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Ưu Đãi Theo Ngành Hàng
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Search / Filter toggle button */}
            <div className="relative hidden md:block">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm nhanh ngành hàng..."
                className={cn(
                  'pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-44 lg:w-56',
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-500'
                    : 'border-stone-200 bg-white text-stone-800 placeholder-stone-400'
                )}
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <HiOutlineX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* View All Categories in Modal / Grid */}
            <button
              onClick={onOpenCategoryModal}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors',
                isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
              )}
              title="Xem toàn bộ danh mục dạng lưới"
            >
              <HiOutlineViewGrid className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Tất cả ngành hàng</span>
              <span className="sm:hidden">Tất cả</span>
              <span className="text-[10px] rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-500 font-bold">
                {categories.length}
              </span>
            </button>

            {/* Left/Right scroll buttons for desktop */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => onScrollCategories('left')}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors hover:border-amber-500 text-stone-500 hover:text-amber-500',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
                title="Cuộn sang trái"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onScrollCategories('right')}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors hover:border-amber-500 text-stone-500 hover:text-amber-500',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
                title="Cuộn sang phải"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Category Pills Bar */}
        <div
          ref={categoryScrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Button "Tất cả" */}
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm',
              selectedCategoryId === 'ALL'
                ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            )}
          >
            <span>Tất cả ngành</span>
            <span className={cn(
              'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
              selectedCategoryId === 'ALL' ? 'bg-white/25 text-white' : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
            )}>
              {totalProductsCount}
            </span>
          </button>

          {/* Individual Category Pills */}
          {displayCategories.map((cat) => {
            const count = categoryProductCounts[cat.id] || 0
            const isSelected = selectedCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm',
                  isSelected
                    ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                    : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                )}
              >
                <span>{cat.name}</span>
                {count > 0 ? (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                    isSelected ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  )}>
                    {count}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 font-normal">
                    (0)
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
