import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineQuestionMarkCircle,
  HiOutlinePrinter,
  HiOutlineShare,
  HiOutlineCheck,
  HiOutlineDocumentDuplicate,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineChevronDown,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import PolicyMarkdownRenderer from '../components/PolicyMarkdownRenderer'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import policyService from '../services/policy'
import { getCategoryIcon } from '../components/policyMetaConstants'

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
  RETURN_REFUND: HiOutlineRefresh,
  SELLER: HiOutlineScale,
  SELLER_RULES: HiOutlineScale,
  SHIPPING: HiOutlineTruck,
  GRADING: HiOutlineDocumentText,
  CONDITION_GRADE: HiOutlineDocumentText,
  DISCIPLINE: HiOutlineCheckCircle,
  PRIVACY: HiOutlineShieldCheck,
  TERMS: HiOutlineDocumentText,
  GENERAL: HiOutlineDocumentText,
}

export default function Policy({ defaultKey }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const location = useLocation()
  const navigate = useNavigate()
  const articleRef = useRef(null)

  const [policies, setPolicies] = useState([])
  const [selectedKey, setSelectedKey] = useState(defaultKey || ROUTE_KEY_MAP[location.pathname] || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    setMobileMenuOpen(false)
    if (window.innerWidth < 1024 && articleRef.current) {
      articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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

  const handleCopyKey = () => {
    if (currentPolicy?.policyKey && navigator.clipboard) {
      navigator.clipboard.writeText(currentPolicy.policyKey)
      setCopiedKey(true)
      toast.success(`Đã sao chép mã: ${currentPolicy.policyKey}`)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-200 flex flex-col justify-between',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900'
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Breadcrumb Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs opacity-70 mb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span
              onClick={() => navigate('/')}
              className="cursor-pointer hover:text-amber-500 transition"
            >
              Trang chủ
            </span>
            <HiOutlineChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-amber-500 font-medium">Trung tâm pháp lý</span>
            {currentPolicy && (
              <>
                <HiOutlineChevronRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold truncate max-w-[200px] sm:max-w-none">
                  {currentPolicy.title}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
                <HiOutlineShieldCheck className="h-4 w-4" />
                Bộ Quy Chuẩn & Bảo Vệ Khách Hàng
              </div>
              <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
                <span>Trung Tâm Chính Sách & Pháp Lý Sàn</span>
              </h1>
              <p
                className={cn(
                  'mt-1 text-xs sm:text-sm max-w-2xl',
                  isDark ? 'text-slate-400' : 'text-stone-500'
                )}
              >
                Toàn bộ quy chế minh bạch bảo vệ người mua, hướng dẫn gian hàng và cơ chế thanh toán ký quỹ an toàn
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                title="In văn bản này"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition shadow-xs active:scale-95',
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                )}
              >
                <HiOutlinePrinter className="h-4 w-4" />
                <span className="hidden sm:inline">In văn bản</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                title="Chia sẻ liên kết"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition shadow-xs active:scale-95',
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                )}
              >
                <HiOutlineShare className="h-4 w-4" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE RESPONSIVE POLICY SELECTOR (lg:hidden) */}
        <div className="lg:hidden mb-6 space-y-2">
          <div
            className={cn(
              'rounded-2xl border p-3 flex items-center justify-between gap-3 shadow-xs',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
            )}
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                Chính sách đang xem:
              </span>
              <p className="text-xs font-bold truncate">
                {currentPolicy ? currentPolicy.title : 'Chọn chính sách...'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shrink-0',
                mobileMenuOpen
                  ? 'bg-amber-500 text-white border-amber-500'
                  : isDark
                    ? 'border-slate-800 bg-slate-950 text-slate-200'
                    : 'border-stone-200 bg-stone-100 text-stone-800'
              )}
            >
              {mobileMenuOpen ? (
                <>
                  <HiOutlineX className="h-4 w-4" />
                  <span>Đóng mục lục</span>
                </>
              ) : (
                <>
                  <HiOutlineMenuAlt2 className="h-4 w-4" />
                  <span>Đổi văn bản</span>
                  <HiOutlineChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>

          {/* Expandable Mobile Policy Drawer / Accordion */}
          {mobileMenuOpen && (
            <div
              className={cn(
                'rounded-3xl border p-4 space-y-3 shadow-xl animate-in fade-in duration-150',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <div className="relative">
                <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm chính sách, quy chế..."
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400'
                  )}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredPolicies.map((p) => {
                  const isSelected = p.policyKey === selectedKey
                  const Icon = getCategoryIcon(p.category, p.policyKey)
                  return (
                    <button
                      key={p.policyKey}
                      type="button"
                      onClick={() => handleSelectPolicy(p.policyKey)}
                      className={cn(
                        'w-full text-left rounded-xl p-2.5 text-xs transition flex items-center gap-2.5',
                        isSelected
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-stone-700 hover:bg-stone-100'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-white' : 'text-amber-500')} />
                      <span className="truncate flex-1">{p.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-20">
            {/* Search Box */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chính sách, quy chế..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500'
                    : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400'
                )}
              />
            </div>

            {/* Policy Navigation List */}
            <div
              className={cn(
                'rounded-3xl border p-3 shadow-sm',
                isDark ? 'border-slate-800 bg-slate-900/80 backdrop-blur-md' : 'border-stone-200 bg-white'
              )}
            >
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider opacity-60">
                Danh mục văn bản quy chế ({filteredPolicies.length})
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs opacity-60">Đang tải danh mục chính sách...</div>
              ) : filteredPolicies.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-60">Không tìm thấy chính sách phù hợp</div>
              ) : (
                <div className="space-y-1 mt-1 max-h-[500px] overflow-y-auto pr-1">
                  {filteredPolicies.map((p) => {
                    const isSelected = p.policyKey === selectedKey
                    const IconComponent = getCategoryIcon(p.category, p.policyKey)

                    return (
                      <button
                        key={p.policyKey}
                        type="button"
                        onClick={() => handleSelectPolicy(p.policyKey)}
                        className={cn(
                          'w-full text-left rounded-2xl p-3 text-xs transition-all flex items-start gap-3',
                          isSelected
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 font-bold'
                            : isDark
                              ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-xl shrink-0 mt-0.5',
                            isSelected
                              ? 'bg-black/20 text-white'
                              : isDark
                                ? 'bg-slate-800 text-amber-400'
                                : 'bg-stone-100 text-amber-600'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="line-clamp-1 leading-snug">{p.title}</div>
                          <div
                            className={cn(
                              'text-[10px] mt-0.5 line-clamp-1',
                              isSelected ? 'text-amber-100' : 'opacity-60'
                            )}
                          >
                            {p.summary || p.title || 'Chính sách nền tảng'}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Support Card */}
            <div
              className={cn(
                'rounded-3xl border p-5',
                isDark
                  ? 'border-amber-500/40 bg-slate-900 text-slate-200 shadow-xs'
                  : 'border-amber-200 bg-amber-50 text-stone-800 shadow-xs'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Bạn có câu hỏi hoặc khiếu nại?</h4>
                  <p className="text-[11px] opacity-70 mt-0.5">Ban Quản Trị sẵn sàng hỗ trợ bạn 24/7</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/report')}
                className={cn(
                  'mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition border',
                  isDark
                    ? 'bg-slate-900 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white'
                    : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-500 hover:text-white'
                )}
              >
                Gửi Yêu Cầu Hỗ Trợ / Khiếu Nại
              </button>
            </div>
          </aside>

          {/* Right Main Policy Content */}
          <main ref={articleRef} className="lg:col-span-8">
            {loading ? (
              <div
                className={cn(
                  'rounded-3xl border p-12 text-center text-sm',
                  isDark ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-stone-200 bg-white text-stone-500'
                )}
              >
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent mx-auto mb-3" />
                Đang tải nội dung văn bản chính sách...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm text-rose-500">
                {error}
              </div>
            ) : !currentPolicy ? (
              <div
                className={cn(
                  'rounded-3xl border p-12 text-center text-sm',
                  isDark ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-stone-200 bg-white text-stone-500'
                )}
              >
                Vui lòng chọn một chính sách từ danh mục bên trái để xem chi tiết.
              </div>
            ) : (
              <article
                className={cn(
                  'rounded-3xl border p-5 sm:p-9 shadow-sm transition',
                  isDark ? 'border-slate-800 bg-slate-900/80 backdrop-blur-md' : 'border-stone-200 bg-white'
                )}
              >
                {/* Policy Meta Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-500">
                    <span>{currentPolicy.policyKey}</span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      title="Sao chép mã"
                      className="hover:text-amber-600 transition"
                    >
                      {copiedKey ? (
                        <HiOutlineCheck className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <HiOutlineDocumentDuplicate className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-bold border',
                      currentPolicy.targetAudience === 'SELLER'
                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                        : currentPolicy.targetAudience === 'BUYER'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    )}
                  >
                    Đối tượng: {currentPolicy.targetAudience === 'SELLER' ? 'Người bán' : currentPolicy.targetAudience === 'BUYER' ? 'Người mua' : 'Toàn sàn'}
                  </span>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold border',
                      isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-700'
                    )}
                  >
                    Phiên bản v{currentPolicy.version || '1.0'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] opacity-60 ml-auto">
                    <HiOutlineCalendar className="h-3.5 w-3.5" />
                    Hiệu lực: {currentPolicy.effectiveDate ? new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN') : 'Hiện hành'}
                  </span>
                </div>

                {/* Policy Document Title */}
                <h1 className="text-xl sm:text-3xl font-black leading-tight">
                  {currentPolicy.title}
                </h1>

                {/* Executive Summary Box */}
                {currentPolicy.summary && (
                  <div
                    className={cn(
                      'mt-6 rounded-2xl border p-4 sm:p-5',
                      isDark
                        ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-transparent text-amber-200'
                        : 'border-amber-200 bg-amber-50 text-amber-900'
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1.5">
                      <HiOutlineShieldCheck className="h-4 w-4" />
                      Tóm tắt điều khoản cốt lõi
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed font-medium">
                      {currentPolicy.summary}
                    </p>
                  </div>
                )}

                {/* Formatted Policy Document Body */}
                <div
                  className={cn(
                    'mt-8 border-t pt-6',
                    isDark ? 'border-slate-800' : 'border-stone-100'
                  )}
                >
                  <PolicyMarkdownRenderer content={currentPolicy.content} isDark={isDark} />
                </div>

                {/* Document Footer Guarantee */}
                <div
                  className={cn(
                    'mt-10 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs',
                    isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <HiOutlineShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
                    <div>
                      <p className={cn('font-bold', isDark ? 'text-slate-200' : 'text-stone-900')}>
                        Cam kết bảo vệ quyền lợi người dùng
                      </p>
                      <p className="text-[11px] opacity-70">
                        Chính sách này được ban hành và bảo đảm thực thi bởi Ban Quản Trị Nền Tảng.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-amber-500 hover:underline font-semibold self-start sm:self-center"
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
