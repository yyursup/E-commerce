import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

const PRICE_RANGES = [
  { label: 'Tất cả', min: null, max: null },
  { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { label: '1 - 3 triệu', min: 1000000, max: 3000000 },
  { label: '3 - 5 triệu', min: 3000000, max: 5000000 },
  { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: 'Trên 10 triệu', min: 10000000, max: null },
]

export { PRICE_RANGES }

export default function PriceRangeFilter({ selectedRange, onChange }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <div className="space-y-2">
      {PRICE_RANGES.map((range) => (
        <label
          key={range.label}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            selectedRange?.label === range.label
              ? isDark
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-amber-50 text-amber-700'
              : isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
          )}
        >
          <input
            type="radio"
            name="priceRange"
            checked={selectedRange?.label === range.label}
            onChange={() => onChange?.(range)}
            className="h-4 w-4 border-stone-300 text-amber-500 focus:ring-amber-500"
          />
          {range.label}
        </label>
      ))}
    </div>
  )
}
