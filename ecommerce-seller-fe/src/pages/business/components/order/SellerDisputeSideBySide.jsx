import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineExternalLink,
  HiOutlinePlay,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { getConditionStatusLabel } from '../../../../lib/orderStatus'
import { isVideoUrl } from '../../../../lib/mediaUtils'

export const formatSellerAction = (action, isReturnDispute) => {
  if (isReturnDispute) {
    return 'Shop khiếu nại kiện hoàn lên BQT sàn'
  }
  switch (action) {
    case 'ACCEPT_RETURN':
      return 'Shop đồng ý nhận lại hàng hoàn'
    case 'ACCEPT_REFUND':
      return 'Shop đồng ý hoàn 100% tiền ngay'
    case 'REJECT_AND_ESCALATE':
      return 'Shop từ chối khiếu nại & Chuyển lên BQT sàn'
    case 'DISPUTE':
      return 'Shop khiếu nại kiện hàng hoàn'
    default:
      return action || 'Đã gửi phản hồi'
  }
}

export default function SellerDisputeSideBySide({
  report,
  returnInfo,
  buyerEvidenceList,
  sellerEvidenceList,
  isNegotiating,
  isDark,
}) {
  const isReturnDispute = Boolean(returnInfo?.conditionStatus || returnInfo?.status === 'DISPUTED')
  const sellerActionLabel = formatSellerAction(report.sellerAction, isReturnDispute)

  // Bằng chứng và giải trình GIAI ĐOẠN 1 (Thương lượng ban đầu)
  const initialSellerResponse = report.sellerResponse || null
  const initialSellerEvidenceList = sellerEvidenceList.length > 0 ? sellerEvidenceList : []

  // Bằng chứng và khiếu nại GIAI ĐOẠN 2 (Kiện hàng hoàn)
  const returnDisputeNote = returnInfo?.conditionNote || null
  const returnEvidenceList = returnInfo?.sellerEvidenceUrls
    ? returnInfo.sellerEvidenceUrls.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const renderMediaThumbnail = (url, altText, isReturn = false) => {
    const isVid = isVideoUrl(url)
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'group relative block w-full aspect-square overflow-hidden rounded-xl border bg-stone-100 dark:bg-slate-800 shadow-xs',
          isReturn ? 'border-rose-200 dark:border-rose-900/50' : 'border-stone-200 dark:border-slate-700',
        )}
        title={isVid ? 'Bấm để mở video trong tab mới' : 'Bấm để mở ảnh gốc trong tab mới'}
      >
        {isVid ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video src={url} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                <HiOutlinePlay className="h-4 w-4 fill-white/80" />
              </span>
            </div>
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white shadow">
              VIDEO
            </span>
          </div>
        ) : (
          <img
            src={url}
            alt={altText}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
          <span>{isVid ? 'Xem video' : 'Xem lớn'}</span>
          <HiOutlineExternalLink className="h-3 w-3" />
        </div>
      </a>
    )
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
      {/* CỘT TRÁI: Khiếu nại từ Người mua */}
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-colors min-w-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <HiOutlineUser className="h-4 w-4" />
              </div>
              <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-200' : 'text-stone-800')}>
                Khiếu Nại Của Người Mua
              </span>
            </div>
            {report.createdAt && (
              <span className="text-[11px] text-stone-400 dark:text-slate-500">
                {new Date(report.createdAt).toLocaleString('vi-VN')}
              </span>
            )}
          </div>

          {/* Lý do & Mô tả */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400 shrink-0 mt-0.5">
                Lý do:
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                {report.reason || 'Yêu cầu đổi trả / hoàn tiền'}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
                Mô tả chi tiết từ khách hàng:
              </p>
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs sm:text-sm leading-relaxed whitespace-pre-line',
                  isDark ? 'border-slate-800 bg-slate-800/40 text-slate-100' : 'border-stone-100 bg-stone-50 text-stone-800'
                )}
              >
                {report.description || 'Không có mô tả chi tiết từ người mua.'}
              </div>
            </div>
          </div>
        </div>

        {/* Ảnh / Video bằng chứng từ Người mua */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Ảnh / Video mở hộp của Người mua:</span>
            <span className="font-normal text-stone-400">
              {buyerEvidenceList.length > 0 ? `(${buyerEvidenceList.length} tệp)` : '(Không có)'}
            </span>
          </p>

          {buyerEvidenceList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
              {buyerEvidenceList.map((url, i) => (
                <div key={i}>{renderMediaThumbnail(url, `Bằng chứng người mua ${i + 1}`)}</div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'p-3 rounded-xl border border-dashed text-center text-xs',
                isDark ? 'border-slate-800 text-slate-500' : 'border-stone-200 text-stone-400'
              )}
            >
              Người mua không đính kèm tệp bằng chứng
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: Phản hồi từ Shop */}
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-colors min-w-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <HiOutlineShoppingBag className="h-4 w-4" />
              </div>
              <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-200' : 'text-stone-800')}>
                Phản Hồi & Đối Chất Từ Shop
              </span>
            </div>
            {(report.sellerAction || isReturnDispute) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                {sellerActionLabel}
              </span>
            )}
          </div>

          {/* 1. LỜI GIẢI TRÌNH BAN ĐẦU CỦA SHOP (GIAI ĐOẠN 1) */}
          {initialSellerResponse ? (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
                Ghi chú / Lời giải trình ban đầu của Shop:
              </p>
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs sm:text-sm leading-relaxed whitespace-pre-line',
                  isDark ? 'border-sky-900/40 bg-sky-950/20 text-sky-100' : 'border-sky-100 bg-sky-50/70 text-sky-900'
                )}
              >
                {initialSellerResponse}
              </div>
            </div>
          ) : isNegotiating ? (
            <div
              className={cn(
                'p-4 rounded-xl border border-dashed text-xs leading-relaxed space-y-2',
                isDark ? 'border-amber-500/30 bg-amber-500/5 text-amber-300' : 'border-amber-200 bg-amber-50/60 text-amber-800'
              )}
            >
              <p className="font-bold">⏳ Shop chưa gửi phản hồi xử lý</p>
              <p className="text-[11px] opacity-90">
                Vui lòng chọn một trong các phương án bên dưới để phản hồi khách hàng trong thời hạn 48 giờ.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'p-3 rounded-xl border border-dashed text-center text-xs',
                isDark ? 'border-slate-800 text-slate-500' : 'border-stone-200 text-stone-400'
              )}
            >
              Shop không để lại lời giải trình đối chất ban đầu
            </div>
          )}

          {/* 2. KHIẾU NẠI KIỆN HÀNG HOÀN TRẢ (GIAI ĐOẠN 2 - NẾU CÓ) */}
          {isReturnDispute && (
            <div className="space-y-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-rose-500 uppercase tracking-wide">
                  Khiếu nại kiện hàng hoàn:
                </span>
                {returnInfo?.conditionStatus && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    {getConditionStatusLabel(returnInfo.conditionStatus)}
                  </span>
                )}
              </div>
              {returnDisputeNote && (
                <div
                  className={cn(
                    'p-2.5 rounded-lg border text-xs leading-relaxed whitespace-pre-line',
                    isDark ? 'border-slate-800 bg-slate-900/80 text-rose-200' : 'border-rose-200 bg-white text-rose-900'
                  )}
                >
                  {returnDisputeNote}
                </div>
              )}
              {returnEvidenceList.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-stone-400">
                    Bằng chứng khui kiện hoàn ({returnEvidenceList.length} tệp):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {returnEvidenceList.map((url, i) => (
                      <div key={i}>{renderMediaThumbnail(url, `Bằng chứng kiện hoàn ${i + 1}`, true)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ảnh / Video bằng chứng ban đầu từ Shop */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Ảnh / Video đối soát ban đầu của Shop:</span>
            <span className="font-normal text-stone-400">
              {initialSellerEvidenceList.length > 0 ? `(${initialSellerEvidenceList.length} tệp)` : '(Không có)'}
            </span>
          </p>

          {initialSellerEvidenceList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
              {initialSellerEvidenceList.map((url, i) => (
                <div key={i}>{renderMediaThumbnail(url, `Bằng chứng shop ${i + 1}`)}</div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'p-3 rounded-xl border border-dashed text-center text-xs',
                isDark ? 'border-slate-800 text-slate-500' : 'border-stone-200 text-stone-400'
              )}
            >
              Shop chưa đính kèm tệp bằng chứng đối soát ban đầu
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
