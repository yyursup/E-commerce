import { motion } from 'framer-motion'
import { HiOutlineChartBar } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

const accentStyles = {
  amber: {
    track: 'bg-amber-500/10',
    bar: 'from-amber-500 to-orange-500',
    rank: 'bg-amber-500 text-white',
    share: 'text-amber-500',
  },
  emerald: {
    track: 'bg-emerald-500/10',
    bar: 'from-emerald-500 to-teal-500',
    rank: 'bg-emerald-500 text-white',
    share: 'text-emerald-500',
  },
  sky: {
    track: 'bg-sky-500/10',
    bar: 'from-sky-500 to-indigo-500',
    rank: 'bg-sky-500 text-white',
    share: 'text-sky-500',
  },
}

function getDefaultKey(item, index) {
  return item?.id || item?.shopId || item?.sellerId || item?.categoryId || `${index}-${item?.name || item?.shopName || item?.categoryName || 'item'}`
}

export default function HorizontalRankingChart({
  items = [],
  isDark,
  getLabel,
  getValue,
  getMeta,
  valueFormatter = (value) => value,
  emptyIcon: EmptyIcon = HiOutlineChartBar,
  emptyText = 'No data available',
  accent = 'amber',
  className,
}) {
  const palette = accentStyles[accent] || accentStyles.amber
  const safeItems = Array.isArray(items) ? items : []
  const totalValue = safeItems.reduce((sum, item) => sum + (Number(getValue(item)) || 0), 0)
  const maxValue = Math.max(...safeItems.map((item) => Number(getValue(item)) || 0), 0)

  if (safeItems.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3">
        <EmptyIcon className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
        <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {safeItems.map((item, index) => {
        const value = Number(getValue(item)) || 0
        const share = totalValue > 0 ? (value / totalValue) * 100 : 0
        const width = maxValue > 0 ? (value / maxValue) * 100 : 0
        const meta = getMeta ? getMeta(item, index, share) : `${share.toFixed(1)}% share`

        return (
          <div
            key={getDefaultKey(item, index)}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-200 bg-stone-50/80',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    index < 3
                      ? palette.rank
                      : isDark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-stone-200 text-stone-600',
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={getLabel(item)}>
                    {getLabel(item)}
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {meta}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold">{valueFormatter(value, item)}</p>
                <p className={cn('mt-1 text-xs font-medium', palette.share)}>
                  {share.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className={cn('mt-3 h-2.5 overflow-hidden rounded-full', palette.track)}>
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', palette.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${width > 0 ? Math.max(width, 6) : 0}%` }}
                transition={{ duration: 0.5, delay: index * 0.04 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
