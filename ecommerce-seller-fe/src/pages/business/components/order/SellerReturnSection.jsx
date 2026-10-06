import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlinePhotograph,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import returnService from '../../../../services/returnService'
import { useThemeStore } from '../../../../store/useThemeStore'
import fileService from '../../../../services/fileService'
import {
  getReturnStatusBadge,
  getReturnStatusLabel,
  formatOrderDate,
  formatOrderCurrency,
} from '../../../../lib/orderStatus'
import SellerReturnCompleteModal from './SellerReturnCompleteModal'
import SellerReturnDisputeModal from './SellerReturnDisputeModal'

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

  const statusBadge = getReturnStatusBadge(returnInfo.status)
  const StatusIcon = statusBadge?.icon
  const statusLabel = getReturnStatusLabel(returnInfo.status)

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

  const handleSubmitComplete = async () => {
    try {
      setSubmitting(true)
      await returnService.completeReturn(returnInfo.id, {
        conditionStatus: 'INTACT',
        conditionNote: conditionNote.trim() || undefined,
        isRestocked,
      })
      toast.success('Đã xác nhận kiểm tra đạt và hoàn tất thủ tục trả hàng!')
      setShowCompleteModal(false)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Complete return error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xác nhận hoàn tiền')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitDispute = async () => {
    if (!disputeNote.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết lý do khiếu nại kiện hàng!')
      return
    }
    if (!evidenceUrls.length) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh/video bằng chứng rõ nét!')
      return
    }

    try {
      setSubmitting(true)
      await returnService.disputeReturn(returnInfo.id, {
        conditionStatus: disputeCondition,
        conditionNote: disputeNote.trim(),
        sellerEvidenceUrls: evidenceUrls.join(','),
      })
      toast.success('Đã nộp khiếu nại kiện hàng thành công! BQT sẽ sớm phân xử.')
      setShowDisputeModal(false)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Dispute return error:', err)
      toast.error(err?.message || 'Không thể gửi khiếu nại')
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
              Xử Lý Yêu Cầu Trả Hàng & Hoàn Tiền (Return Processing)
            </h3>
            <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Mã yêu cầu: <span className="font-mono font-semibold">{returnInfo.id?.substring(0, 8)}...</span>
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm',
            statusBadge.color,
          )}
        >
          {StatusIcon && <StatusIcon className="h-4 w-4" />}
          {statusLabel}
        </span>
      </div>

      {/* Khi CANCELLED: Khách hàng không gửi hàng quá 3 ngày hoặc đã hủy */}
      {returnInfo.status === 'CANCELLED' && (
        <div className="p-4 rounded-2xl border border-stone-300 dark:border-slate-700 bg-stone-100/70 dark:bg-slate-800/40 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <HiOutlineXCircle className="h-5 w-5 text-stone-500" />
            <p className="font-bold text-sm text-stone-700 dark:text-slate-300">
              Yêu cầu trả hàng đã bị hủy bỏ
            </p>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed pl-7">
            Khách hàng không thực hiện gửi hàng hoàn trong thời hạn 3 ngày theo quy định sàn hoặc yêu cầu đã được Ban Quản Trị hủy. Doanh thu đơn hàng đã được giải ngân an toàn về ví gian hàng của bạn.
          </p>
        </div>
      )}

      {/* Hạn chót & Thông tin vận chuyển */}
      {returnInfo.status !== 'CANCELLED' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {returnInfo.buyerShipmentDeadline && returnInfo.status === 'WAITING_FOR_SHIPMENT' && (
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center gap-2.5',
                isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700',
              )}
            >
              <HiOutlineClock className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Hạn chót người mua gửi hàng:</p>
                <p className="font-bold">{formatOrderDate(returnInfo.buyerShipmentDeadline)}</p>
              </div>
            </div>
          )}

          {returnInfo.sellerInspectionDeadline && returnInfo.status === 'RETURNED' && (
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center gap-2.5 sm:col-span-2',
                isDark ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' : 'border-purple-200 bg-purple-50 text-purple-900',
              )}
            >
              <HiOutlineShieldCheck className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <p className="font-bold text-xs">Hạn chót Shop kiểm tra hàng (72 giờ):</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Bạn có thời hạn đến <strong>{formatOrderDate(returnInfo.sellerInspectionDeadline)}</strong> để kiểm tra bưu kiện. Sau thời gian này nếu Shop không phản hồi, hệ thống sẽ tự động hoàn 100% tiền cho Khách hàng.
                </p>
              </div>
            </div>
          )}

          {returnInfo.returnTrackingCode && (
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center gap-2.5',
                isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700',
              )}
            >
              <HiOutlineTruck className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400">Vận đơn hoàn (GHN):</p>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {returnInfo.returnTrackingCode}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hành động kiểm tra kiện hàng hoàn khi RETURNED */}
      {returnInfo.status === 'RETURNED' && (
        <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3">
          <div>
            <p className="font-bold text-xs sm:text-sm text-purple-700 dark:text-purple-300">
              Kiện hàng hoàn đã giao tới Shop — Vui lòng tiến hành kiểm tra
            </p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Hãy quay video khi mở kiện hàng. Nếu sản phẩm đạt chuẩn, bấm <strong>Xác nhận hoàn tiền</strong> để giải phóng Escrow cho khách. Nếu sản phẩm bị trầy xước, vỡ nát hoặc sai hàng, bấm <strong>Khiếu nại kiện hàng</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCompleteModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
              Xác nhận nhận hàng đạt & Hoàn tiền
            </button>
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <HiOutlineExclamation className="h-4 w-4" />
              Khiếu nại kiện hàng (Hỏng / Sai hàng)
            </button>
          </div>
        </div>
      )}

      {/* Khi DISPUTED: Đang chờ BQT phân xử */}
      {returnInfo.status === 'DISPUTED' && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
            <HiOutlineExclamation className="h-4 w-4" />
            <span>Hồ sơ khiếu nại đang được Ban Quản Trị xem xét phân xử</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
            Tình trạng báo cáo: <strong>{returnInfo.conditionStatus}</strong>.
            Ghi chú của Shop: <em>&ldquo;{returnInfo.conditionNote}&rdquo;</em>.
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
                      className="relative rounded-xl border border-rose-300 dark:border-rose-900/50 overflow-hidden h-20 bg-stone-900/10 block group"
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

      {/* Khi COMPLETED: Hiển thị phán quyết kết quả hoàn tiền / giải ngân */}
      {returnInfo.status === 'COMPLETED' && (() => {
        const s = returnInfo.settlement
        if (s && s.settlementType) {
          if (s.settlementType === 'PARTIAL_SPLIT') {
            return (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Phán quyết chia tiền: Khách {s.buyerPercentage}% — Shop {s.sellerPercentage}%
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-500 font-medium">Shop nhận ({s.sellerPercentage}%)</p>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatOrderCurrency(s.sellerReleaseAmount)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[11px] text-blue-500 font-medium">Hoàn khách ({s.buyerPercentage}%)</p>
                    <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatOrderCurrency(s.buyerRefundAmount)}
                    </p>
                  </div>
                </div>
                {s.settlementNote && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                    Ghi chú BQT: &ldquo;{s.settlementNote}&rdquo;
                  </p>
                )}
              </div>
            )
          }
          if (s.settlementType === 'FULL_RELEASE') {
            return (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  Phán quyết BQT: Giải ngân toàn bộ cho Shop
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                  Toàn bộ số tiền <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatOrderCurrency(s.sellerReleaseAmount)}</span> đã được giải ngân vào ví người bán của bạn.
                </p>
              </div>
            )
          }
          return (
            <div className="p-3.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/40 text-xs space-y-1">
              <p className="font-bold text-stone-700 dark:text-slate-300">
                Phán quyết BQT: Hoàn tiền toàn bộ cho Khách hàng
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                Sau khi xem xét bằng chứng, Ban Quản Trị đã hoàn 100% tiền đơn hàng cho Khách.
              </p>
            </div>
          )
        }
        return (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">Đã hoàn tiền</p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
              Quy trình trả hàng và hoàn tiền đã kết thúc thành công.
            </p>
          </div>
        )
      })()}

      {/* Modal Hoàn Tất Nhận Hàng */}
      <SellerReturnCompleteModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        isDark={isDark}
        submitting={submitting}
        conditionNote={conditionNote}
        setConditionNote={setConditionNote}
        isRestocked={isRestocked}
        setIsRestocked={setIsRestocked}
        onSubmit={handleSubmitComplete}
      />

      {/* Modal Khiếu Nại Kiện Hàng */}
      <SellerReturnDisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        isDark={isDark}
        submitting={submitting}
        disputeCondition={disputeCondition}
        setDisputeCondition={setDisputeCondition}
        disputeNote={disputeNote}
        setDisputeNote={setDisputeNote}
        evidenceUrls={evidenceUrls}
        setEvidenceUrls={setEvidenceUrls}
        uploadingImage={uploadingImage}
        fileInputRef={fileInputRef}
        onImageUpload={handleImageUpload}
        onSubmit={handleSubmitDispute}
      />
    </motion.div>
  )
}
