import { useState, useMemo, useCallback } from 'react'
import { cn } from '../../../../lib/cn'
import {
  HiOutlineBookOpen,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
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
  // Danh mục 12 điều khoản đầy đủ (fallback an toàn chống crash)
  const allClauses = useMemo(() => {
    return Array.isArray(policyClauses) && policyClauses.length > 0 ? policyClauses : FALLBACK_CLAUSES
  }, [policyClauses])

  // Trạng thái mở/đóng danh mục (mặc định mở nếu chưa chọn)
  const [isOpen, setIsOpen] = useState(!selectedClause)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('RECOMMENDED') // 'RECOMMENDED' | 'ALL' | 'SELLER_FAULT' | 'BUYER_FAULT' | 'RETURN_DISPUTE'

  // Kiểm tra điều khoản có hợp lệ với phán quyết hiện tại không
  const checkClauseAllowed = useCallback((clause) => {
    if (isSellerDispute) {
      if (actionType === 'REPORT_APPROVE') {
        return clause.category === 'RETURN_DISPUTE' || clause.category === 'BUYER_FAULT'
      }
      if (actionType === 'REPORT_REJECT') {
        return clause.category === 'BUYER_FAULT' || clause.category === 'SELLER_FAULT' || clause.category === 'RETURN_DISPUTE'
      }
      return true
    }

    if (actionType === 'REPORT_APPROVE') {
      return clause.category === 'SELLER_FAULT'
    }

    if (actionType === 'REPORT_REJECT') {
      return clause.category === 'BUYER_FAULT'
    }

    return true
  }, [isSellerDispute, actionType])

  // Danh sách điều khoản sau khi lọc theo Tab và Search
  const displayClauses = useMemo(() => {
    let list = allClauses

    if (activeTab === 'RECOMMENDED') {
      list = list.filter((c) => checkClauseAllowed(c))
      // Sắp xếp ưu tiên theo ngữ cảnh phán quyết
      if (isSellerDispute) {
        if (actionType === 'REPORT_APPROVE') {
          // Ưu tiên nhóm Tranh Chấp Kiện Hoàn (15.1, 15.2, 15.3) lên trên cùng
          list = [...list].sort((a, b) => {
            if (a.category === 'RETURN_DISPUTE' && b.category !== 'RETURN_DISPUTE') return -1
            if (b.category === 'RETURN_DISPUTE' && a.category !== 'RETURN_DISPUTE') return 1
            return 0
          })
        } else if (actionType === 'REPORT_REJECT') {
          // Ưu tiên điều khoản không đủ căn cứ (14.1) hoặc quá hạn (14.3) lên trước
          list = [...list].sort((a, b) => {
            if (a.code === 'CLAUSE_14_1_INSUFFICIENT_EVIDENCE') return -1
            if (b.code === 'CLAUSE_14_1_INSUFFICIENT_EVIDENCE') return 1
            return 0
          })
        }
      }
    } else if (activeTab === 'SELLER_FAULT') {
      list = list.filter((c) => c.category === 'SELLER_FAULT')
    } else if (activeTab === 'BUYER_FAULT') {
      list = list.filter((c) => c.category === 'BUYER_FAULT')
    } else if (activeTab === 'RETURN_DISPUTE') {
      list = list.filter((c) => c.category === 'RETURN_DISPUTE')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      )
    }

    return list
  }, [allClauses, activeTab, searchQuery, checkClauseAllowed, isSellerDispute, actionType])

  const activeClauseInfo = useMemo(() => {
    return allClauses.find((c) => c.code === selectedClause) || null
  }, [allClauses, selectedClause])

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'SELLER_FAULT':
        return {
          label: 'Lỗi Người Bán',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        }
      case 'BUYER_FAULT':
        return {
          label: 'Lỗi Người Mua / Bác Khiếu Nại',
          className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        }
      case 'RETURN_DISPUTE':
        return {
          label: 'Tranh Chấp Kiện Hoàn',
          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        }
      default:
        return {
          label: category,
          className: 'bg-stone-500/10 text-stone-600 border-stone-500/20',
        }
    }
  }

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
                Căn Cứ Điều Khoản Chính Sách
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                Bắt buộc
              </span>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-400">
                (12 điều khoản quy chế sàn)
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
          <span>{isOpen ? 'Thu gọn danh mục' : selectedClause ? 'Đổi điều khoản khác' : 'Chọn điều khoản'}</span>
          {isOpen ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Thông tin điều khoản đang chọn (Callout Banner) */}
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
            {activeClauseInfo.description}
          </p>
        </div>
      )}

      {/* Nội dung danh mục khi mở rộng (Custom Responsive Combobox) */}
      {isOpen && (
        <div className="p-3 space-y-2.5">
          {/* Thanh tìm kiếm */}
          <div className="relative">
            <HiOutlineSearch className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh theo số điều (8.2, 9.1), từ khóa (hàng giả, hư hỏng, video...)"
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
              Tất cả (12)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SELLER_FAULT')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'SELLER_FAULT'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Lỗi Shop (5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BUYER_FAULT')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'BUYER_FAULT'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Lỗi Khách (4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RETURN_DISPUTE')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all shrink-0 border',
                activeTab === 'RETURN_DISPUTE'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              )}
            >
              Kiện Hoàn (3)
            </button>
          </div>

          {/* Trạng thái số lượng điều khoản và chỉ dẫn cuộn */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 px-1 pt-0.5">
            <span className="font-semibold">
              Danh mục: <strong className="text-amber-600 dark:text-amber-400">{displayClauses.length}</strong> / {allClauses.length} điều khoản
            </span>
            <span className="text-[10px] italic text-stone-400 dark:text-slate-400 flex items-center gap-1">
              ↕ Kéo cuộn danh sách bên dưới để xem thêm
            </span>
          </div>

          {/* Danh sách cuộn mượt mà (Responsive Scrollable Container) */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-1.5 pr-1.5 divide-y divide-stone-100 dark:divide-slate-800/60 border border-stone-200/80 dark:border-slate-800 rounded-xl p-1.5 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-stone-400">
            {displayClauses.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Không tìm thấy điều khoản phù hợp với từ khóa "{searchQuery}"
              </div>
            ) : (
              displayClauses.map((clause) => {
                const isSelected = selectedClause === clause.code
                const isAllowed = checkClauseAllowed(clause)
                const badge = getCategoryBadge(clause.category)

                return (
                  <div
                    key={clause.code}
                    onClick={() => {
                      if (!isAllowed) return
                      onChangeClause(clause.code)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'p-2.5 rounded-xl transition-all select-none',
                      isAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-45',
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 shadow-xs'
                        : isAllowed
                          ? isDark
                            ? 'hover:bg-slate-800/60'
                            : 'hover:bg-stone-50'
                          : 'bg-stone-100/30 dark:bg-slate-800/20'
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
                          {!isAllowed && (
                            <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-1 rounded">
                              Không khớp phán quyết
                            </span>
                          )}
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
                          {clause.description}
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

      {/* Thông báo nếu chưa chọn điều khoản */}
      {!selectedClause && (
        <div className="p-2.5 bg-rose-500/10 border-t border-rose-500/20 flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span>Vui lòng chọn 1 điều khoản chính sách trong danh mục trên để mở khóa nút phán quyết.</span>
        </div>
      )}
    </div>
  )
}

export default function AdminActionPolicyClauseSelector(props) {
  if (props.targetType !== 'ORDER') return null

  return <OrderPolicyClauseSelectorContent {...props} />
}
