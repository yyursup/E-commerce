import { HiOutlineTicket, HiOutlineCheckCircle, HiOutlineUsers } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function VoucherMetrics({ vouchers, isDark }) {
  const activeCount = vouchers.filter((v) => v.status === 'ACTIVE').length
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <HiOutlineTicket className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs text-stone-500 dark:text-slate-400">Tổng voucher đã tạo</div>
            <div className="text-xl font-bold text-stone-900 dark:text-white mt-0.5">{vouchers.length}</div>
          </div>
        </div>
      </div>

      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <HiOutlineCheckCircle className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs text-stone-500 dark:text-slate-400">Đang có hiệu lực</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
        </div>
      </div>

      <div className={cn('rounded-2xl border p-5 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <HiOutlineUsers className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs text-stone-500 dark:text-slate-400">Tổng lượt khách đã dùng</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{totalUsed}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
