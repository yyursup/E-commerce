import { useState } from 'react'
import {
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineEye,
  HiOutlinePencilAlt,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import PolicyMarkdownRenderer from './PolicyMarkdownRenderer'

const MARKDOWN_SNIPPETS = [
  { label: 'H1', insert: '\n# Tiêu Đề Mục Chính\n' },
  { label: 'H2', insert: '\n## 1. Tiêu Đề Con\n' },
  { label: 'Đậm', insert: '**văn bản in đậm**' },
  { label: 'Danh sách', insert: '\n- Điều khoản 1\n- Điều khoản 2\n' },
  { label: 'Bảng mẫu', insert: '\n| Tiêu chí | Quy định chi tiết | Mức xử phạt |\n| :--- | :--- | :--- |\n| Vi phạm lần 1 | Cảnh cáo bằng văn bản | Không trừ tiền |\n| Vi phạm lần 2 | Tạm giữ quỹ ký quỹ 7 ngày | Phạt 500.000đ |\n' },
  { label: 'Trích dẫn', insert: '\n> **Lưu ý quan trọng**: Điều khoản này áp dụng cho toàn bộ giao dịch trên sàn.\n' },
  { label: 'Mã code', insert: '`POLICY_KEY_SAMPLE`' },
]

export default function PolicyModal({
  isOpen,
  isDark,
  onClose,
  onSubmit,
  editingPolicy,
  policyForm,
  setPolicyForm,
  saving,
  audienceOptions,
  categoryOptions,
}) {
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'preview'

  if (!isOpen) return null

  const handleInsertSnippet = (snippet) => {
    setPolicyForm((prev) => ({
      ...prev,
      content: (prev.content || '') + snippet,
    }))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div
        className={cn(
          'w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150',
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
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <HiOutlineDocumentText className="h-5 w-5" />
            </div>
            <span>{editingPolicy ? 'Chỉnh Sửa Văn Bản Chính Sách' : 'Thêm Chính Sách Nền Tảng Mới'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-500/10 transition"
            aria-label="Đóng"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Key and Title Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Mã Định Danh (Policy Key) *
              </label>
              <input
                type="text"
                required
                disabled={!!editingPolicy}
                value={policyForm.policyKey}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    policyKey: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                  })
                }
                placeholder="VD: ESCROW_PAYMENT_PROTECTION"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-stone-50 border-stone-200 text-amber-700',
                  editingPolicy && 'opacity-60 cursor-not-allowed'
                )}
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                {editingPolicy ? 'Mã định danh không thể thay đổi sau khi tạo' : 'Dạng VIẾT_HOA, phân cách bằng dấu gạch dưới'}
              </span>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Tiêu Đề Văn Bản Chính Sách *
              </label>
              <input
                type="text"
                required
                value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                placeholder="VD: Quy Trình Ký Quỹ Escrow Và Cơ Chế Bảo Vệ Người Mua"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                )}
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Tiêu đề ngắn gọn, rõ ràng hiển thị trên thanh điều hướng và mục lục
              </span>
            </div>
          </div>

          {/* 4-Item Configuration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Đối Tượng Áp Dụng
              </label>
              <select
                value={policyForm.targetAudience}
                onChange={(e) => setPolicyForm({ ...policyForm, targetAudience: e.target.value })}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                )}
              >
                {audienceOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Danh Mục Nghiệp Vụ
              </label>
              <select
                value={policyForm.category}
                onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                )}
              >
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Số Hiệu Phiên Bản
              </label>
              <input
                type="text"
                value={policyForm.version}
                onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                placeholder="VD: 1.0 hoặc 2.1"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
                Thứ Tự Sắp Xếp
              </label>
              <input
                type="number"
                value={policyForm.displayOrder}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, displayOrder: parseInt(e.target.value) || 0 })
                }
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                )}
              />
            </div>
          </div>

          {/* Summary Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-70">
              Tóm Tắt Nhanh (Executive Summary)
            </label>
            <textarea
              rows={2}
              value={policyForm.summary}
              onChange={(e) => setPolicyForm({ ...policyForm, summary: e.target.value })}
              placeholder="Tóm tắt ngắn gọn 1-2 câu về nội dung cốt lõi của chính sách giúp người dùng nắm bắt nhanh..."
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition leading-relaxed',
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
              )}
            />
          </div>

          {/* Editor / Preview Tabs Header */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs',
                    activeTab === 'editor'
                      ? 'bg-amber-500 text-white shadow-amber-500/25'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                  )}
                >
                  <HiOutlinePencilAlt className="h-4 w-4" />
                  Soạn thảo Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs',
                    activeTab === 'preview'
                      ? 'bg-amber-500 text-white shadow-amber-500/25'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                  )}
                >
                  <HiOutlineEye className="h-4 w-4" />
                  Xem trước trực tiếp
                </button>
              </div>

              {/* Quick Snippets Bar */}
              {activeTab === 'editor' && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-stone-400 mr-1 hidden sm:inline">Chèn nhanh:</span>
                  {MARKDOWN_SNIPPETS.map((snip) => (
                    <button
                      key={snip.label}
                      type="button"
                      onClick={() => handleInsertSnippet(snip.insert)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition',
                        isDark
                          ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-amber-400'
                          : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-amber-700'
                      )}
                    >
                      +{snip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab 1: Markdown Textarea */}
            {activeTab === 'editor' && (
              <div className="space-y-1.5">
                <textarea
                  rows={10}
                  required
                  value={policyForm.content}
                  onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                  placeholder="Nhập nội dung chính sách định dạng Markdown (# Tiêu đề, ## Mục con, - Danh sách, | Bảng |, > Lưu ý)..."
                  className={cn(
                    'w-full px-4 py-3 rounded-2xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed transition',
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-stone-50 border-stone-200 text-stone-800'
                  )}
                />
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                  <HiOutlineInformationCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Hỗ trợ Markdown đầy đủ: Tiêu đề (#), Đậm (**text**), Danh sách (- item), Bảng (| Cột |) và Trích dẫn (&gt;)</span>
                </div>
              </div>
            )}

            {/* Tab 2: Live Preview */}
            {activeTab === 'preview' && (
              <div
                className={cn(
                  'rounded-2xl border p-4 sm:p-6 max-h-[360px] overflow-y-auto',
                  isDark ? 'border-slate-800 bg-slate-950/70' : 'border-stone-200 bg-stone-50/70'
                )}
              >
                {policyForm.content?.trim() ? (
                  <PolicyMarkdownRenderer content={policyForm.content} isDark={isDark} />
                ) : (
                  <div className="py-12 text-center text-xs opacity-50">
                    Chưa có nội dung văn bản để hiển thị xem trước.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={policyForm.isActive}
                onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500 border-stone-300 dark:border-slate-700"
              />
              <span className="text-xs font-bold">Kích hoạt và công bố chính sách ngay lập tức</span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-500/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-500/10 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : editingPolicy ? (
                'Cập Nhật Chính Sách'
              ) : (
                'Tạo Mới Chính Sách'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

