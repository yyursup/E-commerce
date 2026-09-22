import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminAppealsTab({
  appeals,
  isDark,
  handleOpenDetail,
  setActionModal,
  parseImages,
}) {
  if (appeals.length === 0) {
    return (
      <div className="py-16 text-center">
        <HiOutlineCheck className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
        <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">
          Không có hồ sơ kháng cáo nào đang chờ
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-stone-100 dark:divide-slate-800">
      {appeals.map((item) => (
        <div
          key={item.requestId || item.id}
          className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
        >
          <div
            onClick={() => handleOpenDetail(item)}
            className="space-y-1.5 flex-1 min-w-0 cursor-pointer"
            title="Bấm để xem chi tiết kháng cáo"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                  item.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : item.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                )}
              >
                {item.status === 'APPROVED'
                  ? 'Đã gỡ phạt'
                  : item.status === 'REJECTED'
                    ? 'Bị từ chối'
                    : 'Chờ xét duyệt'}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                #{String(item.requestId || item.id).substring(0, 8)}
              </span>
              <span className="text-xs text-stone-400">
                {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
              </span>
            </div>

            <p
              className={cn(
                'text-xs font-medium group-hover:text-amber-500 transition-colors line-clamp-2',
                isDark ? 'text-slate-200' : 'text-stone-800',
              )}
            >
              <strong>Giải trình:</strong> {item.description || 'Không có mô tả'}
            </p>

            {item.coverImageUrl && (() => {
              const imgs = parseImages(item.coverImageUrl)
              if (!imgs.length) return null
              return (
                <a
                  href={imgs[0]}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-500 hover:underline mt-0.5"
                >
                  <HiOutlineExternalLink className="h-3.5 w-3.5" />
                  {imgs.length === 1 ? 'Xem bằng chứng đính kèm' : `Xem bằng chứng đính kèm (${imgs.length} ảnh)`}
                </a>
              )
            })()}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Nút Xem Chi Tiết */}
            <button
              onClick={() => handleOpenDetail(item)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:border-amber-500/50 hover:text-amber-400'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-400 hover:text-amber-600',
              )}
            >
              <HiOutlineEye className="h-4 w-4" />
              Chi tiết
            </button>

            {item.status === 'PENDING' && (
              <>
                <button
                  onClick={() => setActionModal({ isOpen: true, type: 'APPEAL_APPROVE', item, note: '' })}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  Chấp thuận gỡ phạt
                </button>
                <button
                  onClick={() => setActionModal({ isOpen: true, type: 'APPEAL_REJECT', item, note: '' })}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                >
                  <HiOutlineX className="h-4 w-4" />
                  Từ chối
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
