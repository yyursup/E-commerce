import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiStar, HiX, HiOutlineScale, HiOutlineUpload, HiOutlineExclamationCircle } from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'
import requestService from '../services/request'
import toast from 'react-hot-toast'

export default function ReviewAppealModal({ isOpen, onClose, review, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !review) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Vui lòng nhập lý do / giải trình kháng cáo.')
      return
    }

    try {
      setSubmitting(true)
      await requestService.createAppeal({
        targetType: 'REVIEW',
        targetId: review.id,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || null,
      })
      toast.success('Gửi đơn kháng cáo thành công! Quản trị viên sẽ thẩm định hồ sơ của bạn.')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Appeal review error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Có lỗi xảy ra khi nộp đơn kháng cáo.')
    } finally {
      setSubmitting(false)
    }
  }

  const isHidden = review.status === 'HIDDEN'
  const flagCount = review.flagCount || review.reportCount || 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative my-8',
            isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b dark:border-slate-800 border-stone-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
                <HiOutlineScale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Kháng Cáo Đánh Giá Vi Phạm</h3>
                <p className="text-xs text-stone-400">Gửi hồ sơ giải trình minh oan tới ban quản trị sàn</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Thông tin đánh giá bị cảnh báo/bị ẩn */}
            <div
              className={cn(
                'rounded-2xl border p-4 space-y-2.5',
                isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
              )}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-rose-500">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                <span>
                  {isHidden
                    ? `Đánh giá đã bị ẩn (Nhận ${flagCount} lượt báo cáo vi phạm)`
                    : `Đánh giá đang bị gắn cờ cảnh báo (${flagCount} lượt báo cáo vi phạm)`}
                </span>
              </div>

              {review.productName && (
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Sản phẩm: <span className="font-semibold text-stone-800 dark:text-slate-200">{review.productName}</span>
                </p>
              )}

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <HiStar
                    key={star}
                    className={cn('h-4 w-4', star <= review.rating ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600')}
                  />
                ))}
                <span className="text-xs font-bold text-amber-500 ml-1.5">{review.rating} sao</span>
              </div>

              <p className="text-xs italic text-stone-600 dark:text-slate-300 line-clamp-3 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-stone-200/50 dark:border-slate-700/50">
                &ldquo;{review.comment || 'Không có bình luận chữ'}&rdquo;
              </p>
            </div>

            {/* Lý do giải trình */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Lý do / Văn bản giải trình <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giải thích rõ bối cảnh trải nghiệm thực tế của bạn, lý do bạn cho rằng đánh giá bị báo cáo sai sự thật hoặc bị đối thủ cạnh tranh chơi xấu..."
                className={cn(
                  'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none transition',
                  isDark
                    ? 'border-slate-800 bg-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500'
                    : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-500',
                )}
              />
            </div>

            {/* Link ảnh hoặc chứng từ chứng minh */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Đường dẫn ảnh chụp thực tế / Hóa đơn chứng từ (tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... (Ảnh mở hộp, tin nhắn với shop hoặc video bằng chứng)"
                  className={cn(
                    'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none transition',
                    isDark
                      ? 'border-slate-800 bg-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500'
                      : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-500',
                  )}
                />
              </div>
              <p className="text-[11px] text-stone-400">
                Cung cấp hình ảnh sản phẩm bạn nhận được thực tế để chứng minh trải nghiệm chân thực của bạn.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t dark:border-slate-800 border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition',
                  isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-500 hover:bg-stone-100',
                )}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 transition shadow-sm"
              >
                <HiOutlineUpload className="h-4 w-4" />
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi đơn kháng cáo'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
