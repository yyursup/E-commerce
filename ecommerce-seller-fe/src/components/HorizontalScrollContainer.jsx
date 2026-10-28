import { useRef, useState, useEffect, useCallback } from 'react'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { cn } from '../lib/cn'

/**
 * HorizontalScrollContainer
 * Container cuộn ngang cao cấp chuẩn UX:
 * 1. Cho phép lăn con lăn chuột (mouse wheel) để cuộn ngang mượt mà, tự động nhả sự kiện cuộn trang khi chạm kịch biên.
 * 2. Hỗ trợ kéo rê chuột (drag to scroll) trên Desktop và vuốt chạm tự nhiên trên Touch devices.
 * 3. Gradient mờ mép trái/phải kèm nút điều hướng Chevron khi có nội dung tràn.
 * 4. Ẩn triệt để thanh scrollbar thô kệch mặc định của Windows/trình duyệt.
 */
export default function HorizontalScrollContainer({
  children,
  className = '',
  wrapperClassName = '',
  isDark = false,
  showArrows = true,
  scrollStep = 220,
  gradientColor,
}) {
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)

  const [isDragging, setIsDragging] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
  }, [])

  useEffect(() => {
    checkScrollability()
    const el = containerRef.current
    if (!el) return

    let resizeObserver
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        checkScrollability()
      })
      resizeObserver.observe(el)
    }

    window.addEventListener('resize', checkScrollability)

    return () => {
      window.removeEventListener('resize', checkScrollability)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [checkScrollability, children])

  // Lắng nghe sự kiện lăn chuột (Mouse Wheel) để cuộn ngang
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e) => {
      // Chỉ can thiệp khi nội dung thực sự tràn ngang
      if (el.scrollWidth <= el.clientWidth) return

      let delta = e.deltaY
      if (e.deltaMode === 1) delta *= 35 // Firefox line mode
      else if (e.deltaMode === 2) delta *= 600

      // Nếu đang dùng trackpad vuốt ngang rõ rệt, để trình duyệt xử lý tự nhiên
      if (Math.abs(e.deltaX) > 6) {
        checkScrollability()
        return
      }

      if (Math.abs(delta) > 0) {
        const isAtLeft = el.scrollLeft <= 2
        const isAtRight = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 2

        // Chỉ chặn cuộn dọc trang khi chưa chạm kịch biên trái/phải
        if ((delta > 0 && !isAtRight) || (delta < 0 && !isAtLeft)) {
          e.preventDefault()
          el.scrollLeft += delta * 1.05
          checkScrollability()
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [checkScrollability])

  // Kéo ngang bằng chuột (Mouse Drag to scroll)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const el = containerRef.current
    if (!el) return

    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    const el = containerRef.current
    if (!el) return

    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startXRef.current) * 1.3
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true
    }
    el.scrollLeft = scrollLeftRef.current - walk
    checkScrollability()
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }

  // Chặn kích hoạt click trên con nếu vừa thực hiện thao tác kéo chuột
  const handleCaptureClick = (e) => {
    if (hasDraggedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      hasDraggedRef.current = false
    }
  }

  // Nút cuộn thủ công
  const scrollByAmount = (direction) => {
    const el = containerRef.current
    if (!el) return
    const offset = direction === 'left' ? -scrollStep : scrollStep
    el.scrollBy({ left: offset, behavior: 'smooth' })
    setTimeout(checkScrollability, 300)
  }

  return (
    <div className={cn('relative group/scroll-container w-full overflow-hidden', wrapperClassName)}>
      {/* Nút & Gradient mờ bên trái */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pointer-events-none">
          <div
            className={cn(
              'h-full w-12 transition-opacity duration-300',
              gradientColor
                ? cn('bg-gradient-to-r to-transparent', gradientColor)
                : isDark
                  ? 'bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent'
                  : 'bg-gradient-to-r from-stone-100 via-stone-100/80 to-transparent'
            )}
          />
          {showArrows && (
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              className={cn(
                'pointer-events-auto absolute left-1 p-1 rounded-full shadow-md border transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center',
                isDark
                  ? 'bg-slate-800/95 border-slate-700 text-slate-200 hover:text-amber-400 hover:bg-slate-700'
                  : 'bg-white/95 border-stone-200 text-stone-700 hover:text-amber-600 hover:bg-stone-50'
              )}
              title="Cuộn sang trái"
              aria-label="Cuộn sang trái"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Container chứa items */}
      <div
        ref={containerRef}
        onScroll={checkScrollability}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleCaptureClick}
        className={cn(
          'flex items-center overflow-x-auto select-none no-scrollbar scroll-smooth',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-default',
          className
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Nút & Gradient mờ bên phải */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pointer-events-none">
          {showArrows && (
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              className={cn(
                'pointer-events-auto absolute right-1 p-1 rounded-full shadow-md border transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center',
                isDark
                  ? 'bg-slate-800/95 border-slate-700 text-slate-200 hover:text-amber-400 hover:bg-slate-700'
                  : 'bg-white/95 border-stone-200 text-stone-700 hover:text-amber-600 hover:bg-stone-50'
              )}
              title="Cuộn sang phải"
              aria-label="Cuộn sang phải"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          )}
          <div
            className={cn(
              'h-full w-12 transition-opacity duration-300',
              gradientColor
                ? cn('bg-gradient-to-l to-transparent', gradientColor)
                : isDark
                  ? 'bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent'
                  : 'bg-gradient-to-l from-stone-100 via-stone-100/80 to-transparent'
            )}
          />
        </div>
      )}
    </div>
  )
}
