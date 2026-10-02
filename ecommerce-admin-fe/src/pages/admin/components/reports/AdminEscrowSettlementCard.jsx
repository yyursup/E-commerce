import { HiOutlineCash } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { formatOrderDate } from '../../../../lib/orderStatus'

export default function AdminEscrowSettlementCard({
  settlement,
  isDark,
  formatVND,
}) {
  if (!settlement || !settlement.settlementType) return null

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-3',
        isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50',
      )}
    >
      <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800 border-emerald-200/60">
        <div className="flex items-center gap-2">
          <HiOutlineCash className="h-4 w-4 text-emerald-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Kết Quả Phán Quyết Ký Quỹ Đã Thực Hiện
          </h4>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          {settlement.settlementType === 'PARTIAL_SPLIT'
            ? `Phân chia (${settlement.buyerPercentage}% - ${settlement.sellerPercentage}%)`
            : settlement.settlementType === 'FULL_RELEASE'
              ? 'Giải ngân toàn bộ cho Shop'
              : 'Hoàn tiền toàn bộ cho Khách'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hoàn cho Khách:
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatVND(settlement.buyerRefundAmount || 0)}
          </span>
        </div>
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Giải ngân cho Shop:
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatVND(settlement.sellerReleaseAmount || 0)}
          </span>
        </div>
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Phí sàn thu:
          </span>
          <span className="font-mono font-semibold text-stone-700 dark:text-slate-300">
            {formatVND(settlement.commissionAmount || 0)}
          </span>
        </div>
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Ngày phán quyết:
          </span>
          <span className="font-semibold">
            {formatOrderDate(settlement.settledAt)}
          </span>
        </div>
      </div>

      {settlement.settlementNote && (
        <div className="text-[11px] italic text-stone-500 dark:text-slate-400 pt-1">
          Ghi chú phân xử: &ldquo;{settlement.settlementNote}&rdquo;
        </div>
      )}
    </div>
  )
}
