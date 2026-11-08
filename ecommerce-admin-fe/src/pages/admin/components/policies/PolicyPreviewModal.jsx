import { useState } from 'react'
import {
  HiOutlineX,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlinePrinter,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import PolicyMarkdownRenderer from './PolicyMarkdownRenderer'

export default function PolicyPreviewModal({ policy, isDark, onClose, categoryMap, audienceMap }) {
  const [copiedKey, setCopiedKey] = useState(false)

  if (!policy) return null

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(policy.policyKey)
      setCopiedKey(true)
      toast.success(`Đã sao chép mã ${policy.policyKey}`)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const audienceInfo = audienceMap?.[policy.targetAudience] || {
    label: policy.targetAudience || 'Toàn sàn',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }
  const categoryLabel = categoryMap?.[policy.category] || policy.category

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full max-w-3xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150',
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Modal Header */}
        <div
          className={cn(
            'flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0',
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50'
          )}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <HiOutlineShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-500">
                  {policy.policyKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  title="Sao chép mã chính sách"
                  className="text-stone-400 hover:text-amber-500 transition p-0.5"
                >
                  {copiedKey ? (
                    <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <h2 className="text-base sm:text-lg font-black truncate">{policy.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-500/10 transition shrink-0"
            aria-label="Đóng"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                audienceInfo.color
              )}
            >
              {audienceInfo.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border',
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-300'
                  : 'border-stone-200 bg-stone-100 text-stone-700'
              )}
            >
              {categoryLabel}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border',
                isDark
                  ? 'border-slate-800 bg-slate-950 text-purple-400'
                  : 'border-stone-200 bg-stone-100 text-purple-700'
              )}
            >
              Phiên bản v{policy.version || '1.0'}
            </span>
            <span className="flex items-center gap-1 text-[11px] opacity-60 ml-auto">
              <HiOutlineCalendar className="h-3.5 w-3.5" />
              Hiệu lực:{' '}
              {policy.effectiveDate
                ? new Date(policy.effectiveDate).toLocaleDateString('vi-VN')
                : 'Hiện hành'}
            </span>
          </div>

          {/* Policy Summary Callout */}
          {policy.summary && (
            <div
              className={cn(
                'rounded-2xl border p-4 sm:p-4.5 text-xs sm:text-sm',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              )}
            >
              <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-[11px] text-amber-500">
                <HiOutlineTag className="h-3.5 w-3.5" /> Tóm tắt điều khoản cốt lõi
              </div>
              <p className="leading-relaxed">{policy.summary}</p>
            </div>
          )}

          {/* Formatted Markdown Content */}
          <div
            className={cn(
              'border-t pt-5',
              isDark ? 'border-slate-800' : 'border-stone-100'
            )}
          >
            <PolicyMarkdownRenderer content={policy.content} isDark={isDark} />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={cn(
            'px-5 sm:px-6 py-3.5 border-t flex items-center justify-between shrink-0 text-xs',
            isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-stone-100 bg-stone-50 text-stone-600'
          )}
        >
          <div className="text-[11px]">
            Thứ tự hiển thị: <strong className="text-amber-500">{policy.displayOrder}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold border transition',
                isDark
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                  : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
              )}
            >
              <HiOutlinePrinter className="h-4 w-4" />
              In văn bản
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-xs"
            >
              Đóng xem trước
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

