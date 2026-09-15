import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlinePhotograph,
  HiOutlineCloudUpload,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineLink,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import fileService from '../services/fileService'
import toast from 'react-hot-toast'

/**
 * Component Upload & Preview Ảnh bìa Shop (Shop Cover Image)
 * @param {Object} props
 * @param {string|null} props.value - URL ảnh bìa hiện tại
 * @param {Function} props.onChange - Callback khi đổi/xóa ảnh (url hoặc null)
 * @param {string} props.error - Thông báo lỗi nếu có
 * @param {boolean} props.disabled - Trạng thái vô hiệu hóa
 * @param {string} props.className - Class tùy biến
 */
export default function ShopCoverImageUpload({
  value,
  onChange,
  error,
  disabled = false,
  className,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const fileInputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [inputMode, setInputMode] = useState('file') // 'file' | 'url'
  const [customUrl, setCustomUrl] = useState('')

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const handleFile = async (file) => {
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('Dung lượng ảnh tối đa là 10MB. Vui lòng chọn ảnh nhỏ hơn.')
      return
    }

    try {
      setUploading(true)
      const res = await fileService.uploadFile(file, 'shop-covers')
      const uploadedUrl = res?.url || res?.data?.url
      if (uploadedUrl) {
        onChange?.(uploadedUrl)
        toast.success('Tải lên ảnh bìa gian hàng thành công!')
      } else {
        throw new Error('Không nhận được URL ảnh từ server.')
      }
    } catch (err) {
      console.error('Upload shop cover error:', err)
      const msg = err?.message || err?.response?.data?.message || 'Lỗi khi tải lên ảnh bìa.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    e.target.value = ''
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || uploading) return
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || uploading) return

    const file = e.dataTransfer?.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = () => {
    onChange?.(null)
    setCustomUrl('')
    toast.success('Đã gỡ ảnh bìa.')
  }

  const handleApplyUrl = () => {
    if (!customUrl?.trim()) {
      toast.error('Vui lòng nhập đường link ảnh hợp lệ')
      return
    }
    onChange?.(customUrl.trim())
    toast.success('Đã áp dụng link ảnh bìa')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Mode Switcher (Upload File vs Nhập Link URL) */}
      {!value && (
        <div className="flex items-center justify-between pb-1">
          <span className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hình thức thêm ảnh bìa:
          </span>
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-all',
                inputMode === 'file'
                  ? 'bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              )}
            >
              Tải file lên
            </button>
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-all',
                inputMode === 'url'
                  ? 'bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              )}
            >
              Nhập link URL
            </button>
          </div>
        </div>
      )}

      {/* Trạng thái 1: Chưa có ảnh & Chế độ Upload File */}
      {!value && inputMode === 'file' && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[140px]',
            dragActive
              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
              : isDark
                ? 'border-slate-700 bg-slate-800/40 hover:border-amber-500/60 hover:bg-slate-800/70'
                : 'border-stone-300 bg-stone-50 hover:border-amber-500 hover:bg-amber-50/40',
            error && 'border-red-500 bg-red-500/5',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-3">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className={cn('mt-3 text-xs font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Đang tải ảnh bìa lên hệ thống lưu trữ...
              </p>
              <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-500' : 'text-stone-500')}>
                Vui lòng đợi giây lát
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'mb-2 flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                  isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600',
                )}
              >
                <HiOutlineCloudUpload className="h-6 w-6" />
              </div>
              <p className={cn('text-xs font-bold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                Kéo thả ảnh bìa vào đây hoặc{' '}
                <span className="text-amber-500 underline underline-offset-2">chọn từ thiết bị</span>
              </p>
              <p className={cn('mt-1 text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Khuyên dùng ảnh ngang tỉ lệ 16:9 (JPG, PNG, WEBP tối đa 10MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Trạng thái 2: Chưa có ảnh & Chế độ Nhập Link URL */}
      {!value && inputMode === 'url' && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <HiOutlineLink className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
            <input
              type="url"
              placeholder="Dán link ảnh bìa (VD: https://domain.com/banner.jpg)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className={cn(
                'w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs outline-none transition placeholder:opacity-60',
                isDark
                  ? 'border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleApplyUrl}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-sm"
          >
            Áp dụng
          </button>
        </div>
      )}

      {/* Trạng thái 3: ĐÃ CÓ ẢNH BÌA -> Hiển thị Live Banner Preview cực đẹp */}
      {value && (
        <div
          className={cn(
            'group relative overflow-hidden rounded-2xl border shadow-sm transition',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          {/* Banner Container */}
          <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-950/20">
            <img
              src={value}
              alt="Ảnh bìa shop"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.src = '/placeholder-banner.png'
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Top Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Ảnh bìa gian hàng
            </div>

            {/* Bottom Actions Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white transition border border-white/15 active:scale-95"
              >
                <HiOutlineEye className="h-3.5 w-3.5" /> Xem lớn
              </button>

              <button
                type="button"
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition shadow-md shadow-amber-500/25 active:scale-95"
              >
                <HiOutlineRefresh className="h-3.5 w-3.5" /> Đổi ảnh
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-1 rounded-xl bg-red-500/80 hover:bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white transition active:scale-95"
                title="Gỡ ảnh bìa"
              >
                <HiOutlineX className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Modal Quick Preview Phóng To */}
      <AnimatePresence>
        {showPreviewModal && value && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-2xl p-4 shadow-2xl',
                isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white',
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
                <h3 className={cn('text-sm font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-stone-900')}>
                  <HiOutlinePhotograph className="h-4 w-4 text-amber-500" />
                  Xem trước: Ảnh bìa gian hàng
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className={cn(
                    'rounded-lg p-1.5 transition',
                    isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100',
                  )}
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center max-h-[75vh] overflow-auto rounded-xl bg-black/10 dark:bg-black/40 p-2">
                <img
                  src={value}
                  alt="Ảnh bìa đầy đủ"
                  className="max-h-[70vh] w-auto rounded-lg object-contain shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
