import { AnimatePresence, motion } from 'framer-motion'
import { HiX, HiOutlineChat } from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'

function formatTime(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function ChatNotificationToast({ notifications, onDismiss, onOpen, position = 'top-right' }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const isTopRight = position === 'top-right'

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2.5 pointer-events-none',
        isTopRight ? 'top-6 right-6 items-end' : 'bottom-24 left-4 items-start',
      )}
    >
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: isTopRight ? 60 : -60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isTopRight ? 60 : -60, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={cn(
              'pointer-events-auto flex w-[320px] items-start gap-3 rounded-2xl border p-3.5 shadow-2xl cursor-pointer backdrop-blur-md transition hover:scale-[1.02]',
              isDark
                ? 'border-amber-500/30 bg-slate-850/95 text-slate-100 ring-1 ring-amber-500/20'
                : 'border-amber-500/30 bg-white/95 text-stone-900 ring-1 ring-amber-500/20',
            )}
            onClick={() => {
              if (onOpen) onOpen(n.threadId)
              if (onDismiss) onDismiss(n.id)
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-sm font-bold shadow-md">
              {n.senderName?.[0]?.toUpperCase() || <HiOutlineChat className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold truncate text-amber-600 dark:text-amber-400">{n.senderName}</p>
                <span className="text-[10px] opacity-50 shrink-0">{formatTime(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs opacity-80 line-clamp-2 leading-relaxed">{n.content}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(n.id)
              }}
              className={cn(
                'shrink-0 rounded-lg p-1 transition',
                isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-stone-100 text-stone-400',
              )}
              title="Đóng"
            >
              <HiX className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
