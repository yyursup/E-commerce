import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineCash,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiStar,
  HiOutlineClipboardList,
  HiOutlineScissors,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlinePencilAlt,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import trustConfigService from '../../../../services/trustConfig'
import { useHorizontalScroll } from '../../../../hooks/useHorizontalScroll'

// Modals con tách riêng theo chuẩn Single Responsibility
import FundLedgerModal from './modals/FundLedgerModal'
import DeductCompensationModal from './modals/DeductCompensationModal'
import ApproveCloseShopModal from './modals/ApproveCloseShopModal'
import RejectCloseShopModal from './modals/RejectCloseShopModal'
import AdjustFundModal from './modals/AdjustFundModal'

export default function EscrowFundSupervisionTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const tableContainerRef = useHorizontalScroll()

  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState('ALL') // 'ALL', 'DEFICIT', 'REFUND_PENDING'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // State các Modal con
  const [selectedFund, setSelectedFund] = useState(null)
  const [deductShop, setDeductShop] = useState(null)
  const [approveCloseShop, setApproveCloseShop] = useState(null)
  const [rejectCloseShop, setRejectCloseShop] = useState(null)
  const [adjustShop, setAdjustShop] = useState(null)

  const loadFunds = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, size: 10 }
      if (filterTab === 'DEFICIT') {
        params.isDeficit = true
      } else if (filterTab === 'REFUND_PENDING') {
        params.status = 'REFUND_PENDING'
      }
      const data = await trustConfigService.getAdminEscrowFunds(params)
      setFunds(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages || 0)
      setTotalElements(data?.totalElements || 0)
    } catch (err) {
      console.error('Lỗi tải quỹ ký quỹ toàn sàn:', err)
      toast.error(err?.message || 'Không thể tải danh sách Quỹ ký quỹ.')
    } finally {
      setLoading(false)
    }
  }, [page, filterTab])

  useEffect(() => {
    loadFunds()
  }, [loadFunds])

  const formatVND = (val) => {
    if (val === null || val === undefined) return '0 ₫'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const renderStars = (level) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <HiStar
          key={i}
          className={cn(
            'h-4 w-4',
            i <= level ? 'text-amber-400' : isDark ? 'text-slate-700' : 'text-stone-300'
          )}
        />
      )
    }
    return stars
  }

  const totalBalanceAll = funds.reduce((acc, f) => acc + Number(f.balance || 0), 0)
  const deficitCount = funds.filter((f) => f.isDeficit).length

  const filteredFunds = search
    ? funds.filter((f) => f.shopName?.toLowerCase().includes(search.toLowerCase()))
    : funds

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <HiOutlineCash className="h-7 w-7 sm:h-8 sm:w-8 text-amber-500 shrink-0" />
            <span>Giám Sát Quỹ Ký Quỹ Toàn Sàn (Escrow Fund Supervision)</span>
          </h1>
          <p className={cn('text-xs sm:text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi vốn bảo chứng cam kết của tất cả gian hàng, cảnh báo hụt quỹ và phân xử trích bồi thường tranh chấp.
          </p>
        </div>
        <button
          onClick={loadFunds}
          className={cn(
            'self-start sm:self-auto flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold border transition',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          )}
        >
          <HiOutlineRefresh className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tổng Quỹ Bảo Chứng Trên Trang
          </span>
          <h3 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-black text-amber-500">{formatVND(totalBalanceAll)}</h3>
          <p className="mt-1 text-xs text-slate-400">Tiền cọc cam kết bảo vệ người mua</p>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Gian Hàng Ký Quỹ
          </span>
          <h3 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-black">{totalElements} Shop</h3>
          <p className="mt-1 text-xs text-slate-400">Đã kích hoạt Quỹ ký quỹ trên hệ thống</p>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 shadow-sm sm:col-span-2 lg:col-span-1',
            deficitCount > 0
              ? 'border-rose-500/40 bg-rose-500/10'
              : isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', deficitCount > 0 ? 'text-rose-500' : isDark ? 'text-slate-400' : 'text-stone-500')}>
            Cảnh Báo Hụt Quỹ (Deficit)
          </span>
          <h3 className={cn('mt-2 sm:mt-3 text-xl sm:text-2xl font-black', deficitCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500')}>
            {deficitCount} Gian Hàng
          </h3>
          <p className="mt-1 text-xs text-slate-400">Số dư thấp hơn cam kết bảo chứng</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => { setFilterTab('ALL'); setPage(0) }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition whitespace-nowrap',
              filterTab === 'ALL'
                ? 'border-amber-500 bg-amber-500 text-white'
                : isDark
                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                : 'border-stone-200 bg-white text-stone-600 hover:text-stone-900'
            )}
          >
            Tất cả gian hàng ({totalElements})
          </button>
          <button
            onClick={() => { setFilterTab('DEFICIT'); setPage(0) }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 whitespace-nowrap',
              filterTab === 'DEFICIT'
                ? 'border-rose-500 bg-rose-500 text-white'
                : isDark
                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400'
                : 'border-stone-200 bg-white text-stone-600 hover:text-rose-600'
            )}
          >
            <HiOutlineExclamation className="h-4 w-4" />
            Đang thâm hụt ({deficitCount})
          </button>
          <button
            onClick={() => { setFilterTab('REFUND_PENDING'); setPage(0) }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 whitespace-nowrap',
              filterTab === 'REFUND_PENDING'
                ? 'border-purple-500 bg-purple-500 text-white'
                : isDark
                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-purple-400'
                : 'border-stone-200 bg-white text-stone-600 hover:text-purple-600'
            )}
          >
            <HiOutlineClock className="h-4 w-4" />
            Chờ hoàn quỹ đóng shop
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <HiOutlineSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên gian hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-xl border py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-amber-500',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500' : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400'
            )}
          />
        </div>
      </div>

      {/* Escrow Fund Table */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div
          ref={tableContainerRef}
          className={cn(
            'overflow-x-auto',
            isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'
          )}
        >
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className={cn('uppercase tracking-wider', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-100 text-stone-600')}>
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Gian hàng</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Cấp Uy Tín</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Số Dư Quỹ Thực Tế</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Mức Cọc Cam Kết</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Trạng Thái</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5">Thiếu Hụt & Hạn Chót</th>
                <th className="px-4 py-3 sm:px-6 sm:py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                    Đang tải danh sách quỹ ký quỹ...
                  </td>
                </tr>
              ) : filteredFunds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy gian hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredFunds.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition',
                      item.isDeficit
                        ? isDark ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'bg-rose-50 hover:bg-rose-100/60'
                        : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-stone-50'
                    )}
                  >
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="font-bold text-sm">{item.shopName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Shop ID: {item.shopId}</div>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {renderStars(item.currentTrustLevel)}
                      </div>
                      <div className="text-[11px] text-amber-500 font-semibold mt-0.5">
                        Cấp {item.currentTrustLevel} Sao
                      </div>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap font-bold text-sm">
                      <span className={item.isDeficit ? 'text-rose-500' : 'text-emerald-500'}>
                        {formatVND(item.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap text-slate-400">
                      {formatVND(item.committedAmount)}
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap">
                      {item.isDeficit ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-500 animate-pulse">
                          <HiOutlineExclamation className="h-3.5 w-3.5" /> Hụt quỹ
                        </span>
                      ) : item.status === 'PENDING_DEPOSIT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                          <HiOutlineClock className="h-3.5 w-3.5" /> Chờ nạp cọc
                        </span>
                      ) : item.status === 'REFUND_PENDING' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/30 animate-pulse">
                          <HiOutlineClock className="h-3.5 w-3.5" /> Chờ hoàn quỹ đóng shop
                        </span>
                      ) : item.status === 'REFUNDED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Đã hoàn quỹ (Shop đóng)
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 whitespace-nowrap text-xs">
                      {item.isDeficit ? (
                        <div>
                          <div className="font-bold text-rose-500">
                            Thiếu: {formatVND(item.deficitAmount)}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <HiOutlineClock className="h-3 w-3 text-amber-500" />
                            Hạn: {formatDateTime(item.deficitDeadline)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-emerald-500">Đầy đủ</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 sm:py-4 text-right whitespace-nowrap space-x-2">
                      {item.status === 'REFUND_PENDING' && (
                        <>
                          <button
                            onClick={() => setApproveCloseShop(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition border border-emerald-500/30"
                            title="Duyệt đóng shop và hoàn trả toàn bộ Quỹ ký quỹ về Ví Seller"
                          >
                            <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Duyệt đóng
                          </button>
                          <button
                            onClick={() => setRejectCloseShop(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/25 transition border border-rose-500/30"
                            title="Từ chối yêu cầu đóng shop"
                          >
                            <HiOutlineExclamation className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setAdjustShop(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition border border-amber-500/20"
                        title="Điều chỉnh quỹ ký quỹ & cấp sao uy tín"
                      >
                        <HiOutlinePencilAlt className="h-3.5 w-3.5" /> Điều chỉnh
                      </button>
                      <button
                        onClick={() => setSelectedFund(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition border border-blue-500/20"
                      >
                        <HiOutlineClipboardList className="h-3.5 w-3.5" /> Sổ cái
                      </button>
                      <button
                        onClick={() => setDeductShop(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition border border-rose-500/20"
                      >
                        <HiOutlineScissors className="h-3.5 w-3.5" /> Trích phạt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg px-3 py-1.5 border border-slate-700 disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-3 py-1.5 border border-slate-700 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5 Modals con đã được tách riêng */}
      <FundLedgerModal
        fund={selectedFund}
        onClose={() => setSelectedFund(null)}
        formatVND={formatVND}
        formatDateTime={formatDateTime}
      />

      <DeductCompensationModal
        fund={deductShop}
        onClose={() => setDeductShop(null)}
        onSuccess={loadFunds}
        formatVND={formatVND}
      />

      <ApproveCloseShopModal
        shop={approveCloseShop}
        onClose={() => setApproveCloseShop(null)}
        onSuccess={loadFunds}
        formatVND={formatVND}
      />

      <RejectCloseShopModal
        shop={rejectCloseShop}
        onClose={() => setRejectCloseShop(null)}
        onSuccess={loadFunds}
      />

      <AdjustFundModal
        shop={adjustShop}
        onClose={() => setAdjustShop(null)}
        onSuccess={loadFunds}
        formatVND={formatVND}
      />
    </div>
  )
}
