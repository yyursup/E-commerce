import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePhotograph, HiOutlineVideoCamera } from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'

export default function MediaUploadPopover({ isOpen, onClose, onPickImage, onPickVideo, align = 'right' }) {
  const popoverRef = useRef(null)
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute bottom-full mb-2 z-50 rounded-2xl border p-3 shadow-2xl backdrop-blur-md select-none',
          align === 'right' ? 'right-0' : 'left-0',
          isDark
            ? 'border-slate-700 bg-slate-850/95 text-slate-100 shadow-black/60'
            : 'border-stone-200 bg-white/95 text-stone-900 shadow-stone-400/30'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Photo Button */}
          <button
            type="button"
            onClick={() => {
              onClose()
              onPickImage()
            }}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:scale-105 active:scale-95',
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:border-amber-500 hover:bg-slate-700/80'
                : 'border-stone-200 bg-stone-50/80 hover:border-amber-500 hover:bg-amber-50/50'
            )}
            title="Gửi hình ảnh"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <HiOutlinePhotograph className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">Hình ảnh</span>
          </button>

          {/* Video Button */}
          <button
            type="button"
            onClick={() => {
              onClose()
              onPickVideo()
            }}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:scale-105 active:scale-95',
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:border-amber-500 hover:bg-slate-700/80'
                : 'border-stone-200 bg-stone-50/80 hover:border-amber-500 hover:bg-amber-50/50'
            )}
            title="Gửi video"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <HiOutlineVideoCamera className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">Video</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
