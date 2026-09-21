import { HiOutlineCash } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminEscrowTab({
  escrows,
  isDark,
  formatVND,
  setActionModal,
}) {
  if (escrows.length === 0) {
    return (
      <div className="py-16 text-center">
        <HiOutlineCash className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-2" />
        <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">
          Không có giao dịch ký quỹ nào
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-stone-100 dark:divide-slate-800">
      {escrows.map((item) => (
        <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                  item.status === 'RELEASED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : item.status === 'REFUNDED'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                )}
              >
                {item.status}
              </span>
              <span className="text-xs font-mono font-bold text-amber-500">
                {formatVND(item.amount)}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Mã đơn hàng: #{item.orderNumber || item.orderId || item.id}
            </p>
          </div>

          {(item.status === 'HELD' || item.status === 'DISPUTED') && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActionModal({ isOpen: true, type: 'ESCROW_RELEASE', item, note: '' })}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                Giải ngân cho Shop
              </button>
              <button
                onClick={() => setActionModal({ isOpen: true, type: 'ESCROW_REFUND', item, note: '' })}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Hoàn tiền cho Người mua
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
