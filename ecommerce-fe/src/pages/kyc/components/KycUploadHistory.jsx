import { cn } from '../../../lib/cn'

export default function KycUploadHistory({ isDark, uploads, isComparing }) {
  return (
    <>
      {uploads.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
            Lịch sử upload
          </p>
          <div className="space-y-2">
            {uploads.map((item, idx) => (
              <div
                key={`${item.fileHash}-${idx}`}
                className={cn(
                  'rounded-xl border px-4 py-3 text-sm',
                  isDark
                    ? 'border-slate-700 bg-slate-800/60 text-slate-300'
                    : 'border-stone-200 bg-stone-50 text-stone-600',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{item.fileName}</span>
                  <span className="text-xs uppercase tracking-wide">
                    {item.mode}
                  </span>
                </div>
                <div className="mt-1 text-xs break-all">
                  {item.fileHash || 'Chưa có hash'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isComparing && (
        <p className={cn('mt-6 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang so sánh khuôn mặt, vui lòng chờ...
        </p>
      )}
    </>
  )
}
