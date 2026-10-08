import {
  HiOutlineTruck,
  HiOutlinePhotograph,
  HiOutlineExclamationCircle,
  HiOutlineEye,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import {
  getReturnStatusBadge,
  getReturnStatusLabel,
  formatOrderDate,
} from '../../../../lib/orderStatus'

export default function AdminEscrowReturnSection({
  returnDetails,
  isDark,
  onPreviewMedia,
}) {
  if (!returnDetails) return null

  const returnBadge = getReturnStatusBadge(returnDetails.status)
  const ReturnIcon = returnBadge?.icon || HiOutlineTruck

  const parseMedia = (urls) => {
    if (!urls) return []
    if (Array.isArray(urls)) return urls.filter(Boolean)
    return String(urls)
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith('http') || u.startsWith('/')))
  }

  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  const evidenceList = parseMedia(returnDetails.sellerEvidenceUrls)

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-3',
        isDark ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-200 bg-purple-50/50',
      )}
    >
      <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800 border-purple-200/60">
        <div className="flex items-center gap-2">
          <HiOutlineTruck className="h-4 w-4 text-purple-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Tiến Trình Đổi Trả / Hoàn Tiền (Return Info)
          </h4>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
            returnBadge.color,
          )}
        >
          <ReturnIcon className="h-3.5 w-3.5" />
          {getReturnStatusLabel(returnDetails.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Mã yêu cầu trả:
          </span>
          <span className="font-mono font-semibold">
            {returnDetails.id?.substring(0, 8)}...
          </span>
        </div>
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Vận đơn hoàn:
          </span>
          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
            {returnDetails.returnTrackingCode || 'Chưa gửi'}
          </span>
        </div>
        <div>
          <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hạn chót Shop kiểm:
          </span>
          <span className="font-semibold">
            {formatOrderDate(returnDetails.sellerInspectionDeadline)}
          </span>
        </div>
      </div>

      {/* Tình trạng kiểm tra hoặc khiếu nại của Shop */}
      {(returnDetails.conditionStatus || returnDetails.conditionNote) && (
        <div className="p-3 rounded-xl dark:bg-slate-800/80 bg-white border dark:border-slate-700 border-purple-100 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-500">
            <HiOutlineExclamationCircle className="h-4 w-4" />
            <span>
              Tình trạng phản ánh: {returnDetails.conditionStatus || 'Có vấn đề'}
            </span>
          </div>
          {returnDetails.conditionNote && (
            <p className="text-[11px] leading-relaxed dark:text-slate-300 text-stone-700 pl-5">
              &ldquo;{returnDetails.conditionNote}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Ảnh / Video bằng chứng Shop cung cấp */}
      {evidenceList.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
            <HiOutlinePhotograph className="h-4 w-4" /> Bằng chứng từ Shop ({evidenceList.length}):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {evidenceList.map((url, idx) => {
              const isVid = isVideoUrl(url)
              return (
                <div
                  key={idx}
                  onClick={() => onPreviewMedia({ url, isVideo: isVid })}
                  className="relative rounded-xl border dark:border-slate-700 border-stone-200 overflow-hidden h-20 bg-black/5 cursor-pointer group"
                >
                  {isVid ? (
                    <video src={url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <HiOutlineEye className="h-5 w-5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
