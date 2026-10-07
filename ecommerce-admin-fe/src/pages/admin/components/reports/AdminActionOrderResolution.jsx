import { cn } from '../../../../lib/cn'

export default function AdminActionOrderResolution({
  resolutionType,
  onChangeResolution,
  isDark,
}) {
  return (
    <div className="mb-4 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5">
      <span className="text-[11px] font-bold text-amber-500 block mb-2">
        Phương án xử lý nếu Customer thắng khiếu nại:
      </span>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label
          className={cn(
            'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition',
            (resolutionType || 'REFUND_ONLY') === 'REFUND_ONLY'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
              : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-stone-200 bg-stone-50 text-stone-700',
          )}
        >
          <input
            type="radio"
            name="resolutionType"
            value="REFUND_ONLY"
            checked={(resolutionType || 'REFUND_ONLY') === 'REFUND_ONLY'}
            onChange={() => onChangeResolution('REFUND_ONLY')}
            className="text-amber-500"
          />
          <span>Chỉ hoàn tiền</span>
        </label>

        <label
          className={cn(
            'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition',
            resolutionType === 'RETURN_AND_REFUND'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
              : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-stone-200 bg-stone-50 text-stone-700',
          )}
        >
          <input
            type="radio"
            name="resolutionType"
            value="RETURN_AND_REFUND"
            checked={resolutionType === 'RETURN_AND_REFUND'}
            onChange={() => onChangeResolution('RETURN_AND_REFUND')}
            className="text-amber-500"
          />
          <span>Trả hàng & Hoàn tiền</span>
        </label>
      </div>
      <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-2 leading-relaxed">
        Phương án này sẽ có hiệu lực sau khi kết thúc thời hạn 72h kháng cáo của Shop.
      </p>
    </div>
  )
}
