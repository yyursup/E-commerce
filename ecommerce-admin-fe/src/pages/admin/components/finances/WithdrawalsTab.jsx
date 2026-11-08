import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineCash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineQrcode,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCreditCard,
  HiOutlineUser,
  HiOutlineExternalLink,
  HiOutlineClipboardCopy,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import { useThemeStore } from '../../../../store/useThemeStore'
import walletService from '../../../../services/wallet'

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã chuyển tiền' },
  { id: 'REJECTED', label: 'Đã từ chối' },
  { id: 'CANCELLED', label: 'Người dùng hủy' },
]

const formatVND = (val) => {
  if (val === null || val === undefined) return '0 ₫'
  return Number(val).toLocaleString('vi-VN') + ' ₫'
}

export default function WithdrawalsTab() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // QR Modal State
  const [qrModalItem, setQrModalItem] = useState(null)

  // Approve Modal State
  const [approveItem, setApproveItem] = useState(null)
  const [approveTxNo, setApproveTxNo] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [submittingApprove, setSubmittingApprove] = useState(false)

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  const fetchWithdrawals = useCallback(async (p = 0, currentStatus = statusFilter) => {
    try {
      setLoading(true)
      const params = {
        page: p,
        size: 10,
        status: currentStatus === 'ALL' ? undefined : currentStatus,
      }
      const data = await walletService.adminGetWithdrawals(params)
      setWithdrawals(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages || 0)
      setTotalElements(data?.totalElements || 0)
      setPage(p)
    } catch (err) {
      console.error('Lỗi tải danh sách rút tiền:', err)
      toast.error(err?.message || 'Không thể tải danh sách yêu cầu rút tiền')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchWithdrawals(0, statusFilter)
  }, [fetchWithdrawals, statusFilter])

  const handleApprove = async (e) => {
    if (e) e.preventDefault()
    if (!approveItem) return

    try {
      setSubmittingApprove(true)
      await walletService.adminApproveWithdrawal(approveItem.id, {
        bankTxNo: approveTxNo.trim() || undefined,
        note: approveNote.trim() || undefined,
      })
      toast.success(`Đã phê duyệt lệnh rút tiền ${approveItem.txRef}! Email thông báo đã gửi tới khách hàng.`)
      setApproveItem(null)
      setApproveTxNo('')
      setApproveNote('')
      fetchWithdrawals(page, statusFilter)
    } catch (err) {
      console.error('Lỗi phê duyệt rút tiền:', err)
      toast.error(err?.message || 'Không thể phê duyệt yêu cầu rút tiền')
    } finally {
      setSubmittingApprove(false)
    }
  }

  const handleReject = async (e) => {
    if (e) e.preventDefault()
    if (!rejectItem) return
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối yêu cầu rút tiền!')
      return
    }

    try {
      setSubmittingReject(true)
      await walletService.adminRejectWithdrawal(rejectItem.id, {
        note: rejectReason.trim(),
      })
      toast.success(`Đã từ chối lệnh rút tiền ${rejectItem.txRef}! Tiền đã hoàn lại ví và email thông báo đã gửi.`)
      setRejectItem(null)
      setRejectReason('')
      fetchWithdrawals(page, statusFilter)
    } catch (err) {
      console.error('Lỗi từ chối rút tiền:', err)
      toast.error(err?.message || 'Không thể từ chối yêu cầu rút tiền')
    } finally {
      setSubmittingReject(false)
    }
  }

  const copyToClipboard = (text, label) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label || 'nội dung'}!`)
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Refresh Header */}
      <div
        className={cn(
          'rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id)
                setPage(0)
              }}
              className={cn(
                'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                statusFilter === f.id
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 dark:text-slate-400">
            Tổng cộng: <strong className="text-stone-900 dark:text-white">{totalElements}</strong> yêu cầu
          </span>
          <button
            type="button"
            onClick={() => fetchWithdrawals(page, statusFilter)}
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineRefresh className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden shadow-xs',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={cn('uppercase font-semibold', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
              <tr>
                <th className="px-5 py-3.5">Mã GD</th>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Người rút</th>
                <th className="px-5 py-3.5">Số tiền</th>
                <th className="px-5 py-3.5">Tài khoản nhận tiền</th>
                <th className="px-5 py-3.5">Ghi chú</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                    Đang tải danh sách yêu cầu rút tiền...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                    Không có yêu cầu rút tiền nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-stone-900 dark:text-white">
                      {w.txRef || w.id?.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 text-stone-500 dark:text-slate-400 whitespace-nowrap">
                      {w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <HiOutlineUser className="h-3.5 w-3.5 text-stone-400" />
                        {w.requesterName || 'Khách hàng'}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">{w.requesterEmail}</div>
                      <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                        {w.requesterRole === 'ROLE_BUSINESS' ? 'Gian hàng (Seller)' : 'Người mua (Buyer)'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold font-mono text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatVND(w.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-stone-900 dark:text-white">{w.bankName}</div>
                      <div className="font-mono text-xs font-bold text-stone-700 dark:text-slate-300">
                        {w.bankAccountNumber}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 uppercase font-medium">
                        {w.bankAccountName}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-500 dark:text-slate-400 max-w-[180px]">
                      {w.userNote && (
                        <div className="truncate" title={`Khách ghi: ${w.userNote}`}>
                          <span className="font-semibold">Khách:</span> {w.userNote}
                        </div>
                      )}
                      {w.adminNote && (
                        <div className="truncate text-rose-500 dark:text-rose-400" title={`Admin: ${w.adminNote}`}>
                          <span className="font-semibold">Lý do:</span> {w.adminNote}
                        </div>
                      )}
                      {w.bankTxNo && (
                        <div className="truncate font-mono text-[11px] text-emerald-600 dark:text-emerald-400" title={`Mã GD: ${w.bankTxNo}`}>
                          Mã GD: {w.bankTxNo}
                        </div>
                      )}
                      {!w.userNote && !w.adminNote && !w.bankTxNo && '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {w.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                          <HiOutlineClock className="h-3.5 w-3.5 animate-spin" /> Chờ duyệt
                        </span>
                      )}
                      {w.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Đã chuyển tiền
                        </span>
                      )}
                      {w.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-500 border border-rose-500/20">
                          <HiOutlineXCircle className="h-3.5 w-3.5" /> Đã từ chối
                        </span>
                      )}
                      {w.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
                          <HiOutlineBan className="h-3.5 w-3.5" /> Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {w.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* VietQR button */}
                          <button
                            type="button"
                            onClick={() => setQrModalItem(w)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition cursor-pointer"
                            title="Quét mã VietQR chuyển khoản nhanh"
                          >
                            <HiOutlineQrcode className="h-4 w-4 text-amber-500" />
                          </button>

                          {/* Approve button */}
                          <button
                            type="button"
                            onClick={() => {
                              setApproveItem(w)
                              setApproveTxNo('')
                              setApproveNote('')
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                            title="Xác nhận đã chuyển tiền thành công"
                          >
                            <HiOutlineCheck className="h-3.5 w-3.5" />
                            Duyệt
                          </button>

                          {/* Reject button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRejectItem(w)
                              setRejectReason('')
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Từ chối yêu cầu rút tiền"
                          >
                            <HiOutlineX className="h-3.5 w-3.5" />
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-400 dark:text-slate-500 text-xs">
                          {w.processedAt ? new Date(w.processedAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-slate-400">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0 || loading}
                onClick={() => fetchWithdrawals(page - 1, statusFilter)}
                className="rounded-lg px-3 py-1.5 border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1 || loading}
                onClick={() => fetchWithdrawals(page + 1, statusFilter)}
                className="rounded-lg px-3 py-1.5 border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: VIETQR CHUYỂN KHOẢN NHANH */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <HiOutlineQrcode className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">Mã VietQR chuyển tiền</h2>
              </div>
              <button
                type="button"
                onClick={() => setQrModalItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* QR Image */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-md">
                <img
                  src={`https://img.vietqr.io/image/${encodeURIComponent(qrModalItem.bankName)}-${encodeURIComponent(qrModalItem.bankAccountNumber)}-compact2.png?amount=${qrModalItem.amount}&addInfo=${encodeURIComponent(qrModalItem.txRef || 'RUT TIEN')}&accountName=${encodeURIComponent(qrModalItem.bankAccountName || '')}`}
                  alt="VietQR Transfer"
                  className="w-64 h-auto object-contain rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `STK: ${qrModalItem.bankAccountNumber} - ${qrModalItem.bankName} - ${qrModalItem.bankAccountName} - ${qrModalItem.amount} VND`
                    )}`
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                Mở ứng dụng ngân hàng và quét mã để chuyển khoản tức thì
              </p>
            </div>

            {/* Details & Quick Copy */}
            <div className={cn('p-3.5 rounded-xl border text-xs space-y-2', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50')}>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Số tiền:</span>
                <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatVND(qrModalItem.amount)}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(qrModalItem.amount), 'số tiền')}
                    className="p-1 hover:text-amber-500"
                    title="Copy số tiền"
                  >
                    <HiOutlineClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Ngân hàng:</span>
                <span className="font-semibold text-stone-900 dark:text-white">{qrModalItem.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900 dark:text-white">
                  {qrModalItem.bankAccountNumber}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrModalItem.bankAccountNumber, 'số tài khoản')}
                    className="p-1 hover:text-amber-500"
                    title="Copy số tài khoản"
                  >
                    <HiOutlineClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold uppercase text-stone-900 dark:text-white">{qrModalItem.bankAccountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                  {qrModalItem.txRef}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrModalItem.txRef, 'nội dung chuyển khoản')}
                    className="p-1 hover:text-amber-500"
                    title="Copy nội dung CK"
                  >
                    <HiOutlineClipboardCopy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQrModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = qrModalItem
                  setQrModalItem(null)
                  setApproveItem(item)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Đã chuyển khoản xong &rarr; Duyệt lệnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DUYỆT RÚT TIỀN (APPROVE) */}
      {approveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <HiOutlineCheck className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">Xác nhận duyệt yêu cầu rút tiền</h2>
              </div>
              <button
                type="button"
                onClick={() => setApproveItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className={cn('p-3.5 rounded-xl border text-xs space-y-1.5', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-emerald-100 bg-emerald-50/50')}>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Mã yêu cầu:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">{approveItem.txRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Số tiền giải ngân:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatVND(approveItem.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Người nhận:</span>
                <span className="font-semibold text-stone-900 dark:text-white">
                  {approveItem.requesterName} ({approveItem.bankAccountNumber} - {approveItem.bankName})
                </span>
              </div>
            </div>

            <form onSubmit={handleApprove} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">
                  Mã giao dịch ngân hàng thực tế (Bank Tx No)
                </label>
                <input
                  type="text"
                  value={approveTxNo}
                  onChange={(e) => setApproveTxNo(e.target.value)}
                  placeholder="VD: FT241029381923"
                  className={cn(
                    'w-full rounded-xl px-4 py-2 border transition focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Mã tham chiếu chuyển khoản thành công từ Internet Banking của Sàn
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">
                  Ghi chú nội bộ / Phản hồi khách hàng
                </label>
                <input
                  type="text"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="VD: Đã chuyển tiền qua Vietcombank 24/7"
                  className={cn(
                    'w-full rounded-xl px-4 py-2 border transition focus:ring-2 focus:ring-emerald-500 focus:outline-none',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                Hệ thống sẽ trừ số dư đóng băng tương ứng của User/Shop và tự động gửi Email xác nhận chuyển tiền thành công tới <strong>{approveItem.requesterEmail}</strong>.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveItem(null)}
                  className="px-4 py-2 rounded-xl font-semibold border border-stone-200 dark:border-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingApprove}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                >
                  {submittingApprove ? (
                    <>
                      <HiOutlineRefresh className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="h-4 w-4" />
                      Xác nhận đã chuyển tiền
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TỪ CHỐI RÚT TIỀN (REJECT) */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <HiOutlineX className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Từ chối yêu cầu rút tiền
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className={cn('p-3.5 rounded-xl border text-xs space-y-1.5', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-rose-100 bg-rose-50/50')}>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Mã yêu cầu:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">{rejectItem.txRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Số tiền hoàn lại:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {formatVND(rejectItem.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-slate-400">Người yêu cầu:</span>
                <span className="font-semibold text-stone-900 dark:text-white">{rejectItem.requesterName}</span>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Sai thông tin tên chủ tài khoản ngân hàng hoặc tài khoản thụ hưởng bị khóa."
                  className={cn(
                    'w-full rounded-xl p-3 border transition focus:ring-2 focus:ring-rose-500 focus:outline-none',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-800 dark:text-rose-300">
                Toàn bộ số tiền <strong>{formatVND(rejectItem.amount)}</strong> sẽ được hoàn trả lại số dư ví khả dụng của User/Shop ngay lập tức. Email giải thích lý do từ chối sẽ được gửi tự động tới khách hàng.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectItem(null)}
                  className="px-4 py-2 rounded-xl font-semibold border border-stone-200 dark:border-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReject || !rejectReason.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? (
                    <>
                      <HiOutlineRefresh className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <HiOutlineXCircle className="h-4 w-4" />
                      Xác nhận từ chối lệnh
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

