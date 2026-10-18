import {
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineScale,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { getConditionStatusLabel } from '../../../../lib/orderStatus'

export default function SellerReturnDisputeBanner({
  returnInfo,
  isOrderRefunded,
  isVideoUrl,
  report,
}) {
  if (returnInfo.status !== 'DISPUTED') return null

  const conditionText = getConditionStatusLabel(returnInfo.conditionStatus)

  if (isOrderRefunded) {
    return (
      <div className="p-4 rounded-2xl border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/40 text-xs space-y-2.5">
        <div className="flex items-center gap-2 text-stone-700 dark:text-slate-200 font-bold text-sm">
          <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>Phán quyết cuối cùng từ Ban Quản Trị: Chấp thuận hoàn 100% tiền cho Người mua</span>
        </div>
        <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
          Ban Quản Trị đã hoàn tất xem xét hồ sơ và ban hành phán quyết cuối cùng: Bác bỏ khiếu nại kiện hàng hoàn của Shop và giải phóng toàn bộ tiền ký quỹ đơn hàng cho Người mua. Tranh chấp đơn hàng đã chính thức khép lại.
        </p>

        {(report?.policyClauseTitle || report?.policyClauseCode) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <HiOutlineScale className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>⚖️ Căn cứ Điều khoản: <strong>{report.policyClauseTitle || report.policyClauseCode}</strong></span>
          </div>
        )}
        {report?.adminNote && (
          <p className="text-xs italic text-stone-600 dark:text-slate-300">
            Ghi chú phán quyết BQT: &ldquo;{report.adminNote}&rdquo;
          </p>
        )}

        {returnInfo.conditionStatus && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 space-y-1.5">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
              Khiếu nại Shop đã gửi đối soát: <strong className="text-amber-600 dark:text-amber-400">{conditionText}</strong>
              {returnInfo.conditionNote && <span> — Ghi chú của Shop: <em>&ldquo;{returnInfo.conditionNote}&rdquo;</em></span>}
            </p>
            {returnInfo.sellerEvidenceUrls && (
              <div className="pt-1 space-y-1">
                <span className="text-[10px] font-medium text-stone-400 dark:text-slate-500">Ảnh / Video chứng từ Shop đã gửi:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {returnInfo.sellerEvidenceUrls.split(',').filter(Boolean).map((url, i) => {
                    const isVid = isVideoUrl(url.trim())
                    return (
                      <a
                        key={i}
                        href={url.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="relative rounded-xl border border-stone-200 dark:border-slate-700 overflow-hidden h-20 bg-stone-900/10 block group shadow-xs"
                      >
                        {isVid ? (
                          <video src={url.trim()} className="w-full h-full object-cover group-hover:scale-105 transition-transform" muted />
                        ) : (
                          <img src={url.trim()} alt={`Bằng chứng ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2.5 text-xs">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
        <HiOutlineExclamation className="h-4 w-4" />
        <span>Hồ sơ khiếu nại đang được Ban Quản Trị xem xét phân xử</span>
      </div>
      <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
        Tình trạng báo cáo: <strong>{conditionText}</strong>.
        {returnInfo.conditionNote ? ` Ghi chú của Shop: "${returnInfo.conditionNote}".` : ''}
        Tiền ký quỹ tạm thời bị giữ an toàn (HELD / DISPUTED) cho đến khi có phán quyết cuối cùng từ BQT.
      </p>

      {returnInfo.sellerEvidenceUrls && (
        <div className="pt-1 space-y-1">
          <span className="text-[11px] font-semibold text-rose-500">Bằng chứng Shop đã cung cấp:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {returnInfo.sellerEvidenceUrls.split(',').filter(Boolean).map((url, i) => {
              const isVid = isVideoUrl(url.trim())
              return (
                <a
                  key={i}
                  href={url.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="relative rounded-xl border border-rose-300 dark:border-rose-900/50 overflow-hidden h-20 bg-stone-900/10 block group shadow-xs"
                >
                  {isVid ? (
                    <video src={url.trim()} className="w-full h-full object-cover group-hover:scale-105 transition-transform" muted />
                  ) : (
                    <img src={url.trim()} alt={`Bằng chứng ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
