import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlinePrinter,
  HiOutlineShare,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineChat,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineShoppingBag,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import policyService from '../../services/policy'
import PolicyMarkdownRenderer from '../../components/PolicyMarkdownRenderer'
import HorizontalScrollContainer from '../../components/HorizontalScrollContainer'
import { getCategoryIcon } from '../../components/policyMetaConstants'

const TABS = [
  { id: 'ALL', label: 'Tất cả quy chế sàn' },
  { id: 'SELLER', label: 'Dành riêng cho Gian hàng (Shop)' },
  { id: 'ESCROW', label: 'Bảo vệ Escrow & Tiền cọc' },
  { id: 'RETURN', label: 'Đổi trả & Xử lý Khiếu nại' },
  { id: 'SHIPPING', label: 'Vận chuyển cùng GHN' },
  { id: 'GRADING', label: 'Phân hạng hàng 2nd-hand' },
  { id: 'DISCIPLINE', label: 'Kỷ luật & Xử lý Vi phạm' },
]

export default function SellerPolicy() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const articleRef = useRef(null)

  // Kiểm tra xem trang có đang nằm trong SellerLayout (route /policy) hay là Standalone Public (route /seller-policy, /escrow-policy)
  const isStandalone = location.pathname !== '/policy'

  const [policies, setPolicies] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [activeTab, setActiveTab] = useState('SELLER')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Tải danh sách chính sách từ Backend
  const fetchPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await policyService.getActivePolicies()
      const list = Array.isArray(data) ? data : []
      setPolicies(list)

      // Ưu tiên chọn văn bản dành cho Seller đầu tiên nếu có
      if (list.length > 0 && !selectedKey) {
        const sellerFirst = list.find((p) => p.targetAudience === 'SELLER') || list[0]
        setSelectedKey(sellerFirst.policyKey)
      }
    } catch (err) {
      console.error('Lỗi khi tải chính sách người bán:', err)
      setError('Không thể tải quy chế sàn vào lúc này. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  // Bộ lọc văn bản theo Tab và Từ khóa tìm kiếm
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      // 1. Lọc theo Tab
      let matchTab = true
      if (activeTab === 'SELLER') {
        matchTab =
          p.targetAudience === 'SELLER' ||
          p.category === 'SELLER' ||
          p.category === 'SELLER_RULES' ||
          p.policyKey?.includes('SELLER')
      } else if (activeTab === 'ESCROW') {
        matchTab = p.category === 'ESCROW' || p.policyKey?.includes('ESCROW')
      } else if (activeTab === 'RETURN') {
        matchTab =
          p.category === 'RETURN' ||
          p.category === 'RETURN_REFUND' ||
          p.policyKey?.includes('RETURN') ||
          p.policyKey?.includes('CLAUSE_9') ||
          p.policyKey?.includes('CLAUSE_15')
      } else if (activeTab === 'SHIPPING') {
        matchTab = p.category === 'SHIPPING' || p.policyKey?.includes('SHIPPING')
      } else if (activeTab === 'GRADING') {
        matchTab =
          p.category === 'GRADING' ||
          p.category === 'CONDITION_GRADE' ||
          p.policyKey?.includes('PRODUCT_LISTING')
      } else if (activeTab === 'DISCIPLINE') {
        matchTab =
          p.category === 'DISCIPLINE' ||
          p.policyKey?.includes('DISCIPLINE') ||
          p.policyKey?.includes('CLAUSE_8') ||
          p.policyKey?.includes('CLAUSE_10') ||
          p.policyKey?.includes('CLAUSE_14')
      }

      // 2. Lọc theo Từ khóa tìm kiếm
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.policyKey?.toLowerCase().includes(q)

      return matchTab && matchSearch
    })
  }, [policies, activeTab, searchQuery])

  // Văn bản đang được chọn hiển thị
  const currentPolicy = useMemo(() => {
    return (
      policies.find((p) => p.policyKey === selectedKey) ||
      filteredPolicies[0] ||
      policies[0] ||
      null
    )
  }, [policies, filteredPolicies, selectedKey])

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
      toast.success('Đã sao chép liên kết quy chế vào bộ nhớ tạm!')
    }
  }

  const handleCopyKey = () => {
    if (currentPolicy?.policyKey && navigator.clipboard) {
      navigator.clipboard.writeText(currentPolicy.policyKey)
      setCopiedKey(true)
      toast.success(`Đã sao chép mã quy chế: ${currentPolicy.policyKey}`)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  const userRole = user?.role?.toUpperCase()

  // Phần nội dung chính sách
  const policyContent = (
    <div className="space-y-6">
      {/* 1. Page Header Banner */}
      <div
        className={cn(
          'rounded-3xl border p-5 sm:p-8 transition shadow-xs',
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
              <HiOutlineShieldCheck className="h-4 w-4" />
              <span>Quy Chế Hoạt Động Kênh Người Bán (Merchant Center)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Chính Sách & Tiêu Chuẩn Vận Hành Gian Hàng
            </h1>
            <p
              className={cn(
                'mt-2 text-xs sm:text-sm max-w-3xl leading-relaxed',
                isDark ? 'text-slate-400' : 'text-stone-500'
              )}
            >
              Hệ thống quy chế và tiêu chuẩn vận hành dành cho người bán trên sàn thương mại điện tử: điều kiện kinh doanh, quỹ ký quỹ bảo chứng, quy trình xử lý đơn hàng và cam kết chất lượng sản phẩm.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs active:scale-95',
                isDark
                  ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
              )}
            >
              <HiOutlinePrinter className="h-4 w-4" />
              <span className="hidden sm:inline">In Quy Chế</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs active:scale-95',
                isDark
                  ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
              )}
            >
              <HiOutlineShare className="h-4 w-4" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

                {/* Tab Pills - Cuộn ngang mượt mà bằng con lăn chuột, kéo rê chuột hoặc nút mũi tên */ }
                  < div className = "mt-6 pt-5 border-t border-stone-100 dark:border-slate-800" >
                  <HorizontalScrollContainer
                    isDark={isDark}
                    showArrows={true}
                    scrollStep={240}
                    className="gap-2 py-1 px-1"
                    gradientColor={isDark ? 'from-slate-900 via-slate-900/90' : 'from-white via-white/90'}
                  >
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={(e) => {
                            setActiveTab(tab.id)
                            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
                          }}
                          className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 active:scale-95 cursor-pointer select-none',
                            isActive
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 font-bold'
                              : isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                          )}
                        >
                    {tab.label}
                  </button>
                )
                })
          }
                  </HorizontalScrollContainer>
      </div>
    </div>

              {/* 2. Mobile Quick Selector (chỉ hiện trên màn hình < 1024px) */ }
  <div className="lg:hidden space-y-2">
    <div
      className={cn(
        'rounded-2xl border p-3 flex items-center justify-between gap-3 shadow-xs',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}
    >
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
          Văn bản đang xem:
        </span>
        <p className="text-xs font-bold truncate">
          {currentPolicy ? currentPolicy.title : 'Chọn văn bản...'}
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
            <span>Đóng</span>
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
            placeholder="Tìm theo tiêu đề hoặc từ khóa..."
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
            const isSelected = p.policyKey === currentPolicy?.policyKey
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

  {/* 3. Bố cục 2 Cột Desktop & Tablet */ }
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    {/* Cột trái: Tìm kiếm, Danh mục văn bản & Thẻ Kỷ luật (Desktop only) */}
    <div className="hidden lg:block lg:col-span-4 space-y-4 sticky top-20">
      {/* Ô tìm kiếm */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc từ khóa..."
          className={cn(
            'w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
              : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
          )}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
          >
            <HiOutlineX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Danh sách văn bản */}
      <div
        className={cn(
          'rounded-3xl border p-3 shadow-xs',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider opacity-60">
          Văn bản đang áp dụng ({filteredPolicies.length})
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs opacity-60">Đang tải danh sách...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="py-8 text-center text-xs opacity-60">Không tìm thấy quy chế phù hợp</div>
        ) : (
          <div className="space-y-1.5 mt-1 max-h-[480px] overflow-y-auto pr-1">
            {filteredPolicies.map((p) => {
              const isSelected = p.policyKey === currentPolicy?.policyKey
              const Icon = getCategoryIcon(p.category, p.policyKey)

              return (
                <button
                  key={p.policyKey}
                  type="button"
                  onClick={() => handleSelectPolicy(p.policyKey)}
                  className={cn(
                    'w-full text-left rounded-2xl p-3 text-xs transition-all flex items-start gap-3',
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900 border border-stone-100'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl shrink-0 mt-0.5',
                      isSelected
                        ? 'bg-black/20 text-white'
                        : isDark
                          ? 'bg-slate-800 text-amber-400'
                          : 'bg-amber-50 text-amber-600'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 leading-snug">{p.title}</div>
                    <div
                      className={cn(
                        'text-[10px] mt-0.5 line-clamp-1',
                        isSelected ? 'text-amber-100' : 'opacity-60'
                      )}
                    >
                      {p.summary || p.title || 'Quy chế nền tảng'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Thẻ Lưu Ý Kỷ Luật Gian Hàng (Đã sửa nền đục 100%, độ tương phản hoàn hảo) */}
      <div
        className={cn(
          'rounded-3xl border p-5 shadow-xs transition-colors',
          isDark
            ? 'border-amber-500/40 bg-slate-900 text-slate-200'
            : 'border-amber-300 bg-amber-50 text-stone-800'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 text-xs font-bold mb-1.5',
            isDark ? 'text-amber-400' : 'text-amber-800'
          )}
        >
          <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
          <span>Lưu Ý Về Kỷ Luật Gian Hàng</span>
        </div>
        <p
          className={cn(
            'text-[11px] leading-relaxed',
            isDark ? 'text-slate-300' : 'text-amber-950/90'
          )}
        >
          Gian hàng tích lũy từ <strong>7 vi phạm</strong> trở lên sẽ bị áp dụng chế tài{' '}
          <strong>Khóa Vĩnh Viễn (Permanent Ban)</strong>, đóng băng giải ngân toàn bộ số dư và xử lý ký quỹ theo đúng điều khoản cam kết.
        </p>
        <button
          type="button"
          onClick={() => navigate('/violations')}
          className={cn(
            'mt-3 text-xs font-bold inline-flex items-center gap-1 hover:underline',
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-800 hover:text-amber-950'
          )}
        >
          <span>Kiểm tra điểm uy tín gian hàng</span>
          <HiOutlineArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    {/* Cột phải: Khung hiển thị nội dung chi tiết văn bản (Article Reader) */}
    <div ref={articleRef} className="lg:col-span-8">
      {loading ? (
        <div
          className={cn(
            'rounded-3xl border p-12 text-center text-sm shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-stone-200 bg-white text-stone-500'
          )}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent mx-auto mb-3" />
          Đang tải nội dung văn bản...
        </div>
      ) : !currentPolicy ? (
        <div
          className={cn(
            'rounded-3xl border p-12 text-center text-sm shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-stone-200 bg-white text-stone-500'
          )}
        >
          Vui lòng chọn một chính sách từ danh mục bên trái để xem nội dung.
        </div>
      ) : (
        <article
          className={cn(
            'rounded-3xl border p-6 sm:p-9 shadow-xs transition-colors',
            isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          {/* Meta Header */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-500">
              <span>{currentPolicy.policyKey}</span>
              <button
                type="button"
                onClick={handleCopyKey}
                title="Sao chép mã quy chế"
                className="hover:text-amber-600 transition"
              >
                {copiedKey ? (
                  <HiOutlineCheck className="h-3 w-3 text-emerald-500" />
                ) : (
                  <HiOutlineDocumentDuplicate className="h-3 w-3" />
                )}
              </button>
            </div>

            <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-500">
              Đối tượng: {currentPolicy.targetAudience === 'SELLER' ? 'Người bán (Shop)' : currentPolicy.targetAudience === 'BUYER' ? 'Người mua' : 'Toàn sàn'}
            </span>

            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold border',
                isDark ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-700'
              )}
            >
              Phiên bản v{currentPolicy.version || '1.0'}
            </span>

            <span className="flex items-center gap-1 text-[11px] opacity-60 ml-auto">
              <HiOutlineCalendar className="h-3.5 w-3.5" />
              Hiệu lực từ:{' '}
              {currentPolicy.effectiveDate
                ? new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN')
                : 'Hiện hành'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
            {currentPolicy.title}
          </h1>

          {/* Summary Callout */}
          {currentPolicy.summary && (
            <div
              className={cn(
                'mt-6 rounded-2xl border p-4 sm:p-5 transition-colors',
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              )}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 text-amber-500">
                <HiOutlineCheckCircle className="h-4 w-4" />
                <span>Tóm tắt điều khoản cốt lõi</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {currentPolicy.summary}
              </p>
            </div>
          )}

          {/* Markdown Content Body */}
          <div className="mt-8 border-t border-stone-100 dark:border-slate-800 pt-6">
            <PolicyMarkdownRenderer content={currentPolicy.content} isDark={isDark} />
          </div>

          {/* Footer Guidance */}
          <div
            className={cn(
              'mt-10 rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs',
              isDark
                ? 'border-slate-800 bg-slate-950 text-slate-400'
                : 'border-stone-200 bg-stone-50 text-stone-600'
            )}
          >
            <div>
              <p className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Cần tư vấn thêm về quy chế gian hàng?
              </p>
              <p className="text-[11px] mt-0.5 opacity-70">
                Liên hệ trực tiếp bộ phận Quản lý Người bán qua kênh Live Chat hoặc CSKH.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition shadow-xs self-start sm:self-center"
            >
              <HiOutlineChat className="h-4 w-4" />
              <span>Chat Với Quản Trị Viên</span>
            </button>
          </div>
        </article>
      )}
    </div>
  </div>
    </div >
                  )

  // Nếu là Standalone Page (/seller-policy hoặc /escrow-policy):
  // Bọc trong Layout độc lập đầy đủ Header Navbar, Background chuẩn và Footer
  if (isStandalone) {
    return (
      <div
        className={cn(
          'min-h-screen flex flex-col font-sans transition-colors',
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900'
        )}
      >
        {/* Top Navbar dành cho Standalone Mode */}
        <header
          className={cn(
            'sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white/90'
          )}
        >
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <HiOutlineShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                    Kênh Người Bán
                  </span>
                  <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 text-[10px] uppercase">
                    Merchant Center
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                  Quy Chế Hoạt Động & Tiêu Chuẩn Nền Tảng
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-xl border transition-colors',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
              title="Đổi giao diện Sáng / Tối"
            >
              {isDark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
            </button>

            <a
              href="http://localhost:3000"
              className="hidden md:inline-flex text-xs font-semibold text-stone-500 hover:text-amber-600 px-3 py-2 transition-colors"
            >
              &larr; Về Sàn Mua Sắm
            </a>

            {isAuthenticated ? (
              <Link
                to={userRole === 'BUSINESS' ? '/dashboard' : '/seller-register'}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                {userRole === 'BUSINESS' ? 'Vào Kênh Quản Trị' : 'Quản Lý Hồ Sơ Shop'}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold border transition-colors',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                  )}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/seller-register"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Đăng Ký Gian Hàng
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Thân trang bọc container chuẩn */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {policyContent}
        </main>

        {/* Footer chuyên nghiệp dành cho Standalone Mode */}
        <footer
          className={cn(
            'mt-auto py-8 px-4 sm:px-8 border-t text-center text-xs text-stone-400 transition-colors',
            isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-stone-50'
          )}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 E-Commerce Marketplace - Kênh Quản Trị & Phát Triển Người Bán.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="http://localhost:3000" className="hover:text-amber-500 transition-colors">
                Trang Chủ Sàn
              </a>
              <span>•</span>
              <span className="text-stone-500 dark:text-slate-500">
                Hotline Hỗ Trợ Người Bán: 1900 1234
              </span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Nếu nằm trong SellerLayout (route /policy): chỉ render policyContent
  return policyContent
}
