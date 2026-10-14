import { useState, useEffect, useMemo, useRef } from 'react'
import {
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineArrowNarrowRight,
  HiOutlinePhotograph,
  HiOutlineTrash,
  HiOutlineScale,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import reportService from '../../../../services/report'
import fileService from '../../../../services/fileService'

const MAX_IMAGES = 4

export default function SellerDisputeSection({ orderId, order, isDark, onRefresh }) {
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

  // Handle image upload for Rejection
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = MAX_IMAGES - evidenceUrls.length
    if (remainingSlots <= 0) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh bằng chứng!`)
      return
    }

    const validFiles = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá dung lượng 10MB!`)
      } else {
        validFiles.push(file)
      }
    }

    const filesToUpload = validFiles.slice(0, remainingSlots)
    if (!filesToUpload.length) return

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
        toast.success(`Đã tải lên ${uploaded.length} ảnh`)
      }
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên máy chủ')
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

  // Kiểm tra xem đơn hàng có khiếu nại không
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

  // Fallback nếu có tranh chấp trong order nhưng API report chưa fetch được hoặc gặp lỗi
  if (!report && hasDisputeInOrder) {
    return (
      <div className="border-b border-stone-200 dark:border-slate-800 p-6">
        <div
          className={cn(
            'rounded-2xl border p-5 sm:p-6 shadow-sm',
            isDark ? 'border-amber-500/40 bg-amber-500/10' : 'border-amber-300 bg-amber-50/70'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-sm">
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
                {fetchError && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    ⚠️ {fetchError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all shrink-0"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              <span>Tải Lại Chi Tiết</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Buyer evidence images array
  const buyerEvidenceList = report.evidenceUrl
    ? report.evidenceUrl.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const isNegotiating = report.stage === 'DIRECT_NEGOTIATION'
  const isReturnProgress = report.stage === 'RETURN_IN_PROGRESS'
  const isEscalated = report.stage === 'ESCALATED_TO_ADMIN'
  const isResolved = report.stage === 'RESOLVED'
  const isCancelled = report.stage === 'CANCELLED'

  return (
    <div className="border-b border-stone-200 dark:border-slate-800 p-6">
    <div
      className={cn(
        'rounded-2xl border p-5 sm:p-6 transition-all duration-200 shadow-sm',
        isNegotiating
          ? isDark
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-amber-300 bg-amber-50/70'
          : isReturnProgress
            ? isDark
              ? 'border-sky-500/40 bg-sky-500/10'
              : 'border-sky-300 bg-sky-50/70'
            : isEscalated
              ? isDark
                ? 'border-purple-500/40 bg-purple-500/10'
                : 'border-purple-300 bg-purple-50/70'
              : isDark
                ? 'border-slate-800 bg-slate-900/60'
                : 'border-stone-200 bg-stone-50'
      )}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20 dark:border-amber-500/10">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2.5 rounded-xl text-white shrink-0 mt-0.5 shadow-sm',
              isNegotiating
                ? 'bg-amber-500'
                : isReturnProgress
                  ? 'bg-sky-500'
                  : isEscalated
                    ? 'bg-purple-600'
                    : isResolved
                      ? 'bg-emerald-500'
                      : 'bg-stone-500'
            )}
          >
            {isNegotiating ? (
              <HiOutlineExclamationCircle className="h-6 w-6" />
            ) : isEscalated ? (
              <HiOutlineScale className="h-6 w-6" />
            ) : (
              <HiOutlineShieldCheck className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg">
                {isNegotiating && 'Yêu Cầu Khiếu Nại — Thương Lượng 1:1'}
                {isReturnProgress && 'Đang Xử Lý Đổi Trả Hàng (RETURN_IN_PROGRESS)'}
                {isEscalated && 'Tranh Chấp Đang Chờ Ban Quản Trị Sàn Phán Quyết'}
                {isResolved && 'Khiếu Nại Đã Được Giải Quyết'}
                {isCancelled && 'Khách Hàng Đã Rút Khiếu Nại'}
              </h3>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border',
                  isNegotiating
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : isReturnProgress
                      ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
                      : isEscalated
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : isResolved
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400 border-stone-300'
                )}
              >
                {report.stage || 'PENDING'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
              {isNegotiating &&
                'Khách hàng đã nộp khiếu nại. Bạn có 48 giờ để thương lượng trực tiếp nhằm bảo toàn uy tín Shop.'}
              {isReturnProgress &&
                'Shop đã đồng ý đổi trả. Vui lòng theo dõi kiện hàng hoàn tại mục "Yêu cầu Trả hàng & Hoàn tiền".'}
              {isEscalated &&
                'Hai bên không thể thương lượng. Ban Quản Trị sàn đang đối soát chứng từ để đưa ra phán quyết cuối cùng.'}
              {isResolved && 'Vụ việc khiếu nại đã hoàn tất.'}
            </p>
          </div>
        </div>

        {/* SLA Countdown Badge */}
        {isNegotiating && slaRemaining && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
            <HiOutlineClock className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>SLA phản hồi: {slaRemaining}</span>
          </div>
        )}
      </div>

      {/* Buyer's Complaint Detail */}
      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-white/70 dark:bg-slate-800/70 p-4 border border-stone-200/80 dark:border-slate-700/80 space-y-2">
          <p className="text-xs font-bold text-stone-600 dark:text-slate-300">
            Lý do & Nội dung khiếu nại của khách hàng:
          </p>
          <p className="text-xs sm:text-sm text-stone-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
            {report.description || 'Không có mô tả chi tiết'}
          </p>

          {/* Buyer Evidence Thumbnails */}
          {buyerEvidenceList.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-2">
                Ảnh bằng chứng mở hộp / lỗi do khách cung cấp ({buyerEvidenceList.length} ảnh):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {buyerEvidenceList.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-video sm:h-24 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-900"
                  >
                    <img
                      src={url}
                      alt={`Bằng chứng ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Xem ảnh lớn
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seller's Previous Response if already responded */}
        {report.sellerResponse && (
          <div className="rounded-xl bg-sky-50/70 dark:bg-sky-950/30 p-4 border border-sky-200 dark:border-sky-800/60 space-y-1">
            <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
              Phản hồi từ Shop ({report.sellerAction || 'Đã gửi'}):
            </p>
            <p className="text-xs sm:text-sm text-sky-900 dark:text-sky-100">
              {report.sellerResponse}
            </p>
          </div>
        )}

        {/* Action Buttons for DIRECT_NEGOTIATION */}
        {isNegotiating && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModal('REFUND')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineCheck className="h-4 w-4" />
              <span>Đồng ý Hoàn Tiền (Không phạt)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('RETURN')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineArrowNarrowRight className="h-4 w-4" />
              <span>Đồng ý Đổi Trả Hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('REJECT')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all duration-150 active:scale-[0.98]"
            >
              <HiOutlineX className="h-4 w-4" />
              <span>Từ chối & Chuyển Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Dialogs */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto',
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <h4 className="text-base font-bold">
                {activeModal === 'REFUND' && 'Xác Nhận Đồng Ý Hoàn Tiền'}
                {activeModal === 'RETURN' && 'Xác Nhận Nhận Lại Hàng Đổi Trả'}
                {activeModal === 'REJECT' && 'Từ Chối & Chuyển Ban Quản Trị Sàn'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null)
                  setResponseNote('')
                  setEvidenceUrls([])
                }}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {activeModal === 'REFUND' && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold">Lợi ích thương lượng thành công:</p>
                  <p className="mt-1">
                    Hệ thống sẽ hoàn 100% tiền ký quỹ về ví của Người mua. <strong>Shop KHÔNG bị trừ điểm uy tín</strong> và không bị ghi nhận vi phạm gian hàng.
                  </p>
                </div>
              )}

              {activeModal === 'RETURN' && (
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-sky-800 dark:text-sky-300">
                  <p className="font-bold">Quy trình đổi trả hàng:</p>
                  <p className="mt-1">
                    Yêu cầu trả hàng sẽ được khởi tạo. Khách hàng có 3 ngày để nộp mã vận đơn gửi hàng về kho của bạn. Tiền ký quỹ tiếp tục được bảo lưu an toàn.
                  </p>
                </div>
              )}

              {activeModal === 'REJECT' && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-800 dark:text-rose-300">
                  <p className="font-bold">Lưu ý khi chuyển Admin phân xử:</p>
                  <p className="mt-1">
                    Vụ việc sẽ được chuyển lên Ban Quản Trị sàn thẩm định. Vui lòng cung cấp đầy đủ lý do và hình ảnh chứng minh (video test máy, ảnh đóng gói seal) để bảo vệ quyền lợi.
                  </p>
                </div>
              )}

              {/* Note Input */}
              <div>
                <label className="block font-bold mb-1">
                  {activeModal === 'REFUND' && 'Lời nhắn cho khách hàng (không bắt buộc):'}
                  {activeModal === 'RETURN' && 'Hướng dẫn đóng gói & gửi hàng cho khách:'}
                  {activeModal === 'REJECT' && 'Lý do từ chối giải trình với BQT (bắt buộc):'}
                </label>
                <textarea
                  rows={3}
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder={
                    activeModal === 'REFUND'
                      ? 'Shop xin lỗi quý khách vì sự cố này, shop chấp nhận hoàn tiền.'
                      : activeModal === 'RETURN'
                        ? 'Shop đồng ý nhận lại máy để kiểm tra/đổi mới. Quý khách vui lòng đóng gói cẩn thận.'
                        : 'Sản phẩm trước khi gửi đi đã được kiểm tra kỹ IMEI và tem bảo hành còn nguyên vẹn...'
                  }
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs outline-hidden transition-all',
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
                      : 'bg-white border-stone-200 text-stone-900 focus:border-amber-500'
                  )}
                />
              </div>

              {/* Evidence Upload for REJECT */}
              {activeModal === 'REJECT' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Ảnh bằng chứng của Shop ({evidenceUrls.length}/4):</span>
                    {evidenceUrls.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                      >
                        <HiOutlinePhotograph className="h-4 w-4" />
                        <span>{uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {evidenceUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative h-20 rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700"
                      >
                        <img src={url} alt={`Chứng cứ ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEvidence(idx)}
                          className="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null)
                  setResponseNote('')
                  setEvidenceUrls([])
                }}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-bold border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (activeModal === 'REFUND') handleSellerAction('ACCEPT_REFUND')
                  else if (activeModal === 'RETURN') handleSellerAction('ACCEPT_RETURN')
                  else if (activeModal === 'REJECT') handleSellerAction('REJECT_AND_ESCALATE')
                }}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all',
                  activeModal === 'REFUND'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : activeModal === 'RETURN'
                      ? 'bg-sky-600 hover:bg-sky-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                )}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
