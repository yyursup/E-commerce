import { formatOrderCurrency } from '../../../lib/orderStatus'

export default function ReturnSettlementSection({ settlement }) {
  if (!settlement || !settlement.settlementType) {
    return (
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
        <p className="font-bold text-emerald-600 dark:text-emerald-400">Hoàn tất</p>
        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
          Quy trình hoàn hàng đã hoàn tất thành công.
        </p>
      </div>
    )
  }

  const s = settlement

  if (s.settlementType === 'PARTIAL_SPLIT') {
    return (
      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
        <p className="font-bold text-amber-600 dark:text-amber-400">
          Phân xử chia tiền: Khách {s.buyerPercentage}% — Shop {s.sellerPercentage}%
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Number(s.buyerRefundAmount) > 0 && (
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-[11px] text-blue-500 font-medium">
                Hoàn về ví bạn ({s.buyerPercentage}%)
              </p>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatOrderCurrency(s.buyerRefundAmount)}
              </p>
            </div>
          )}
          {Number(s.sellerReleaseAmount) > 0 && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[11px] text-emerald-500 font-medium">
                Shop nhận ({s.sellerPercentage}%)
              </p>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatOrderCurrency(s.sellerReleaseAmount)}
              </p>
            </div>
          )}
        </div>
        {s.settlementNote && (
          <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
            &ldquo;{s.settlementNote}&rdquo;
          </p>
        )}
      </div>
    )
  }

  if (s.settlementType === 'FULL_REFUND') {
    return (
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
        <p className="font-bold text-emerald-600 dark:text-emerald-400">Hoàn tiền thành công</p>
        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
          Số tiền{' '}
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatOrderCurrency(s.buyerRefundAmount)}
          </span>{' '}
          đã được hoàn trả về Ví số dư của bạn.
        </p>
      </div>
    )
  }

  // FULL_RELEASE: seller nhận hết, buyer không được refund
  return (
    <div className="p-3 rounded-xl border border-stone-300/50 bg-stone-50 dark:bg-slate-800/30 dark:border-slate-700/50 text-xs space-y-1">
      <p className="font-bold text-stone-700 dark:text-slate-300">
        Hoàn tất — Giải ngân cho Shop
      </p>
      <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
        Sau khi xem xét, Ban Quản Trị đã giải ngân toàn bộ cho Shop. Không có khoản hoàn tiền cho đơn này.
      </p>
    </div>
  )
}
