import { useState } from 'react'
import {
  HiOutlineEye,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'

export default function PolicyTable({
  policies,
  isDark,
  loading,
  audienceOptions,
  categoryOptions,
  categoryMap = {},
  onPreview,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCopyKey = (key, e) => {
    e?.stopPropagation()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key)
      setCopiedKey(key)
      toast.success(`Đã sao chép mã: ${key}`)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        <p className="text-xs font-medium">Đang tải danh sách chính sách nền tảng...</p>
      </div>
    )
  }

  if (!policies || policies.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <HiOutlineShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-stone-400">Không tìm thấy chính sách nào phù hợp</p>
        <p className="text-xs text-stone-500">Hãy thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc</p>
      </div>
    )
  }

  return (
    <div>
      {/* 1. DESKTOP VIEW: CLEAN RESPONSIVE TABLE (md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead
            className={cn(
              'border-b uppercase font-bold text-[11px] tracking-wider',
              isDark
                ? 'border-slate-800 bg-slate-950/60 text-slate-400'
                : 'border-stone-200 bg-stone-50 text-stone-600'
            )}
          >
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">Thứ tự</th>
              <th className="py-3.5 px-4">Mã Key & Tiêu đề</th>
              <th className="py-3.5 px-4">Đối tượng</th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4">Phiên bản</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
            {policies.map((p) => {
              const audienceInfo =
                audienceOptions.find((a) => a.value === p.targetAudience) || audienceOptions[0]
              const categoryInfo = categoryOptions.find((c) => c.value === p.category)

              return (
                <tr
                  key={p.id}
                  className={cn(
                    'transition-colors hover:bg-amber-500/5',
                    !p.isActive && 'opacity-65'
                  )}
                >
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-500">
                    {p.displayOrder}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-bold text-sm line-clamp-1">{p.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[11px] text-amber-500/90 font-semibold">
                        {p.policyKey}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyKey(p.policyKey, e)}
                        title="Sao chép mã"
                        className="text-stone-400 hover:text-amber-500 transition p-0.5"
                      >
                        {copiedKey === p.policyKey ? (
                          <HiOutlineCheck className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <HiOutlineDocumentDuplicate className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {p.summary && (
                      <div className="text-[11px] opacity-60 line-clamp-1 mt-0.5">{p.summary}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border',
                        audienceInfo.color
                      )}
                    >
                      {audienceInfo.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-stone-400">
                      {categoryMap[p.category] || categoryInfo?.label || p.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold bg-stone-500/10 px-2.5 py-1 rounded-lg text-[11px]">
                      v{p.version || '1.0'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onToggleActive(p)}
                      title={p.isActive ? 'Bấm để tạm ẩn' : 'Bấm để kích hoạt'}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition shadow-xs',
                        p.isActive
                          ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/20'
                      )}
                    >
                      {p.isActive ? (
                        <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <HiOutlineXCircle className="h-3.5 w-3.5" />
                      )}
                      {p.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPreview(p)}
                        title="Xem nội dung chi tiết"
                        className="p-2 rounded-xl text-blue-500 hover:bg-blue-500/10 transition"
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        title="Chỉnh sửa chính sách"
                        className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition"
                      >
                        <HiOutlinePencilAlt className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        title="Xóa chính sách"
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 2. MOBILE / TABLET VIEW: RESPONSIVE CARDS (md:hidden) */}
      <div className="md:hidden divide-y divide-stone-200 dark:divide-slate-800">
        {policies.map((p) => {
          const audienceInfo =
            audienceOptions.find((a) => a.value === p.targetAudience) || audienceOptions[0]
          const categoryInfo = categoryOptions.find((c) => c.value === p.category)

          return (
            <div
              key={p.id}
              className={cn(
                'p-4 space-y-3 transition-colors',
                !p.isActive && 'opacity-65',
                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/20'
              )}
            >
              {/* Card Top: Order + Title + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      #{p.displayOrder}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                        audienceInfo.color
                      )}
                    >
                      {audienceInfo.label}
                    </span>
                    <span className="font-mono text-[10px] font-semibold opacity-60">
                      v{p.version || '1.0'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug line-clamp-2">{p.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleActive(p)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition',
                    p.isActive
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-500 border-rose-500/20'
                  )}
                >
                  {p.isActive ? (
                    <HiOutlineCheckCircle className="h-3 w-3" />
                  ) : (
                    <HiOutlineXCircle className="h-3 w-3" />
                  )}
                  {p.isActive ? 'Bật' : 'Tắt'}
                </button>
              </div>

              {/* Key & Category */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1 font-mono text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/15">
                  <span>{p.policyKey}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyKey(p.policyKey, e)}
                    className="p-0.5 text-stone-400 hover:text-amber-500 transition"
                  >
                    {copiedKey === p.policyKey ? (
                      <HiOutlineCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <HiOutlineDocumentDuplicate className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <span className="text-stone-400">
                  {categoryMap[p.category] || categoryInfo?.label || p.category}
                </span>
              </div>

              {/* Summary if any */}
              {p.summary && (
                <p className="text-[11px] opacity-70 line-clamp-2 leading-relaxed">
                  {p.summary}
                </p>
              )}

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-500/10">
                <button
                  type="button"
                  onClick={() => onPreview(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition"
                >
                  <HiOutlineEye className="h-3.5 w-3.5" />
                  Xem
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition"
                >
                  <HiOutlinePencilAlt className="h-3.5 w-3.5" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition"
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

