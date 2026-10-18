import { useState, useEffect, useMemo, useRef } from 'react'
import {
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineArrowNarrowRight,
  HiOutlineRefresh,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import reportService from '../../../../services/report'
import fileService from '../../../../services/fileService'
import SellerDisputeHeader from './SellerDisputeHeader'
import SellerDisputeAdminBanner from './SellerDisputeAdminBanner'
import SellerDisputeSideBySide from './SellerDisputeSideBySide'
import SellerDisputeActionModal from './SellerDisputeActionModal'
import { isVideoUrl, isVideoFile } from '../../../../lib/mediaUtils'

export default function SellerDisputeSection({ orderId, order, returnInfo, isDark, onRefresh }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Modals state
  const [activeModal, setActiveModal] = useState(null) // 'REFUND' | 'RETURN' | 'REJECT'
  const [responseNote, setResponseNote] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!orderId) return
    loadReport()
  }, [orderId])

  const loadReport = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const data = await reportService.getReportByOrderId(orderId)
      setReport(data || null)
    } catch (err) {
      console.warn('Lỗi tải thông tin khiếu nại đơn hàng:', err)
      setFetchError(err?.message || 'Không thể tải thông tin khiếu nại')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  // SLA Countdown timer
  const slaRemaining = useMemo(() => {
    if (!report?.sellerResponseDeadline) return null
    const deadline = new Date(report.sellerResponseDeadline).getTime()
    const now = Date.now()
    const diff = deadline - now
    if (diff <= 0) return 'Đã hết hạn 48h'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} giờ ${minutes} phút`
  }, [report?.sellerResponseDeadline])

  // Handle media upload for Rejection (tối đa 4 ảnh 10MB + 1 video 50MB)
  const currentImages = evidenceUrls.filter((u) => !isVideoUrl(u))
  const currentVideos = evidenceUrls.filter((u) => isVideoUrl(u))

  const handleFileUpload = async (e) => {
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
        const res = await fileService.uploadFile(file, 'disputes')
        const url = res?.url || res?.data?.url
        if (url) uploaded.push(url)
      }
      if (uploaded.length) {
        setEvidenceUrls((prev) => [...prev, ...uploaded])
        toast.success(`Đã tải lên ${uploaded.length} tệp chứng từ`)
      }
    } catch (err) {
      toast.error('Lỗi khi tải tệp lên máy chủ')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeEvidence = (idx) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSellerAction = async (actionType) => {
    if (!report?.id) return

    if (actionType === 'REJECT_AND_ESCALATE' && !responseNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối để Admin đối soát!')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        action: actionType,
        responseNote: responseNote.trim() || null,
        evidenceUrl: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
      }

      await reportService.sellerRespond(report.id, payload)

      if (actionType === 'ACCEPT_REFUND') {
        toast.success('Đã chấp thuận hoàn tiền cho khách hàng thành công!')
      } else if (actionType === 'ACCEPT_RETURN') {
        toast.success('Đã chấp thuận đổi trả! Chờ khách gửi hàng hoàn về kho.')
      } else {
        toast.success('Đã gửi phản hồi và chuyển hồ sơ lên Ban Quản Trị sàn!')
      }

      setActiveModal(null)
      setResponseNote('')
      setEvidenceUrls([])
      await loadReport()
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra khi gửi phản hồi')
    } finally {
      setSubmitting(false)
    }
  }

  const hasDisputeInOrder = Boolean(
    order?.hasActiveDispute ||
    ['REPORT_PENDING', 'DISPUTED'].includes(order?.disputeStatus)
  )

  if (!loading && !report && !hasDisputeInOrder) return null

  if (loading && !report) {
    return (
      <div className="border-b border-stone-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-semibold text-amber-500 gap-2">
          <HiOutlineClock className="h-4 w-4 animate-spin" />
          <span>Đang kiểm tra và tải hồ sơ khiếu nại từ người mua...</span>
        </div>
      </div>
    )
  }

  if (!report && hasDisputeInOrder) {
    return (
      <div className="border-b border-stone-200 dark:border-slate-800 p-6">
        <div
          className={cn(
            'rounded-2xl border p-5 sm:p-6 shadow-xs',
            isDark ? 'border-amber-500/40 bg-amber-500/10' : 'border-amber-300 bg-amber-50/70'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                <HiOutlineExclamationCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-amber-800 dark:text-amber-200">
                    Yêu Cầu Khiếu Nại — Thương Lượng 1:1
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    {order?.disputeStatus || 'DIRECT_NEGOTIATION'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-slate-300 mt-1">
                  Lý do khiếu nại: <strong>{order?.disputeReason || 'Khách hàng yêu cầu đổi trả / hoàn tiền đối với đơn hàng này.'}</strong>
                </p>
                {fetchError && <p className="text-[11px] text-rose-500 mt-1">⚠️ {fetchError}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all shrink-0"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              <span>Tải Lại Chi Tiết</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const buyerEvidenceList = report.evidenceUrl
    ? report.evidenceUrl.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const sellerEvidenceList = report.sellerEvidenceUrl
    ? report.sellerEvidenceUrl.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const isNegotiating = report.stage === 'DIRECT_NEGOTIATION'
  const isOrderRefunded = order?.status === 'REFUNDED'

  return (
    <div className="border-b border-stone-200 dark:border-slate-800 p-4 sm:p-6">
      <div
        className={cn(
          'rounded-3xl border transition-all duration-200 shadow-xs overflow-hidden',
          isNegotiating
            ? isDark
              ? 'border-amber-500/30 bg-amber-950/20'
              : 'border-amber-200 bg-amber-50/50'
            : isDark
              ? 'border-slate-800 bg-slate-900/70'
              : 'border-stone-200 bg-stone-50/80'
        )}
      >
        {/* 1. Header Banner */}
        <SellerDisputeHeader
          report={report}
          slaRemaining={slaRemaining}
          isNegotiating={isNegotiating}
          isDark={isDark}
        />

        {/* 2. Banner Phán Quyết Của Admin */}
        <SellerDisputeAdminBanner
          report={report}
          isOrderRefunded={isOrderRefunded}
          isDark={isDark}
        />

        {/* 3. Bố cục 2 Cột Đối Chất */}
        <SellerDisputeSideBySide
          report={report}
          returnInfo={returnInfo}
          buyerEvidenceList={buyerEvidenceList}
          sellerEvidenceList={sellerEvidenceList}
          isNegotiating={isNegotiating}
          isDark={isDark}
        />

        {/* 4. Action Buttons */}
        {isNegotiating && (
          <div
            className={cn(
              'p-4 sm:p-5 border-t flex flex-wrap items-center gap-3',
              isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-200 bg-stone-50'
            )}
          >
            <button
              type="button"
              onClick={() => setActiveModal('REFUND')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineCheck className="h-4 w-4" />
              <span>Đồng ý Hoàn Tiền</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('RETURN')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineArrowNarrowRight className="h-4 w-4" />
              <span>Đồng ý Nhận Lại Hàng Đổi Trả</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('REJECT')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineX className="h-4 w-4" />
              <span>Từ Chối & Chuyển Lên Ban Quản Trị Sàn</span>
            </button>
          </div>
        )}

        {/* Modal Dialog */}
        <SellerDisputeActionModal
          activeModal={activeModal}
          onClose={() => {
            setActiveModal(null)
            setResponseNote('')
            setEvidenceUrls([])
          }}
          isDark={isDark}
          responseNote={responseNote}
          setResponseNote={setResponseNote}
          evidenceUrls={evidenceUrls}
          removeEvidence={removeEvidence}
          handleFileSelect={handleFileUpload}
          uploadingImage={uploadingImage}
          fileInputRef={fileInputRef}
          submitting={submitting}
          onSubmit={handleSellerAction}
          order={order}
        />
      </div>
    </div>
  )
}
