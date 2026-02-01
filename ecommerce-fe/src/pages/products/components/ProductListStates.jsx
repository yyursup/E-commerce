import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function ProductListStates({ loading, error, empty, hasActiveFilters, onClearFilters, onRetry }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Đang tải sản phẩm...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
            {error}
          </p>
          <button
            onClick={onRetry}
            className={cn(
              'mt-4 rounded-xl px-4 py-2 text-sm font-medium',
              isDark
                ? 'bg-slate-700 text-white hover:bg-slate-600'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
            )}
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Không tìm thấy sản phẩm nào
          </p>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={cn(
                'mt-4 rounded-xl px-4 py-2 text-sm font-medium',
                isDark
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-amber-500 text-white hover:bg-amber-600',
              )}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
