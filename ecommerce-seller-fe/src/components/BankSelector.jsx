import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import {
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCreditCard,
} from 'react-icons/hi'
import { cn } from '../lib/cn'

// Helper function to remove Vietnamese diacritics for smart search
const removeDiacritics = (str = '') => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export default function BankSelector({
  value = '',
  onChange,
  error = '',
  isDark = false,
  disabled = false,
  placeholder = 'Tìm kiếm hoặc chọn ngân hàng (VD: VCB, MB, Techcombank)...',
}) {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState(null)

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // 1. Fetch danh sách ngân hàng từ VietQR API
  useEffect(() => {
    let isMounted = true
    const fetchBanks = async () => {
      try {
        setLoading(true)
        setFetchError('')
        const res = await axios.get('https://api.vietqr.io/v2/banks')
        if (res?.data?.data && Array.isArray(res.data.data)) {
          if (isMounted) {
            setBanks(res.data.data)
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách ngân hàng VietQR:', err)
        if (isMounted) {
          setFetchError('Không thể tải danh sách ngân hàng tự động. Bạn vẫn có thể tự nhập tên ngân hàng.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBanks()
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Đồng bộ selectedBank khi value từ bên ngoài thay đổi
  useEffect(() => {
    if (value && banks.length > 0) {
      const valLower = value.toLowerCase()
      const found = banks.find(
        (b) =>
          (b.shortName && valLower.includes(b.shortName.toLowerCase())) ||
          (b.short_name && valLower.includes(b.short_name.toLowerCase())) ||
          (b.code && valLower.includes(b.code.toLowerCase())) ||
          (b.name && b.name.toLowerCase() === valLower)
      )
      if (found) {
        setSelectedBank(found)
      }
    } else if (!value) {
      setSelectedBank(null)
    }
  }, [value, banks])

  // 3. Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 4. Lọc danh sách ngân hàng theo từ khóa
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks
    const query = removeDiacritics(searchTerm)
    return banks.filter((b) => {
      const short = b.shortName || b.short_name || ''
      const matchShortName = removeDiacritics(short).includes(query)
      const matchName = removeDiacritics(b.name || '').includes(query)
      const matchCode = removeDiacritics(b.code || '').includes(query)
      const matchBin = (b.bin || '').includes(query)
      return matchShortName || matchName || matchCode || matchBin
    })
  }, [banks, searchTerm])

  const handleSelectBank = (bank) => {
    setSelectedBank(bank)
    const short = bank.shortName || bank.short_name || bank.code
    const bankFormatted = `${short} (${bank.code})`
    setSearchTerm('')
    setIsOpen(false)
    if (onChange) {
      onChange(bankFormatted, bank)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedBank(null)
    setSearchTerm('')
    if (onChange) {
      onChange('', null)
    }
    inputRef.current?.focus()
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    setSearchTerm(text)
    if (!isOpen) setIsOpen(true)

    // Nếu người dùng tự gõ mà không chọn trong list, vẫn cập nhật giá trị
    if (onChange) {
      onChange(text, null)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  // Display label
  const displayValue = isOpen ? searchTerm : (value || (selectedBank ? `${selectedBank.shortName} (${selectedBank.code})` : ''))

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input container */}
      <div
        className={cn(
          'relative flex items-center w-full rounded-xl border transition-all',
          isDark
            ? 'border-slate-600 bg-slate-800/50 text-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
            : 'border-stone-300 bg-stone-50/80 text-stone-900 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20',
          error && 'border-red-500/70 focus-within:border-red-500 focus-within:ring-red-500/20',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Left Icon or Selected Bank Logo */}
        <div className="pl-3.5 pr-2 flex items-center justify-center shrink-0">
          {selectedBank?.logo && !isOpen ? (
            <img
              src={selectedBank.logo}
              alt={selectedBank.shortName}
              className="h-5 w-auto max-w-[40px] object-contain rounded"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <HiOutlineSearch
              className={cn('h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-400')}
            />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={loading ? 'Đang tải danh sách ngân hàng...' : (value || placeholder)}
          className={cn(
            'w-full py-3 pr-10 text-sm outline-none bg-transparent placeholder:text-stone-400 dark:placeholder:text-slate-500',
            disabled && 'cursor-not-allowed'
          )}
        />

        {/* Action icons (Clear + Dropdown arrow) */}
        <div className="absolute right-3 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors"
              title="Xóa lựa chọn"
            >
              <HiOutlineX className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => {
                  if (prev) setSearchTerm('')
                  return !prev
                })
              }
            }}
            tabIndex={-1}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors"
          >
            <HiOutlineChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Helper text / Fetch error */}
      {fetchError && (
        <p className="mt-1 text-xs text-amber-500 dark:text-amber-400">
          {fetchError}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border p-1.5 shadow-2xl backdrop-blur-md transition-all',
            isDark
              ? 'border-slate-700 bg-slate-900/95 text-white shadow-black/50'
              : 'border-stone-200 bg-white/95 text-stone-900 shadow-stone-400/20'
          )}
        >
          {loading ? (
            <div className="py-6 text-center text-xs text-stone-400 dark:text-slate-400 flex items-center justify-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              Đang tải danh sách ngân hàng...
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="py-6 px-4 text-center">
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Không tìm thấy ngân hàng khớp với <span className="font-semibold text-amber-500">"{searchTerm}"</span>
              </p>
              <p className="mt-1 text-[11px] text-stone-400 dark:text-slate-500">
                Hệ thống vẫn sẽ lưu tên bạn đã nhập.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                Tìm thấy {filteredBanks.length} ngân hàng
              </div>
              {filteredBanks.map((bank) => {
                const isSelected =
                  selectedBank?.id === bank.id ||
                  value === `${bank.shortName} (${bank.code})` ||
                  value === bank.name

                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelectBank(bank)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'bg-amber-50 text-amber-800 font-semibold'
                        : isDark
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-stone-100 text-stone-700'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo */}
                      <div className="h-7 w-12 rounded bg-white p-0.5 flex items-center justify-center border border-stone-200/80 shadow-xs shrink-0 overflow-hidden">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.shortName}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <HiOutlineCreditCard className="h-4 w-4 text-stone-400" />
                        )}
                      </div>

                      {/* Name & ShortName */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate">
                            {bank.shortName}
                          </span>
                          <span className="rounded bg-stone-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-600 dark:text-slate-300 shrink-0">
                            {bank.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 dark:text-slate-400 truncate mt-0.5">
                          {bank.name}
                        </p>
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <HiOutlineCheck className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
