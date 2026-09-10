import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiX,
  HiOutlineZoomIn,
  HiOutlineZoomOut,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiOutlineDownload,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

/**
 * Modal Lightbox soi ảnh Giấy phép kinh doanh chuyên dụng cho Admin
 * Hỗ trợ: Phóng to (Zoom In/Out), Xoay ảnh 90°, Reset, Mở tab mới, Tải về
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái hiển thị modal
 * @param {Function} props.onClose - Callback đóng modal
 * @param {string} props.imageUrl - Đường dẫn ảnh GPKD
 * @param {string} props.title - Tiêu đề hiển thị (mặc định: 'Giấy phép kinh doanh')
 */
export default function LicenseImageModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Giấy phép kinh doanh',
}) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Reset zoom & rotation khi mở ảnh mới
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
    }
  }, [isOpen, imageUrl])

  // Lắng nghe phím ESC để đóng
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = 'giay-phep-kinh-doanh'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!isOpen || !imageUrl) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 select-none">
        {/* Thanh điều khiển trên cùng (Header & Controls) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex w-full max-w-5xl items-center justify-between rounded-2xl bg-slate-900/80 border border-slate-700/60 px-4 py-3 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-semibold truncate max-w-[200px] sm:max-w-md">
              {title}
            </h2>
            <span className="hidden sm:inline-block text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Phóng to (+)"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <HiOutlineZoomIn className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Thu nhỏ (-)"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <HiOutlineZoomOut className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              title="Xoay 90°"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <HiOutlineRefresh className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Khôi phục kích thước ban đầu"
              className="hidden sm:inline-flex rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Reset
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              title="Mở ảnh gốc trong tab mới"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <HiOutlineExternalLink className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={handleDownload}
              title="Tải ảnh về máy"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <HiOutlineDownload className="h-5 w-5" />
            </button>
            <div className="h-5 w-px bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={onClose}
              title="Đóng (ESC)"
              className="rounded-lg p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>
        </motion.div>

        {/* Khung hiển thị ảnh (Interactive Zoom Area) */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          className="flex flex-1 w-full items-center justify-center overflow-auto p-4 cursor-zoom-out"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="max-h-[75vh] max-w-[90vw] rounded-xl shadow-2xl object-contain border border-white/10"
            />
          </motion.div>
        </div>

        {/* Chú thích hướng dẫn dưới đáy */}
        <div className="text-center text-xs text-slate-400 pb-2">
          Gợi ý: Sử dụng nút xoay hoặc phóng to để kiểm tra rõ số hiệu, con dấu tròn và người đại diện pháp luật trên GPKD.
        </div>
      </div>
    </AnimatePresence>
  )
}