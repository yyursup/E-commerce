import { HiOutlineIdentification } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function KycSessionCard({
  isDark,
  sessionId,
  sessionStatus,
  isStarting,
  onStartSession,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-8 shadow-xl',
        isDark
          ? 'border-slate-700/50 bg-slate-900/80'
          : 'border-stone-200/80 bg-white',
      )}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Xác minh danh tính (KYC)
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tạo phiên và tải ảnh để xác minh thông tin.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartSession}
          disabled={isStarting}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
            isStarting
              ? 'cursor-not-allowed bg-amber-500/60'
              : 'bg-amber-500 hover:bg-amber-600',
          )}
        >
          <HiOutlineIdentification className="h-5 w-5" />
          {isStarting ? 'Đang tạo phiên...' : 'Tạo phiên KYC'}
        </button>
      </div>

      <div
        className={cn(
          'rounded-xl border px-4 py-3 text-sm',
          isDark ? 'border-slate-700 bg-slate-800/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600',
        )}
      >
        <div className="flex flex-wrap gap-4">
          <span>
            <strong>Session:</strong> {sessionId || 'Chưa tạo'}
          </span>
          <span>
            <strong>Status:</strong> {sessionStatus || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}
