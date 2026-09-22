import {
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineShieldCheck,
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
  // Thang điểm uy tín chuẩn 100 điểm, mỗi lần vi phạm trừ 15 điểm
  const reputationScore = Math.max(0, 100 - violationCount * 15)

  const getReputationBadge = () => {
    if (shopStatus === 'BANNED' || reputationScore === 0) {
      return {
        label: 'Uy tín vô hiệu',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      }
    }
    if (shopStatus === 'SUSPENDED' || reputationScore < 40) {
      return {
        label: 'Nguy cơ đình chỉ',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      }
    }
    if (shopStatus === 'WARNED' || reputationScore < 70) {
      return {
        label: 'Cảnh báo giảm uy tín',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      }
    }
    if (reputationScore === 100) {
      return {
        label: 'Uy tín tuyệt đối (100đ)',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      }
    }
    return {
      label: 'Uy tín Tốt',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    }
  }

  const badge = getReputationBadge()

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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-500 text-white tracking-wider">
                    Kỷ luật cấp 2 (Điểm uy tín: {reputationScore}/100 - {violationCount}/7 vi phạm)
                  </span>
                  <h3 className="text-base font-bold text-rose-500 dark:text-rose-400">
                    Gian hàng đang bị tạm ngưng hoạt động 14 ngày
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Do điểm uy tín sụt giảm nghiêm trọng (tích lũy <strong>{violationCount} lần vi phạm</strong>), toàn bộ sản phẩm của gian hàng đã được tạm ẩn khỏi sàn và gian hàng bị đình chỉ kinh doanh tạm thời. Khoản tiền ký quỹ Escrow đang được tạm giữ để bảo vệ quyền lợi người mua.
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
                Nộp đơn kháng cáo phục hồi uy tín
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-500 text-white tracking-wider">
                    Cảnh báo sụt giảm uy tín (Điểm uy tín: {reputationScore}/100)
                  </span>
                  <h3 className="text-base font-bold text-amber-500 dark:text-amber-400">
                    Gian hàng đang trong tình trạng cảnh báo uy tín
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Điểm uy tín của gian hàng đã bị giảm do tích lũy <strong>{violationCount} lần vi phạm</strong>. Vui lòng rà soát chất lượng sản phẩm và dịch vụ để tránh điểm uy tín giảm xuống ngưỡng đình chỉ kinh doanh (5 lần vi phạm / dưới 30 điểm).
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
                Kháng cáo gỡ cảnh báo uy tín
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Reputation Metric & Decay Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reputation Score Card */}
        <div
          className={cn(
            'rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineShieldCheck className="h-4 w-4 text-amber-500" />
                Điểm uy tín gian hàng
              </span>
              <span className={cn('px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border', badge.color)}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn(
                'text-4xl font-black',
                reputationScore >= 70 ? 'text-emerald-500' : reputationScore >= 40 ? 'text-amber-500' : 'text-rose-500'
              )}>
                {reputationScore}
              </span>
              <span className="text-sm font-bold text-stone-400">/ 100 điểm</span>
            </div>

            <p className="text-xs text-stone-400 mb-3">
              {violationCount === 0
                ? 'Gian hàng chưa ghi nhận bất kỳ vi phạm nào'
                : `Đã ghi nhận ${violationCount}/7 lần vi phạm (-${violationCount * 15} điểm)`}
            </p>

            {/* Progress bar */}
            <div className="w-full h-3 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  reputationScore >= 70
                    ? 'bg-emerald-500'
                    : reputationScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                )}
                style={{ width: `${reputationScore}%` }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] text-stone-400 space-y-1">
            <p>• <strong>70 - 100 điểm</strong>: Uy tín Tốt, ưu tiên hiển thị đề xuất</p>
            <p>• <strong>40 - 69 điểm</strong> (3 vi phạm): Cảnh báo giảm uy tín (WARNED)</p>
            <p>• <strong>15 - 39 điểm</strong> (5 vi phạm): Tạm ngưng 14 ngày & Giữ Escrow (SUSPENDED)</p>
            <p>• <strong>0 điểm</strong> (7 vi phạm): Khóa vĩnh viễn & Hoàn Escrow cho khách (BANNED)</p>
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
              <h3 className="font-bold text-sm">Cơ Chế Phục Hồi Điểm Uy Tín (Chu Kỳ 30 Ngày)</h3>
            </div>
            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Hệ thống áp dụng chính sách <strong>Phục hồi điểm uy tín định kỳ 30 ngày</strong>: Nếu trong vòng 30 ngày liên tục, gian hàng hoạt động chuẩn mực và không phát sinh bất kỳ báo cáo vi phạm nào được xác nhận, hệ thống sẽ tự động khôi phục <strong>+15 điểm uy tín</strong> (tương đương xóa bỏ <code>1 lần vi phạm</code>) cho đến khi đạt điểm tối đa <strong>100 điểm</strong>.
            </p>
            <div className={cn(
              'mt-4 p-4 rounded-2xl border text-xs space-y-2',
              isDark ? 'border-amber-500/20 bg-amber-500/5 text-slate-300' : 'border-amber-200 bg-amber-50/50 text-stone-700'
            )}>
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>🛡️ Lợi ích khi duy trì điểm uy tín cao:</span>
              </div>
              <p>• <strong>Ưu tiên hiển thị:</strong> Sản phẩm của gian hàng có điểm uy tín cao được ưu tiên đề xuất trên trang chủ và kết quả tìm kiếm.</p>
              <p>• <strong>Khắc phục sai sót:</strong> Giúp các gian hàng có cơ hội sửa đổi và phục hồi toàn diện điểm số theo thời gian mà không bị trừ điểm vĩnh viễn.</p>
              <p>• <strong>Kháng cáo phục hồi điểm:</strong> Khi nộp đơn giải trình và được Ban Quản Trị chấp thuận, điểm uy tín của sự vụ đó sẽ được khôi phục ngay lập tức (+15 điểm).</p>
              <p>• <strong>Tính công bằng:</strong> Quyết định thẩm định của Ban Quản Trị là phán quyết cuối cùng để bảo đảm tính nghiêm minh và quyền lợi người mua.</p>
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
