import { useRef, useEffect } from 'react'

/**
 * Hook cho phép cuộn ngang (horizontal scroll) bằng con lăn chuột (mouse wheel)
 * khi người dùng di chuột vào bên trong container có overflow-x.
 * Đồng thời tự động nhả sự kiện cuộn dọc khi đã chạm kịch biên trái/phải,
 * tránh làm người dùng bị "kẹt" không cuộn được trang.
 */
export function useHorizontalScroll() {
  const elRef = useRef(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const handleWheel = (e) => {
      // Chỉ can thiệp khi nội dung thực sự tràn ngang
      if (el.scrollWidth <= el.clientWidth) return

      // Chuẩn hóa deltaY theo deltaMode của các trình duyệt
      let delta = e.deltaY
      if (e.deltaMode === 1) {
        delta *= 40 // line mode (Firefox)
      } else if (e.deltaMode === 2) {
        delta *= 800 // page mode
      }

      // Nếu cử chỉ đã có thành phần cuộn ngang rõ rệt (ví dụ người dùng vuốt ngang 2 ngón trên trackpad), để trình duyệt tự xử lý tự nhiên
      if (Math.abs(e.deltaX) > 5) return

      // Chỉ chuyển đổi khi con lăn đang lăn theo chiều dọc (deltaY chiếm ưu thế rõ rệt từ con lăn chuột)
      if (Math.abs(delta) > Math.abs(e.deltaX) * 1.5) {
        const isAtLeft = el.scrollLeft <= 0
        const isAtRight = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth

        // Nếu lăn xuống (sang phải) mà chưa chạm biên phải, HOẶC lăn lên (sang trái) mà chưa chạm biên trái
        if ((delta > 0 && !isAtRight) || (delta < 0 && !isAtLeft)) {
          e.preventDefault()
          el.scrollLeft += delta
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  return elRef
}

export default useHorizontalScroll
