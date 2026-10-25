import { useState, useEffect, useMemo } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePrinter,
  HiOutlineShare,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineChat,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import policyService from '../../services/policy'

const TABS = [
  { id: 'ALL', label: 'Tất cả quy chế sàn' },
  { id: 'SELLER', label: 'Dành riêng cho Gian hàng (Shop)' },
  { id: 'ESCROW', label: 'Bảo vệ Escrow & Tiền cọc' },
  { id: 'RETURN', label: 'Đổi trả & Xử lý Khiếu nại' },
  { id: 'SHIPPING', label: 'Vận chuyển cùng GHN' },
  { id: 'GRADING', label: 'Phân hạng hàng 2nd-hand' },
]

const CATEGORY_ICONS = {
  ESCROW: HiOutlineShieldCheck,
  RETURN: HiOutlineRefresh,
  SELLER: HiOutlineScale,
  SHIPPING: HiOutlineTruck,
  GRADING: HiOutlineTag,
  PRIVACY: HiOutlineShieldCheck,
  TERMS: HiOutlineDocumentText,
  GENERAL: HiOutlineDocumentText,
}

export default function SellerPolicy() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()

  const [policies, setPolicies] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [activeTab, setActiveTab] = useState('SELLER')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await policyService.getActivePolicies()
      const list = Array.isArray(data) ? data : []
      setPolicies(list)

      // Default select first seller policy if available, otherwise first policy
      if (list.length > 0 && !selectedKey) {
        const sellerFirst = list.find((p) => p.targetAudience === 'SELLER') || list[0]
        setSelectedKey(sellerFirst.policyKey)
      }
    } catch (err) {
      console.error('Lỗi khi tải chính sách người bán:', err)
      setError('Không thể tải quy chế sàn vào lúc này.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  // Filtered policies based on Tab and Search
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      // Tab filter
      let matchTab = true
      if (activeTab === 'SELLER') {
        matchTab = p.targetAudience === 'SELLER' || p.category === 'SELLER'
      } else if (activeTab === 'ESCROW') {
        matchTab = p.category === 'ESCROW'
      } else if (activeTab === 'RETURN') {
        matchTab = p.category === 'RETURN'
      } else if (activeTab === 'SHIPPING') {
        matchTab = p.category === 'SHIPPING'
      } else if (activeTab === 'GRADING') {
        matchTab = p.category === 'GRADING'
      }

      // Search filter
      const matchSearch =
        !searchQuery.trim() ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policyKey?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchTab && matchSearch
    })
  }, [policies, activeTab, searchQuery])

  // Current selected policy
  const currentPolicy = useMemo(() => {
    return (
      policies.find((p) => p.policyKey === selectedKey) ||
      filteredPolicies[0] ||
      policies[0] ||
      null
    )
  }, [policies, filteredPolicies, selectedKey])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết điều khoản!')
    }
  }

  // Format inline markdown
  const formatInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className={isDark ? 'text-white font-bold' : 'text-stone-950 font-bold'}>
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-xs',
              isDark ? 'bg-slate-800 text-amber-400' : 'bg-stone-200 text-amber-700'
            )}
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  // Render Formatted Content (Markdown-like)
  const renderFormattedContent = (content) => {
    if (!content) return null

    const lines = content.split('\n')
    const elements = []
    let inTable = false
    let tableRows = []

    const flushTable = (key) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0]
        const bodyRows = tableRows.slice(2)

        elements.push(
          <div
            key={`table-${key}`}
            className={cn(
              'my-6 overflow-x-auto rounded-2xl border shadow-xs',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
            )}
          >
            <table className="w-full text-left text-xs sm:text-sm">
              <thead
                className={cn(
                  'border-b uppercase font-bold text-xs',
                  isDark ? 'border-slate-800 bg-slate-950/80 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600'
                )}
              >
                <tr>
                  {headerRow.map((col, idx) => (
                    <th key={idx} className="px-4 py-3">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={cn('transition', isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50')}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={cn('px-4 py-2.5', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
      }
      inTable = false
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true
        const cols = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
        tableRows.push(cols)
        return
      } else if (inTable) {
        flushTable(index)
      }

      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-3" />)
        return
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${index}`} className="mt-8 mb-4 text-xl sm:text-2xl font-black text-amber-500 border-b border-amber-500/20 pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className={cn('mt-6 mb-3 text-lg font-bold flex items-center gap-2', isDark ? 'text-slate-100' : 'text-stone-900')}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            {trimmed.replace('## ', '')}
          </h2>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${index}`} className="mt-4 mb-2 text-base font-semibold text-amber-400">
            {trimmed.replace('### ', '')}
          </h3>
        )
        return
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className={cn(
              'my-3 border-l-4 border-amber-500 px-4 py-3 rounded-r-2xl text-xs sm:text-sm',
              isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-900'
            )}
          >
            {trimmed.replace('> ', '')}
          </blockquote>
        )
        return
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${index}`} className={cn('ml-5 list-disc text-xs sm:text-sm leading-relaxed my-1', isDark ? 'text-slate-300' : 'text-stone-700')}>
            {formatInline(trimmed.slice(2))}
          </li>
        )
        return
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s/)
        elements.push(
          <li key={`num-${index}`} className={cn('ml-5 list-decimal text-xs sm:text-sm leading-relaxed my-1 font-medium', isDark ? 'text-slate-300' : 'text-stone-800')}>
            {formatInline(trimmed.slice(match[0].length))}
          </li>
        )
        return
      }

      elements.push(
        <p key={`p-${index}`} className={cn('my-2 text-xs sm:text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
          {formatInline(trimmed)}
        </p>
      )
    })

    if (inTable) {
      flushTable(lines.length)
    }

    return elements
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* Page Header Banner */}
      <div
        className={cn(
          'rounded-3xl border p-6 sm:p-8 relative overflow-hidden',
          isDark
            ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20'
            : 'border-stone-200 bg-gradient-to-r from-white via-white to-amber-50'
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 mb-2">
              <HiOutlineShieldCheck className="h-4 w-4" />
              Quy Chế Hoạt Động Kênh Người Bán (Merchant Center)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
              Chính Sách & Tiêu Chuẩn Vận Hành Gian Hàng
            </h1>
            <p className={cn('mt-1.5 text-xs sm:text-sm max-w-2xl', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hệ thống chính sách được cập nhật động từ Ban Quản Trị: điều kiện kinh doanh, quỹ ký quỹ, xử lý khiếu nại và cam kết chất lượng sản phẩm
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-xs',
                isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              )}
            >
              <HiOutlinePrinter className="h-4 w-4" />
              In Quy Chế
            </button>
            <button
              onClick={handleShare}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-xs',
                isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              )}
            >
              <HiOutlineShare className="h-4 w-4" />
              Chia sẻ
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-stone-500/10">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs',
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : isDark
                      ? 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Policy List & Search */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc từ khóa..."
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-stone-200 text-stone-900'
              )}
            />
          </div>

          <div className={cn('rounded-3xl border p-3 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider opacity-60">
              Văn bản đang áp dụng ({filteredPolicies.length})
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs opacity-60">Đang tải danh sách...</div>
            ) : filteredPolicies.length === 0 ? (
              <div className="py-8 text-center text-xs opacity-60">Không tìm thấy chính sách nào</div>
            ) : (
              <div className="space-y-1 mt-1">
                {filteredPolicies.map((p) => {
                  const isSelected = p.policyKey === currentPolicy?.policyKey
                  const Icon = CATEGORY_ICONS[p.category] || HiOutlineDocumentText

                  return (
                    <button
                      key={p.policyKey}
                      onClick={() => setSelectedKey(p.policyKey)}
                      className={cn(
                        'w-full text-left rounded-2xl p-3 text-xs transition-all flex items-start gap-3',
                        isSelected
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-xl shrink-0 mt-0.5',
                          isSelected ? 'bg-black/20 text-white' : isDark ? 'bg-slate-800 text-amber-400' : 'bg-stone-100 text-amber-600'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-1">{p.title}</div>
                        <div className={cn('text-[10px] mt-0.5 line-clamp-1', isSelected ? 'text-amber-100' : 'opacity-60')}>
                          {p.summary || p.policyKey}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Notice for Merchant */}
          <div
            className={cn(
              'rounded-3xl border p-5',
              isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50/60'
            )}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
              <HiOutlineExclamationCircle className="h-4 w-4" />
              Lưu Ý Về Kỷ Luật Gian Hàng
            </div>
            <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Gian hàng tích lũy từ <strong>7 vi phạm</strong> trở lên sẽ bị áp dụng chế tài <strong>Khóa Vĩnh Viễn (Permanent Ban)</strong>, đóng băng giải ngân toàn bộ số dư và xử lý ký quỹ theo đúng điều khoản cam kết.
            </p>
            <button
              onClick={() => navigate('/violations')}
              className="mt-3 text-xs font-bold text-amber-500 hover:underline inline-flex items-center gap-1"
            >
              Kiểm tra điểm uy tín gian hàng →
            </button>
          </div>
        </div>

        {/* Right Side: Policy Reader */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className={cn('rounded-3xl border p-12 text-center text-sm opacity-60', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
              Đang tải nội dung văn bản...
            </div>
          ) : !currentPolicy ? (
            <div className={cn('rounded-3xl border p-12 text-center text-sm opacity-60', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
              Vui lòng chọn một chính sách từ danh mục bên trái.
            </div>
          ) : (
            <article className={cn('rounded-3xl border p-6 sm:p-10 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-500">
                  {currentPolicy.policyKey}
                </span>
                <span className="rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[11px] font-bold text-purple-500">
                  Đối tượng: {currentPolicy.targetAudience === 'SELLER' ? 'Người bán (Shop)' : currentPolicy.targetAudience}
                </span>
                <span className="rounded-lg bg-stone-500/15 px-2.5 py-1 text-[11px] font-mono font-bold opacity-70">
                  Phiên bản v{currentPolicy.version || '1.0'}
                </span>
                <span className="flex items-center gap-1 text-[11px] opacity-60 ml-auto">
                  <HiOutlineCalendar className="h-3.5 w-3.5" />
                  Hiệu lực từ: {currentPolicy.effectiveDate ? new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN') : 'Hiện hành'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black leading-tight">
                {currentPolicy.title}
              </h1>

              {/* Summary Callout */}
              {currentPolicy.summary && (
                <div
                  className={cn(
                    'mt-6 rounded-2xl border p-5',
                    isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                    <HiOutlineCheckCircle className="h-4 w-4 text-amber-500" />
                    Tóm tắt điều khoản cốt lõi
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {currentPolicy.summary}
                  </p>
                </div>
              )}

              {/* Content Body */}
              <div className="mt-8 border-t border-stone-500/10 pt-6">
                {renderFormattedContent(currentPolicy.content)}
              </div>

              {/* Footer Guidance */}
              <div
                className={cn(
                  'mt-10 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs',
                  isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-600'
                )}
              >
                <div>
                  <p className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>Cần tư vấn thêm về quy chế gian hàng?</p>
                  <p className="text-[11px] mt-0.5">Liên hệ trực tiếp bộ phận Quản lý Người bán qua kênh Live Chat hoặc CSKH.</p>
                </div>
                <button
                  onClick={() => navigate('/chat')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition shadow-xs self-start sm:self-center"
                >
                  <HiOutlineChat className="h-4 w-4" />
                  Chat Với Quản Trị Viên
                </button>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
