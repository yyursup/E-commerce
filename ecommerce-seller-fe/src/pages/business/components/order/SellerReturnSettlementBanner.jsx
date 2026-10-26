import { formatOrderCurrency } from '../../../../lib/orderStatus'

export default function SellerReturnSettlementBanner({ settlement }) {
  if (!settlement || !settlement.settlementType) return null

  if (settlement.settlementType === 'PARTIAL_SPLIT') {
    return (
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
        <p className="font-bold text-amber-600 dark:text-amber-400">
          Phán quyết chia tiền: Khách {settlement.buyerPercentage}% — Shop {settlement.sellerPercentage}%
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[11px] text-emerald-500 font-medium">Shop nhận ({settlement.sellerPercentage}%)</p>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatOrderCurrency(settlement.sellerReleaseAmount)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-[11px] text-blue-500 font-medium">Hoàn khách ({settlement.buyerPercentage}%)</p>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {formatOrderCurrency(settlement.buyerRefundAmount)}
            </p>
          </div>
        </div>
        {settlement.settlementNote && (
          <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
            Ghi chú BQT: &ldquo;{settlement.settlementNote}&rdquo;
          </p>
        )}
      </div>
    )
  }

  if (settlement.settlementType === 'FULL_RELEASE') {
    return (
      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
        <p className="font-bold text-emerald-600 dark:text-emerald-400">
          Phán quyết BQT: Giải ngân toàn bộ cho Shop
        </p>
        <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
          Toàn bộ tiền đơn hàng đã được giải ngân về Ví của gian hàng sau khi khấu trừ phí sàn 5%.
        </p>
        {settlement.settlementNote && (
          <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
            Ghi chú BQT: &ldquo;{settlement.settlementNote}&rdquo;
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-xs space-y-1">
      <p className="font-bold text-blue-600 dark:text-blue-400">
        Phán quyết BQT: Hoàn tiền 100% cho Người mua
      </p>
      <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
        Toàn bộ tiền ký quỹ Escrow đã được bồi hoàn về Ví số dư của khách hàng.
      </p>
      {settlement.settlementNote && (
        <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
          Ghi chú BQT: &ldquo;{settlement.settlementNote}&rdquo;
        </p>
      )}
    </div>
  )
}
