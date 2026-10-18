import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../lib/cn'
import returnService from '../../../services/returnService'
import { useThemeStore } from '../../../store/useThemeStore'
import { isVideoUrl } from '../../../lib/mediaUtils'
import {
  getReturnStatusBadge,
  getReturnStatusLabel,
  getConditionStatusLabel,
  formatOrderDate,
} from '../../../lib/orderStatus'
import ReturnAddressSnapshot from './ReturnAddressSnapshot'
import ReturnHandoverSection from './ReturnHandoverSection'
import ReturnSettlementSection from './ReturnSettlementSection'

export default function CustomerReturnCard({ returnInfo, order, isDark: isDarkProp, onRefresh }) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = isDarkProp !== undefined ? isDarkProp : storeTheme === 'dark'
  const [submitting, setSubmitting] = useState(false)

  if (!returnInfo) return null

  const isOrderRefunded = order?.status === 'REFUNDED'
  const isOrderCompleted = order?.status === 'COMPLETED'
  const isSettled = isOrderRefunded || isOrderCompleted || returnInfo.status === 'COMPLETED'

  const defaultCarrier = returnInfo.carrierName || 'Giao Hàng Nhanh (GHN)'
  const defaultTracking =
    returnInfo.returnTrackingCode || `GHN-RET-${returnInfo.id?.substring(0, 8).toUpperCase()}`

  const parseEvidenceUrls = (str) => {
    if (!str || typeof str !== 'string') return []
    return str.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const renderEvidenceGrid = (urlsString, title = 'Ảnh / Video bằng chứng từ Người bán:') => {
    const list = parseEvidenceUrls(urlsString)
    if (!list.length) return null

    return (
      <div className="pt-2.5 space-y-1.5 border-t border-stone-200/80 dark:border-slate-700/60">
        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <HiOutlinePhotograph className="h-4 w-4" />
          {title} ({list.length} tệp)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {list.map((url, i) => {
            const isVid = isVideoUrl(url)
            return isVid ? (
              <div
                key={i}
                className="relative rounded-xl border border-rose-300 dark:border-rose-800 overflow-hidden h-24 bg-black flex flex-col justify-center shadow-xs"
              >
                <video src={url} controls className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white uppercase pointer-events-none flex items-center gap-0.5">
                  <HiOutlineVideoCamera className="h-2.5 w-2.5" />
                  Video
                </div>
              </div>
            ) : (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="relative rounded-xl border border-rose-300 dark:border-rose-800/80 overflow-hidden h-24 bg-stone-900/10 block group shadow-xs"
                title="Bấm để xem ảnh phóng to"
              >
                <img
                  src={url}
                  alt={`Bằng chứng Shop ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <HiOutlineExternalLink className="h-4 w-4 text-white" />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

  // Nếu đơn hàng đã có phán quyết cuối cùng hoàn tiền, hiển thị trạng thái hoàn tất thành công (xanh)
  const returnBadge = isOrderRefunded
    ? {
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
        icon: HiOutlineCheckCircle,
      }
    : getReturnStatusBadge(returnInfo.status)
  const StatusIcon = returnBadge.icon
  const statusLabel = isOrderRefunded
    ? 'Đã hoàn tất đổi trả & Hoàn tiền'
    : getReturnStatusLabel(returnInfo.status)

  const handleHandoverToCarrier = async () => {
    if (!returnInfo?.id) {
      toast.error('Không tìm thấy thông tin hoàn hàng')
      return
    }
    try {
      setSubmitting(true)
      await returnService.submitTracking(returnInfo.id, {
        carrierName: defaultCarrier,
        returnTrackingCode: defaultTracking,
      })
      toast.success('Đã xác nhận bàn giao hàng cho shipper GHN!')
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Handover tracking error:', err)
      toast.error(err?.message || 'Không thể cập nhật trạng thái bàn giao')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelivered = async () => {
    if (!window.confirm('Xác nhận kiện hàng hoàn đã được bưu tá giao tới địa chỉ của Shop?')) return
    try {
      setSubmitting(true)
      await returnService.confirmDelivered(returnInfo.id)
      toast.success('Đã cập nhật trạng thái kiện hàng đến nơi!')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-5 shadow-sm space-y-4',
        isDark ? 'border-amber-500/30 bg-slate-900/90' : 'border-amber-200 bg-amber-50/40',
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
            <HiOutlineTruck className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn('text-sm sm:text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Quy Trình Trả Hàng & Hoàn Tiền (Return & Refund)
            </h3>
            <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Mã yêu cầu hoàn: <span className="font-mono font-semibold">{returnInfo.id?.substring(0, 8)}...</span>
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm',
            returnBadge.color,
          )}
        >
          <StatusIcon className="h-4 w-4" />
          {statusLabel}
        </span>
      </div>

      {/* Khi CANCELLED: Đã hủy trả hàng & Phán quyết của Ban Quản Trị */}
      {returnInfo.status === 'CANCELLED' && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 text-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0">
              <HiOutlineXCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-rose-600 dark:text-rose-400">
                Yêu cầu trả hàng & hoàn tiền đã bị hủy
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                Quy trình hoàn hàng đã kết thúc. Doanh thu đơn hàng được giải ngân cho Người bán theo phán quyết của Ban Quản Trị.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700/80 shadow-sm space-y-2">
            {returnInfo.conditionStatus && (
              <div className="flex items-center gap-2 pb-1.5 border-b border-stone-100 dark:border-slate-700/60">
                <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400">Tình trạng Shop ghi nhận:</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {getConditionStatusLabel(returnInfo.conditionStatus)}
                </span>
              </div>
            )}

            {returnInfo.conditionNote ? (
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineExclamation className="h-4 w-4" />
                  Lý do & Phán quyết từ Ban Quản Trị / Hệ thống:
                </p>
                <p className="text-xs font-semibold text-stone-800 dark:text-slate-200 leading-relaxed pl-5 whitespace-pre-line">
                  {returnInfo.conditionNote}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                Yêu cầu trả hàng của bạn đã bị hủy hoặc không được chấp thuận.
              </p>
            )}

            {/* Bằng chứng Shop đưa ra - Dù shop thắng khách hàng vẫn xem được đầy đủ */}
            {returnInfo.sellerEvidenceUrls && renderEvidenceGrid(
              returnInfo.sellerEvidenceUrls,
              'Bằng chứng đối soát do Shop cung cấp (Ảnh / Video mở hộp kiện hoàn):'
            )}
          </div>
        </div>
      )}

      {/* Địa chỉ hoàn hàng của Shop (Snapshot) */}
      <ReturnAddressSnapshot returnInfo={returnInfo} isDark={isDark} />

      {/* Timeline deadlines (chỉ hiển thị khi đơn chưa kết thúc) */}
      {!isSettled && returnInfo.status !== 'CANCELLED' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {returnInfo.buyerShipmentDeadline && (
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center gap-2.5',
                isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700',
              )}
            >
              <HiOutlineClock className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót gửi hàng (3 ngày):</p>
                <p className="font-bold">{formatOrderDate(returnInfo.buyerShipmentDeadline)}</p>
              </div>
            </div>
          )}
          {returnInfo.sellerInspectionDeadline && (
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center gap-2.5',
                isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700',
              )}
            >
              <HiOutlineShieldCheck className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót Shop kiểm hàng (72h):</p>
                <p className="font-bold">{formatOrderDate(returnInfo.sellerInspectionDeadline)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thông tin vận đơn khi đã gửi hàng */}
      {returnInfo.returnTrackingCode && returnInfo.status !== 'WAITING_FOR_SHIPMENT' && (
        <div
          className={cn(
            'p-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-800/80 text-slate-200' : 'border-stone-200/90 bg-white text-stone-800',
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                'p-1.5 rounded-lg flex items-center justify-center shrink-0',
                isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-blue-50 text-blue-600 border border-blue-100',
              )}
            >
              <HiOutlineTruck className="h-4 w-4" />
            </span>
            <span className={cn('text-xs font-medium', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Đơn vị:{' '}
              <strong className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                {returnInfo.carrierName || 'Giao Hàng Nhanh (GHN)'}
              </strong>
            </span>
            <span className={cn('select-none font-bold', isDark ? 'text-slate-600' : 'text-stone-300')}>•</span>
            <span className={cn('text-xs font-medium', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Mã vận đơn:{' '}
              <strong
                className={cn(
                  'font-mono font-bold px-2 py-0.5 rounded-md border text-xs tracking-wider inline-block',
                  isDark ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-300',
                )}
              >
                {returnInfo.returnTrackingCode}
              </strong>
            </span>
          </div>
          {returnInfo.buyerShippedAt && (
            <span className={cn('text-[11px] font-medium flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              <HiOutlineClock className="h-3.5 w-3.5 opacity-70" />
              Bàn giao lúc:{' '}
              <strong className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-stone-700')}>
                {formatOrderDate(returnInfo.buyerShippedAt)}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Vận chuyển hoàn GHN & Xác nhận bàn giao (chỉ hiện khi chưa hoàn tất) */}
      {!isSettled && (
        <ReturnHandoverSection
          returnInfo={returnInfo}
          isDark={isDark}
          submitting={submitting}
          defaultCarrier={defaultCarrier}
          defaultTracking={defaultTracking}
          onHandoverToCarrier={handleHandoverToCarrier}
          onConfirmDelivered={handleConfirmDelivered}
        />
      )}

      {/* Khi DISPUTED: Kiểm tra nếu đã có phán quyết cuối cùng hoàn tiền */}
      {returnInfo.status === 'DISPUTED' && (
        isOrderRefunded ? (
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                <HiOutlineCheckCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  Phán quyết cuối cùng từ Ban Quản Trị: Chấp thuận hoàn 100% tiền cho bạn
                </p>
                <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-0.5">
                  Khiếu nại kiện hàng hoàn đã được Ban Quản Trị giải quyết dứt điểm. Tiền ký quỹ đã được hoàn trả 100% về Ví tài khoản của Quý khách.
                </p>
              </div>
            </div>

            {returnInfo.conditionStatus && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700/80 text-stone-700 dark:text-slate-300 space-y-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-stone-600 dark:text-slate-300">
                    Khiếu nại kiện hàng hoàn từ phía Shop (đã được Ban Quản Trị bác bỏ):
                  </p>
                  <div className="text-xs text-stone-600 dark:text-slate-400 space-y-0.5 pl-2">
                    <p>
                      • Tình trạng Shop khiếu nại:{' '}
                      <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                        {getConditionStatusLabel(returnInfo.conditionStatus)}
                      </strong>
                    </p>
                    {returnInfo.conditionNote && (
                      <p>
                        • Ghi chú lý do của Shop:{' '}
                        <em className="text-stone-800 dark:text-slate-200 font-medium">
                          &ldquo;{returnInfo.conditionNote}&rdquo;
                        </em>
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic pt-0.5">
                    ✓ Ban Quản Trị đã thẩm định và bác bỏ khiếu nại của Shop do không đủ cơ sở đối soát. Toàn bộ tiền đơn hàng đã được giải phóng về Ví của Quý khách.
                  </p>
                </div>
                {returnInfo.sellerEvidenceUrls && renderEvidenceGrid(
                  returnInfo.sellerEvidenceUrls,
                  'Ảnh / Video bằng chứng Shop đã gửi đối soát:'
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs space-y-2">
            <p className="font-bold text-rose-600 dark:text-rose-400">Shop đã gửi khiếu nại về kiện hàng hoàn</p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
              Shop báo cáo hàng hoàn có vấn đề (Tình trạng: <strong>{getConditionStatusLabel(returnInfo.conditionStatus)}</strong>{returnInfo.conditionNote ? ` — Ghi chú của Shop: "${returnInfo.conditionNote}"` : ''}). Ban Quản Trị đang can thiệp phân xử và sẽ ra phán quyết hoàn tiền hoặc bồi thường sớm nhất.
            </p>
            {returnInfo.sellerEvidenceUrls && renderEvidenceGrid(
              returnInfo.sellerEvidenceUrls,
              'Ảnh / Video bằng chứng do Shop cung cấp:'
            )}
          </div>
        )
      )}

      {/* Khi COMPLETED */}
      {returnInfo.status === 'COMPLETED' && (
        <ReturnSettlementSection settlement={returnInfo.settlement} />
      )}
    </motion.div>
  )
}
