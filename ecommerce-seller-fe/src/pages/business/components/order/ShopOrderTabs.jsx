import { useRef, useState, useEffect, useCallback } from 'react'
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

const TAB_ICONS = {
  ALL: HiOutlineClipboardList,
  PENDING_PAYMENT: HiOutlineClock,
  PROCESSING: HiOutlineCube,
  SHIPPING: HiOutlineTruck,
  DELIVERED: HiOutlineCheckCircle,
  CANCELLED: HiOutlineXCircle,
}

export default function ShopOrderTabs({
  tabs = [],
  selectedTab = 'ALL',
  onSelectTab,
  isDark = false,
}) {
  const scrollRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const [isDraggingState, setIsDraggingState] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Kiểm tra trạng thái có thể cuộn sang 2 bên để hiển thị gradient mờ
  const checkScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  useEffect(() => {
    checkScrollState()
    window.addEventListener('resize', checkScrollState)
    return () => window.removeEventListener('resize', checkScrollState)
  }, [checkScrollState, tabs])

  // Lắng nghe sự kiện lăn chuột (Mouse Wheel) để cuộn ngang thanh tab mượt mà
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.2
        checkScrollState()
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [checkScrollState])

  // Kéo ngang bằng chuột (Mouse Drag to scroll)
  const handleMouseDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
    setIsDraggingState(true)
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const distance = (x - startXRef.current) * 1.3
    if (Math.abs(distance) > 6) {
      hasDraggedRef.current = true
    }
    el.scrollLeft = scrollLeftRef.current - distance
    checkScrollState()
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
    setIsDraggingState(false)
  }

  const handleTabClick = (tabId) => {
    // Nếu đang trong thao tác kéo chuột thì không đổi tab
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    if (onSelectTab) {
      onSelectTab(tabId)
    }
  }

  return (
    <div className="relative group">
      {/* Mép Gradient mờ bên trái khi có thể cuộn về trước */}
      {canScrollLeft && (
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-300 rounded-l-xl',
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent'
              : 'bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent'
          )}
        />
      )}

      {/* Container cuộn ngang các pills */}
      <div
        ref={scrollRef}
        onScroll={checkScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={cn(
          'flex items-center gap-2.5 overflow-x-auto py-1 px-1 no-scrollbar scroll-smooth transition-colors select-none',
          isDraggingState ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id
          const Icon = TAB_ICONS[tab.id] || HiOutlineClipboardList

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 shadow-sm active:scale-98',
                isSelected
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500/20'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200',
                  isSelected
                    ? 'text-white scale-110'
                    : isDark
                    ? 'text-slate-400 group-hover:text-amber-400'
                    : 'text-stone-500'
                )}
              />

              <span className="whitespace-nowrap">{tab.label}</span>

              {/* Badge số lượng đơn */}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors shrink-0',
                  isSelected
                    ? 'bg-white/25 text-white'
                    : tab.highlight
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 animate-pulse'
                    : tab.count > 0
                    ? isDark
                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-500'
                    : 'bg-stone-100 text-stone-400'
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mép Gradient mờ bên phải khi có thể cuộn tiếp sang phải */}
      {canScrollRight && (
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-300 rounded-r-xl',
            isDark
              ? 'bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent'
              : 'bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent'
          )}
        />
      )}
    </div>
  )
}
