import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'

const EMOJI_CATEGORIES = [
  {
    name: 'Mặt cười',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛',
      '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
      '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺',
      '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶',
    ],
  },
  {
    name: 'Cử chỉ',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '🤏', '👌',
      '👈', '👉', '👆', '👇', '☝️', '🖐️', '✋', '👊', '✊', '🤛',
      '🤜', '🤟', '🙏', '💪', '👋', '✍️', '💅', '👀',
    ],
  },
  {
    name: 'Trái tim',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💯',
      '✨', '🔥', '💥', '⭐', '🌟', '💫', '🎉', '🎊',
    ],
  },
  {
    name: 'Mua sắm',
    icon: '🛍️',
    emojis: [
      '🛒', '🛍️', '📦', '🏷️', '🎁', '💰', '💵', '💳', '🧾', '📱',
      '💻', '👗', '👕', '👟', '💄', '⚡', '🚚', '💬', '🔔', '✅',
    ],
  },
]

export default function EmojiPickerPopover({ isOpen, onClose, onSelectEmoji, align = 'right' }) {
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
          'absolute bottom-full mb-2 z-50 w-72 max-w-[calc(100vw-32px)] rounded-2xl border p-2.5 shadow-2xl backdrop-blur-md select-none',
          align === 'right' ? 'right-0' : 'left-0',
          isDark
            ? 'border-slate-700 bg-slate-850/95 text-slate-100 shadow-black/60'
            : 'border-stone-200 bg-white/95 text-stone-900 shadow-stone-400/30'
        )}
      >
        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <p className="text-[11px] font-semibold opacity-60 mb-1 px-1">
                {cat.icon} {cat.name}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {cat.emojis.map((emoji, idx) => (
                  <button
                    key={`${cat.name}-${idx}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onSelectEmoji(emoji)
                    }}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-base transition-transform hover:scale-125 active:scale-95',
                      isDark ? 'hover:bg-slate-700/80' : 'hover:bg-stone-100'
                    )}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
