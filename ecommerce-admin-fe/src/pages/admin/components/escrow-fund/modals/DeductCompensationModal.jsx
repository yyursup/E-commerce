import { useState, useEffect, useRef } from 'react'
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineCheck,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../../store/useThemeStore'
import { cn } from '../../../../../lib/cn'
import trustConfigService from '../../../../../services/trustConfig'
import orderService from '../../../../../services/order'
import requestService from '../../../../../services/request'

export default function DeductCompensationModal({ fund, onClose, onSuccess, formatVND }) {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [orderId, setOrderId] = useState('')
  const [reportId, setReportId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [shopOrders, setShopOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [manualOrderInput, setManualOrderInput] = useState(false)

  const [shopReports, setShopReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [manualReportInput, setManualReportInput] = useState(false)

  // Combobox dropdown states
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const orderDropdownRef = useRef(null)

  const [reportDropdownOpen, setReportDropdownOpen] = useState(false)
  const [reportSearch, setReportSearch] = useState('')
  const reportDropdownRef = useRef(null)

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target)) {
        setOrderDropdownOpen(false)
      }
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target)) {
        setReportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load orders and reports when fund changes
  useEffect(() => {
    if (!fund?.shopId) return

    let isMounted = true

    const loadData = async () => {
      // 1. Tải danh sách đơn hàng của Shop
      try {
        setLoadingOrders(true)
        const allOrders = await orderService.getAllOrders()
        if (isMounted && Array.isArray(allOrders)) {
          const filtered = allOrders.filter(
            (o) => o.shopId === fund.shopId || (fund.shopName && o.shopName === fund.shopName)
          )
          setShopOrders(filtered)
          if (filtered.length > 0) {
            setOrderId(filtered[0].id)
          }
        }
      } catch (err) {
        console.error('Không thể tải danh sách đơn hàng:', err)
      } finally {
        if (isMounted) setLoadingOrders(false)
      }

      // 2. Tải danh sách báo cáo khiếu nại
      try {
        setLoadingReports(true)
        const repData = await requestService.getAdminRequests({ type: 'REPORT' })
        if (isMounted) {
          const repList = repData?.content || (Array.isArray(repData) ? repData : [])
          setShopReports(repList)
        }
      } catch (err) {
        console.error('Không thể tải danh sách báo cáo:', err)
      } finally {
        if (isMounted) setLoadingReports(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [fund?.shopId, fund?.shopName])

  if (!fund) return null

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      case 'DELIVERED':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30'
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const filteredShopOrders = shopOrders.filter((ord) => {
    if (!orderSearch.trim()) return true
    const term = orderSearch.toLowerCase()
    const num = (ord.orderNumber || ord.id || '').toLowerCase()
    const name = (ord.userName || ord.shippingName || '').toLowerCase()
    return num.includes(term) || name.includes(term)
  })

  const selectedOrderObj = shopOrders.find((o) => o.id === orderId)

  const filteredShopReports = shopReports.filter((rep) => {
    if (!reportSearch.trim()) return true
    const term = reportSearch.toLowerCase()
    const code = (rep.displayCode || rep.requestId || '').toLowerCase()
    const desc = (rep.description || '').toLowerCase()
    return code.includes(term) || desc.includes(term)
  })

  const selectedReportObj = shopReports.find((r) => r.requestId === reportId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orderId.trim()) {
      toast.error('Vui lòng chọn hoặc nhập mã đơn hàng')
      return
    }
    const num = Number(amount)
    if (!num || num < 1000) {
      toast.error('Số tiền trích bồi thường tối thiểu là 1.000 VNĐ')
      return
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do phân xử trích bồi thường')
      return
    }

    try {
      setSubmitting(true)
      const clientReqId = 'COMP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
      await trustConfigService.deductCompensation(fund.shopId, {
        orderId: orderId.trim(),
        reportId: reportId ? reportId.trim() : null,
        amount: num,
        reason: reason.trim(),
        clientRequestId: clientReqId,
      })
      toast.success(`Đã trích bồi thường ${formatVND(num)} từ Quỹ ký quỹ của gian hàng!`)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('Lỗi trích bồi thường:', err)
      toast.error(err?.message || 'Trích bồi thường thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        <h2 className="text-lg sm:text-xl font-bold text-rose-500">
          Trích Quỹ Ký Quỹ Bồi Thường Cho Người Mua
        </h2>
        <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Áp dụng cho gian hàng <span className="font-bold text-amber-500">{fund.shopName}</span>.
          (Số dư Quỹ hiện có: {formatVND(fund.balance)})
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Mã Đơn Hàng */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold">Mã Đơn Hàng *</label>
              {shopOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setManualOrderInput(!manualOrderInput)
                    setOrderDropdownOpen(false)
                  }}
                  className="text-[11px] text-amber-500 hover:underline"
                >
                  {manualOrderInput ? 'Chọn từ danh sách đơn của shop' : 'Nhập mã đơn khác'}
                </button>
              )}
            </div>

            {loadingOrders ? (
              <div className="text-xs text-slate-400 py-2 flex items-center gap-1.5">
                <HiOutlineRefresh className="h-4 w-4 animate-spin text-amber-500" />
                Đang tải danh sách đơn hàng...
              </div>
            ) : shopOrders.length > 0 && !manualOrderInput ? (
              <div className="relative w-full" ref={orderDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOrderDropdownOpen((prev) => !prev)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs text-left outline-none transition focus:ring-2 focus:ring-rose-500 font-medium',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                >
                  <div className="truncate pr-2">
                    {selectedOrderObj ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-amber-500 shrink-0">
                          {selectedOrderObj.orderNumber || selectedOrderObj.id.substring(0, 10)}
                        </span>
                        <span className="text-slate-400 truncate text-[11px]">
                          | {selectedOrderObj.userName || selectedOrderObj.shippingName || 'Khách'} | {formatVND(selectedOrderObj.total)}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ml-auto',
                            getOrderStatusBadge(selectedOrderObj.status)
                          )}
                        >
                          {selectedOrderObj.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-- Chọn đơn hàng cần bồi thường --</span>
                    )}
                  </div>
                  <HiOutlineChevronDown
                    className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', orderDropdownOpen && 'rotate-180')}
                  />
                </button>

                {orderDropdownOpen && (
                  <div
                    className={cn(
                      'absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-hidden rounded-xl border shadow-xl flex flex-col',
                      isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  >
                    <div className={cn('p-2 border-b flex items-center gap-1.5', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                      <HiOutlineSearch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Tìm mã đơn hoặc tên khách..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className={cn(
                          'w-full bg-transparent text-xs outline-none',
                          isDark ? 'placeholder-slate-500 text-white' : 'placeholder-stone-400 text-stone-900'
                        )}
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-800/40">
                      {filteredShopOrders.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Không tìm thấy đơn hàng phù hợp
                        </div>
                      ) : (
                        filteredShopOrders.map((ord) => {
                          const isSelected = ord.id === orderId
                          return (
                            <button
                              type="button"
                              key={ord.id}
                              onClick={() => {
                                setOrderId(ord.id)
                                setOrderDropdownOpen(false)
                              }}
                              className={cn(
                                'w-full p-2.5 text-left text-xs transition flex items-center justify-between gap-2',
                                isSelected
                                  ? isDark
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-rose-50 text-rose-700'
                                  : isDark
                                  ? 'hover:bg-slate-800/60'
                                  : 'hover:bg-stone-50'
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-amber-500 truncate">
                                    {ord.orderNumber || ord.id.substring(0, 10)}
                                  </span>
                                  <span
                                    className={cn(
                                      'rounded px-1.5 py-0.5 text-[10px] font-bold border',
                                      getOrderStatusBadge(ord.status)
                                    )}
                                  >
                                    {ord.status}
                                  </span>
                                </div>
                                <div className={cn('text-[11px] truncate mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                  Khách: <span className="font-medium">{ord.userName || ord.shippingName || 'Khách hàng'}</span> •{' '}
                                  <span className="font-semibold text-rose-400">{formatVND(ord.total)}</span>
                                </div>
                              </div>
                              {isSelected && <HiOutlineCheck className="h-4 w-4 text-rose-500 shrink-0" />}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="Nhập mã đơn hàng..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-4 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500',
                  isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                )}
              />
            )}
          </div>

          {/* Mã Báo Cáo Vi Phạm */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold">Mã Báo Cáo Vi Phạm</label>
              {shopReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setManualReportInput(!manualReportInput)
                    setReportDropdownOpen(false)
                  }}
                  className="text-[11px] text-amber-500 hover:underline"
                >
                  {manualReportInput ? 'Chọn từ danh sách khiếu nại' : 'Nhập mã báo cáo khác'}
                </button>
              )}
            </div>

            {loadingReports ? (
              <div className="text-xs text-slate-400 py-1 flex items-center gap-1.5">
                <HiOutlineRefresh className="h-3.5 w-3.5 animate-spin text-amber-500" />
                Đang tải danh sách khiếu nại...
              </div>
            ) : shopReports.length > 0 && !manualReportInput ? (
              <div className="relative w-full" ref={reportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setReportDropdownOpen((prev) => !prev)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs text-left outline-none transition focus:ring-2 focus:ring-rose-500 font-medium',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                >
                  <div className="truncate pr-2">
                    {selectedReportObj ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-amber-500 shrink-0">
                          {selectedReportObj.displayCode || selectedReportObj.requestId.substring(0, 10)}
                        </span>
                        <span className="text-slate-400 truncate text-[11px]">
                          | {selectedReportObj.description ? selectedReportObj.description.substring(0, 40) : 'Báo cáo vi phạm'}
                        </span>
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border border-slate-700 text-slate-400 ml-auto">
                          {selectedReportObj.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-- Không kèm báo cáo (Trích bồi thường trực tiếp) --</span>
                    )}
                  </div>
                  <HiOutlineChevronDown
                    className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', reportDropdownOpen && 'rotate-180')}
                  />
                </button>

                {reportDropdownOpen && (
                  <div
                    className={cn(
                      'absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-hidden rounded-xl border shadow-xl flex flex-col',
                      isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  >
                    <div className={cn('p-2 border-b flex items-center gap-1.5', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                      <HiOutlineSearch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Tìm mã báo cáo hoặc nội dung..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className={cn(
                          'w-full bg-transparent text-xs outline-none',
                          isDark ? 'placeholder-slate-500 text-white' : 'placeholder-stone-400 text-stone-900'
                        )}
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-800/40">
                      <button
                        type="button"
                        onClick={() => {
                          setReportId('')
                          setReportDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full p-2.5 text-left text-xs transition flex items-center justify-between gap-2',
                          !reportId
                            ? isDark
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-rose-50 text-rose-700'
                            : isDark
                            ? 'hover:bg-slate-800/60 text-slate-400'
                            : 'hover:bg-stone-50 text-stone-500'
                        )}
                      >
                        <span className="italic">-- Không kèm báo cáo (Trích bồi thường trực tiếp) --</span>
                        {!reportId && <HiOutlineCheck className="h-4 w-4 text-rose-500 shrink-0" />}
                      </button>

                      {filteredShopReports.map((rep) => {
                        const isSelected = rep.requestId === reportId
                        return (
                          <button
                            type="button"
                            key={rep.requestId}
                            onClick={() => {
                              setReportId(rep.requestId)
                              setReportDropdownOpen(false)
                            }}
                            className={cn(
                              'w-full p-2.5 text-left text-xs transition flex items-center justify-between gap-2',
                              isSelected
                                ? isDark
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : 'bg-rose-50 text-rose-700'
                                : isDark
                                ? 'hover:bg-slate-800/60'
                                : 'hover:bg-stone-50'
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-500 truncate">
                                  {rep.displayCode || rep.requestId.substring(0, 10)}
                                </span>
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold border border-slate-700 text-slate-400">
                                  {rep.status}
                                </span>
                              </div>
                              <div className={cn('text-[11px] truncate mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                {rep.description || 'Báo cáo vi phạm'}
                              </div>
                            </div>
                            {isSelected && <HiOutlineCheck className="h-4 w-4 text-rose-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Tùy chọn nếu có khiếu nại..."
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-4 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500',
                  isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                )}
              />
            )}
          </div>

          {/* Số tiền trích bồi thường */}
          <div>
            <label className="block text-xs font-semibold mb-1">Số tiền trích bồi thường *</label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="Ví dụ: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500',
                isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
              )}
            />
            <div className="text-[11px] text-amber-500 font-medium mt-1">
              {amount ? `→ ${formatVND(amount)}` : 'Tối thiểu 1.000 ₫'}
            </div>
          </div>

          {/* Lý do phân xử */}
          <div>
            <label className="block text-xs font-semibold mb-1">Lý do phân xử trích bồi thường *</label>
            <textarea
              rows="2"
              required
              placeholder="Ví dụ: Đền bù người mua do giao sai hàng hóa và không phản hồi khiếu nại..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500',
                isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
              )}
            />
          </div>

          {/* Nút Submit */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
              )}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận trích quỹ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
