import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineClipboardCheck } from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'

export default function AdminDashboard() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Manage platform requests and moderation tasks.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Request approvals</h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Review and approve seller registrations or reports.
            </p>
          </div>
          <Link
            to="/admin/requests"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
              isDark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
            )}
          >
            <HiOutlineClipboardCheck className="h-4 w-4" />
            Open requests
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
