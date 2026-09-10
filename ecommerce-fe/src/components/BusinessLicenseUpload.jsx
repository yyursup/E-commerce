import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineDocumentText,
  HiOutlineCloudUpload,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import fileService from '../services/fileService'
import toast from 'react-hot-toast'

/**
 * Component Upload Gi?y phép kinh doanh (GPKD)
 * @param {Object} props
 * @param {string|null} props.value - URL ?nh GPKD hi?n t?i
 * @param {Function} props.onChange - Callback khi upload thành công ho?c xóa (truy?n url ho?c null)
 * @param {string} props.error - Thông báo l?i n?u có
 * @param {boolean} props.disabled - Tr?ng thái vô hi?u hóa
 * @param {string} props.className - Class tùy bi?n
 */
export default function BusinessLicenseUpload({
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
  const [previewName, setPreviewName] = useState('')

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const handleFile = async (file) => {
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Ch? ch?p nh?n file ?nh d?nh d?ng JPG, PNG ho?c WEBP.')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('Dung lu?ng ?nh t?i da là 10MB. Vui lòng ch?n ?nh nh? hon.')
      return
    }

    try {
      setUploading(true)
      setPreviewName(file.name)
      const res = await fileService.uploadFile(file, 'licenses')
      const uploadedUrl = res?.url || res?.data?.url
      if (uploadedUrl) {
        onChange?.(uploadedUrl)
        toast.success('T?i lên ?nh Gi?y phép kinh doanh thành công!')
      } else {
        throw new Error('Không nh?n du?c URL ?nh t? server.')
      }
    } catch (err) {
      console.error('Upload license error:', err)
      const msg = err?.message || err?.response?.data?.message || 'L?i khi t?i lên file.'
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
    // reset input d? ch?n l?i file cùng tên n?u c?n
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
    setPreviewName('')
    toast.success('Ðã g? ?nh Gi?y phép kinh doanh.')
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

      {/* Khi chua có ?nh */}
      {!value && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer',
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
            <div className="flex flex-col items-center py-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className={cn('mt-3 text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Ðang t?i ?nh lên MinIO...
              </p>
              <p className={cn('text-xs mt-1', isDark ? 'text-slate-500' : 'text-stone-500')}>
                Vui lòng không dóng trình duy?t
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                  isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600',
                )}
              >
                <HiOutlineCloudUpload className="h-7 w-7" />
              </div>
              <p className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                Kéo th? ?nh GPKD vào dây ho?c{' '}
                <span className="text-amber-500 underline underline-offset-2">ch?n t? thi?t b?</span>
              </p>
              <p className={cn('mt-1.5 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Ð?nh d?ng: JPG, PNG, WEBP (Dung lu?ng t?i da 10MB)
              </p>
              <div
                className={cn(
                  'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-stone-200/70 text-stone-600',
                )}
              >
                <HiOutlineDocumentText className="h-3.5 w-3.5 text-amber-500" />
                B?t bu?c d?i v?i H? kinh doanh & Doanh nghi?p
              </div>
            </>
          )}
        </div>
      )}

      {/* Khi dã có ?nh */}
      {value && (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border p-4 shadow-sm transition',
            isDark ? 'border-slate-700 bg-slate-800/60' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              onClick={() => setShowPreviewModal(true)}
              className="relative aspect-[4/3] w-full sm:w-36 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-700 cursor-pointer group bg-black/5"
            >
              <img
                src={value}
                alt="Gi?y phép kinh doanh"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                  <HiOutlineEye className="h-3.5 w-3.5" /> Xem
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Ðã t?i lên
                </span>
                <span className={cn('text-xs truncate max-w-[200px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  {previewName || 'Gi?y phép kinh doanh'}
                </span>
              </div>
              <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
                ?nh dã du?c luu trên h? th?ng luu tr? MinIO và s?n sàng g?i xét duy?t.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    isDark
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                  )}
                >
                  <HiOutlineEye className="h-3.5 w-3.5" /> Phóng to
                </button>
                <button
                  type="button"
                  onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
                  )}
                >
                  <HiOutlineRefresh className="h-3.5 w-3.5" /> Ð?i ?nh khác
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    isDark
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-red-100 text-red-700 hover:bg-red-200',
                  )}
                >
                  <HiOutlineX className="h-3.5 w-3.5" /> G? b?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Modal Quick Preview */}
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
                <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                  Xem tru?c: Gi?y phép kinh doanh
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

              <div className="mt-3 flex items-center justify-center max-h-[75vh] overflow-auto rounded-xl bg-black/5 dark:bg-black/30 p-2">
                <img
                  src={value}
                  alt="Gi?y phép kinh doanh full"
                  className="max-h-[70vh] w-auto rounded-lg object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
