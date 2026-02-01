import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 0}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium transition',
          currentPage === 0
            ? 'cursor-not-allowed opacity-50'
            : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-white text-stone-700 hover:bg-stone-50',
          isDark ? 'border border-slate-600' : 'border border-stone-300',
        )}
      >
        Trước
      </button>

      {[...Array(totalPages)].map((_, i) => {
        if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
          return (
            <button
              key={i}
              onClick={() => onPageChange?.(i)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition',
                currentPage === i
                  ? 'bg-amber-500 text-white'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-stone-700 hover:bg-stone-50',
                isDark ? 'border border-slate-600' : 'border border-stone-300',
              )}
            >
              {i + 1}
            </button>
          )
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          return (
            <span
              key={i}
              className={cn('px-2', isDark ? 'text-slate-400' : 'text-stone-400')}
            >
              ...
            </span>
          )
        }
        return null
      })}

      <button
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium transition',
          currentPage >= totalPages - 1
            ? 'cursor-not-allowed opacity-50'
            : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-white text-stone-700 hover:bg-stone-50',
          isDark ? 'border border-slate-600' : 'border border-stone-300',
        )}
      >
        Sau
      </button>
    </div>
  )
}
