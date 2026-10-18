import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import returnService from '../../../../services/returnService'
import { useThemeStore } from '../../../../store/useThemeStore'
import fileService from '../../../../services/fileService'
import {
  getReturnStatusBadge,
  getReturnStatusLabel,
  formatOrderCurrency,
} from '../../../../lib/orderStatus'
import SellerReturnTimeline from './SellerReturnTimeline'
import SellerReturnDisputeBanner from './SellerReturnDisputeBanner'
import SellerReturnSettlementBanner from './SellerReturnSettlementBanner'
import SellerReturnCompleteModal from './SellerReturnCompleteModal'
import SellerReturnDisputeModal from './SellerReturnDisputeModal'

export default function SellerReturnSection({ returnInfo, order, isDark: isDarkProp, onRefresh }) {
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

  const isOrderRefunded = order?.status === 'REFUNDED'
  const isOrderCompleted = order?.status === 'COMPLETED'
  const isSettled = isOrderRefunded || isOrderCompleted || returnInfo.status === 'COMPLETED'

  const statusBadge = isOrderRefunded || isOrderCompleted
    ? {
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
        icon: HiOutlineCheckCircle,
      }
    : getReturnStatusBadge(returnInfo.status)
  const StatusIcon = statusBadge?.icon
  const statusLabel = isOrderRefunded
    ? 'Đã hoàn tất đổi trả & Hoàn tiền'
    : isOrderCompleted
      ? 'Đã hoàn tất đổi trả'
      : getReturnStatusLabel(returnInfo.status)

  const isVideoFile = (file) => {
    return file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
  }

  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  const currentImages = evidenceUrls.filter((u) => !isVideoUrl(u))
  const currentVideos = evidenceUrls.filter((u) => isVideoUrl(u))

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    let availableImageSlots = 4 - currentImages.length
    let availableVideoSlots = 1 - currentVideos.length

    if (availableImageSlots <= 0 && availableVideoSlots <= 0) {
      toast.error('Đã đạt giới hạn tối đa (4 ảnh và 1 video bằng chứng)!')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const filesToUpload = []
    for (const file of files) {
      const isVid = isVideoFile(file)
      if (isVid) {
        if (availableVideoSlots <= 0) {
          toast.error(`Chỉ được tải lên tối đa 1 video bằng chứng! Đã bỏ qua "${file.name}"`)
          continue
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`Video "${file.name}" vượt quá dung lượng tối đa 50MB!`)
          continue
        }
        filesToUpload.push(file)
        availableVideoSlots--
      } else {
        if (availableImageSlots <= 0) {
          toast.error(`Chỉ được tải lên tối đa 4 hình ảnh bằng chứng! Đã bỏ qua "${file.name}"`)
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB!`)
          continue
        }
        filesToUpload.push(file)
        availableImageSlots--
      }
    }

    if (!filesToUpload.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      setUploadingImage(true)
      const uploaded = []
      for (const file of filesToUpload) {
        const res = await fileService.uploadFile(file, 'returns')
        const uploadedUrl = res?.url || res?.data?.url || (res?.fileName ? `/files/view/${res.fileName}` : null)
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
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
            <HiOutlineTruck className="h-5 w-5" />
          </div>
          <div>
            <h3 className={cn('text-sm sm:text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Xử Lý Yêu Cầu Trả Hàng & Hoàn Tiền
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

      {/* 1.1 Lý do ban đầu khách yêu cầu đổi trả */}
      {order?.disputeReason && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs flex items-start gap-2.5 shadow-2xs',
            isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
          )}
        >
          <span className="font-bold shrink-0 text-amber-600 dark:text-amber-400">
            Lý do khách yêu cầu đổi trả:
          </span>
          <span className="leading-relaxed">
            {order.disputeReason}
          </span>
        </div>
      )}

      {/* 2. Khi CANCELLED: Khách không gửi hàng quá 3 ngày hoặc đã hủy */}
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

      {/* 3. Deadlines & Timeline info */}
      <SellerReturnTimeline
        returnInfo={returnInfo}
        isSettled={isSettled}
        isDark={isDark}
      />

      {/* 3.1 Chi phí vận chuyển 2 chiều Shop chịu do phát sinh đổi trả */}
      {returnInfo.status !== 'CANCELLED' && (
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs space-y-1.5 shadow-2xs',
            isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
          )}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <HiOutlineTruck className="h-4 w-4" />
              Chi phí vận chuyển 2 chiều (Shop chịu do phát sinh đổi trả):
            </span>
            <span className="font-mono text-sm text-rose-600 dark:text-rose-400">
              {formatOrderCurrency(Number(order?.shippingFee || 0) + Number(returnInfo?.shippingFee || order?.shippingFee || 0))}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-slate-800 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="font-sans text-stone-500 dark:text-slate-400">• Cước chiều đi ban đầu:</span>
              <span>{formatOrderCurrency(order?.shippingFee || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-stone-500 dark:text-slate-400">• Cước chiều về thu gom tận nhà:</span>
              <span>{formatOrderCurrency(returnInfo?.shippingFee || order?.shippingFee || 0)}</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-400 dark:text-slate-500 italic pt-0.5">
            * Khoản cước này được tự động trích từ Quỹ Ký Quỹ Gian Hàng (ShopEscrowFund) nộp về Sàn để thanh toán cho đơn vị vận chuyển GHN khi hoàn tất.
          </p>
        </div>
      )}

      {/* 4. Hành động kiểm tra kiện hàng hoàn khi RETURNED */}
      {returnInfo.status === 'RETURNED' && !isSettled && (
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

      {/* 5. Khi DISPUTED: Tranh chấp kiện hàng hoàn (đã Việt hóa 100%) */}
      <SellerReturnDisputeBanner
        returnInfo={returnInfo}
        isOrderRefunded={isOrderRefunded}
        isVideoUrl={isVideoUrl}
      />

      {/* 6. Khi COMPLETED: Kết quả giải ngân / hoàn tiền */}
      {returnInfo.status === 'COMPLETED' && (
        <SellerReturnSettlementBanner settlement={returnInfo.settlement} />
      )}

      {/* 7. Modal Hoàn tất kiểm tra hàng đạt */}
      <SellerReturnCompleteModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        submitting={submitting}
        conditionNote={conditionNote}
        setConditionNote={setConditionNote}
        isRestocked={isRestocked}
        setIsRestocked={setIsRestocked}
        onSubmit={handleSubmitComplete}
        isDark={isDark}
        order={order}
        returnInfo={returnInfo}
      />

      {/* 8. Modal Khiếu nại kiện hàng hoàn */}
      <SellerReturnDisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
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
        handleImageUpload={handleImageUpload}
        onSubmit={handleSubmitDispute}
        isDark={isDark}
      />
    </motion.div>
  )
}
