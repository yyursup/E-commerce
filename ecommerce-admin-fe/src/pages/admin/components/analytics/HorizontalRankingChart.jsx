import { motion } from 'framer-motion'
import { HiOutlineChartBar } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

const accentStyles = {
  amber: { bar: 'bg-amber-500' },
  emerald: { bar: 'bg-emerald-600' },
  sky: { bar: 'bg-sky-600' },
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
    <div className={cn('space-y-4', className)}>
      {safeItems.map((item, index) => {
        const value = Number(getValue(item)) || 0
        const share = totalValue > 0 ? (value / totalValue) * 100 : 0
        const width = maxValue > 0 ? (value / maxValue) * 100 : 0
        const meta = getMeta ? getMeta(item, index, share) : `${share.toFixed(1)}% share`

        return (
          <div key={getDefaultKey(item, index)}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex items-baseline gap-3">
                <span className={cn('w-5 shrink-0 font-mono text-xs tabular-nums', isDark ? 'text-slate-500' : 'text-stone-400')}>
                  {index + 1}
                </span>
                <p className="truncate text-sm font-medium" title={getLabel(item)}>
                  {getLabel(item)}
                </p>
              </div>

              <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{valueFormatter(value, item)}</p>
            </div>

            <div className="mt-1.5 flex items-center gap-3 pl-8">
              <div className={cn('h-1.5 flex-1 overflow-hidden rounded-full', isDark ? 'bg-slate-800' : 'bg-stone-100')}>
                <motion.div
                  className={cn('h-full rounded-full', palette.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${width > 0 ? Math.max(width, 2) : 0}%` }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                />
              </div>
              <span className={cn('shrink-0 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>{meta}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
