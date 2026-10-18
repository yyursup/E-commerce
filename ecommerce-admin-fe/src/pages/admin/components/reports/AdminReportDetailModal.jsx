import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineClipboardCopy,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import AdminReportTargetInfo from './AdminReportTargetInfo'
import AdminReportEscrowSection from './AdminReportEscrowSection'
import AdminReportDisputeSideBySide from './AdminReportDisputeSideBySide'
import AdminReportSingleClaim from './AdminReportSingleClaim'
import AdminReportImageLightbox from './AdminReportImageLightbox'

export default function AdminReportDetailModal({
  detailModal,
  setDetailModal,
  isDark,
  copyToClipboard,
  getTargetIcon,
  getTargetLabel,
  parseImages,
  setActionModal,
}) {
  const [previewImage, setPreviewImage] = useState(null)

  const isReport = (detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
  const isPending = (detailModal.data?.status || detailModal.rawItem?.status) === 'PENDING'
  const isApproved = (detailModal.data?.status || detailModal.rawItem?.status) === 'APPROVED'
  const isRejected = (detailModal.data?.status || detailModal.rawItem?.status) === 'REJECTED'

  const targetType =
    detailModal.data?.detail?.targetType ||
    detailModal.rawItem?.targetType ||
    (detailModal.data?.detail?.escrow ? 'ORDER' : null)
  const isOrderReport = targetType === 'ORDER' || Boolean(detailModal.data?.detail?.escrow)

  const orderReturn = detailModal.data?.detail?.orderReturn
  const isReturnDisputed = orderReturn?.status === 'DISPUTED' || Boolean(orderReturn?.conditionStatus)

  // Kiểm tra xem đây có phải là vụ việc Shop khiếu nại kiện hàng hoàn (Seller return dispute)
  const isSellerReturnDispute = isOrderReport && Boolean(
    isReturnDisputed ||
    detailModal.data?.detail?.targetInfo?.includes('DISPUTED') ||
    detailModal.data?.detail?.escalationReason?.includes('kiện hàng hoàn') ||
    detailModal.rawItem?.description?.includes('Shop khiếu nại kiện hàng hoàn') ||
    detailModal.data?.description?.includes('Shop khiếu nại kiện hàng hoàn')
  )

  const canTakeAction = isPending || (isSellerReturnDispute && orderReturn?.status === 'DISPUTED')

  // Kiểm tra xem đây có phải là vụ việc tranh chấp đơn hàng có phản hồi/đối chất từ phía Người bán hay không
  const hasSellerResponse = Boolean(
    detailModal.data?.detail?.sellerResponse ||
    detailModal.data?.detail?.sellerAction ||
    detailModal.data?.detail?.sellerEvidenceUrl ||
    isReturnDisputed ||
    detailModal.data?.detail?.stage === 'ESCALATED_TO_ADMIN' ||
    detailModal.data?.detail?.stage === 'DIRECT_NEGOTIATION'
  )

  const evImgs = parseImages(detailModal.data?.detail?.evidenceUrl)
  const sellerImgs = parseImages(detailModal.data?.detail?.sellerEvidenceUrl)
  const rawCovImgs = parseImages(
    detailModal.data?.coverImageUrl,
    detailModal.rawItem?.coverImageUrl
  )
  // Lọc ảnh bìa/minh họa không trùng lặp với ảnh bằng chứng
  const covImgs = rawCovImgs.filter(
    (url) => !evImgs.includes(url) && !sellerImgs.includes(url)
  )

  const closeModal = () => {
    setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })
  }

  const handleAction = (actionType) => {
    setActionModal({
      isOpen: true,
      type: actionType,
      item: {
        ...(detailModal.rawItem || {}),
        ...(detailModal.data || {}),
        targetType: detailModal.data?.detail?.targetType || detailModal.rawItem?.targetType,
        detail: detailModal.data?.detail,
        isSellerReturnDispute,
      },
      note: '',
    })
  }

  const translateReportStage = (stage) => {
    switch (stage) {
      case 'CLOSED':
        return 'Đã đóng / Hoàn tất'
      case 'DIRECT_NEGOTIATION':
        return 'Thương lượng 1-1'
      case 'ESCALATED_TO_ADMIN':
        return 'BQT can thiệp phân xử'
      case 'PENDING':
        return 'Chờ tiếp nhận'
      default:
        return stage
    }
  }

  return (
    <AnimatePresence>
      {detailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'w-full max-w-4xl lg:max-w-5xl rounded-3xl border shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
            )}
          >
            {/* Header Modal - Cố định (shrink-0) */}
            <div className="shrink-0 flex items-start justify-between p-4 sm:p-6 border-b dark:border-slate-800 border-stone-200 bg-stone-50/50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase',
                      isReport
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
                    )}
                  >
                    {isReport ? 'Báo Cáo Vi Phạm' : 'Đơn Kháng Cáo'}
                  </span>
                  {isSellerReturnDispute && orderReturn?.status === 'DISPUTED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase bg-rose-500/10 text-rose-500 border-rose-500/30">
                      Khiếu nại kiện hoàn (Chờ BQT phân xử)
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase',
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : isRejected
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                      )}
                    >
                      {isApproved
                        ? 'Đã duyệt'
                        : isRejected
                          ? 'Từ chối / Bác bỏ'
                          : 'Chờ thẩm định'}
                    </span>
                  )}
                  {detailModal.data?.detail?.stage && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                      Giai đoạn: {translateReportStage(detailModal.data.detail.stage)}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 pt-1 text-stone-900 dark:text-white">
                  Chi tiết hồ sơ {detailModal.data?.displayCode || detailModal.rawItem?.displayCode || `#${String(detailModal.data?.requestId || detailModal.rawItem?.requestId || detailModal.rawItem?.id).substring(0, 8)}`}
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        detailModal.data?.requestId || detailModal.rawItem?.requestId || detailModal.rawItem?.id,
                      )
                    }
                    title="Sao chép toàn bộ ID"
                    className="text-stone-400 hover:text-amber-500 transition-colors p-1"
                  >
                    <HiOutlineClipboardCopy className="h-4 w-4" />
                  </button>
                </h2>

                <p className="text-xs text-stone-400">
                  Thời gian gửi:{' '}
                  {detailModal.data?.createdAt || detailModal.rawItem?.createdAt
                    ? new Date(
                      detailModal.data?.createdAt || detailModal.rawItem?.createdAt,
                    ).toLocaleString('vi-VN')
                    : 'N/A'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng cửa sổ"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal - Cuộn độc lập (flex-1 overflow-y-auto), không bao giờ bị Footer đè */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {detailModal.loading ? (
                <div className="py-16 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
                  <p className="mt-2 text-xs text-stone-400">Đang tải thông tin chi tiết hồ sơ...</p>
                </div>
              ) : (
                <>
                  {/* Khối 1: Thông tin đối tượng liên quan (Modular Component) */}
                  <AdminReportTargetInfo
                    detail={detailModal.data?.detail}
                    isDark={isDark}
                    getTargetIcon={getTargetIcon}
                    getTargetLabel={getTargetLabel}
                  />

                  {/* Khối 1.5: Thông tin Ký Quỹ Escrow (Dành cho Báo cáo Đơn hàng Order) */}
                  {isOrderReport && (
                    <AdminReportEscrowSection
                      detail={detailModal.data?.detail}
                      isDark={isDark}
                    />
                  )}

                  {/* Khối 2: BỐ CỤC ĐỐI CHẤT 2 PHÍA (BUYER VS SELLER) NẾU CÓ TRANH CHẤP */}
                  {hasSellerResponse ? (
                    <AdminReportDisputeSideBySide
                      detailModal={detailModal}
                      evImgs={evImgs}
                      sellerImgs={sellerImgs}
                      isDark={isDark}
                      setPreviewImage={setPreviewImage}
                    />
                  ) : (
                    /* TRƯỜNG HỢP HỒ SƠ THƯỜNG (Báo cáo sản phẩm, gian hàng, hoặc đơn kháng cáo) */
                    <AdminReportSingleClaim
                      detailModal={detailModal}
                      isReport={isReport}
                      evImgs={evImgs}
                      covImgs={covImgs}
                      isDark={isDark}
                      setPreviewImage={setPreviewImage}
                    />
                  )}

                  {/* Khối 3: Kết quả thẩm định của Quản trị viên (nếu đã xử lý hoặc có phán quyết vòng 1) */}
                  {(Boolean(detailModal.data?.detail?.moderatorNote) || !isPending) && (
                    <div
                      className={cn(
                        'rounded-2xl border p-4 space-y-2',
                        isApproved
                          ? (isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50/70')
                          : (isDark ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50/70'),
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                          {isSellerReturnDispute ? 'Phán quyết Giai đoạn 1 của Quản trị viên (Yêu cầu trả hàng):' : 'Kết quả thẩm định của Quản trị viên:'}
                        </span>
                        <span className="text-xs text-stone-400">
                          {detailModal.data?.reviewedAt
                            ? new Date(detailModal.data.reviewedAt).toLocaleString('vi-VN')
                            : ''}
                        </span>
                      </div>
                      {(detailModal.data?.detail?.policyClauseTitle || detailModal.data?.detail?.policyClauseCode) && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          <span>⚖️ Căn cứ Điều khoản:</span>
                          <span className="underline decoration-amber-500/50">
                            {detailModal.data.detail.policyClauseTitle || detailModal.data.detail.policyClauseCode}
                          </span>
                        </div>
                      )}
                      <p
                        className={cn(
                          'text-xs font-medium',
                          isApproved ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
                        )}
                      >
                        {detailModal.data?.note || detailModal.data?.detail?.moderatorNote || 'Không có ghi chú phản hồi'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Modal - Cố định (shrink-0), hiển thị tách biệt rõ ràng */}
            <div className="shrink-0 p-4 sm:p-5 border-t dark:border-slate-800 border-stone-200 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100',
                )}
              >
                Đóng
              </button>

              {/* Các nút hành động nếu hồ sơ đang chờ duyệt hoặc kiện hoàn đang tranh chấp */}
              {canTakeAction && (
                <div className="flex items-center gap-2.5">
                  {isReport ? (
                    isSellerReturnDispute ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAction('REPORT_APPROVE')}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all shadow-xs"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Chấp thuận Shop khiếu nại (Giải ngân Shop)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction('REPORT_REJECT')}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/20 transition-all"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Bác bỏ Shop khiếu nại (Bồi hoàn Buyer)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAction('REPORT_REJECT')}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Bác bỏ (Bảo vệ Shop)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction('REPORT_APPROVE')}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/20 transition-all"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Xác nhận vi phạm (Phạt Shop)
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction('APPEAL_REJECT')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all shadow-xs"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Từ chối kháng cáo
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('APPEAL_APPROVE')}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Chấp thuận gỡ phạt
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Lightbox Modal Xem Ảnh Phóng To Siêu Nét (Modular Component) */}
          <AdminReportImageLightbox
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
