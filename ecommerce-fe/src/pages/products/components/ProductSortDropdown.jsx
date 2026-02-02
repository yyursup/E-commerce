import { HiOutlineChevronDown } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'createdAt,asc', label: 'Cũ nhất' },
  { value: 'basePrice,asc', label: 'Giá: Thấp đến cao' },
  { value: 'basePrice,desc', label: 'Giá: Cao đến thấp' },
  { value: 'name,asc', label: 'Tên: A-Z' },
  { value: 'name,desc', label: 'Tên: Z-A' },
]

export default function ProductSortDropdown({ value, onChange }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'appearance-none rounded-xl border py-2.5 pl-4 pr-10 text-sm font-medium outline-none transition',
          isDark
            ? 'border-slate-600 bg-slate-800/50 text-slate-300 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
            : 'border-stone-300 bg-white text-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <HiOutlineChevronDown
        className={cn(
          'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2',
          isDark ? 'text-slate-400' : 'text-stone-400',
        )}
      />
    </div>
  )
}
