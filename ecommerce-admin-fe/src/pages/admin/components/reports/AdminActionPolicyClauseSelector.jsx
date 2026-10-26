import { useState, useMemo } from 'react'
import { cn } from '../../../../lib/cn'
import {
  HiOutlineBookOpen,
  HiOutlineShieldCheck,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineInformationCircle,
  HiOutlineX,
} from 'react-icons/hi'
import { FALLBACK_CLAUSES } from './policyClauseConstants'

function OrderPolicyClauseSelectorContent({
  policyClauses = [],
  selectedClause,
  onChangeClause,
  targetType,
  actionType,
  isSellerDispute = false,
  isDark = false,
}) {
  // Chuẩn hóa danh mục Chính Sách Nền Tảng (fallback an toàn chống crash)
  const allClauses = useMemo(() => {
    const rawList = Array.isArray(policyClauses) && policyClauses.length > 0 ? policyClauses : FALLBACK_CLAUSES
    return rawList.map((item) => ({
      code: item.policyKey || item.code,
      policyKey: item.policyKey || item.code,
      title: item.title,
      summary: item.summary || item.description || '',
      description: item.summary || item.description || '',
      category: item.category || 'GENERAL',
    }))
  }, [policyClauses])

  // Trạng thái mở/đóng danh mục
  const [isOpen, setIsOpen] = useState(!selectedClause)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('RECOMMENDED') // 'RECOMMENDED' | 'ALL' | 'RETURN' | 'STANDARDS' | 'ESCROW_SAFETY'

  // Phân loại danh mục chính sách
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'RETURN_REFUND':
      case 'RETURN':
        return {
          label: 'Đổi Trả & Khiếu Nại',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        }
      case 'CONDITION_GRADE':
      case 'GRADING':
        return {
          label: 'Tiêu Chuẩn Hàng Hóa',
          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        }
      case 'ESCROW':
        return {
          label: 'Bảo Vệ Escrow',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        }
      case 'SHIPPING':
        return {
          label: 'Vận Chuyển & GHN',
          className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        }
      case 'SELLER_RULES':
      case 'SELLER':
        return {
          label: 'Quy Chế Gian Hàng',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        }
      case 'DISCIPLINE':
        return {
          label: 'Kỷ Luật & Uy Tín',
          className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        }
      default:
        return {
          label: 'Quy Chế Chung',
          className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
        }
    }
  }

  // Danh sách chính sách sau khi lọc theo Tab và Search
  const displayClauses = useMemo(() => {
    let list = allClauses

    if (activeTab === 'RECOMMENDED') {
      const priorityMap = {
        PRODUCT: [
          'PRODUCT_LISTING_AND_PROHIBITED_ITEMS',
          'PRODUCT_LISTING_AND_CONDITION_STANDARDS',
          'CLAUSE_8_COUNTERFEIT_AND_PROHIBITED_GOODS',
          'CLAUSE_9_PRODUCT_QUALITY_AND_SPEC_DISPUTE',
        ],
        SHOP: [
          'SELLER_CONDUCT_AND_PENALTIES',
          'SELLER_OPERATING_POLICY',
          'CLAUSE_10_SELLER_UNRESPONSIVE_AND_SLA_BREACH',
          'COMMISSION_AND_SETTLEMENT',
        ],
        REVIEW: [
          'BUYER_RIGHTS_AND_PROTECTION',
          'PRIVACY_AND_DATA_PROTECTION',
          'SELLER_CONDUCT_AND_PENALTIES',
        ],
        USER: [
          'BUYER_RIGHTS_AND_PROTECTION',
          'CLAUSE_14_BUYER_DISPUTE_REJECTION_STANDARDS',
          'PRIVACY_AND_DATA_PROTECTION',
        ],
        ORDER: [
          'CLAUSE_9_PRODUCT_QUALITY_AND_SPEC_DISPUTE',
          'CLAUSE_8_COUNTERFEIT_AND_PROHIBITED_GOODS',
          'CLAUSE_10_SELLER_UNRESPONSIVE_AND_SLA_BREACH',
          'CLAUSE_14_BUYER_DISPUTE_REJECTION_STANDARDS',
          'CLAUSE_15_RETURN_PACKAGE_DISPUTE_STANDARDS',
          'RETURN_REFUND_COMPLAINT_POLICY',
          'ESCROW_PAYMENT_PROTECTION',
        ],
      }

      const priorities = priorityMap[targetType] || priorityMap.ORDER

      list = [...list].sort((a, b) => {
        const idxA = priorities.indexOf(a.code)
        const idxB = priorities.indexOf(b.code)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return 0
      })
    } else if (activeTab === 'RETURN') {
      list = list.filter((c) => c.category === 'RETURN_REFUND' || c.category === 'RETURN')
    } else if (activeTab === 'STANDARDS') {
      list = list.filter((c) => c.category === 'CONDITION_GRADE' || c.category === 'SHIPPING' || c.category === 'GRADING' || c.category === 'LISTING_STANDARDS')
    } else if (activeTab === 'SELLER_RULES') {
      list = list.filter((c) => c.category === 'SELLER_RULES' || c.category === 'SELLER' || c.category === 'FINANCE')
    } else if (activeTab === 'USER_SAFETY') {
      list = list.filter((c) => c.category === 'BUYER_PROTECTION' || c.category === 'ESCROW' || c.category === 'DISCIPLINE' || c.category === 'PRIVACY')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.summary?.toLowerCase().includes(q)
      )
    }

    return list
  }, [allClauses, activeTab, searchQuery, targetType])

  const activeClauseInfo = useMemo(() => {
    return allClauses.find((c) => c.code === selectedClause) || null
  }, [allClauses, selectedClause])

  return (
    <div
      className={cn(
        'rounded-2xl border mb-3 transition-all overflow-hidden',
        !selectedClause
          ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
          : isDark
            ? 'border-slate-800 bg-slate-900/80'
            : 'border-stone-200 bg-white'
      )}
    >
      {/* Header bar */}
      <div className="p-3.5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <HiOutlineBookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-800 dark:text-slate-100">
                Căn Cứ Chính Sách & Quy Định Nền Tảng
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                Bắt buộc
              </span>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-400">
                (Dynamic Platform Policies)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
            isOpen
              ? 'bg-amber-500 text-white shadow-xs'
              : 'border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700'
          )}
        >
          <span>{isOpen ? 'Thu gọn danh mục' : selectedClause ? 'Đổi chính sách khác' : 'Chọn căn cứ chính sách'}</span>
          {isOpen ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Thông tin chính sách đang chọn (Callout Banner) */}
      {activeClauseInfo && !isOpen && (
        <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/20 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {activeClauseInfo.title}
              </span>
            </div>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                getCategoryBadge(activeClauseInfo.category).className
              )}
            >
              {getCategoryBadge(activeClauseInfo.category).label}
            </span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-slate-300">
            {activeClauseInfo.summary}
          </p>
        </div>
      )}

      {/* Nội dung danh mục khi mở rộng */}
      {isOpen && (
        <div className="p-3 space-y-2.5">
          {/* Thanh tìm kiếm */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên chính sách, từ khóa (đổi trả, bảo vệ escrow, 6 cấp bậc...)"
              className={cn(
                'w-full text-xs rounded-xl pl-9 pr-8 py-2 border outline-hidden transition-all',
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:bg-white'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bộ lọc Tabs danh mục */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('RECOMMENDED')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'RECOMMENDED'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              ✨ Phù hợp nhất
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'ALL'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Tất cả ({allClauses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RETURN')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'RETURN'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Đổi Trả & Khiếu Nại
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('STANDARDS')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'STANDARDS'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Tiêu Chuẩn & Vận Chuyển
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SELLER_RULES')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'SELLER_RULES'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Gian Hàng & Người Bán
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('USER_SAFETY')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'USER_SAFETY'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Người Dùng & Kỷ Luật
            </button>
          </div>

          {/* Trạng thái số lượng */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 px-1 pt-0.5">
            <span className="font-semibold">
              Danh mục: <strong className="text-amber-600 dark:text-amber-400">{displayClauses.length}</strong> chính sách nền tảng
            </span>
            <span className="text-[10px] italic text-stone-400 dark:text-slate-400 flex items-center gap-1">
              ↕ Nhấp vào chính sách để chọn làm căn cứ phán quyết
            </span>
          </div>

          {/* Danh sách chính sách cuộn */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-1.5 pr-1.5 divide-y divide-stone-100 dark:divide-slate-800/60 border border-stone-200/80 dark:border-slate-800 rounded-xl p-1.5 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-stone-400">
            {displayClauses.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Không tìm thấy chính sách nào phù hợp với từ khóa "{searchQuery}"
              </div>
            ) : (
              displayClauses.map((clause) => {
                const isSelected = selectedClause === clause.code
                const badge = getCategoryBadge(clause.category)

                return (
                  <div
                    key={clause.code}
                    onClick={() => {
                      onChangeClause(clause.code)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'p-2.5 rounded-xl transition-all select-none cursor-pointer',
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 shadow-xs'
                        : isDark
                          ? 'hover:bg-slate-800/60'
                          : 'hover:bg-stone-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'text-[9.5px] font-extrabold uppercase px-1.5 py-0.2 rounded-md border',
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                          <span className="font-mono text-[9px] text-amber-500/80">
                            {clause.code}
                          </span>
                        </div>

                        <p
                          className={cn(
                            'text-xs font-bold leading-snug break-words',
                            isSelected
                              ? 'text-amber-800 dark:text-amber-300'
                              : isDark
                                ? 'text-slate-100'
                                : 'text-stone-900'
                          )}
                        >
                          {clause.title}
                        </p>

                        <p className="text-[11px] leading-relaxed text-stone-500 dark:text-slate-400 break-words">
                          {clause.summary}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="p-1 rounded-full bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Thông báo nếu chưa chọn chính sách */}
      {!selectedClause && (
        <div className="p-2.5 bg-rose-500/10 border-t border-rose-500/20 flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span>Vui lòng chọn 1 chính sách nền tảng trong danh mục trên để làm căn cứ phán quyết.</span>
        </div>
      )}
    </div>
  )
}

export default function AdminActionPolicyClauseSelector(props) {
  return <OrderPolicyClauseSelectorContent {...props} />
}
