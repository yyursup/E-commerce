import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import {
  canReleaseEscrow,
  escrowStatusBadgeClass,
  formatEscrowCurrency,
  formatEscrowDate,
  shortEscrowId,
} from './escrowHelpers'

export default function AdminEscrowTable({
  isDark,
  loading,
  error,
  escrows,
  releaseLoadingId,
  onRelease,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <div className="grid grid-cols-12 gap-3 border-b px-6 py-4 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-slate-800 dark:text-slate-400">
        <div className="col-span-2">Escrow</div>
        <div className="col-span-2">Order</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
          Loading escrows...
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-6 text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && escrows.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-stone-500 dark:text-slate-400">
          No escrows found.
        </div>
      )}

      {!loading && !error && escrows.map((escrow) => (
        <div
          key={escrow.escrowId}
          className={cn(
            'grid grid-cols-12 items-center gap-3 px-6 py-4 text-sm border-b last:border-b-0',
            isDark ? 'border-slate-800 text-slate-200' : 'border-stone-100 text-stone-700',
          )}
        >
          <div className="col-span-2 font-medium" title={escrow.escrowId}>
            {shortEscrowId(escrow.escrowId)}
          </div>
          <div className="col-span-2">
            {escrow.orderId ? (
              <Link
                to={`/admin/orders/${escrow.orderId}`}
                className={cn(
                  'text-sm font-semibold underline',
                  isDark ? 'text-amber-300' : 'text-amber-700',
                )}
              >
                {escrow.orderNumber || shortEscrowId(escrow.orderId)}
              </Link>
            ) : (
              '-'
            )}
          </div>
          <div className="col-span-2">
            <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', escrowStatusBadgeClass(escrow.status, isDark))}>
              {escrow.status || '-'}
            </span>
          </div>
          <div className="col-span-2 text-xs">
            <p>{formatEscrowCurrency(escrow.amount)}</p>
            <p className={cn(isDark ? 'text-slate-500' : 'text-stone-500')}>
              Fee: {formatEscrowCurrency(escrow.platformCommission)}
            </p>
          </div>
          <div className="col-span-2 text-xs">{formatEscrowDate(escrow.createdAt)}</div>
          <div className="col-span-2 text-right">
            <button
              onClick={() => onRelease(escrow)}
              disabled={!canReleaseEscrow(escrow.status) || releaseLoadingId === escrow.escrowId}
              className={cn(
                'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold',
                !canReleaseEscrow(escrow.status) || releaseLoadingId === escrow.escrowId
                  ? 'cursor-not-allowed opacity-50 bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-500'
                  : isDark
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
              )}
            >
              {releaseLoadingId === escrow.escrowId ? 'Releasing...' : 'Release'}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
