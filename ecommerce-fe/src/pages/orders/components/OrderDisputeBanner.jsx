import { useState, useEffect, useMemo } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineScale,
  HiOutlineArrowNarrowRight,
  HiOutlineCheck,
  HiOutlineChatAlt2,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import toast from 'react-hot-toast'
import reportService from '../../../services/report'
import DisputeChatModal from './DisputeChatModal'

export default function OrderDisputeBanner({ order, returnInfo, report: reportProp, isDark, onRefresh }) {
  const [internalReport, setInternalReport] = useState(null)
  const report = reportProp || internalReport
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasActiveReturn = returnInfo || order?.returnInfo
  const isDeliveredNoDispute =
    order?.status === 'DELIVERED' &&
    !order?.hasActiveDispute &&
    !hasActiveReturn

  useEffect(() => {
    if (reportProp || !order?.id) return
    if (!order?.hasActiveDispute && order?.status !== 'REFUNDED') return
    loadReport()
  }, [order?.id, order?.hasActiveDispute, order?.status, reportProp])

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await reportService.getReportByOrderId(order.id)
      setInternalReport(data || null)
    } catch (err) {
      console.warn('Lỗi tải report của đơn hàng:', err)
      setInternalReport(null)
    } finally {
      setLoading(false)
    }
  }

  // SLA Countdown
  const slaRemaining = useMemo(() => {
    if (!report?.sellerResponseDeadline) return null
    const deadline = new Date(report.sellerResponseDeadline).getTime()
    const now = Date.now()
    const diff = deadline - now
    if (diff <= 0) return 'Đã hết hạn 48h (Hệ thống sẽ tự động chuyển BQT)'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} giờ ${minutes} phút`
  }, [report?.sellerResponseDeadline])

  const handleCancelReport = async () => {
    if (!report?.id) return
    try {
      setSubmitting(true)
      await reportService.cancelReport(report.id)
      toast.success('Đã hủy khiếu nại thành công! Tiền tiếp tục được giữ an toàn trong Ký quỹ.')
      setShowCancelModal(false)
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra khi hủy khiếu nại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEscalateReport = async () => {
    if (!report?.id) return
    try {
      setSubmitting(true)
      await reportService.escalateReport(report.id, { reason: escalateReason.trim() || null })
      toast.success('Đã chuyển hồ sơ khiếu nại lên Ban Quản Trị sàn phân xử!')
      setShowEscalateModal(false)
      setEscalateReason('')
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra khi yêu cầu can thiệp')
    } finally {
      setSubmitting(false)
    }
  }

  if (!order) return null

  const isNegotiating = report?.stage === 'DIRECT_NEGOTIATION'
  const isReturnProgress = report?.stage === 'RETURN_IN_PROGRESS'
  const isEscalated = report?.stage === 'ESCALATED_TO_ADMIN' || (!report && order.hasActiveDispute)

  return (
    <>
      {/* 1. Escrow Guidance Banner when DELIVERED and NO dispute and NO return */}
      {isDeliveredNoDispute && (
        <div
          className={cn(
            'rounded-2xl p-3.5 sm:p-4 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
            isDark
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-900',
          )}
        >
          <div className="flex items-start gap-2.5">
            <HiOutlineShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đơn hàng đã được giao đến bạn</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                Vui lòng kiểm tra kỹ sản phẩm. Tiền đang được{' '}
                <strong>Sàn ký quỹ giữ an toàn</strong>. Nếu có vấn đề về sản phẩm, hãy bấm{' '}
                <strong>Khiếu nại / Báo sự cố</strong> để tạm giữ tiền giải ngân cho Shop.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dispute Status Card when order has active dispute */}
      {order.hasActiveDispute && (
        <div
          className={cn(
            'rounded-2xl p-4 sm:p-5 border text-xs space-y-3 shadow-sm transition-all',
            isNegotiating
              ? isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-300 text-amber-900'
              : isReturnProgress
                ? isDark
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                  : 'bg-sky-50 border-sky-300 text-sky-900'
                : isDark
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                  : 'bg-purple-50 border-purple-300 text-purple-900',
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20 dark:border-amber-500/10">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-2 rounded-xl text-white shrink-0 mt-0.5 shadow-sm',
                  isNegotiating
                    ? 'bg-amber-500'
                    : isReturnProgress
                      ? 'bg-sky-500'
                      : 'bg-purple-600',
                )}
              >
                {isNegotiating ? (
                  <HiOutlineExclamationCircle className="h-5 w-5" />
                ) : isReturnProgress ? (
                  <HiOutlineArrowNarrowRight className="h-5 w-5" />
                ) : (
                  <HiOutlineScale className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm">
                    {isNegotiating && 'Đang Trong Giai Đoạn Thương Lượng 1:1 Với Shop'}
                    {isReturnProgress && 'Shop Đã Đồng Ý Đổi Trả — Tiến Hành Gửi Hàng Hoàn'}
                    {isEscalated && 'Khiếu Nại Đang Được Ban Quản Trị Sàn Phán Quyết'}
                  </p>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider',
                      isNegotiating
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : isReturnProgress
                          ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
                          : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
                    )}
                  >
                    {report?.stage || order.disputeStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                  {isNegotiating &&
                    'Hồ sơ của bạn đã được gửi trực tiếp cho Shop. Người bán có tối đa 48 giờ để xử lý (đồng ý hoàn tiền hoặc đổi trả). Tiền đơn hàng đang được Ký quỹ sàn bảo vệ tuyệt đối.'}
                  {isReturnProgress &&
                    'Shop đã chấp thuận nhận lại hàng để kiểm tra hoặc đổi mới. Vui lòng theo dõi chi tiết và nộp mã vận đơn hoàn ở khối bên dưới.'}
                  {isEscalated &&
                    'Vụ việc đã được chuyển lên Ban Quản Trị sàn thụ lý. BQT sẽ xem xét bằng chứng của hai bên để đưa ra phán quyết hoàn tiền hoặc giải ngân công bằng.'}
                </p>
              </div>
            </div>

            {/* SLA Clock for Buyer */}
            {isNegotiating && slaRemaining && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0 self-start sm:self-auto">
                <HiOutlineClock className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Hạn Shop phản hồi: {slaRemaining}</span>
              </div>
            )}
          </div>

          {/* Shop response note if any */}
          {report?.sellerResponse && (
            <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 p-3 border border-amber-200 dark:border-slate-700 space-y-1">
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Phản hồi từ Người bán ({report.sellerAction || 'Đã gửi'}):
              </p>
              <p className="text-xs text-stone-700 dark:text-slate-200">
                {report.sellerResponse}
              </p>
            </div>
          )}

          {/* Căn cứ Điều khoản chính sách khi BQT phán quyết */}
          {(report?.policyClauseTitle || report?.policyClauseCode) && (
            <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-3 text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <HiOutlineScale className="h-4 w-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <div className="space-y-0.5">
                <span className="font-bold text-xs">⚖️ Căn cứ Điều khoản phán quyết: </span>
                <span className="font-semibold text-xs">{report.policyClauseTitle || report.policyClauseCode}</span>
                {report.adminNote && (
                  <p className="text-[11px] opacity-90 leading-relaxed italic pt-0.5">
                    Ghi chú phán quyết BQT: &ldquo;{report.adminNote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action buttons for Buyer */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowChatModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 px-3.5 py-2 text-xs font-bold text-orange-700 dark:text-orange-300 transition-all shadow-xs"
            >
              <HiOutlineChatAlt2 className="h-4 w-4 text-orange-500" />
              <span>Phòng thương lượng trực tiếp</span>
            </button>

            {isNegotiating && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
                >
                  <HiOutlineX className="h-4 w-4 text-stone-500" />
                  <span>Rút / Hủy khiếu nại này</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEscalateModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 transition-all shadow-xs"
                >
                  <HiOutlineScale className="h-4 w-4 text-purple-500" />
                  <span>Yêu cầu Ban Quản Trị can thiệp</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Phán quyết BQT khi tranh chấp đã khép lại */}
      {!order.hasActiveDispute && (report?.policyClauseTitle || report?.policyClauseCode || (report?.adminNote && order.status === 'REFUNDED')) && (
        <div
          className={cn(
            'rounded-2xl p-4 border text-xs space-y-2 shadow-xs',
            report?.status === 'APPROVED' || order.status === 'REFUNDED'
              ? isDark
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isDark
                ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                : 'bg-stone-100 border-stone-200 text-stone-800'
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <HiOutlineScale className="h-5 w-5 text-purple-500 shrink-0" />
            <span>Kết luận giải quyết khiếu nại từ Ban Quản Trị</span>
          </div>
          {(report?.policyClauseTitle || report?.policyClauseCode) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-800 dark:text-purple-300">
              <span>⚖️ Căn cứ Điều khoản:</span>
              <span>{report.policyClauseTitle || report.policyClauseCode}</span>
            </div>
          )}
          {report?.adminNote && (
            <p className="text-xs leading-relaxed opacity-90 pl-1">
              Phán quyết BQT: &ldquo;{report.adminNote}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Modal Cancel Report */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4',
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            )}
          >
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <HiOutlineExclamationCircle className="h-6 w-6 shrink-0" />
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Xác Nhận Rút Khiếu Nại Đơn Hàng?
              </h4>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn rút khiếu nại đơn hàng này? Thao tác này có hiệu lực ngay lập tức và <strong>không thể hoàn tác</strong>.
            </p>

            {/* Khối cảnh báo mất quyền vĩnh viễn */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span>⚠️</span> Mất quyền khiếu nại vĩnh viễn
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Mỗi đơn hàng chỉ được khiếu nại <strong>1 lần duy nhất</strong> trong toàn bộ vòng đời. Khi bạn xác nhận rút, bạn sẽ <strong>vĩnh viễn không thể gửi lại khiếu nại</strong> cho đơn hàng này dưới bất kỳ lý do nào.
              </p>
              <p className="text-[11px] leading-relaxed opacity-90 pt-0.5">
                Tiền thanh toán đang tạm giữ sẽ được chuyển về trạng thái bình thường và tự động giải ngân cho Người bán.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-bold border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              >
                Giữ khiếu nại
              </button>
              <button
                type="button"
                onClick={handleCancelReport}
                disabled={submitting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                {submitting ? 'Đang hủy...' : 'Tôi hiểu, xác nhận rút'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escalate Report */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4',
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            )}
          >
            <h4 className="text-base font-bold text-stone-900 dark:text-white">
              Yêu Cầu Ban Quản Trị Sàn Can Thiệp
            </h4>
            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              Nếu hai bên không tìm được tiếng nói chung, bạn có thể chuyển hồ sơ lên BQT sàn. Admin sẽ xem xét bằng chứng và đưa ra phán quyết cuối cùng.
            </p>
            <div>
              <label className="block text-xs font-bold mb-1">
                Lý do yêu cầu can thiệp (không bắt buộc):
              </label>
              <textarea
                rows={3}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Shop không phản hồi tin nhắn hoặc không đồng ý giải quyết..."
                className={cn(
                  'w-full rounded-xl border p-3 text-xs outline-hidden transition-all',
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-stone-200 text-stone-900 focus:border-purple-500'
                )}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-xs font-bold border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleEscalateReport}
                disabled={submitting}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu BQT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <DisputeChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          orderId={order?.id}
          requestId={report?.request?.id || report?.requestId}
          orderNumber={order?.orderNumber}
          isDark={isDark}
        />
      )}
    </>
  )
}
