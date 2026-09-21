import {
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AppealsHistoryTable({
  isDark,
  loading,
  appeals,
  getStatusBadge,
  parseImages,
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-6 shadow-sm transition-colors space-y-4',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Lịch Sử Đơn Kháng Cáo Đã Gửi
          </h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Danh sách các hồ sơ giải trình đang được Quản trị viên sàn thẩm định
          </p>
        </div>
        <span className="text-xs font-bold text-amber-500">{appeals.length} hồ sơ</span>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="mt-2 text-xs text-stone-400">Đang tải lịch sử kháng cáo...</p>
        </div>
      ) : appeals.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-slate-800">
          <HiOutlineDocumentText className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-sm text-stone-600 dark:text-slate-400">
            Gian hàng chưa nộp đơn kháng cáo nào
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Khi phát sinh vi phạm cần giải trình, hãy chọn "Kháng cáo vi phạm này" ở bảng vi phạm phía trên.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-slate-800">
          {appeals.map((item) => {
            const badge = getStatusBadge(item.status)
            const BadgeIcon = badge.icon
            return (
              <div key={item.requestId || item.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border', badge.color)}>
                      <BadgeIcon className="h-3.5 w-3.5" />
                      {badge.label}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      Mã đơn: #{String(item.requestId || item.id).substring(0, 8)}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                </div>

                <p className={cn('text-xs font-medium leading-relaxed', isDark ? 'text-slate-200' : 'text-stone-800')}>
                  {item.description || 'Không có mô tả chi tiết'}
                </p>

                {item.coverImageUrl && (() => {
                  const appealImgs = parseImages(item.coverImageUrl)
                  if (!appealImgs.length) return null
                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {appealImgs.map((imgUrl, aIdx) => (
                        <a
                          key={aIdx}
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 text-xs font-semibold transition"
                        >
                          <HiOutlinePhotograph className="h-4 w-4" />
                          {appealImgs.length === 1 ? 'Hình ảnh' : `Hình ảnh #${aIdx + 1}`}
                          <HiOutlineExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )
                })()}

                {item.response && (
                  <div className={cn(
                    'p-3 rounded-xl border text-xs space-y-1 mt-2',
                    isDark ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-700'
                  )}>
                    <span className="font-bold text-amber-500">Phản hồi từ Quản trị viên:</span>
                    <p>{item.response}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
