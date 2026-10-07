import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlineUpload,
  HiX,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

function parseViolationReason(reasonStr) {
  if (!reasonStr) return { tag: null, text: 'Vi phạm tiêu chuẩn cộng đồng' }
  const match = reasonStr.match(/^\[(?:Khiếu nại đơn hàng\s+[\w-]+|\w+)?\s*-?\s*([^\]]+)\]:\s*(.*)$/)
  if (match) {
    return {
      tag: match[1].trim(),
      text: match[2].trim() || 'Người mua khiếu nại vi phạm',
    }
  }
  const matchSimple = reasonStr.match(/^\[([^\]]+)\]:\s*(.*)$/)
  if (matchSimple) {
    return {
      tag: matchSimple[1].trim(),
      text: matchSimple[2].trim(),
    }
  }
  return { tag: null, text: reasonStr }
}

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
  useEffect(() => {
    if (showAppealModal && !selectedViolation && appealableViolations.length > 0) {
      setSelectedViolation(appealableViolations[0])
    }
  }, [showAppealModal, selectedViolation, appealableViolations, setSelectedViolation])

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
              'w-full max-w-xl rounded-[28px] border shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col',
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Sự vụ vi phạm cần kháng cáo <span className="text-rose-500">*</span>
                  </label>
                  {appealableViolations.length > 1 && (
                    <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      {appealableViolations.length} vi phạm
                    </span>
                  )}
                </div>

                {appealableViolations.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                    {appealableViolations.map((v) => {
                      const isSelected = selectedViolation && String(selectedViolation.reportId) === String(v.reportId)
                      const { tag, text } = parseViolationReason(v.reason)
                      const formattedDate = v.createdAt
                        ? new Date(v.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : null

                      return (
                        <div
                          key={v.reportId}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedViolation(v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedViolation(v)
                            }
                          }}
                          className={cn(
                            'w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-3 select-none',
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30'
                              : isDark
                                ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
                                : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-100/70'
                          )}
                        >
                          {/* Radio indicator */}
                          <div className="pt-0.5 shrink-0">
                            <div
                              className={cn(
                                'h-4 w-4 rounded-full border flex items-center justify-center transition-all',
                                isSelected
                                  ? 'border-amber-500 bg-amber-500 text-stone-950'
                                  : isDark
                                    ? 'border-slate-600 bg-slate-800'
                                    : 'border-stone-300 bg-white'
                              )}
                            >
                              {isSelected && <HiCheck className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0',
                                    v.targetType === 'SHOP'
                                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                      : v.targetType === 'ORDER'
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  )}
                                >
                                  {v.targetType === 'SHOP'
                                    ? 'Gian hàng'
                                    : v.targetType === 'ORDER'
                                      ? 'Đơn hàng'
                                      : 'Sản phẩm'}
                                </span>
                                <span
                                  className={cn(
                                    'text-xs font-bold break-all',
                                    isDark ? 'text-white' : 'text-stone-900'
                                  )}
                                >
                                  {v.targetName}
                                </span>
                              </div>

                              {formattedDate && (
                                <div className="flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
                                  <HiOutlineClock className="h-3 w-3" />
                                  <span>{formattedDate}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-xs leading-relaxed break-words">
                              {tag && (
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20 mr-1.5 mb-1">
                                  {tag}
                                </span>
                              )}
                              <span className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                                {text}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                    <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                    <span>Không có vi phạm nào đủ điều kiện kháng cáo vào lúc này.</span>
                  </div>
                )}
              </div>

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
