import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineQuestionMarkCircle,
  HiOutlinePrinter,
  HiOutlineShare,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import { cn } from '../lib/cn'
import policyService from '../services/policy'

// Default route to policy key mapping
const ROUTE_KEY_MAP = {
  '/escrow-policy': 'ESCROW_PAYMENT_PROTECTION',
  '/returns': 'RETURN_REFUND_COMPLAINT_POLICY',
  '/return-policy': 'RETURN_REFUND_COMPLAINT_POLICY',
  '/seller-policy': 'SELLER_OPERATING_POLICY',
  '/shipping': 'SHIPPING_AND_CO_INSPECTION_POLICY',
  '/grading': 'PRODUCT_LISTING_AND_CONDITION_STANDARDS',
  '/discipline': 'DISCIPLINE_AND_REPUTATION_SYSTEM',
  '/privacy': 'PRIVACY_AND_DATA_PROTECTION',
  '/privacy-policy': 'PRIVACY_AND_DATA_PROTECTION',
  '/terms': 'PLATFORM_OPERATING_REGULATIONS',
  '/terms-of-service': 'PLATFORM_OPERATING_REGULATIONS',
}

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

export default function Policy({ defaultKey }) {
  const location = useLocation()
  const navigate = useNavigate()

  const [policies, setPolicies] = useState([])
  const [selectedKey, setSelectedKey] = useState(defaultKey || ROUTE_KEY_MAP[location.pathname] || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await policyService.getActivePolicies()
        const list = Array.isArray(data) ? data : []
        setPolicies(list)

        // Select policy based on prop, route, or default to first
        const routeKey = defaultKey || ROUTE_KEY_MAP[location.pathname]
        if (routeKey) {
          const found = list.find((p) => p.policyKey === routeKey)
          if (found) setSelectedKey(found.policyKey)
          else if (list.length > 0) setSelectedKey(list[0].policyKey)
        } else if (!selectedKey && list.length > 0) {
          setSelectedKey(list[0].policyKey)
        }
      } catch (err) {
        console.error('Lỗi khi tải chính sách:', err)
        setError('Không thể tải chính sách vào lúc này. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [location.pathname, defaultKey])

  // Filter policies by search query
  const filteredPolicies = useMemo(() => {
    if (!searchQuery.trim()) return policies
    const q = searchQuery.toLowerCase()
    return policies.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.policyKey?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
  }, [policies, searchQuery])

  // Currently active policy
  const currentPolicy = useMemo(() => {
    return policies.find((p) => p.policyKey === selectedKey) || policies[0] || null
  }, [policies, selectedKey])

  const handleSelectPolicy = (key) => {
    setSelectedKey(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết chính sách vào bộ nhớ tạm!')
    }
  }

  // Simple Markdown-like Renderer for Headings, Bold, Lists, Code, and Tables
  const renderFormattedContent = (content) => {
    if (!content) return null

    const lines = content.split('\n')
    const elements = []
    let inTable = false
    let tableRows = []

    const flushTable = (key) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0]
        const bodyRows = tableRows.slice(2) // Skip header and separator

        elements.push(
          <div key={`table-${key}`} className="my-6 overflow-x-auto rounded-xl border border-slate-700/60 shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/80 font-bold uppercase text-slate-300">
                <tr>
                  {headerRow.map((col, idx) => (
                    <th key={idx} className="px-4 py-3">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-slate-300">
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

      // Table row detection
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

      // Empty line
      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-3" />)
        return
      }

      // Heading 1
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${index}`} className="mt-8 mb-4 text-xl sm:text-2xl font-black text-amber-400 border-b border-amber-500/20 pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        )
        return
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${index}`} className="mt-6 mb-3 text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
            {trimmed.replace('## ', '')}
          </h2>
        )
        return
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${index}`} className="mt-5 mb-2 text-base sm:text-lg font-semibold text-amber-300">
            {trimmed.replace('### ', '')}
          </h3>
        )
        return
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${index}`} className="my-3 border-l-4 border-amber-500 bg-amber-500/10 px-4 py-3 rounded-r-xl text-amber-200 text-xs sm:text-sm">
            {trimmed.replace('> ', '')}
          </blockquote>
        )
        return
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.slice(2)
        elements.push(
          <li key={`li-${index}`} className="ml-5 list-disc text-slate-300 text-xs sm:text-sm leading-relaxed my-1">
            {formatInlineText(text)}
          </li>
        )
        return
      }

      // Numbered items (1. 2.)
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s/)
        const text = trimmed.slice(match[0].length)
        elements.push(
          <li key={`num-${index}`} className="ml-5 list-decimal text-slate-300 text-xs sm:text-sm leading-relaxed my-1 font-medium">
            {formatInlineText(text)}
          </li>
        )
        return
      }

      // Normal paragraph
      elements.push(
        <p key={`p-${index}`} className="my-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      )
    })

    if (inTable) {
      flushTable(lines.length)
    }

    return elements
  }

  // Handle inline markdown formatting: **bold**, `code`, etc.
  const formatInlineText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-amber-400">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span
              onClick={() => navigate('/')}
              className="cursor-pointer hover:text-amber-400 transition"
            >
              Trang chủ
            </span>
            <HiOutlineChevronRight className="h-3 w-3" />
            <span className="text-amber-400 font-medium">Chính sách & Quy định nền tảng</span>
            {currentPolicy && (
              <>
                <HiOutlineChevronRight className="h-3 w-3" />
                <span className="text-slate-300 font-semibold">{currentPolicy.title}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <HiOutlineShieldCheck className="h-8 w-8 text-amber-400" />
                Trung Tâm Chính Sách & Pháp Lý Sàn
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Toàn bộ quy chế minh bạch bảo vệ người mua, hướng dẫn gian hàng và cơ chế thanh toán ký quỹ an toàn
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                title="In văn bản này"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <HiOutlinePrinter className="h-4 w-4" />
                In chính sách
              </button>
              <button
                onClick={handleShare}
                title="Chia sẻ liên kết"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <HiOutlineShare className="h-4 w-4" />
                Chia sẻ
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Search Box */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chính sách, quy chế..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-900 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Policy Navigation List */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl backdrop-blur-md">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Danh mục văn bản quy chế ({filteredPolicies.length})
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-500">Đang tải danh mục chính sách...</div>
              ) : filteredPolicies.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">Không tìm thấy chính sách phù hợp</div>
              ) : (
                <div className="space-y-1 mt-1">
                  {filteredPolicies.map((p) => {
                    const isSelected = p.policyKey === selectedKey
                    const IconComponent = CATEGORY_ICONS[p.category] || HiOutlineDocumentText

                    return (
                      <button
                        key={p.policyKey}
                        onClick={() => handleSelectPolicy(p.policyKey)}
                        className={cn(
                          'w-full text-left rounded-2xl p-3 text-xs transition-all flex items-start gap-3',
                          isSelected
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-xl shrink-0 mt-0.5',
                            isSelected ? 'bg-black/20 text-white' : 'bg-slate-800 text-amber-400'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="line-clamp-1 leading-snug">{p.title}</div>
                          <div
                            className={cn(
                              'text-[10px] mt-0.5 line-clamp-1',
                              isSelected ? 'text-amber-100' : 'text-slate-500'
                            )}
                          >
                            {p.summary || p.policyKey}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Support Card */}
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bạn có câu hỏi hoặc khiếu nại?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ban Quản Trị sẵn sàng hỗ trợ bạn 24/7</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/report')}
                className="mt-4 w-full rounded-xl bg-slate-900 border border-amber-500/30 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-white transition"
              >
                Gửi Yêu Cầu Hỗ Trợ / Khiếu Nại
              </button>
            </div>
          </aside>

          {/* Right Main Policy Content */}
          <main className="lg:col-span-8">
            {loading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
                Đang tải nội dung văn bản chính sách...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm text-rose-300">
                {error}
              </div>
            ) : !currentPolicy ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
                Vui lòng chọn một chính sách từ danh mục bên trái để xem chi tiết.
              </div>
            ) : (
              <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
                {/* Policy Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                    Mã: {currentPolicy.policyKey}
                  </span>
                  <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-[11px] font-bold text-blue-400">
                    Đối tượng: {currentPolicy.targetAudience === 'SELLER' ? 'Người bán' : currentPolicy.targetAudience === 'BUYER' ? 'Người mua' : 'Toàn sàn'}
                  </span>
                  <span className="rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[11px] font-mono font-semibold text-purple-400">
                    Phiên bản v{currentPolicy.version || '1.0'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                    <HiOutlineCalendar className="h-3.5 w-3.5" />
                    Hiệu lực: {currentPolicy.effectiveDate ? new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN') : 'Hiện hành'}
                  </span>
                </div>

                {/* Policy Document Title */}
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {currentPolicy.title}
                </h1>

                {/* Executive Summary Box */}
                {currentPolicy.summary && (
                  <div className="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-transparent p-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                      <HiOutlineCheckCircle className="h-4 w-4" />
                      Tóm tắt điều khoản cốt lõi
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {currentPolicy.summary}
                    </p>
                  </div>
                )}

                {/* Formatted Policy Document Body */}
                <div className="mt-8 border-t border-slate-800 pt-6">
                  {renderFormattedContent(currentPolicy.content)}
                </div>

                {/* Document Footer Guarantee */}
                <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <HiOutlineShieldCheck className="h-6 w-6 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-200">Cam kết bảo vệ quyền lợi người dùng</p>
                      <p className="text-[11px]">Chính sách này được ban hành và bảo đảm thực thi bởi Ban Quản Trị Nền Tảng.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-amber-400 hover:underline font-semibold self-start sm:self-center"
                  >
                    Về đầu trang ↑
                  </button>
                </div>
              </article>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  )
}
