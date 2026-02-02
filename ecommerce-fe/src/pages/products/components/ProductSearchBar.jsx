import { useState, useEffect } from 'react'
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function ProductSearchBar({ value, onChange, onSubmit, onClear }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(localValue.trim())
  }

  const handleClear = () => {
    setLocalValue('')
    onClear?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 sm:max-w-md">
      <div className="relative">
        <HiOutlineSearch
          className={cn(
            'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
            isDark ? 'text-slate-500' : 'text-stone-400',
          )}
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value)
            onChange?.(e.target.value)
          }}
          placeholder="Tìm kiếm sản phẩm..."
          className={cn(
            'w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm outline-none transition',
            isDark
              ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
              : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
          )}
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 rounded p-1',
              isDark ? 'text-slate-400 hover:text-slate-300' : 'text-stone-400 hover:text-stone-600',
            )}
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  )
}
