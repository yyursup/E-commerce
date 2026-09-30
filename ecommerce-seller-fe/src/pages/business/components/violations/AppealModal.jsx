import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlineUpload,
  HiX,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AppealModal({
  showAppealModal,
  setShowAppealModal,
  isDark,
  handleSubmitAppeal,
  appealableViolations,
  selectedViolation,
  setSelectedViolation,
  description,
  setDescription,
  evidenceUrls,
  setEvidenceUrls,
  uploadingImage,
  fileInputRef,
  handleImageUpload,
  submitting,
}) {
  return (
    <AnimatePresence>
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'w-full max-w-lg rounded-[28px] border shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col',
              isDark ? 'border-slate-800 bg-slate-900 text-white shadow-amber-950/20' : 'border-stone-200 bg-white text-stone-900 shadow-stone-400/20'
            )}
          >
            {/* Header Modal */}
            <div className={cn(
              'flex items-center justify-between px-5 sm:px-6 py-4.5 border-b shrink-0',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-100 bg-stone-50/50'
            )}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-sm">
                  <HiOutlineShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Gửi Đơn Kháng Cáo Vi Phạm</h2>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Giải trình và đính kèm bằng chứng để khôi phục điểm uy tín
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className={cn(
                  'rounded-xl p-2 transition-all',
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-stone-100 text-stone-400 hover:text-stone-800'
                )}
                aria-label="Đóng modal"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAppeal} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Chọn vi phạm cần kháng cáo */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Chọn vi phạm cần kháng cáo <span className="text-rose-500">*</span>
                </label>
                {appealableViolations.length > 0 ? (
                  <select
                    value={selectedViolation?.reportId || ''}
                    onChange={(e) => {
                      const found = appealableViolations.find((v) => String(v.reportId) === e.target.value)
                      setSelectedViolation(found || null)
                    }}
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none font-medium transition focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  >
                    {appealableViolations.map((v) => (
                      <option key={v.reportId} value={v.reportId}>
                        [{v.targetType === 'SHOP' ? 'Gian hàng' : v.targetType === 'ORDER' ? 'Đơn hàng' : 'Sản phẩm'}] {v.targetName} - {v.reason || 'Báo cáo'} ({v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-500">
                    Không có vi phạm nào đủ điều kiện kháng cáo vào lúc này.
                  </p>
                )}
              </div>

              {/* Thông tin đối tượng được hiển thị trực quan */}
              {selectedViolation && (
                <div className={cn(
                  'p-3.5 rounded-2xl border text-xs space-y-1.5',
                  isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-amber-200 bg-amber-50/60 text-stone-800'
                )}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Đối tượng:</span>
                    <span className="font-bold">{selectedViolation.targetName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">Nội dung ghi nhận vi phạm: </span>
                    <span>{selectedViolation.reason || 'Vi phạm tiêu chuẩn cộng đồng'}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Nội dung giải trình <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Trình bày chi tiết lý do bạn cho rằng phán quyết là nhầm lẫn hoặc nguyên nhân khách quan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className={cn(
                    'w-full rounded-2xl p-3.5 text-xs border outline-none resize-none leading-relaxed transition focus:ring-2 focus:ring-amber-500/20',
                    isDark ? 'border-slate-800 bg-slate-800 text-white placeholder-slate-500' : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400'
                  )}
                />
              </div>

              {/* Upload hình ảnh tài liệu chứng từ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold">
                    Hình ảnh tài liệu / Hóa đơn chứng từ ({evidenceUrls.length}/4)
                  </label>
                  <span className="text-[11px] text-stone-400">Tối đa 4 ảnh, 10MB / ảnh</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {evidenceUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {evidenceUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-24 sm:h-28 bg-stone-900/10">
                        <img
                          src={url}
                          alt={`Hình ảnh ${idx + 1}`}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                            title="Xem ảnh gốc"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow"
                            title="Gỡ ảnh"
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
                          {evidenceUrls.length > 0 ? '+ Thêm ảnh chứng từ khác' : 'Bấm để tải ảnh chứng từ lên'}
                        </span>
                        <span className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 4 ảnh, 10MB / ảnh)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all',
                    isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage || !selectedViolation || appealableViolations.length === 0}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Đang gửi...' : 'Nộp đơn kháng cáo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
