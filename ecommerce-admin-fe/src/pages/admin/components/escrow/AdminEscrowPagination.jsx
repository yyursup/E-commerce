import { cn } from '../../../../lib/cn'

export default function AdminEscrowPagination({ isDark, page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm">
      <button
        disabled={page <= 0}
        onClick={onPrev}
        className={cn(
          'rounded-lg px-4 py-2 font-semibold transition',
          page <= 0
            ? 'cursor-not-allowed opacity-50'
            : isDark
              ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'bg-white text-stone-700 hover:bg-stone-100',
        )}
      >
        Prev
      </button>
      <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>
        Page {page + 1} / {totalPages}
      </span>
      <button
        disabled={page + 1 >= totalPages}
        onClick={onNext}
        className={cn(
          'rounded-lg px-4 py-2 font-semibold transition',
          page + 1 >= totalPages
            ? 'cursor-not-allowed opacity-50'
            : isDark
              ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'bg-white text-stone-700 hover:bg-stone-100',
        )}
      >
        Next
      </button>
    </div>
  )
}
