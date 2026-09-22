import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineClipboardCopy,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

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
  return (
    <AnimatePresence>
      {detailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-2xl rounded-3xl border p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
            )}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b dark:border-slate-800 border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-bold border',
                      (detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
                    )}
                  >
                    {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
                      ? 'Báo Cáo Vi Phạm'
                      : 'Đơn Kháng Cáo'}
                  </span>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-bold border',
                      (detailModal.data?.status || detailModal.rawItem?.status) === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : (detailModal.data?.status || detailModal.rawItem?.status) === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                    )}
                  >
                    {(detailModal.data?.status || detailModal.rawItem?.status) === 'APPROVED'
                      ? 'Đã duyệt'
                      : (detailModal.data?.status || detailModal.rawItem?.status) === 'REJECTED'
                        ? 'Từ chối / Bác bỏ'
                        : 'Chờ thẩm định'}
                  </span>
                </div>
                <h2 className="text-lg font-bold mt-2 flex items-center gap-2">
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
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal (Cuộn được) */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {detailModal.loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
                  <p className="mt-2 text-xs text-stone-400">Đang tải thông tin chi tiết...</p>
                </div>
              ) : (
                <>
                  {/* Phần 1: Đối tượng bị báo cáo / kháng cáo */}
                  <div
                    className={cn(
                      'rounded-2xl border p-4 space-y-2',
                      isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTargetIcon(detailModal.data?.detail?.targetType)}
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                        Đối tượng liên quan: {getTargetLabel(detailModal.data?.detail?.targetType)}
                      </span>
                    </div>

                    {detailModal.data?.detail ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px]">
                            Tên đối tượng:
                          </span>
                          <span className="text-sm font-bold text-stone-900 dark:text-white">
                            {detailModal.data.detail.targetName || 'Chưa có thông tin'}
                          </span>
                        </div>

                        {detailModal.data.detail.targetInfo && (
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px]">
                              Thông tin bổ sung:
                            </span>
                            <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
                              {detailModal.data.detail.targetInfo}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 dark:text-slate-400 italic">
                        Không tìm thấy thông tin đối tượng chi tiết trong hồ sơ.
                      </p>
                    )}
                  </div>

                  {/* Phần 2: Nội dung báo cáo / giải trình */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                      {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
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

                  {/* Phần 3: Bằng chứng / Ảnh / Chứng từ đính kèm (Phân tách rõ ràng) */}
                  {(() => {
                    const evImgs = parseImages(detailModal.data?.detail?.evidenceUrl)
                    const covImgs = parseImages(
                      detailModal.data?.coverImageUrl,
                      detailModal.rawItem?.coverImageUrl
                    )

                    if (!evImgs.length && !covImgs.length) {
                      return (
                        <div
                          className={cn(
                            'p-4 rounded-2xl border text-center text-xs text-stone-400',
                            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50',
                          )}
                        >
                          Không có tệp hình ảnh hoặc tài liệu bằng chứng đính kèm.
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {/* Mục 1: Bằng chứng vi phạm từ người tố cáo */}
                        {evImgs.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                                Hình ảnh bằng chứng vi phạm ({evImgs.length} tệp):
                              </label>
                              <span className="text-[11px] text-stone-400">Do người tố cáo tải lên làm bằng chứng</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {evImgs.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  className="relative group overflow-hidden rounded-2xl border border-red-500/25 bg-stone-900/10 h-36 flex items-center justify-center p-1.5"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Bằng chứng vi phạm ${idx + 1}`}
                                    className="h-full w-full object-cover rounded-xl"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                                    <span className="text-[11px] text-white font-medium">Bằng chứng #{idx + 1}</span>
                                    <a
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-transform active:scale-95"
                                    >
                                      <HiOutlineExternalLink className="h-4 w-4" />
                                      Mở tab mới
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mục 2: Hình ảnh minh họa của gian hàng / sản phẩm */}
                        {covImgs.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                                Hình ảnh minh họa của gian hàng / sản phẩm ({covImgs.length} tệp):
                              </label>
                              <span className="text-[11px] text-stone-400">Hình ảnh gian hàng hoặc sản phẩm bị tố cáo</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {covImgs.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  className="relative group overflow-hidden rounded-2xl border border-blue-500/25 bg-stone-900/10 h-36 flex items-center justify-center p-1.5"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Minh họa shop ${idx + 1}`}
                                    className="h-full w-full object-cover rounded-xl"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                                    <span className="text-[11px] text-white font-medium">Minh họa #{idx + 1}</span>
                                    <a
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition-transform active:scale-95"
                                    >
                                      <HiOutlineExternalLink className="h-4 w-4" />
                                      Mở tab mới
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Phần 4: Lịch sử thẩm định (nếu đã xử lý) */}
                  {(detailModal.data?.status || detailModal.rawItem?.status) !== 'PENDING' && (
                    <div
                      className={cn(
                        'rounded-2xl border p-4 space-y-2',
                        isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                          Kết quả thẩm định của Quản trị viên:
                        </span>
                        <span className="text-xs text-stone-400">
                          {detailModal.data?.reviewedAt
                            ? new Date(detailModal.data.reviewedAt).toLocaleString('vi-VN')
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {detailModal.data?.note || detailModal.data?.detail?.moderatorNote || 'Không có ghi chú phản hồi'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t dark:border-slate-800 border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100',
                )}
              >
                Đóng
              </button>

              {/* Các nút hành động nếu hồ sơ đang chờ duyệt */}
              {(detailModal.data?.status || detailModal.rawItem?.status) === 'PENDING' && (
                <div className="flex items-center gap-2">
                  {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'REPORT_APPROVE',
                            item: detailModal.rawItem || detailModal.data,
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-sm transition-all"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Xác nhận vi phạm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'REPORT_REJECT',
                            item: detailModal.rawItem || detailModal.data,
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Bác bỏ
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'APPEAL_APPROVE',
                            item: detailModal.rawItem || detailModal.data,
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        Chấp thuận gỡ phạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal({
                            isOpen: true,
                            type: 'APPEAL_REJECT',
                            item: detailModal.rawItem || detailModal.data,
                            note: '',
                          })
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
