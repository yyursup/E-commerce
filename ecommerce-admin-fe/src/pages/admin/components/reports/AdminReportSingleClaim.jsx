import { HiOutlineEye, HiOutlinePlay } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { isVideoUrl } from '../../../../lib/mediaUtils'

export default function AdminReportSingleClaim({
  detailModal,
  isReport,
  evImgs = [],
  covImgs = [],
  isDark,
  setPreviewImage,
}) {
  const desc = detailModal.data?.description || detailModal.rawItem?.description || 'Không có mô tả chi tiết'

  const renderSingleMediaItem = (imgUrl, altText, borderClass) => {
    const isVid = isVideoUrl(imgUrl)
    return (
      <div
        onClick={() => setPreviewImage(imgUrl)}
        className={cn(
          'relative group aspect-square rounded-2xl overflow-hidden border bg-stone-900/10 cursor-pointer shadow-xs',
          borderClass,
        )}
      >
        {isVid ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video src={imgUrl} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs">
                <HiOutlinePlay className="h-5 w-5 fill-white/80" />
              </span>
            </div>
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white shadow">
              VIDEO
            </span>
          </div>
        ) : (
          <img
            src={imgUrl}
            alt={altText}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <HiOutlineEye className="h-6 w-6 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
          {isReport
            ? 'Mô tả vi phạm từ người tố cáo:'
            : 'Nội dung trần tình & giải trình kháng cáo:'}
        </label>
        <div
          className={cn(
            'p-3.5 rounded-2xl border text-xs leading-relaxed',
            isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-white text-stone-800',
          )}
        >
          {desc}
        </div>
      </div>

      {/* Hình ảnh bằng chứng vi phạm */}
      {evImgs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              Hình ảnh bằng chứng vi phạm ({evImgs.length} tệp):
            </label>
            <span className="text-[11px] text-stone-400">Do người tố cáo tải lên</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {evImgs.map((imgUrl, idx) => (
              <div key={idx}>
                {renderSingleMediaItem(imgUrl, `Bằng chứng vi phạm ${idx + 1}`, 'border-rose-500/25')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hình ảnh minh họa gian hàng / sản phẩm (nếu khác với evidence) */}
      {covImgs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              Hình ảnh minh họa sản phẩm / gian hàng ({covImgs.length} tệp):
            </label>
            <span className="text-[11px] text-stone-400">Ảnh hệ thống ghi nhận</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {covImgs.map((imgUrl, idx) => (
              <div key={idx}>
                {renderSingleMediaItem(imgUrl, `Minh họa shop ${idx + 1}`, 'border-blue-500/25')}
              </div>
            ))}
          </div>
        </div>
      )}

      {evImgs.length === 0 && covImgs.length === 0 && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-center text-xs text-stone-400',
            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50',
          )}
        >
          Không có tệp hình ảnh hoặc tài liệu bằng chứng đính kèm.
        </div>
      )}
    </div>
  )
}
