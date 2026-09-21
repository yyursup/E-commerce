import {
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineClock,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function ShopHealthOverview({
  isDark,
  shopHealth,
  violationCount,
  shopStatus,
  hasAppealableViolations,
  onOpenAppealModal,
}) {
  return (
    <div className="space-y-6">
      {/* Cảnh báo kỷ luật cấp độ 2: Tạm ngưng 14 ngày & Giữ Escrow */}
      {(shopStatus === 'SUSPENDED' || violationCount >= 5) && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                <HiOutlineExclamation className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-500 text-white tracking-wider">
                    Kỷ luật cấp độ 2 ({violationCount}/7 vi phạm)
                  </span>
                  <h3 className="text-base font-bold text-rose-500 dark:text-rose-400">
                    Gian hàng đang bị tạm ngưng hoạt động 14 ngày
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Do tích lũy <strong>{violationCount} lần vi phạm</strong>, toàn bộ sản phẩm của gian hàng đã được tạm ẩn khỏi sàn và gian hàng bị đình chỉ kinh doanh tạm thời. Khoản tiền ký quỹ Escrow đang được tạm giữ để bảo vệ quyền lợi người mua.
                </p>
                <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                  • Các đơn hàng đã phát sinh trước đó vẫn được tiếp tục vận chuyển bình thường đến tay khách hàng.
                </p>
              </div>
            </div>

            {hasAppealableViolations && (
              <button
                type="button"
                onClick={onOpenAppealModal}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/30 transition-all"
              >
                <HiOutlineDocumentText className="h-4 w-4" />
                Nộp đơn kháng cáo ngay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cảnh báo kỷ luật cấp độ 1: Cảnh báo gian hàng */}
      {shopStatus === 'WARNED' && violationCount < 5 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                <HiOutlineExclamation className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-500 text-white tracking-wider">
                    Kỷ luật cấp độ 1 ({violationCount}/7 vi phạm)
                  </span>
                  <h3 className="text-base font-bold text-amber-500 dark:text-amber-400">
                    Gian hàng đang trong tình trạng cảnh báo
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Gian hàng đã chạm mốc <strong>{violationCount} lần vi phạm</strong>. Vui lòng rà soát chất lượng sản phẩm và dịch vụ để tránh đạt ngưỡng 5 lần vi phạm (sẽ bị tạm ngưng 14 ngày).
                </p>
              </div>
            </div>

            {hasAppealableViolations && (
              <button
                type="button"
                onClick={onOpenAppealModal}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 shadow-md shadow-amber-600/30 transition-all"
              >
                <HiOutlineDocumentText className="h-4 w-4" />
                Kháng cáo gỡ cảnh báo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Health Metric & Decay Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Card */}
        <div
          className={cn(
            'rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Chỉ số kỷ luật</span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border',
                  shopStatus === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : shopStatus === 'WARNED'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                )}
              >
                {shopStatus === 'ACTIVE' ? 'Hoạt động tốt' : shopStatus === 'WARNED' ? 'Đang cảnh báo' : 'Bị tạm ngưng'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-amber-500">{violationCount}</span>
              <span className="text-sm font-semibold text-stone-400">/ 7 lần vi phạm tối đa</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  violationCount < 3
                    ? 'bg-emerald-500'
                    : violationCount < 5
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(100, (violationCount / 7) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] text-stone-400 space-y-1">
            <p>• <strong>3 lần</strong>: Cảnh báo gian hàng (WARNED)</p>
            <p>• <strong>5 lần</strong>: Tạm ngưng 14 ngày & Giữ Escrow (SUSPENDED)</p>
            <p>• <strong>7 lần</strong>: Khóa vĩnh viễn & Hoàn tiền Escrow cho khách (BANNED)</p>
          </div>
        </div>

        {/* 30-Day Monthly Decay Explanation */}
        <div
          className={cn(
            'lg:col-span-2 rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-3 text-amber-500">
              <HiOutlineClock className="h-5 w-5" />
              <h3 className="font-bold text-sm">Cơ Chế Giảm Trừ Điểm Vi Phạm (Chu Kỳ 30 Ngày)</h3>
            </div>
            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Hệ thống áp dụng chính sách <strong>30 ngày giảm trừ 1 điểm vi phạm</strong>: Nếu trong vòng 30 ngày liên tục, gian hàng hoạt động chuẩn mực và không phát sinh bất kỳ báo cáo vi phạm nào được xác nhận, số lần vi phạm của gian hàng sẽ được tự động trừ đi <code>-1 lần</code> cho đến khi trở về <code>0</code>.
            </p>
            <div className={cn(
              'mt-4 p-4 rounded-2xl border text-xs space-y-2',
              isDark ? 'border-amber-500/20 bg-amber-500/5 text-slate-300' : 'border-amber-200 bg-amber-50/50 text-stone-700'
            )}>
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>🛡️ Quyền lợi khi chấp hành tốt:</span>
              </div>
              <p>• Giúp các gian hàng có cơ hội khắc phục sai sót, không bị cộng dồn lỗi vĩnh viễn xuyên suốt nhiều năm.</p>
              <p>• Mỗi đơn kháng cáo chỉ áp dụng cho 1 sự vụ vi phạm cụ thể, khi được duyệt sẽ trừ đúng 1 vi phạm.</p>
              <p>• Quyết định từ chối của Ban Quản Trị là quyết định cuối cùng cho vi phạm đó để tránh việc khiếu nại tràn lan.</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-400">
            <span>Trạng thái ký quỹ Escrow:</span>
            <span className="font-bold text-emerald-500">Bảo vệ 2 chiều (Sàn trung gian)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
