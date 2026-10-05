import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineClipboardList,
  HiOutlineRefresh,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../../store/useThemeStore'
import { cn } from '../../../../../lib/cn'
import trustConfigService from '../../../../../services/trustConfig'
import { useHorizontalScroll } from '../../../../../hooks/useHorizontalScroll'

export default function FundLedgerModal({ fund, onClose, formatVND, formatDateTime }) {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const ledgerTableRef = useHorizontalScroll()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadTransactions = useCallback(async (p = 0, isCurrent = () => true) => {
    if (!fund?.id) return
    try {
      setLoading(true)
      const data = await trustConfigService.getFundTransactions(fund.id, { page: p, size: 10 })
      if (!isCurrent()) return
      setTransactions(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages || 0)
      setPage(p)
    } catch (err) {
      if (!isCurrent()) return
      console.error('Lỗi tải sổ cái quỹ:', err)
      toast.error('Không thể tải lịch sử biến động quỹ.')
    } finally {
      if (isCurrent()) {
        setLoading(false)
      }
    }
  }, [fund?.id])

  useEffect(() => {
    let mounted = true
    if (fund?.id) {
      loadTransactions(0, () => mounted)
    }
    return () => {
      mounted = false
    }
  }, [fund?.id, loadTransactions])

  if (!fund) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <HiOutlineClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 shrink-0" />
              <span>Sổ Cái Quỹ Ký Quỹ: {fund.shopName}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Số dư hiện tại: <span className="font-bold text-amber-500">{formatVND(fund.balance)}</span> | Cấp uy tín: {fund.currentTrustLevel}★
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Table Content */}
        <div
          ref={ledgerTableRef}
          className={cn(
            'overflow-x-auto overflow-y-auto flex-1 my-4',
            isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'
          )}
        >
          <table className="w-full text-left text-xs min-w-[700px]">
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
              {loading ? (
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

        {/* Footer & Pagination */}
        <div className="pt-3 border-t border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page === 0}
                onClick={() => loadTransactions(page - 1)}
                className="rounded-lg px-2.5 py-1 border border-slate-700 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => loadTransactions(page + 1)}
                className="rounded-lg px-2.5 py-1 border border-slate-700 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
