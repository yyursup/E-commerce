import { HiOutlineTicket, HiOutlineCheckCircle, HiOutlineUsers } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminVoucherMetrics({ vouchers, isDark }) {
  const activeCount = vouchers.filter((v) => v.status === 'ACTIVE').length
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <HiOutlineTicket className="h-6 w-6" />
          </span>
          <div>
            <div className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Voucher Sàn Đã Phát Hành</div>
            <div className={cn('text-xl font-bold mt-0.5', isDark ? 'text-white' : 'text-stone-900')}>{vouchers.length}</div>
          </div>
        </div>
      </div>

      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <HiOutlineCheckCircle className="h-6 w-6" />
          </span>
          <div>
            <div className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Chiến Dịch Đang Chạy</div>
            <div className="text-xl font-bold text-emerald-500 mt-0.5">{activeCount}</div>
          </div>
        </div>
      </div>

      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <HiOutlineUsers className="h-6 w-6" />
          </span>
          <div>
            <div className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Tổng Lượt Khách Áp Dụng</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{totalUsed}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
