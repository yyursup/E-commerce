import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePhotograph,
  HiOutlineEye,
  HiOutlineDocumentText,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function ViolationsTable({
  isDark,
  loading,
  violations,
  onDetail,
  onAppeal,
  parseImages,
}) {
  const activeCount = violations.filter((v) => v.appealStatus !== 'APPROVED').length
  const clearedCount = violations.filter((v) => v.appealStatus === 'APPROVED').length

  return (
    <div
      className={cn(
        'rounded-3xl border p-6 shadow-sm transition-colors space-y-4',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Hồ Sơ Ghi Nhận Điểm Uy Tín
          </h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Lựa chọn đúng sự vụ vi phạm để nộp đơn giải trình nhằm khôi phục điểm uy tín gian hàng
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-amber-500">
            {activeCount} vi phạm đang ghi nhận
          </span>
          {clearedCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {clearedCount} đã gỡ bỏ thành công
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="mt-2 text-xs text-stone-400">Đang tải danh sách vi phạm...</p>
        </div>
      ) : violations.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5">
          <HiOutlineCheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
          <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
            Gian hàng duy trì trọn vẹn điểm uy tín tuyệt đối!
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Không có vi phạm nào được ghi nhận. Bạn đang tuân thủ rất tốt các tiêu chuẩn cộng đồng và quy định bán hàng của sàn.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs border-collapse">
            <thead>
              <tr className={cn('border-b text-stone-400', isDark ? 'border-slate-800' : 'border-stone-100')}>
                <th className="py-3 px-4 font-bold w-56 min-w-[200px]">Đối tượng vi phạm</th>
                <th className="py-3 px-4 font-bold min-w-[240px]">Lý do báo cáo</th>
                <th className="py-3 px-4 font-bold min-w-[180px]">Phán quyết Ban Quản Trị</th>
                <th className="py-3 px-4 font-bold min-w-[100px]">Thời gian</th>
                <th className="py-3 px-4 font-bold min-w-[130px]">Trạng thái kháng cáo</th>
                <th className="py-3 px-4 font-bold min-w-[160px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
              {violations.map((v) => {
                const isCleared = v.appealStatus === 'APPROVED'
                return (
                  <tr
                    key={v.reportId || v.targetId}
                    className={cn(
                      'transition-colors',
                      isCleared
                        ? 'opacity-75 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]'
                        : 'hover:bg-amber-500/5'
                    )}
                  >
                    <td className="py-4 px-4 align-top w-56 min-w-[200px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            'inline-block w-max px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                            v.targetType === 'SHOP'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          )}>
                            {v.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}
                          </span>
                          {isCleared && (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              Đã hủy phạt
                            </span>
                          )}
                        </div>
                        <span className={cn('font-bold leading-tight break-words text-xs', isDark ? 'text-white' : 'text-stone-900', isCleared && 'line-through opacity-70')}>
                          {v.targetName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top min-w-[240px] max-w-xs">
                      <p className={cn('line-clamp-2 leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        {v.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng'}
                      </p>
                      {(() => {
                        const evImgs = parseImages ? parseImages(v.evidenceUrl) : []
                        const covImgs = parseImages ? parseImages(v.coverImageUrl) : []
                        if (!evImgs.length && !covImgs.length) return null
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {evImgs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => onDetail(v)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] font-medium transition"
                                title="Xem hình ảnh bằng chứng vi phạm"
                              >
                                <HiOutlinePhotograph className="h-3.5 w-3.5 text-red-500" />
                                Bằng chứng ({evImgs.length})
                              </button>
                            )}
                            {covImgs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => onDetail(v)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-medium transition"
                                title="Xem hình ảnh minh họa của gian hàng"
                              >
                                <HiOutlinePhotograph className="h-3.5 w-3.5 text-blue-400" />
                                Minh họa ({covImgs.length})
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </td>

                    <td className="py-4 px-4 align-top min-w-[180px] max-w-xs">
                      <span className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                        {v.adminNote || 'Đã được Ban Quản Trị xác minh và áp dụng chế tài'}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top whitespace-nowrap text-stone-400 min-w-[100px]">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </td>

                    <td className="py-4 px-4 align-top whitespace-nowrap min-w-[130px]">
                      {v.appealStatus === 'NONE' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-500/10 text-stone-400 border border-stone-500/20">
                          Chưa nộp đơn
                        </span>
                      )}
                      {v.appealStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <HiOutlineClock className="h-3.5 w-3.5" />
                          Đang thẩm định
                        </span>
                      )}
                      {v.appealStatus === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                          Đã gỡ vi phạm
                        </span>
                      )}
                      {v.appealStatus === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <HiOutlineXCircle className="h-3.5 w-3.5" />
                          Bị bác đơn
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 align-top text-right whitespace-nowrap min-w-[160px]">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onDetail(v)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
                            isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-amber-400'
                              : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-amber-600'
                          )}
                          title="Xem chi tiết hồ sơ vi phạm"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>

                        {v.appealStatus === 'NONE' && (
                          <button
                            type="button"
                            onClick={() => onAppeal(v)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-sm shadow-amber-500/20 transition-all"
                          >
                            <HiOutlineDocumentText className="h-3.5 w-3.5" />
                            Kháng cáo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
