import { motion } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import { formatAdminRequestDate } from './requestHelpers'

export default function AdminRequestOverviewCard({ detail, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border p-6 shadow-sm lg:col-span-2',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <h2 className="text-lg font-semibold">Overview</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Type</p>
          <p className="mt-1 text-sm font-semibold">{detail.type || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Status</p>
          <p className="mt-1 text-sm font-semibold">{detail.status || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Created</p>
          <p className="mt-1 text-sm">{formatAdminRequestDate(detail.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Updated</p>
          <p className="mt-1 text-sm">{formatAdminRequestDate(detail.updatedAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Account</p>
          <p className="mt-1 text-sm">{detail.accountId || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Reviewed by</p>
          <p className="mt-1 text-sm">{detail.reviewedBy || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Reviewed at</p>
          <p className="mt-1 text-sm">{formatAdminRequestDate(detail.reviewedAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Review note</p>
          <p className="mt-1 text-sm">{detail.note || '-'}</p>
        </div>
      </div>

      {detail.coverImageUrl && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Cover</p>
          <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-700">
            <img src={detail.coverImageUrl} alt="cover" className="h-56 w-full object-cover" />
          </div>
        </div>
      )}

      {detail.description && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Description</p>
          <p className="mt-2 text-sm leading-relaxed">{detail.description}</p>
        </div>
      )}
    </motion.div>
  )
}
