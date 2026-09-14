import { useRef, useEffect } from 'react'
import { HiOutlineTicket, HiOutlinePlus } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function VoucherTable({ vouchers, loading, isDark, onOpenCreateModal }) {
  const tableContainerRef = useRef(null)

  useEffect(() => {
    const el = tableContainerRef.current
    if (!el) return

    const handleWheel = (e) => {
      // If user is scrolling with the mouse wheel vertically
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScrollLeft = el.scrollWidth - el.clientWidth
        if (maxScrollLeft > 0) {
          const canScrollRight = e.deltaY > 0 && el.scrollLeft < maxScrollLeft - 1
          const canScrollLeft = e.deltaY < 0 && el.scrollLeft > 1
          if (canScrollRight || canScrollLeft) {
            e.preventDefault()
            el.scrollLeft += e.deltaY
          }
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [vouchers])

  if (loading) {
    return (
      <div className={cn('rounded-3xl border p-20 text-center shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
        <p className="mt-3 text-xs text-stone-500">Đang tải danh sách voucher từ hệ thống...</p>
      </div>
    )
  }

  if (vouchers.length === 0) {
    return (
      <div className={cn('rounded-3xl border p-16 text-center shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <HiOutlineTicket className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-stone-700 dark:text-slate-300">Chưa có mã giảm giá nào</h3>
        <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
          Hãy tạo voucher đầu tiên để thu hút khách hàng đặt đơn ngay hôm nay!
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 active:scale-95 transition-all"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Tạo voucher ngay
        </button>
      </div>
    )
  }

  return (
    <div className={cn('rounded-3xl border overflow-hidden shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
      <div
        ref={tableContainerRef}
        className={cn(
          'overflow-x-auto pb-1',
          isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'
        )}
      >
        <table className="w-full text-left text-xs min-w-[950px] border-collapse">
          <thead className={cn('border-b text-[11px] font-bold uppercase tracking-wider', isDark ? 'border-slate-800 bg-slate-800/60 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-600')}>
            <tr>
              <th className="p-4 min-w-[280px]">Mã Voucher & Tên Chương Trình</th>
              <th className="p-4 whitespace-nowrap">Loại & Mức Giảm</th>
              <th className="p-4 whitespace-nowrap">Đơn Tối Thiểu</th>
              <th className="p-4 whitespace-nowrap">Lượt Dùng / Giới Hạn</th>
              <th className="p-4 whitespace-nowrap">Thời Gian Hiệu Lực</th>
              <th className="p-4 whitespace-nowrap text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
            {vouchers.map((v) => {
              const isExpired = v.endDate && new Date(v.endDate) < new Date()
              const statusLabel = isExpired ? 'Hết hạn' : v.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'

              return (
                <tr key={v.id || v.code} className={cn('transition-colors', isDark ? 'hover:bg-slate-800/60' : 'hover:bg-stone-50/50')}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-amber-500 uppercase px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                        {v.code}
                      </span>
                      <div className="min-w-0">
                        <div className={cn('font-bold text-sm leading-snug', isDark ? 'text-white' : 'text-stone-900')}>{v.title}</div>
                        {v.description && (
                          <div className={cn('text-[11px] mt-0.5 line-clamp-2 max-w-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            {v.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-bold text-rose-500 dark:text-rose-400 text-xs">
                      {v.voucherType === 'PERCENTAGE'
                        ? `Giảm ${v.discountValue}% (Tối đa ${v.maxDiscountAmount ? Number(v.maxDiscountAmount).toLocaleString('vi-VN') + 'đ' : 'Không giới hạn'})`
                        : v.voucherType === 'FREE_SHIPPING'
                        ? 'Miễn phí giao hàng'
                        : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}₫`}
                    </span>
                  </td>
                  <td className={cn('p-4 whitespace-nowrap font-semibold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                    {v.minOrderValue ? `${Number(v.minOrderValue).toLocaleString('vi-VN')}₫` : '0₫'}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className={cn('font-bold text-sm', isDark ? 'text-slate-100' : 'text-stone-900')}>
                      {v.usedCount || 0} <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>/</span> {v.usageLimit || '∞'}
                    </div>
                    <div className={cn('text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>1 lần/khách</div>
                  </td>
                  <td className={cn('p-4 whitespace-nowrap text-xs font-medium', isDark ? 'text-slate-300' : 'text-stone-600')}>
                    {v.startDate ? new Date(v.startDate).toLocaleDateString('vi-VN') : 'Từ nay'}{' '}
                    <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>→</span> {v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                  </td>
                  <td className="p-4 whitespace-nowrap text-center">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1.5',
                        statusLabel === 'Đang chạy'
                          ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                          : (isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-stone-100 text-stone-600 border border-stone-200')
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusLabel === 'Đang chạy' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400')} />
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
