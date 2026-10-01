import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineClipboardCopy,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../lib/cn'
import returnService from '../../../services/returnService'
import { useThemeStore } from '../../../store/useThemeStore'

const RETURN_STATUS_CONFIG = {
  WAITING_FOR_SHIPMENT: {
    label: 'Chờ gửi hàng hoàn',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: HiOutlineClock,
  },
  SHIPPED: {
    label: 'Đang giao hàng hoàn',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: HiOutlineTruck,
  },
  DELIVERED: {
    label: 'Đã giao hàng hoàn',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: HiOutlineCheckCircle,
  },
  RETURNED: {
    label: 'Đã giao hàng hoàn',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: HiOutlineCheckCircle,
  },
  COMPLETED: {
    label: 'Hoàn hàng & Hoàn tiền thành công',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: HiOutlineCheckCircle,
  },
  DISPUTED: {
    label: 'Shop khiếu nại kiện hàng',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    icon: HiOutlineExclamation,
  },
  CANCELLED: {
    label: 'Đã hủy trả hàng',
    color: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/30',
    icon: HiOutlineXCircle,
  },
}

export default function CustomerReturnCard({ returnInfo, isDark: isDarkProp, onRefresh }) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = isDarkProp !== undefined ? isDarkProp : storeTheme === 'dark'
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!returnInfo) return null

  const defaultCarrier = returnInfo.carrierName || 'Giao Hàng Nhanh (GHN)'
  const defaultTracking = returnInfo.returnTrackingCode || `GHN-RET-${returnInfo.id?.substring(0, 8).toUpperCase()}`

  const statusConfig = RETURN_STATUS_CONFIG[returnInfo.status] || {
    label: returnInfo.status,
    color: 'bg-stone-500/10 text-stone-600 border-stone-500/30',
    icon: HiOutlineClock,
  }
  const StatusIcon = statusConfig.icon

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  const handleConfirmReturned = async () => {
    if (!window.confirm('Bạn xác nhận đã hoàn tất giao hàng hoàn cho Shop? Thao tác này sẽ kích hoạt thời hạn 72h để Shop kiểm tra sản phẩm.')) return
    try {
      setSubmitting(true)
      await returnService.confirmReturned(returnInfo.id)
      toast.success('Đã xác nhận hoàn hàng! Shop có 72 giờ để kiểm tra sản phẩm.')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const copyAddress = () => {
    const text = `${returnInfo.returnRecipientName} - ${returnInfo.returnRecipientPhone} - ${returnInfo.returnAddress}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép địa chỉ hoàn hàng')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-5 shadow-sm space-y-4',
        isDark ? 'border-amber-500/30 bg-slate-900/90' : 'border-amber-200 bg-amber-50/40'
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
            statusConfig.color
          )}
        >
          <StatusIcon className="h-4 w-4" />
          {statusConfig.label}
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

          {returnInfo.conditionNote ? (
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700/80 shadow-sm space-y-1.5">
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
        </div>
      )}

      {/* Địa chỉ hoàn hàng của Shop (Snapshot) - Ẩn khi yêu cầu đã hủy */}
      {returnInfo.status !== 'CANCELLED' && (
        <div className={cn('p-3.5 rounded-xl border text-xs space-y-2', isDark ? 'border-slate-800 bg-slate-800/60' : 'border-stone-200 bg-white')}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <HiOutlineLocationMarker className="h-4 w-4" /> Địa chỉ gửi trả hàng về cho Shop:
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
              {copied ? 'Đã sao chép' : 'Sao chép địa chỉ'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <HiOutlineUser className="h-4 w-4 text-stone-400" />
              <span>Người nhận: <strong>{returnInfo.returnRecipientName || 'Chủ gian hàng'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlinePhone className="h-4 w-4 text-stone-400" />
              <span>Số điện thoại: <strong>{returnInfo.returnRecipientPhone || '-'}</strong></span>
            </div>
          </div>
          <p className="text-stone-600 dark:text-slate-300 font-medium">
            Địa chỉ: {returnInfo.returnAddress || 'Theo địa chỉ kho của Shop'}
          </p>
        </div>
      )}

      {/* Timeline deadlines - Chỉ hiển thị khi đang trong tiến trình chưa kết thúc */}
      {returnInfo.status !== 'CANCELLED' && returnInfo.status !== 'COMPLETED' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {returnInfo.buyerShipmentDeadline && (
            <div className={cn('p-3 rounded-xl border flex items-center gap-2.5', isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700')}>
              <HiOutlineClock className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót gửi hàng (3 ngày):</p>
                <p className="font-bold">{formatDateTime(returnInfo.buyerShipmentDeadline)}</p>
              </div>
            </div>
          )}
          {returnInfo.sellerInspectionDeadline && (
            <div className={cn('p-3 rounded-xl border flex items-center gap-2.5', isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700')}>
              <HiOutlineShieldCheck className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót Shop kiểm hàng (72h):</p>
                <p className="font-bold">{formatDateTime(returnInfo.sellerInspectionDeadline)}</p>
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
            isDark
              ? 'border-slate-800 bg-slate-800/80 text-slate-200'
              : 'border-stone-200/90 bg-white text-stone-800'
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                'p-1.5 rounded-lg flex items-center justify-center shrink-0',
                isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-blue-50 text-blue-600 border border-blue-100'
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
              <strong className={cn(
                'font-mono font-bold px-2 py-0.5 rounded-md border text-xs tracking-wider inline-block',
                isDark
                  ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                  : 'text-amber-800 bg-amber-50 border-amber-300'
              )}>
                {returnInfo.returnTrackingCode}
              </strong>
            </span>
          </div>
          {returnInfo.buyerShippedAt && (
            <span className={cn('text-[11px] font-medium flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              <HiOutlineClock className="h-3.5 w-3.5 opacity-70" />
              Bàn giao lúc:{' '}
              <strong className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-stone-700')}>
                {formatDateTime(returnInfo.buyerShippedAt)}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Vận chuyển hoàn tự động qua GHN khi WAITING_FOR_SHIPMENT */}
      {returnInfo.status === 'WAITING_FOR_SHIPMENT' && (
        <div className={cn(
          'p-4 rounded-2xl border space-y-3.5',
          isDark ? 'border-amber-500/30 bg-slate-800/60' : 'border-amber-300 bg-amber-50/50'
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <HiOutlineTruck className="h-4 w-4" /> Đơn vị vận chuyển hoàn hàng chỉ định
            </span>
            <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              Miễn phí (Người bán chịu phí hoàn hàng)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className={cn('p-3 rounded-xl border', isDark ? 'border-slate-700 bg-slate-800/70' : 'border-stone-200 bg-white')}>
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>Đơn vị tiếp nhận bưu kiện:</p>
              <p className={cn('font-bold text-sm mt-0.5 flex items-center gap-2', isDark ? 'text-white' : 'text-stone-900')}>
                <span>{defaultCarrier}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                  isDark ? 'text-amber-400 bg-amber-500/15 border-amber-500/25' : 'text-amber-800 bg-amber-50 border-amber-300'
                )}>
                  Mặc định sàn
                </span>
              </p>
            </div>

            <div className={cn('p-3 rounded-xl border', isDark ? 'border-slate-700 bg-slate-800/70' : 'border-stone-200 bg-white')}>
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>Mã vận đơn thu hồi (Tự động):</p>
              <p className={cn(
                'font-bold font-mono text-sm mt-0.5 px-2 py-0.5 rounded inline-block border',
                isDark ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-300'
              )}>
                {defaultTracking}
              </p>
            </div>
          </div>

          <div className={cn('text-[11px] leading-relaxed space-y-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            <p>• Bưu tá GHN sẽ liên hệ lấy hàng hoàn tại địa chỉ của bạn hoặc bạn có thể gửi kiện hàng tại bưu cục GHN gần nhất.</p>
            <p>• Vui lòng đóng gói sản phẩm cẩn thận trước khi bàn giao cho bưu tá.</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleHandoverToCarrier}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 transition shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <HiOutlineTruck className="h-4 w-4" />
              {submitting ? 'Đang cập nhật...' : 'Xác nhận đã bàn giao hàng cho shipper GHN'}
            </button>
          </div>
        </div>
      )}

      {/* Khi đang giao (SHIPPED): Khách bấm Xác nhận đã giao hàng cho Shop -> Chuyển thẳng sang ĐÃ GIAO (RETURNED) */}
      {returnInfo.status === 'SHIPPED' && (
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-blue-600 dark:text-blue-400">Kiện hàng đang trên đường vận chuyển hoàn</p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
              (Môi trường Sandbox): Khi kiện hàng đã được giao tới địa chỉ của Shop, bạn bấm xác nhận bên dưới để chuyển sang trạng thái <strong>Đã giao</strong> (Shop bắt đầu 72h kiểm hàng).
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmDelivered}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shrink-0 inline-flex items-center gap-1.5"
          >
            <HiOutlineTruck className="h-4 w-4" />
            {submitting ? 'Đang xử lý...' : 'Xác nhận đã giao cho Shop'}
          </button>
        </div>
      )}

      {/* Khi ĐÃ GIAO (RETURNED): Shop đang có 72h kiểm hàng */}
      {(returnInfo.status === 'RETURNED') && (
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 text-xs space-y-1">
          <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <HiOutlineShieldCheck className="h-4 w-4" />
            Đã giao hàng hoàn đến Shop — Shop đang kiểm tra hàng (72 giờ)
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
            Kiện hàng đã được giao thành công cho Shop. Shop đang tiến hành kiểm tra tình trạng hàng hóa. Nếu hàng nguyên vẹn, sàn sẽ hoàn 100% tiền về ví của bạn. Nếu sau 72h Shop không phản hồi, hệ thống sẽ tự động hoàn tiền cho bạn.
          </p>
        </div>
      )}

      {/* Khi DISPUTED */}
      {returnInfo.status === 'DISPUTED' && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs space-y-2">
          <p className="font-bold text-rose-600 dark:text-rose-400">Shop đã gửi khiếu nại về kiện hàng hoàn</p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
            Shop báo cáo hàng hoàn có vấn đề (Tình trạng: <strong>{returnInfo.conditionStatus}</strong> - Ghi chú: <em>{returnInfo.conditionNote || 'Không có'}</em>). Ban Quản Trị đang can thiệp phân xử và sẽ ra phán quyết hoàn tiền hoặc bồi thường sớm nhất.
          </p>
          {returnInfo.sellerEvidenceUrls && (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] font-semibold text-rose-500">Ảnh bằng chứng do Shop cung cấp:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {returnInfo.sellerEvidenceUrls.split(',').filter(Boolean).map((url, i) => (
                  <a
                    key={i}
                    href={url.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className="relative rounded-xl border border-rose-300 dark:border-rose-900/50 overflow-hidden h-20 bg-stone-900/10 block group"
                  >
                    <img src={url.trim()} alt={`Bằng chứng ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Khi COMPLETED */}
      {returnInfo.status === 'COMPLETED' && (() => {
        const s = returnInfo.settlement
        const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ'
        if (s && s.settlementType) {
          if (s.settlementType === 'PARTIAL_SPLIT') {
            return (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Phân xử chia tiền: Khách {s.buyerPercentage}% — Shop {s.sellerPercentage}%
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Number(s.buyerRefundAmount) > 0 && (
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[11px] text-blue-500 font-medium">Hoàn về ví bạn ({s.buyerPercentage}%)</p>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {formatVND(s.buyerRefundAmount)}
                      </p>
                    </div>
                  )}
                  {Number(s.sellerReleaseAmount) > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[11px] text-emerald-500 font-medium">Shop nhận ({s.sellerPercentage}%)</p>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatVND(s.sellerReleaseAmount)}
                      </p>
                    </div>
                  )}
                </div>
                {s.settlementNote && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                    &ldquo;{s.settlementNote}&rdquo;
                  </p>
                )}
              </div>
            )
          }
          if (s.settlementType === 'FULL_REFUND') {
            return (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  Hoàn tiền thành công
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                  Số tiền <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVND(s.buyerRefundAmount)}</span> đã được hoàn trả về Ví số dư của bạn.
                </p>
              </div>
            )
          }
          // FULL_RELEASE: seller nhận hết, buyer không được refund
          return (
            <div className="p-3 rounded-xl border border-stone-300/50 bg-stone-50 dark:bg-slate-800/30 dark:border-slate-700/50 text-xs space-y-1">
              <p className="font-bold text-stone-700 dark:text-slate-300">
                Hoàn tất — Giải ngân cho Shop
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                Sau khi xem xét, Ban Quản Trị đã giải ngân toàn bộ cho Shop. Không có khoản hoàn tiền cho đơn này.
              </p>
            </div>
          )
        }
        // Fallback khi chưa có settlement data (backward compatibility)
        return (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">Hoàn tất</p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
              Quy trình hoàn hàng đã hoàn tất thành công.
            </p>
          </div>
        )
      })()}
    </motion.div>
  )
}
