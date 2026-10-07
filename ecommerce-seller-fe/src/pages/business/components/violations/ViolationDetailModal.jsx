import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineXCircle,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function ViolationDetailModal({
  detailViolation,
  setDetailViolation,
  isDark,
  parseImages,
  handleOpenAppealModal,
}) {
  return (
    <AnimatePresence>
      {detailViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-2xl rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                    detailViolation.targetType === 'SHOP'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  )}>
                    {detailViolation.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}
                  </span>
                  <h2 className="text-base font-bold">Hồ Sơ Vi Phạm #{String(detailViolation.reportId || detailViolation.targetId).substring(0, 8)}</h2>
                </div>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Thời gian ghi nhận: {detailViolation.createdAt ? new Date(detailViolation.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailViolation(null)}
                className={cn(
                  'p-2 rounded-xl text-stone-400 hover:text-stone-600 transition',
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-100'
                )}
              >
                <HiOutlineXCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Đối tượng vi phạm */}
            <div className={cn(
              'p-3.5 rounded-2xl border text-xs space-y-1',
              isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50'
            )}>
              <span className="text-stone-400 font-medium">Đối tượng liên quan:</span>
              <p className="font-bold text-sm text-amber-500">{detailViolation.targetName}</p>
            </div>

            {/* Lý do / Nội dung vi phạm */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Nội dung vi phạm được ghi nhận:
              </label>
              <div className={cn(
                'p-3.5 rounded-2xl border text-xs leading-relaxed',
                isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-stone-50 text-stone-800'
              )}>
                {detailViolation.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng và quy định bán hàng.'}
              </div>
            </div>

            {/* Phán quyết BQT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Kết luận & Phán quyết của Ban Quản Trị:
              </label>
              <div className={cn(
                'p-3.5 rounded-2xl border text-xs leading-relaxed',
                isDark ? 'border-amber-500/20 bg-amber-500/5 text-amber-300' : 'border-amber-200 bg-amber-50/50 text-amber-800'
              )}>
                {detailViolation.adminNote || 'Hồ sơ đã được Ban Quản Trị kiểm duyệt, xác minh bằng chứng và áp dụng chế tài tương ứng.'}
              </div>
            </div>

            {/* Tách bạch 2 mục hình ảnh: Bằng chứng vs Minh họa của Shop */}
            {(() => {
              const evImgs = parseImages(detailViolation.evidenceUrl)
              const covImgs = parseImages(detailViolation.coverImageUrl)

              if (!evImgs.length && !covImgs.length) {
                return (
                  <div className={cn(
                    'p-4 rounded-2xl border text-center text-xs text-stone-400',
                    isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50'
                  )}>
                    Không có tệp hình ảnh đính kèm trong hồ sơ này.
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {/* Mục 1: Hình ảnh bằng chứng vi phạm */}
                  {evImgs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                          Hình ảnh bằng chứng vi phạm ({evImgs.length} ảnh):
                        </label>
                        <span className="text-[11px] text-stone-400">Do người báo cáo cung cấp</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {evImgs.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group overflow-hidden rounded-2xl border border-red-500/25 bg-stone-900/10 h-32 flex items-center justify-center"
                          >
                            <img
                              src={imgUrl}
                              alt={`Bằng chứng ${idx + 1}`}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                              >
                                <HiOutlineExternalLink className="h-4 w-4" />
                                Xem ảnh gốc
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mục 2: Hình ảnh minh họa của shop */}
                  {covImgs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                          Hình ảnh minh họa của gian hàng / sản phẩm ({covImgs.length} ảnh):
                        </label>
                        <span className="text-[11px] text-stone-400">Hình ảnh gian hàng / sản phẩm bị tố cáo</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {covImgs.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group overflow-hidden rounded-2xl border border-blue-500/25 bg-stone-900/10 h-32 flex items-center justify-center"
                          >
                            <img
                              src={imgUrl}
                              alt={`Minh họa shop ${idx + 1}`}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
                              >
                                <HiOutlineExternalLink className="h-4 w-4" />
                                Xem ảnh gốc
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

            {/* Trạng thái và nút thao tác */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetailViolation(null)}
                className={cn(
                  'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all',
                  isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Đóng
              </button>

              {detailViolation.appealStatus === 'NONE' && (
                <button
                  type="button"
                  onClick={() => {
                    const v = detailViolation
                    setDetailViolation(null)
                    handleOpenAppealModal(v)
                  }}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5"
                >
                  <HiOutlineDocumentText className="h-4 w-4" />
                  Kháng cáo phục hồi uy tín
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
