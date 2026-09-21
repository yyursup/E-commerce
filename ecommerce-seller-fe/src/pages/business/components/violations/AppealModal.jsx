import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlineUpload,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h2 className="text-lg font-bold mb-1">Gửi Đơn Kháng Cáo Vi Phạm</h2>
            <p className={cn('text-xs mb-4', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Vui lòng cung cấp đầy đủ lý do giải trình và tải lên hình ảnh bằng chứng (hóa đơn VAT, chứng từ phân phối)
            </p>

            <form onSubmit={handleSubmitAppeal} className="space-y-4">
              {/* Chọn vi phạm cần kháng cáo */}
              <div>
                <label className="block text-xs font-bold mb-1">Chọn vi phạm cần kháng cáo *</label>
                {appealableViolations.length > 0 ? (
                  <select
                    value={selectedViolation?.reportId || ''}
                    onChange={(e) => {
                      const found = appealableViolations.find((v) => String(v.reportId) === e.target.value)
                      setSelectedViolation(found || null)
                    }}
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none font-medium',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  >
                    {appealableViolations.map((v) => (
                      <option key={v.reportId} value={v.reportId}>
                        [{v.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}] {v.targetName} - {v.reason || 'Báo cáo'} ({v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-500">
                    Không có vi phạm nào đủ điều kiện kháng cáo vào lúc này.
                  </p>
                )}
              </div>

              {/* Thông tin đối tượng được hiển thị trực quan (KHÔNG HIỆN MÃ SHOP ID UUID) */}
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
                <label className="block text-xs font-bold mb-1">Nội dung giải trình *</label>
                <textarea
                  rows={4}
                  placeholder="Trình bày chi tiết lý do bạn cho rằng phán quyết là nhầm lẫn hoặc nguyên nhân khách quan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className={cn(
                    'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none',
                    isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                  )}
                />
              </div>

              {/* Upload hình ảnh tài liệu chứng từ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold">
                    Hình ảnh tài liệu / Hóa đơn chứng từ ({evidenceUrls.length})
                  </label>
                  <span className="text-[11px] text-stone-400">Tối đa 10MB / ảnh</span>
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
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {evidenceUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-32 bg-stone-900/10">
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
                      <span className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB / ảnh)</span>
                    </div>
                  )}
                </div>
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
