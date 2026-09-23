import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiStar, HiX, HiOutlineScale, HiOutlineUpload, HiOutlineExclamationCircle, HiOutlineTrash, HiOutlineExternalLink } from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'
import requestService from '../services/request'
import fileService from '../services/fileService'
import toast from 'react-hot-toast'

export default function ReviewAppealModal({ isOpen, onClose, review, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [description, setDescription] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !review) return null

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const MAX_IMAGES = 4
    const remainingSlots = MAX_IMAGES - evidenceUrls.length

    if (remainingSlots <= 0) {
      toast.error('Chỉ được tải lên tối đa 4 hình ảnh chứng minh!')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const validFiles = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB!`)
      } else {
        validFiles.push(file)
      }
    }

    if (!validFiles.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    let filesToUpload = validFiles
    if (validFiles.length > remainingSlots) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh. Hệ thống sẽ xử lý ${remainingSlots} ảnh hợp lệ đầu tiên.`)
      filesToUpload = validFiles.slice(0, remainingSlots)
    }

    try {
      setUploadingImage(true)
      const uploaded = []
      for (const file of filesToUpload) {
        const res = await fileService.uploadFile(file, 'appeals')
        const uploadedUrl = res?.url || res?.data?.url
        if (uploadedUrl) {
          uploaded.push(uploadedUrl)
        }
      }

      if (uploaded.length > 0) {
        setEvidenceUrls((prev) => [...prev, ...uploaded])
        toast.success(`Đã tải lên ${uploaded.length} ảnh chứng minh thành công!`)
      } else {
        toast.error('Không nhận được link ảnh từ máy chủ.')
      }
    } catch (err) {
      console.error('Upload image error:', err)
      toast.error(err?.message || 'Tải ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
        evidenceUrl: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
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

            {/* Upload ảnh hoặc chứng từ chứng minh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Ảnh chụp thực tế / Bằng chứng ({evidenceUrls.length}/4)
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
                        alt={`Bằng chứng ${idx + 1}`}
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
                  <span className="text-xs font-medium">Đã đạt giới hạn tối đa 4/4 ảnh chứng minh</span>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-colors',
                    uploadingImage ? 'opacity-50 pointer-events-none' : '',
                    isDark
                      ? 'border-slate-700 hover:border-amber-500 bg-slate-800/50'
                      : 'border-stone-300 hover:border-amber-500 bg-stone-50'
                  )}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
                      <span className="text-xs font-semibold text-amber-500">Đang tải ảnh lên...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500">
                        <HiOutlineUpload className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold">
                        {evidenceUrls.length > 0 ? '+ Thêm ảnh chứng minh khác' : 'Bấm để tải ảnh chứng minh lên'}
                      </span>
                      <span className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 4 ảnh, 10MB / ảnh)</span>
                    </div>
                  )}
                </div>
              )}
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
