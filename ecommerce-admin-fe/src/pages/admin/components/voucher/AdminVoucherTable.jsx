import { HiOutlineTicket, HiOutlinePlus } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminVoucherTable({ vouchers, loading, isDark, onOpenCreateModal }) {
  if (loading) {
    return (
      <div className={cn('rounded-3xl border p-20 text-center shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
        <p className="mt-3 text-xs text-stone-500">Đang tải danh sách voucher sàn...</p>
      </div>
    )
  }

  if (vouchers.length === 0) {
    return (
      <div className={cn('rounded-3xl border p-16 text-center shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <HiOutlineTicket className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-stone-700 dark:text-slate-300">Chưa có voucher toàn sàn nào</h3>
        <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
          Hãy tạo voucher trợ giá toàn sàn đầu tiên để đẩy mạnh lượng đơn hàng!
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 active:scale-95 transition-all"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Phát hành voucher ngay
        </button>
      </div>
    )
  }

  return (
    <div className={cn('rounded-3xl border overflow-hidden shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className={cn('border-b text-[11px] font-bold uppercase tracking-wider', isDark ? 'border-slate-800 bg-slate-800/50 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-600')}>
            <tr>
              <th className="p-4">Mã Voucher Sàn</th>
              <th className="p-4">Loại Khuyến Mãi</th>
              <th className="p-4">Mức Giảm</th>
              <th className="p-4">Đơn Tối Thiểu</th>
              <th className="p-4">Lượt Dùng / Giới Hạn</th>
              <th className="p-4">Thời Gian Hiệu Lực</th>
              <th className="p-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
            {vouchers.map((v) => {
              const isExpired = v.endDate && new Date(v.endDate) < new Date()
              const statusLabel = isExpired ? 'Hết hạn' : v.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'

              return (
                <tr key={v.id || v.code} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-blue-500 uppercase px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        {v.code}
                      </span>
                      <div>
                        <div className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-stone-900')}>{v.title}</div>
                        {v.description && <div className="text-[11px] text-stone-400">{v.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {v.voucherType === 'FREE_SHIPPING' ? 'Trợ Phí Ship GHN' : v.voucherType === 'PERCENTAGE' ? 'Giảm Giá %' : 'Giảm Tiền Mặt'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-rose-500">
                      {v.voucherType === 'PERCENTAGE'
                        ? `Giảm ${v.discountValue}% (Tối đa ${v.maxDiscountAmount ? Number(v.maxDiscountAmount).toLocaleString('vi-VN') + 'đ' : '∞'})`
                        : v.voucherType === 'FREE_SHIPPING'
                        ? `Tối đa ${Number(v.discountValue || 50000).toLocaleString('vi-VN')}₫`
                        : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}₫`}
                    </span>
                  </td>
                  <td className="p-4 font-medium">
                    {v.minOrderValue ? `${Number(v.minOrderValue).toLocaleString('vi-VN')}₫` : '0₫'}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-stone-900 dark:text-white">
                      {v.usedCount || 0} / {v.usageLimit || '∞'}
                    </div>
                    <div className="text-[10px] text-stone-400">1 lần/tài khoản</div>
                  </td>
                  <td className="p-4 text-stone-500 dark:text-slate-400">
                    {v.startDate ? new Date(v.startDate).toLocaleDateString('vi-VN') : 'Bắt đầu ngay'}{' '}
                    → {v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Dài hạn'}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1',
                        statusLabel === 'Đang chạy'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-stone-200 dark:bg-slate-700 text-stone-500'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusLabel === 'Đang chạy' ? 'bg-emerald-500' : 'bg-stone-400')} />
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
