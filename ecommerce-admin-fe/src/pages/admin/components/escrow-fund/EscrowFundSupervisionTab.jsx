import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineCash,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiStar,
  HiOutlineClipboardList,
  HiOutlineScissors,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSearch,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import trustConfigService from '../../../../services/trustConfig'

export default function EscrowFundSupervisionTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDeficit, setFilterDeficit] = useState(null) // null: all, true: deficit only
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Drawer / Modal Sổ cái giao dịch
  const [selectedFund, setSelectedFund] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)
  const [txPage, setTxPage] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(0)

  // Modal Trích Bồi Thường Thủ Công
  const [deductShop, setDeductShop] = useState(null)
  const [deductAmount, setDeductAmount] = useState('')
  const [deductReason, setDeductReason] = useState('')
  const [deductSubmitting, setDeductSubmitting] = useState(false)

  const loadFunds = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, size: 10 }
      if (filterDeficit !== null) {
        params.isDeficit = filterDeficit
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
  }, [page, filterDeficit])

  useEffect(() => {
    loadFunds()
  }, [loadFunds])

  const loadTransactions = useCallback(async (fundId, p = 0) => {
    try {
      setTxLoading(true)
      const data = await trustConfigService.getFundTransactions(fundId, { page: p, size: 10 })
      setTransactions(Array.isArray(data?.content) ? data.content : [])
      setTxTotalPages(data?.totalPages || 0)
    } catch (err) {
      console.error('Lỗi tải sổ cái quỹ:', err)
      toast.error('Không thể tải lịch sử biến động quỹ.')
    } finally {
      setTxLoading(false)
    }
  }, [])

  const handleOpenLedger = (fund) => {
    setSelectedFund(fund)
    setTxPage(0)
    loadTransactions(fund.id, 0)
  }

  const handleDeductSubmit = async (e) => {
    e.preventDefault()
    if (!deductShop) return
    const num = Number(deductAmount)
    if (!num || num <= 0) {
      toast.error('Số tiền trích phải lớn hơn 0')
      return
    }
    if (!deductReason.trim()) {
      toast.error('Vui lòng nhập lý do phân xử trích bồi thường')
      return
    }

    try {
      setDeductSubmitting(true)
      await trustConfigService.deductCompensation(deductShop.shopId, {
        amount: num,
        reason: deductReason.trim(),
      })
      toast.success(`Đã trích bồi thường ${formatVND(num)} từ Quỹ ký quỹ của gian hàng!`)
      setDeductShop(null)
      setDeductAmount('')
      setDeductReason('')
      loadFunds()
    } catch (err) {
      console.error('Lỗi trích bồi thường:', err)
      toast.error(err?.message || 'Trích bồi thường thất bại.')
    } finally {
      setDeductSubmitting(false)
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <HiOutlineCash className="h-8 w-8 text-amber-500" />
            Giám Sát Quỹ Ký Quỹ Toàn Sàn (Escrow Fund Supervision)
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi vốn bảo chứng cam kết của tất cả gian hàng, cảnh báo hụt quỹ và phân xử trích bồi thường tranh chấp.
          </p>
        </div>
        <button
          onClick={loadFunds}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition',
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
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tổng Quỹ Bảo Chứng Trên Trang
          </span>
          <h3 className="mt-3 text-2xl font-black text-amber-500">{formatVND(totalBalanceAll)}</h3>
          <p className="mt-1 text-xs text-slate-400">Tiền cọc cam kết bảo vệ người mua</p>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Gian Hàng Ký Quỹ
          </span>
          <h3 className="mt-3 text-2xl font-black">{totalElements} Shop</h3>
          <p className="mt-1 text-xs text-slate-400">Đã kích hoạt Quỹ ký quỹ trên hệ thống</p>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            deficitCount > 0
              ? 'border-rose-500/40 bg-rose-500/10'
              : isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-stone-200 bg-white'
          )}
        >
          <span className={cn('text-xs font-semibold uppercase tracking-wider', deficitCount > 0 ? 'text-rose-500' : isDark ? 'text-slate-400' : 'text-stone-500')}>
            Cảnh Báo Hụt Quỹ Cần Nạp Bù
          </span>
          <h3 className={cn('mt-3 text-2xl font-black', deficitCount > 0 ? 'text-rose-500' : 'text-emerald-500')}>
            {deficitCount} Shop
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {deficitCount > 0 ? 'Đang trong hạn 72h nạp bù trước khi giáng cấp' : 'Tất cả các shop đảm bảo mức cọc'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFilterDeficit(null)
              setPage(0)
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition',
              filterDeficit === null
                ? 'bg-amber-500 text-white'
                : isDark
                ? 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                : 'bg-white text-stone-600 hover:bg-stone-100 border'
            )}
          >
            Tất cả gian hàng ({totalElements})
          </button>
          <button
            onClick={() => {
              setFilterDeficit(true)
              setPage(0)
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5',
              filterDeficit === true
                ? 'bg-rose-600 text-white'
                : isDark
                ? 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                : 'bg-white text-stone-600 hover:bg-stone-100 border'
            )}
          >
            <HiOutlineExclamation className="h-4 w-4 text-rose-500" />
            Đang hụt quỹ cảnh báo ({deficitCount})
          </button>
        </div>

        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'rounded-xl border py-2 pl-9 pr-4 text-xs font-medium outline-none transition',
              isDark ? 'border-slate-800 bg-slate-900 text-white focus:border-amber-500' : 'border-stone-200 bg-white text-stone-800 focus:border-amber-500'
            )}
          />
        </div>
      </div>

      {/* Table Danh Sách Quỹ Ký Quỹ Toàn Sàn */}
      <div
        className={cn(
          'rounded-2xl border shadow-sm overflow-hidden',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn('text-xs uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
              <tr>
                <th className="px-6 py-4">Tên Gian Hàng</th>
                <th className="px-6 py-4">Số Dư Quỹ Ký Quỹ</th>
                <th className="px-6 py-4">Vốn Cam Kết</th>
                <th className="px-6 py-4">Độ Uy Tín</th>
                <th className="px-6 py-4">Trạng Thái Quỹ</th>
                <th className="px-6 py-4">Tình Trạng Hụt Quỹ</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                    Đang tải danh sách quỹ gian hàng...
                  </td>
                </tr>
              ) : filteredFunds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    Không tìm thấy gian hàng nào.
                  </td>
                </tr>
              ) : (
                filteredFunds.map((item) => (
                  <tr key={item.id} className={cn('hover:bg-slate-800/20 transition')}>
                    <td className="px-6 py-4 font-bold whitespace-nowrap text-amber-500">
                      {item.shopName || item.shopId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-base">
                      {formatVND(item.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {formatVND(item.committedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {renderStars(item.currentTrustLevel || 1)}
                        </div>
                        <span className="text-xs font-bold text-amber-500">
                          {item.tierName || `${item.currentTrustLevel}★`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Hoạt động
                        </span>
                      ) : item.status === 'DEFICIT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-500 animate-pulse">
                          <HiOutlineExclamation className="h-3.5 w-3.5" /> Hụt quỹ
                        </span>
                      ) : item.status === 'PENDING_DEPOSIT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                          <HiOutlineClock className="h-3.5 w-3.5" /> Chờ nạp cọc
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
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
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenLedger(item)}
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
          <div className="p-4 border-t border-slate-700/40 flex items-center justify-between text-xs">
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

      {/* MODAL SỔ CÁI GIAO DỊCH CỦA GIAN HÀNG */}
      {selectedFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <HiOutlineClipboardList className="h-6 w-6 text-blue-400" />
                  Sổ Cái Quỹ Ký Quỹ: {selectedFund.shopName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Số dư hiện tại: <span className="font-bold text-amber-500">{formatVND(selectedFund.balance)}</span> | Cấp uy tín: {selectedFund.currentTrustLevel}★
                </p>
              </div>
              <button
                onClick={() => setSelectedFund(null)}
                className="rounded-lg p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4">
              <table className="w-full text-left text-xs">
                <thead className={cn('uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-100 text-stone-600')}>
                  <tr>
                    <th className="px-4 py-2.5">Thời gian</th>
                    <th className="px-4 py-2.5">Loại giao dịch</th>
                    <th className="px-4 py-2.5">Số tiền</th>
                    <th className="px-4 py-2.5">Số dư trước</th>
                    <th className="px-4 py-2.5">Số dư sau</th>
                    <th className="px-4 py-2.5">Mã GD</th>
                    <th className="px-4 py-2.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {txLoading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        <HiOutlineRefresh className="mx-auto h-5 w-5 animate-spin text-amber-500 mb-1" />
                        Đang tải sổ cái...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                        Chưa có lịch sử giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = Number(tx.amount) > 0
                      return (
                        <tr key={tx.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                            {formatDateTime(tx.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {tx.transactionType}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold">
                            <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                              {isPositive ? '+' : ''}{formatVND(tx.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                            {formatVND(tx.balanceBefore)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold">
                            {formatVND(tx.balanceAfter)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono">
                            {tx.referenceCode || '-'}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" title={tx.note}>
                            {tx.note || '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-700/40 flex justify-end">
              <button
                onClick={() => setSelectedFund(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRÍCH BỒI THƯỜNG THỦ CÔNG */}
      {deductShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h2 className="text-xl font-bold text-rose-500 flex items-center gap-2">
              <HiOutlineScissors className="h-6 w-6" />
              Trích Bồi Thường Từ Quỹ Ký Quỹ
            </h2>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Áp dụng cho gian hàng <span className="font-bold text-amber-500">{deductShop.shopName}</span>.
              (Số dư hiện có: {formatVND(deductShop.balance)})
            </p>

            <form onSubmit={handleDeductSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Số tiền trích bồi thường (VNĐ)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  placeholder="Ví dụ: 500000"
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Lý do phân xử trích bồi thường</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ví dụ: Đền bù người mua do giao sai hàng hóa và không phản hồi khiếu nại..."
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 leading-relaxed">
                <span className="font-bold">Cảnh báo:</span> Tiền sẽ bị khấu trừ trực tiếp khỏi Quỹ ký quỹ của Shop. Nếu số dư giảm xuống dưới ngưỡng tier sao hiện tại, hệ thống sẽ tự động kích hoạt trạng thái Hụt Quỹ và thông báo cho Shop nạp bù trong 72h.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={deductSubmitting}
                  onClick={() => setDeductShop(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={deductSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deductSubmitting ? 'Đang xử lý...' : 'Xác nhận trích quỹ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
