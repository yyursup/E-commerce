import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function SellerReturnDisputeModal({
  isOpen,
  onClose,
  isDark,
  submitting,
  disputeCondition,
  setDisputeCondition,
  disputeNote,
  setDisputeNote,
  evidenceUrls,
  setEvidenceUrls,
  uploadingImage,
  fileInputRef,
  onImageUpload,
  onSubmit,
}) {
  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900',
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800 border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
                  <HiOutlineExclamation className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-base">Khiếu Nại Kiện Hàng Hoàn Trả</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Nếu sản phẩm nhận về bị hỏng hóc, sai hàng hoặc thiếu phụ kiện, bạn hãy gửi khiếu nại kèm hình ảnh/video bằng chứng rõ ràng. Ban Quản Trị sàn sẽ vào cuộc phân xử công bằng.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tình trạng thực tế kiện hàng: <span className="text-rose-500">*</span></label>
                <select
                  value={disputeCondition}
                  onChange={(e) => setDisputeCondition(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium',
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-900',
                  )}
                >
                  <option value="DAMAGED">Hàng bị vỡ / trầy xước / hư hại nặng</option>
                  <option value="WRONG_ITEM">Gửi sai sản phẩm / không đúng hàng của Shop</option>
                  <option value="INCOMPLETE">Thiếu phụ kiện / quà tặng kèm theo</option>
                  <option value="NOT_RETURNED">Hộp rỗng / không có hàng bên trong</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Chi tiết khiếu nại & mô tả thiệt hại: <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder="Mô tả cụ thể tình trạng hàng hóa nhận về, số lượng hư hại..."
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500',
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-200',
                  )}
                />
              </div>

              {/* Upload bằng chứng ảnh/video */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold">
                    Ảnh / Video bằng chứng thực tế: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {evidenceUrls.length}/4 tệp (Ảnh tối đa 10MB, Video tối đa 50MB)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {evidenceUrls.map((url, i) => {
                    const isVid = isVideoUrl(url)
                    return (
                      <div
                        key={i}
                        className="relative rounded-xl border overflow-hidden h-24 bg-stone-900/10 group dark:border-slate-700 border-stone-200"
                      >
                        {isVid ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg bg-white/80 hover:bg-white text-stone-900 transition"
                          >
                            <HiOutlineExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEvidenceUrls((prev) => prev.filter((_, idx) => idx !== i))}
                            className="p-1 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {evidenceUrls.length < 4 && (
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition text-[11px] font-medium disabled:opacity-50',
                        isDark
                          ? 'border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400'
                          : 'border-stone-300 hover:border-rose-500 text-stone-500 hover:text-rose-600',
                      )}
                    >
                      <HiOutlineUpload className="h-5 w-5" />
                      <span>{uploadingImage ? 'Đang tải...' : 'Tải tệp lên'}</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t dark:border-slate-800 border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting || uploadingImage}
                onClick={onSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <HiOutlineExclamation className="h-4 w-4" />
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi khiếu nại tới BQT'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
