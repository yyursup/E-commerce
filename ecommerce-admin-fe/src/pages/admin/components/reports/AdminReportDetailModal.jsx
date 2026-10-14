import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineClipboardCopy,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

const renderTargetInfo = (targetInfo, isDark) => {
  if (!targetInfo) return null;

  // Nếu targetInfo chứa các trường phân cách bởi '|' (ví dụ Đơn hàng: Gian hàng | Người mua | Tổng tiền...)
  if (targetInfo.includes('|')) {
    const parts = targetInfo.split('|').map((p) => p.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {parts.map((part, index) => {
          const colonIndex = part.indexOf(':');
          if (colonIndex === -1) {
            return (
              <span
                key={index}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-xs font-medium border',
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                )}
              >
                {part}
              </span>
            );
          }

          const label = part.substring(0, colonIndex).trim();
          let value = part.substring(colonIndex + 1).trim();

          // Format lại trường tiền tệ (ví dụ 16400500.00 đ -> 16.400.500 đ)
          const isPrice = label.toLowerCase().includes('tiền') || value.endsWith('đ') || value.endsWith('₫');
          if (isPrice) {
            const numericPart = value.replace(/đ|₫|VND/gi, '').trim();
            const parsed = parseFloat(numericPart);
            if (!isNaN(parsed)) {
              value = new Intl.NumberFormat('vi-VN').format(parsed) + ' đ';
            }
          }

          const isStatus = label.toLowerCase().includes('trạng thái');
          const isPayment = label.toLowerCase().includes('pttt') || label.toLowerCase().includes('thanh toán');
          const isReturn = label.toLowerCase().includes('hoàn') || label.toLowerCase().includes('kiện');

          return (
            <div
              key={index}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border shadow-xs transition-all',
                isPrice
                  ? (isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold' : 'bg-rose-50 border-rose-200 text-rose-700 font-bold')
                  : isStatus
                    ? (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold' : 'bg-amber-50 border-amber-200 text-amber-700 font-bold')
                    : isPayment
                      ? (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 font-semibold' : 'bg-blue-50 border-blue-200 text-blue-700 font-semibold')
                      : isReturn
                        ? (isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold' : 'bg-purple-50 border-purple-200 text-purple-700 font-semibold')
                        : (isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700')
              )}
            >
              <span className="text-stone-400 dark:text-slate-400 font-normal">{label}:</span>
              <span className={cn('font-semibold', isPrice && 'font-mono text-xs sm:text-sm tracking-tight')}>{value}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const formattedText = targetInfo.replace(/(\d+(?:\.\d+)?)\s*(?:đ|₫)/g, (match, p1) => {
    const parsed = parseFloat(p1);
    return isNaN(parsed) ? match : new Intl.NumberFormat('vi-VN').format(parsed) + ' đ';
  });

  return (
    <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
      {formattedText}
    </span>
  );
};

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

  // Kiểm tra xem đây có phải là vụ việc tranh chấp đơn hàng có phản hồi/đối chất từ phía Người bán hay không
  const hasSellerResponse = Boolean(
    detailModal.data?.detail?.sellerResponse ||
    detailModal.data?.detail?.sellerAction ||
    detailModal.data?.detail?.sellerEvidenceUrl ||
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
                  {detailModal.data?.detail?.stage && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                      Giai đoạn: {detailModal.data.detail.stage}
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
                onClick={() => setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })}
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
                  {/* Khối 1: Đối tượng liên quan */}
                  <div
                    className={cn(
                      'rounded-2xl border p-4 space-y-2.5 transition-all',
                      isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/80',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTargetIcon(detailModal.data?.detail?.targetType)}
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                        Đối tượng liên quan: {getTargetLabel(detailModal.data?.detail?.targetType)}
                      </span>
                    </div>

                    {detailModal.data?.detail ? (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px] shrink-0">
                            Tên đối tượng:
                          </span>
                          <span className="text-sm font-bold text-stone-900 dark:text-white">
                            {detailModal.data.detail.targetName || 'Chưa có thông tin'}
                          </span>
                        </div>

                        {detailModal.data.detail.targetInfo && (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 pt-0.5">
                            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px] shrink-0 pt-1">
                              Thông tin bổ sung:
                            </span>
                            <div className="flex-1">
                              {renderTargetInfo(detailModal.data.detail.targetInfo, isDark)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 dark:text-slate-400 italic">
                        Không tìm thấy thông tin đối tượng chi tiết trong hồ sơ.
                      </p>
                    )}
                  </div>

                  {/* Khối 2: BỐ CỤC ĐỐI CHẤT 2 PHÍA (BUYER VS SELLER) NẾU CÓ TRANH CHẤP */}
                  {hasSellerResponse ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 flex items-center gap-1.5">
                          <HiOutlineShieldCheck className="h-4 w-4 text-amber-500" />
                          Hồ sơ đối chất 2 phía (Thương lượng & Bằng chứng):
                        </label>
                        <span className="text-[11px] text-stone-400">
                          BQT đối soát chéo bằng chứng trước khi phán quyết
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CỘT 1: PHÍA NGƯỜI MUA (BUYER) */}
                        <div
                          className={cn(
                            'rounded-2xl border p-4 flex flex-col justify-between space-y-3',
                            isDark
                              ? 'border-rose-500/20 bg-rose-500/5'
                              : 'border-rose-200 bg-rose-50/50',
                          )}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-1 border-b border-rose-200/60 dark:border-rose-900/60">
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <HiOutlineExclamationCircle className="h-4 w-4" />
                                1. Phía Người Mua Khiếu Nại
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                                Người tố cáo
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                                Lý do & Mô tả vi phạm:
                              </span>
                              <div
                                className={cn(
                                  'p-3 rounded-xl border text-xs leading-relaxed max-h-36 overflow-y-auto',
                                  isDark
                                    ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                                    : 'border-rose-100 bg-white text-stone-800',
                                )}
                              >
                                {detailModal.data?.description || detailModal.rawItem?.description || 'Không có mô tả chi tiết'}
                              </div>
                            </div>
                          </div>

                          {/* Bằng chứng vi phạm từ Buyer */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                Bằng chứng vi phạm / mở hộp ({evImgs.length}/4 tệp):
                              </span>
                            </div>

                            {evImgs.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {evImgs.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setPreviewImage(imgUrl)}
                                    className="relative group aspect-square rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800/80 bg-stone-900/10 cursor-pointer shadow-xs"
                                    title="Nhấn để xem phóng to"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Bằng chứng Buyer ${idx + 1}`}
                                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <HiOutlineEye className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 italic py-2">
                                Người mua không đính kèm ảnh bằng chứng.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* CỘT 2: PHÍA NGƯỜI BÁN (SELLER) */}
                        <div
                          className={cn(
                            'rounded-2xl border p-4 flex flex-col justify-between space-y-3',
                            isDark
                              ? 'border-sky-500/20 bg-sky-500/5'
                              : 'border-sky-200 bg-sky-50/50',
                          )}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-1 border-b border-sky-200/60 dark:border-sky-900/60">
                              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                <HiOutlineShoppingBag className="h-4 w-4" />
                                2. Phía Người Bán (Shop)
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                                Bị tố cáo
                              </span>
                            </div>

                            {/* Quyết định/Hành động của Shop */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                                Hành động của Shop:
                              </span>
                              <div>
                                <span
                                  className={cn(
                                    'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border',
                                    detailModal.data?.detail?.sellerAction === 'REJECT_AND_ESCALATE'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                      : detailModal.data?.detail?.sellerAction === 'ACCEPT_REFUND'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                                  )}
                                >
                                  {detailModal.data?.detail?.sellerAction === 'ACCEPT_REFUND' && 'Đồng ý hoàn tiền'}
                                  {detailModal.data?.detail?.sellerAction === 'ACCEPT_RETURN' && 'Đồng ý nhận lại hàng đổi trả'}
                                  {detailModal.data?.detail?.sellerAction === 'REJECT_AND_ESCALATE' && 'Từ chối & Khiếu nại lên BQT'}
                                  {!detailModal.data?.detail?.sellerAction && 'Chưa có phản hồi'}
                                </span>
                              </div>
                            </div>

                            {/* Lời trần tình của Shop */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                                Giải trình từ Shop:
                              </span>
                              <div
                                className={cn(
                                  'p-3 rounded-xl border text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line',
                                  isDark
                                    ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                                    : 'border-sky-100 bg-white text-stone-800',
                                )}
                              >
                                {detailModal.data?.detail?.sellerResponse || 'Shop chưa để lại lời giải trình chi tiết'}
                              </div>
                            </div>
                          </div>

                          {/* Bằng chứng đóng gói / test seal từ Shop */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                Ảnh đóng gói / test do Shop cung cấp ({sellerImgs.length}/4 tệp):
                              </span>
                            </div>

                            {sellerImgs.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {sellerImgs.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setPreviewImage(imgUrl)}
                                    className="relative group aspect-square rounded-xl overflow-hidden border border-sky-200 dark:border-sky-800/80 bg-stone-900/10 cursor-pointer shadow-xs"
                                    title="Nhấn để xem phóng to"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Chứng cứ Shop ${idx + 1}`}
                                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <HiOutlineEye className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 italic py-2">
                                Shop không tải lên ảnh bằng chứng đối soát.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TRƯỜNG HỢP HỒ SƠ THƯỜNG (Báo cáo sản phẩm, gian hàng, hoặc đơn kháng cáo) */
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                          {isReport
                            ? 'Mô tả vi phạm từ người tố cáo:'
                            : 'Nội dung trần tình & giải trình kháng cáo:'}
                        </label>
                        <div
                          className={cn(
                            'p-3.5 rounded-2xl border text-xs leading-relaxed',
                            isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-white text-stone-800',
                          )}
                        >
                          {detailModal.data?.description || detailModal.rawItem?.description || 'Không có mô tả chi tiết'}
                        </div>
                      </div>

                      {/* Hình ảnh bằng chứng vi phạm */}
                      {evImgs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                              Hình ảnh bằng chứng vi phạm ({evImgs.length} tệp):
                            </label>
                            <span className="text-[11px] text-stone-400">Do người tố cáo tải lên</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {evImgs.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="relative group aspect-square rounded-2xl overflow-hidden border border-rose-500/25 bg-stone-900/10 cursor-pointer shadow-xs"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Bằng chứng vi phạm ${idx + 1}`}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <HiOutlineEye className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hình ảnh minh họa gian hàng / sản phẩm (nếu khác với evidence) */}
                      {covImgs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                              Hình ảnh minh họa sản phẩm / gian hàng ({covImgs.length} tệp):
                            </label>
                            <span className="text-[11px] text-stone-400">Ảnh hệ thống ghi nhận</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {covImgs.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="relative group aspect-square rounded-2xl overflow-hidden border border-blue-500/25 bg-stone-900/10 cursor-pointer shadow-xs"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Minh họa shop ${idx + 1}`}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <HiOutlineEye className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {evImgs.length === 0 && covImgs.length === 0 && (
                        <div
                          className={cn(
                            'p-4 rounded-2xl border text-center text-xs text-stone-400',
                            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50',
                          )}
                        >
                          Không có tệp hình ảnh hoặc tài liệu bằng chứng đính kèm.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Khối 3: Kết quả thẩm định của Quản trị viên (nếu đã xử lý) */}
                  {!isPending && (
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
                          Kết quả thẩm định của Quản trị viên:
                        </span>
                        <span className="text-xs text-stone-400">
                          {detailModal.data?.reviewedAt
                            ? new Date(detailModal.data.reviewedAt).toLocaleString('vi-VN')
                            : ''}
                        </span>
                      </div>
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
                onClick={() => setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100',
                )}
              >
                Đóng
              </button>

              {/* Các nút hành động nếu hồ sơ đang chờ duyệt */}
              {isPending && (
                <div className="flex items-center gap-2.5">
                  {isReport ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'REPORT_REJECT',
                            item: {
                              ...(detailModal.rawItem || {}),
                              ...(detailModal.data || {}),
                              targetType: detailModal.data?.detail?.targetType || detailModal.rawItem?.targetType,
                              detail: detailModal.data?.detail,
                            },
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Bác bỏ (Bảo vệ Shop)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'REPORT_APPROVE',
                            item: {
                              ...(detailModal.rawItem || {}),
                              ...(detailModal.data || {}),
                              targetType: detailModal.data?.detail?.targetType || detailModal.rawItem?.targetType,
                              detail: detailModal.data?.detail,
                            },
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/20 transition-all"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Xác nhận vi phạm (Phạt Shop)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'APPEAL_REJECT',
                            item: {
                              ...(detailModal.rawItem || {}),
                              ...(detailModal.data || {}),
                              targetType: detailModal.data?.detail?.targetType || detailModal.rawItem?.targetType,
                              detail: detailModal.data?.detail,
                            },
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all shadow-xs"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Từ chối kháng cáo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'APPEAL_APPROVE',
                            item: {
                              ...(detailModal.rawItem || {}),
                              ...(detailModal.data || {}),
                              targetType: detailModal.data?.detail?.targetType || detailModal.rawItem?.targetType,
                              detail: detailModal.data?.detail,
                            },
                            note: '',
                          })
                        }}
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

          {/* Lightbox Modal Xem Ảnh Phóng To Siêu Nét */}
          <AnimatePresence>
            {previewImage && (
              <div
                onClick={() => setPreviewImage(null)}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-4xl max-h-[88vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex flex-col"
                >
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <a
                      href={previewImage}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all inline-flex items-center gap-1"
                      title="Mở tab mới"
                    >
                      <HiOutlineExternalLink className="h-4 w-4" />
                      Mở ảnh gốc
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all"
                      title="Đóng xem ảnh"
                    >
                      <HiOutlineX className="h-4 w-4" />
                    </button>
                  </div>
                  <img
                    src={previewImage}
                    alt="Phóng to ảnh bằng chứng"
                    className="max-h-[82vh] max-w-full object-contain mx-auto"
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}

