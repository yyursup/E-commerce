import { motion } from 'framer-motion'
import { cn } from '../../../../lib/cn'

export default function AdminRequestActionCard({
  detailEntries,
  isDark,
  responseText,
  setResponseText,
  requestType,
  isPending,
  actionLoading,
  onApprove,
  onReject,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className={cn(
        'rounded-2xl border p-6 shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <h2 className="text-lg font-semibold">Detail</h2>
      <div className="mt-4 space-y-3 text-sm">
        {detailEntries.length === 0 && <p className="text-stone-500 dark:text-slate-400">No detail data.</p>}
        {detailEntries.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">{label}</p>
            {label === 'Evidence' && value ? (
              <a
                href={value}
                className={cn('text-sm font-semibold underline', isDark ? 'text-amber-300' : 'text-amber-700')}
                target="_blank"
                rel="noreferrer"
              >
                Open evidence
              </a>
            ) : (
              <p className="text-sm break-all">{value || '-'}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-stone-200 pt-4 text-sm dark:border-slate-700">
        <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Admin action</p>
        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder={requestType === 'REPORT' ? 'Enter moderator note (optional)' : 'Enter response / reason'}
          rows={3}
          className={cn(
            'mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
              : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
          )}
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onApprove}
            disabled={!isPending || actionLoading}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition',
              !isPending || actionLoading
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-emerald-500/80 text-white hover:bg-emerald-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
            )}
          >
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={!isPending || actionLoading}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition',
              !isPending || actionLoading
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-red-500/80 text-white hover:bg-red-500'
                  : 'bg-red-600 text-white hover:bg-red-700',
            )}
          >
            Reject
          </button>
        </div>
        {!isPending && (
          <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            This request has already been reviewed.
          </p>
        )}
      </div>
    </motion.div>
  )
}
