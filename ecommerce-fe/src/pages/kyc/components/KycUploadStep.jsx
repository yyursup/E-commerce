import { HiOutlineCloudUpload } from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function KycUploadStep({
  isDark,
  title,
  inputId,
  inputLabel,
  onFileChange,
  onUpload,
  isUploading,
  uploadButtonLabel,
}) {
  return (
    <div className="space-y-6">
      <h2
        className={cn(
          'text-lg font-semibold',
          isDark ? 'text-white' : 'text-stone-900',
        )}
      >
        {title}
      </h2>

      <div>
        <label
          htmlFor={inputId}
          className={cn(
            'mb-1.5 block text-sm font-medium',
            isDark ? 'text-slate-300' : 'text-stone-700',
          )}
        >
          {inputLabel}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange?.(e.target.files?.[0] || null)}
          className={cn(
            'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600',
            isDark
              ? 'border-slate-600 bg-slate-800/50 text-white'
              : 'border-stone-300 bg-stone-50/80 text-stone-900',
          )}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onUpload}
          disabled={isUploading}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
            isUploading
              ? 'cursor-not-allowed bg-amber-500/60'
              : 'bg-amber-500 hover:bg-amber-600',
          )}
        >
          <HiOutlineCloudUpload className="h-5 w-5" />
          {isUploading ? 'Đang upload...' : uploadButtonLabel}
        </button>
      </div>
    </div>
  )
}
