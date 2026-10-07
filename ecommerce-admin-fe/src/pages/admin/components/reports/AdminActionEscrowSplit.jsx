import { cn } from '../../../../lib/cn'

export default function AdminActionEscrowSplit({
  actionModal,
  setActionModal,
  isDark,
  formatVND,
}) {
  const totalAmount = Number(actionModal.item?.amount || 0)
  const commission = Number(actionModal.item?.platformCommission || 0)
  const netAmount = Math.max(0, totalAmount - commission)
  const buyerPct = actionModal.buyerPercentage != null ? Number(actionModal.buyerPercentage) : 50
  const sellerPct = 100 - buyerPct
  const buyerAmount = Math.round((netAmount * buyerPct) / 100)
  const sellerAmount = netAmount - buyerAmount

  const presets = [
    { label: '100% Khách - 0% Shop', buyer: 100 },
    { label: '70% Khách - 30% Shop', buyer: 70 },
    { label: '50% Khách - 50% Shop', buyer: 50 },
    { label: '30% Khách - 70% Shop', buyer: 30 },
    { label: '0% Khách - 100% Shop', buyer: 0 },
  ]

  const disputeReasons = [
    'Hòa giải: Hai bên cùng chịu một phần chi phí rủi ro vận chuyển',
    'Người mua nhận hoàn phần lớn do sản phẩm có lỗi ngoại quan nhẹ',
    'Người bán nhận phần lớn do kiện hàng hoàn bị thiếu một phần phụ kiện',
    'Thống nhất phương án phân chia sau khi đối soát bằng chứng mở hộp',
  ]

  return (
    <div className="mb-4 space-y-3.5">
      {/* Thẻ tóm tắt số liệu dòng tiền */}
      <div
        className={cn(
          'p-3.5 rounded-2xl border space-y-2 text-xs',
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-stone-50 border-stone-200',
        )}
      >
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Tổng tiền ký quỹ Escrow:</span>
          <span className="font-mono font-bold text-stone-300 dark:text-slate-200">
            {formatVND(totalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Khấu trừ phí hoa hồng sàn:</span>
          <span className="font-mono text-rose-400">
            - {formatVND(commission)}
          </span>
        </div>
        <div className="pt-1 border-t dark:border-slate-700 border-stone-200 flex items-center justify-between font-bold">
          <span>Tổng số tiền thực tế phân chia:</span>
          <span className="font-mono text-amber-500 text-sm">
            {formatVND(netAmount)}
          </span>
        </div>
        <p className="text-[10px] text-stone-400 dark:text-slate-400 italic leading-relaxed pt-1">
          ℹ️ Quy tắc Sàn: Phí hoa hồng sàn được bảo lưu bù đắp chi phí vận hành & đối soát tranh chấp; số tiền còn lại (95%) được phân bổ chính xác theo tỷ lệ % giữa hai bên.
        </p>
      </div>

      {/* Slider & Nhập % */}
      <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-400">
            Tỷ lệ phân chia: Người mua {buyerPct}% — Người bán {sellerPct}%
          </span>
        </div>

        {/* Thanh kéo Slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={buyerPct}
          onChange={(e) =>
            setActionModal((prev) => ({
              ...prev,
              buyerPercentage: Number(e.target.value),
            }))
          }
          className="w-full accent-indigo-500 cursor-pointer h-2 bg-stone-200 dark:bg-slate-700 rounded-lg"
        />

        {/* Nút Presets tỷ lệ nhanh */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((preset) => (
            <button
              key={preset.buyer}
              type="button"
              onClick={() =>
                setActionModal((prev) => ({
                  ...prev,
                  buyerPercentage: preset.buyer,
                }))
              }
              className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-lg border transition active:scale-95',
                buyerPct === preset.buyer
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Chi tiết số tiền mỗi bên nhận được */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-700/60 border-stone-200">
          <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10">
            <p className="text-[10px] text-blue-400 font-semibold">Người mua nhận ({buyerPct}%):</p>
            <p className="text-xs font-mono font-bold text-blue-400 mt-0.5">
              {formatVND(buyerAmount)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-[10px] text-emerald-400 font-semibold">Người bán nhận ({sellerPct}%):</p>
            <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
              {formatVND(sellerAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Gợi ý lý do phân xử nhanh */}
      <div>
        <span className="text-[11px] font-bold text-stone-400 block mb-1.5">
          Gợi ý lý do phân xử nhanh:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {disputeReasons.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
              className={cn(
                'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                actionModal.note === tag
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                  : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
              )}
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
