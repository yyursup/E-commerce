import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function ProductImageGallery({ images = [] }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-stone-100 dark:bg-slate-800">
        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Không có hình ảnh
        </p>
      </div>
    )
  }

  const selectedImage = images[selectedIndex]?.imageUrl || images[0]?.imageUrl

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-stone-50 dark:bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.img
            key={selectedIndex}
            src={selectedImage}
            alt={`Product image ${selectedIndex + 1}`}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm transition',
                isDark
                  ? 'bg-slate-800/80 text-white hover:bg-slate-700/80'
                  : 'bg-white/80 text-stone-700 hover:bg-white',
              )}
              aria-label="Previous image"
            >
              <HiOutlineChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm transition',
                isDark
                  ? 'bg-slate-800/80 text-white hover:bg-slate-700/80'
                  : 'bg-white/80 text-stone-700 hover:bg-white',
              )}
              aria-label="Next image"
            >
              <HiOutlineChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            className={cn(
              'absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm',
              isDark ? 'bg-slate-800/80 text-white' : 'bg-white/80 text-stone-700',
            )}
          >
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition',
                selectedIndex === index
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : isDark
                    ? 'border-slate-600 hover:border-slate-500'
                    : 'border-stone-300 hover:border-stone-400',
              )}
            >
              <img
                src={image.imageUrl}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-amber-500/20" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
