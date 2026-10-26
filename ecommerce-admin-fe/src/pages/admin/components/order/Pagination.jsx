import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isDark,
  pageSizeOptions = [10, 20, 50],
}) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, currentPage + 2)

      if (currentPage <= 3) {
        start = 1
        end = maxVisible
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1
        end = totalPages
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-2 text-xs sm:text-sm">
      {/* Items range info */}
      <div className={cn('font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
        Hiển thị <span className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>{startItem}</span> -{' '}
        <span className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>{endItem}</span> trên tổng số{' '}
        <span className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>{totalItems}</span>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
              )}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page number buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Prev button */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className={cn(
                'inline-flex items-center justify-center h-8 w-8 rounded-lg border font-bold transition-all',
                currentPage <= 1
                  ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-slate-800 text-stone-400'
                  : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95'
              )}
              title="Trang trước"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>

            {/* First page if not in range */}
            {pageNumbers[0] > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onPageChange(1)}
                  className={cn(
                    'h-8 min-w-[32px] px-2 rounded-lg border text-xs font-bold transition-all',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  )}
                >
                  1
                </button>
                {pageNumbers[0] > 2 && (
                  <span className={cn('px-1', isDark ? 'text-slate-500' : 'text-stone-400')}>...</span>
                )}
              </>
            )}

            {/* Page number buttons */}
            {pageNumbers.map((p) => {
              const active = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'h-8 min-w-[32px] px-2 rounded-lg border text-xs font-bold transition-all',
                    active
                      ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  )}
                >
                  {p}
                </button>
              )
            })}

            {/* Last page if not in range */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className={cn('px-1', isDark ? 'text-slate-500' : 'text-stone-400')}>...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(totalPages)}
                  className={cn(
                    'h-8 min-w-[32px] px-2 rounded-lg border text-xs font-bold transition-all',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  )}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next button */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className={cn(
                'inline-flex items-center justify-center h-8 w-8 rounded-lg border font-bold transition-all',
                currentPage >= totalPages
                  ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-slate-800 text-stone-400'
                  : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95'
              )}
              title="Trang sau"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
