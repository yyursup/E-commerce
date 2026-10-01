import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlinePhotograph,
  HiOutlineArchive,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import returnService from '../../../../services/returnService'
import { useThemeStore } from '../../../../store/useThemeStore'
import fileService from '../../../../services/fileService'

const RETURN_STATUS_MAP = {
  WAITING_FOR_SHIPMENT: {
    label: 'Khách đang chuẩn bị gửi hàng (Hạn 3 ngày)',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    icon: HiOutlineClock,
  },
  SHIPPED: {
    label: 'Đang giao hàng hoàn',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    icon: HiOutlineTruck,
  },
  DELIVERED: {
    label: 'Đã giao hàng hoàn trả',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    icon: HiOutlineCheckCircle,
  },
  RETURNED: {
    label: 'Đã giao hàng hoàn trả',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    icon: HiOutlineCheckCircle,
  },
  COMPLETED: {
    label: 'Đã hoàn tiền',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    icon: HiOutlineCheckCircle,
  },
  DISPUTED: {
    label: 'Shop đang khiếu nại kiện hàng',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    icon: HiOutlineExclamation,
  },
  CANCELLED: {
    label: 'Đã hủy trả hàng (Khách không gửi)',
    color: 'bg-stone-500/10 text-stone-500 border-stone-500/30',
    icon: HiOutlineXCircle,
  },
}

export default function SellerReturnSection({ returnInfo, isDark: isDarkProp, onRefresh }) {
  const storeTheme = useThemeStore((s) => s.theme)
  const isDark = isDarkProp !== undefined ? isDarkProp : storeTheme === 'dark'
  const [submitting, setSubmitting] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  // Form Complete
  const [conditionNote, setConditionNote] = useState('')
  const [isRestocked, setIsRestocked] = useState(true)

  // Form Dispute
  const [disputeCondition, setDisputeCondition] = useState('DAMAGED')
  const [disputeNote, setDisputeNote] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  if (!returnInfo) return null

  const statusConfig = RETURN_STATUS_MAP[returnInfo.status] || {
    label: returnInfo.status,
    color: 'bg-stone-500/10 text-stone-500 border-stone-500/30',
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

  const isVideoFile = (file) => {
    return file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
  }

  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const MAX_FILES = 4
    const remainingSlots = MAX_FILES - evidenceUrls.length

    if (remainingSlots <= 0) {
      toast.error('Chỉ được tải lên tối đa 4 tệp bằng chứng (ảnh / video)!')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const validFiles = []
    for (const file of files) {
      const isVid = isVideoFile(file)
      const maxSize = isVid ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`Tệp "${file.name}" vượt quá dung lượng tối đa (${isVid ? '50MB cho video' : '10MB cho ảnh'})!`)
      } else {
        validFiles.push(file)
      }
    }

    if (!validFiles.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    let filesToUpload = validFiles
    if (validFiles.length > remainingSlots) {
      toast.error(`Chỉ được tải tối đa ${MAX_FILES} tệp. Hệ thống sẽ xử lý ${remainingSlots} tệp hợp lệ đầu tiên.`)
      filesToUpload = validFiles.slice(0, remainingSlots)
    }

    try {
      setUploadingImage(true)
      const uploaded = []
      for (const file of filesToUpload) {
        const res = await fileService.uploadFile(file, 'returns')
        const uploadedUrl = res?.url || res?.data?.url
        if (uploadedUrl) {
          uploaded.push(uploadedUrl)
        }
      }

      if (uploaded.length > 0) {
        setEvidenceUrls((prev) => [...prev, ...uploaded])
        toast.success(`Đã tải lên ${uploaded.length} tệp chứng từ thành công!`)
      } else {
        toast.error('Không nhận được liên kết tệp từ máy chủ.')
      }
    } catch (err) {
      console.error('Upload evidence error:', err)
      toast.error(err?.message || 'Tải tệp thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCompleteReturn = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await returnService.completeReturn(returnInfo.id, {
        conditionStatus: 'INTACT',
        conditionNote: conditionNote.trim() || 'Hàng hoàn nguyên vẹn',
        isRestocked,
      })
      toast.success(
        isRestocked
          ? 'Đã duyệt nhận hàng hoàn, hoàn tiền cho khách & cộng lại tồn kho!'
          : 'Đã duyệt nhận hàng hoàn & hoàn tiền cho khách!'
      )
      setShowCompleteModal(false)
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Thao tác hoàn tất thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisputeReturn = async (e) => {
    e.preventDefault()
    if (!disputeNote.trim()) {
      toast.error('Vui lòng nhập chi tiết sự cố kiện hàng hoàn')
      return
    }
    try {
      setSubmitting(true)
      await returnService.disputeReturn(returnInfo.id, {
        conditionStatus: disputeCondition,
        conditionNote: disputeNote.trim(),
        sellerEvidenceUrls: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
      })
      toast.success('Đã gửi khiếu nại kiện hàng hoàn lên Ban Quản Trị!')
      setShowDisputeModal(false)
      setDisputeNote('')
      setEvidenceUrls([])
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Gửi khiếu nại thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        'border-b p-6 space-y-4',
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50/50'
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
            <HiOutlineTruck className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn('text-sm sm:text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Quy Trình Hoàn Hàng Của Khách (Return Management)
            </h3>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Mã yêu cầu hoàn: <span className="font-mono font-bold">{returnInfo.id}</span>
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

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Vận đơn khách gửi */}
        <div className={cn('p-3.5 rounded-2xl border space-y-2', isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-white text-stone-800')}>
          <span className="font-bold text-amber-500 uppercase tracking-wider text-[11px] block">
            Thông tin vận chuyển hoàn:
          </span>
          <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
            Đơn vị vận chuyển:{' '}
            <strong className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              {returnInfo.carrierName || 'Chưa cập nhật'}
            </strong>
          </p>
          <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
            Mã vận đơn:{' '}
            <strong className={cn(
              'font-mono font-bold px-2 py-0.5 rounded border text-xs inline-block',
              isDark
                ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                : 'text-amber-800 bg-amber-50 border-amber-300'
            )}>
              {returnInfo.returnTrackingCode || 'Chờ khách nộp mã...'}
            </strong>
          </p>
          {returnInfo.buyerShippedAt && (
            <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Khách gửi lúc:{' '}
              <strong className={cn('font-medium', isDark ? 'text-slate-200' : 'text-stone-700')}>
                {formatDateTime(returnInfo.buyerShippedAt)}
              </strong>
            </p>
          )}
        </div>

        {/* Hạn chót kiểm tra 72h */}
        <div className={cn('p-3.5 rounded-2xl border space-y-1.5', isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700')}>
          <span className="font-bold text-purple-500 uppercase tracking-wider text-[11px] block">
            Thời hạn kiểm tra hàng (72 Giờ):
          </span>
          <p>Hạn chót Shop kiểm hàng: <strong>{formatDateTime(returnInfo.sellerInspectionDeadline)}</strong></p>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            * Sau 72h kể từ khi nhận hàng hoàn, nếu Shop không phản hồi, hệ thống sẽ tự động hoàn tiền cho Khách (không tự động hoàn kho).
          </p>
        </div>
      </div>

      {/* Action buttons khi RETURNED */}
      {returnInfo.status === 'RETURNED' && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowCompleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <HiOutlineCheckCircle className="h-4 w-4" />
            <span>Xác Nhận Hàng Nguyên Vẹn & Hoàn Tiền (Hoàn Kho)</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowDisputeModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 transition-all active:scale-95 disabled:opacity-50"
          >
            <HiOutlineExclamation className="h-4 w-4" />
            <span>Khiếu Nại Kiện Hàng Hoàn (Hàng hỏng / Tráo hàng)</span>
          </button>
        </div>
      )}

      {/* DISPUTED Info */}
      {returnInfo.status === 'DISPUTED' && (
        <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs space-y-2">
          <p className="font-bold text-rose-600 dark:text-rose-400">
            ⚠️ Shop đã khiếu nại kiện hàng hoàn
          </p>
          <p className="text-stone-600 dark:text-slate-300">
            Tình trạng: <strong>{returnInfo.conditionStatus}</strong> • Ghi chú: <em>{returnInfo.conditionNote}</em>
          </p>
          {returnInfo.sellerEvidenceUrls && (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">Ảnh chứng từ đã nộp:</span>
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
          <p className="text-[11px] text-stone-500 dark:text-slate-400">
            Hồ sơ đang được Ban Quản Trị xem xét và phân xử giải ngân hoặc bồi thường theo quy định sàn.
          </p>
        </div>
      )}

      {/* COMPLETED Settlement Info */}
      {returnInfo.status === 'COMPLETED' && (() => {
        const s = returnInfo.settlement
        const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ'
        if (s && s.settlementType) {
          if (s.settlementType === 'PARTIAL_SPLIT') {
            return (
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Phân xử chia tiền: Khách {s.buyerPercentage}% — Shop {s.sellerPercentage}%
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {Number(s.sellerReleaseAmount) > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[11px] text-emerald-500 font-medium">Shop nhận ({s.sellerPercentage}%)</p>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatVND(s.sellerReleaseAmount)}
                      </p>
                    </div>
                  )}
                  {Number(s.buyerRefundAmount) > 0 && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[11px] text-blue-500 font-medium">Hoàn cho Khách ({s.buyerPercentage}%)</p>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {formatVND(s.buyerRefundAmount)}
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
          if (s.settlementType === 'FULL_RELEASE') {
            return (
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Giải ngân thành công</p>
                <p className="text-stone-600 dark:text-slate-300">
                  Số tiền <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVND(s.sellerReleaseAmount)}</span> (sau phí hoa hồng sàn) đã được cộng vào ví Shop.
                </p>
              </div>
            )
          }
          // FULL_REFUND
          return (
            <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-xs space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400">Đã hoàn tiền cho Khách</p>
              <p className="text-stone-600 dark:text-slate-300">
                Toàn bộ tiền đơn hàng đã được hoàn trả cho Người mua theo phán quyết của Ban Quản Trị.
              </p>
            </div>
          )
        }
        return (
          <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">Hoàn tất</p>
            <p className="text-stone-600 dark:text-slate-300 mt-0.5">Quy trình hoàn hàng đã kết thúc.</p>
          </div>
        )
      })()}

      {/* MODAL 1: COMPLETE RETURN */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200 dark:border-slate-800">
                <HiOutlineCheckCircle className="h-6 w-6 text-emerald-500" />
                <h3 className="text-base font-bold">Xác Nhận Hàng Hoàn Hợp Lệ</h3>
              </div>

              <form onSubmit={handleCompleteReturn} className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Xác nhận kiện hàng hoàn đã về kho nguyên vẹn. Hệ thống sẽ giải ngân hoàn tiền 100% về ví của người mua.
                </div>

                <div>
                  <label className="block font-medium mb-1">Ghi chú kiểm tra hàng:</label>
                  <textarea
                    rows={2}
                    value={conditionNote}
                    onChange={(e) => setConditionNote(e.target.value)}
                    placeholder="VD: Hàng còn nguyên tem mác, phụ kiện đầy đủ..."
                    className={cn(
                      'w-full rounded-xl border p-2.5 outline-none',
                      isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white'
                    )}
                  />
                </div>

                {/* Checkbox Restock */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRestocked}
                    onChange={(e) => setIsRestocked(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500"
                  />
                  <div>
                    <span className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <HiOutlineArchive className="h-4 w-4" /> Tự động hoàn lại số lượng tồn kho (Restock)
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      Nếu chọn, hệ thống sẽ cộng lại số lượng các sản phẩm trong đơn vào kho và lưu nhật ký kiểm toán kho hàng (REFUND_RESTORE).
                    </p>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác Nhận & Hoàn Tiền'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DISPUTE RETURN */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl space-y-4',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200 dark:border-slate-800">
                <HiOutlineExclamation className="h-6 w-6 text-rose-500" />
                <h3 className="text-base font-bold">Khiếu Nại Kiện Hàng Hoàn</h3>
              </div>

              <form onSubmit={handleDisputeReturn} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Tình trạng thực tế kiện hàng:</label>
                  <select
                    value={disputeCondition}
                    onChange={(e) => setDisputeCondition(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border p-2.5 outline-none font-bold',
                      isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white'
                    )}
                  >
                    <option value="DAMAGED">Hàng bị vỡ / hỏng hóc nghiêm trọng (DAMAGED)</option>
                    <option value="WRONG_ITEM">Bị tráo hàng / Sai sản phẩm (WRONG_ITEM)</option>
                    <option value="EMPTY_BOX">Hộp rỗng / Thiếu linh kiện (EMPTY_BOX)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Mô tả chi tiết bằng chứng (*):</label>
                  <textarea
                    rows={3}
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    placeholder="Mô tả hiện trạng kiện hàng khi mở hộp, dấu vết mở gói..."
                    className={cn(
                      'w-full rounded-xl border p-2.5 outline-none',
                      isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white'
                    )}
                  />
                </div>

                {/* Upload hình ảnh và video chứng từ mở hộp (Tối đa 4 tệp) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold">
                      Ảnh & Video bằng chứng mở hộp ({evidenceUrls.length}/4)
                    </label>
                    <span className="text-[11px] text-stone-400">Tối đa 4 tệp (Ảnh ≤ 10MB, Video ≤ 50MB)</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      {evidenceUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-24 sm:h-28 bg-stone-900/10"
                        >
                          {isVideoUrl(url) ? (
                            <video
                              src={url}
                              controls
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Bằng chứng ${idx + 1}`}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                              title={isVideoUrl(url) ? 'Mở video' : 'Xem ảnh gốc'}
                            >
                              <HiOutlineExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow"
                              title="Gỡ tệp"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {evidenceUrls.length >= 4 ? (
                    <div
                      className={cn(
                        'w-full border border-dashed rounded-2xl p-3 text-center transition-colors',
                        isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-500'
                      )}
                    >
                      <span className="text-xs font-medium">Đã đạt giới hạn tối đa 4/4 ảnh chứng từ</span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors',
                        uploadingImage ? 'opacity-50 pointer-events-none' : '',
                        isDark
                          ? 'border-slate-700 hover:border-amber-500 bg-slate-800/50'
                          : 'border-stone-300 hover:border-amber-500 bg-stone-50'
                      )}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-1">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
                          <span className="text-xs font-semibold text-amber-500">Đang tải ảnh lên máy chủ...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                          <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                            <HiOutlineUpload className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold">
                            {evidenceUrls.length > 0 ? '+ Thêm ảnh chứng từ khác' : 'Bấm để tải ảnh chứng từ mở hộp'}
                          </span>
                          <span className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 4 ảnh, 10MB / ảnh)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisputeModal(false)
                      setDisputeNote('')
                      setEvidenceUrls([])
                    }}
                    className="px-4 py-2 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingImage}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Đang gửi...' : 'Nộp Đơn Khiếu Nại BQT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
