import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiOutlineCash,
  HiOutlineScale,
  HiOutlineEye,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineStar,
  HiOutlineClipboardCopy,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import reportService from '../../services/report'
import requestService from '../../services/request'
import escrowService from '../../services/escrow'
import toast from 'react-hot-toast'

// Helper tách và gom tất cả link ảnh từ các nguồn (hỗ trợ nhiều ảnh phân cách bằng dấu phẩy)
export const parseImages = (...sources) => {
  const urls = []
  sources.forEach((src) => {
    if (typeof src === 'string' && src.trim()) {
      src.split(',').forEach((url) => {
        const trimmed = url.trim()
        if (trimmed && !urls.includes(trimmed)) {
          urls.push(trimmed)
        }
      })
    }
  })
  return urls
}

export default function AdminReports() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [activeTab, setActiveTab] = useState('REPORTS') // 'REPORTS' | 'APPEALS' | 'ESCROW'
  const [loading, setLoading] = useState(true)

  // Data states
  const [reports, setReports] = useState([])
  const [appeals, setAppeals] = useState([])
  const [escrows, setEscrows] = useState([])

  // Modal actions (xác nhận/từ chối kèm ghi chú)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'REPORT_APPROVE', 'REPORT_REJECT', 'APPEAL_APPROVE', 'APPEAL_REJECT', 'ESCROW_REFUND', 'ESCROW_RELEASE'
    item: null,
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal xem chi tiết
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    loading: false,
    data: null,
    rawItem: null,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      if (activeTab === 'REPORTS' || activeTab === 'APPEALS') {
        const [reportRes, appealRes] = await Promise.all([
          requestService.getAdminRequests({ type: 'REPORT' }),
          requestService.getAdminRequests({ type: 'APPEAL' }),
        ])
        const reportList = reportRes?.content || (Array.isArray(reportRes) ? reportRes : [])
        const appealList = appealRes?.content || (Array.isArray(appealRes) ? appealRes : [])
        setReports(reportList)
        setAppeals(appealList)
      } else if (activeTab === 'ESCROW') {
        const res = await escrowService.getAdminEscrows()
        const list = res?.content || (Array.isArray(res) ? res : [])
        setEscrows(list)
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu kiểm duyệt:', err)
      toast.error('Không thể tải danh sách dữ liệu kiểm duyệt.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenDetail = async (item) => {
    const requestId = item.requestId || item.id
    setDetailModal({
      isOpen: true,
      loading: true,
      data: null,
      rawItem: item,
    })
    try {
      const details = await requestService.getRequestDetails(requestId)
      setDetailModal({
        isOpen: true,
        loading: false,
        data: details,
        rawItem: item,
      })
    } catch (err) {
      console.error('Lỗi tải chi tiết yêu cầu:', err)
      toast.error('Không thể tải chi tiết. Vui lòng thử lại.')
      setDetailModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleActionConfirm = async () => {
    const { type, item, note } = actionModal
    if (!item) return

    const trimmedNote = note?.trim() || ''

    // Bắt buộc nhập lý do phán quyết đối với duyệt / từ chối report hoặc kháng cáo
    if (!trimmedNote && ['REPORT_APPROVE', 'REPORT_REJECT', 'APPEAL_APPROVE', 'APPEAL_REJECT'].includes(type)) {
      toast.error('Vui lòng nhập hoặc chọn lý do / phán quyết của Ban Quản Trị!')
      return
    }

    try {
      setSubmitting(true)
      const requestId = item.requestId || item.id

      if (type === 'REPORT_APPROVE') {
        await reportService.handleReport(requestId, 'APPROVE', trimmedNote)
        toast.success('Đã xác nhận vi phạm! Hệ thống đã tự động áp dụng chế tài & tính chu kỳ hoàn lương 30 ngày.')
      } else if (type === 'REPORT_REJECT') {
        await reportService.handleReport(requestId, 'REJECT', trimmedNote)
        toast.success('Đã bác bỏ báo cáo vi phạm.')
      } else if (type === 'APPEAL_APPROVE') {
        await requestService.approveRequest(requestId, trimmedNote)
        toast.success('Đã chấp thuận kháng cáo! Đã khôi phục trạng thái và điều chỉnh điểm vi phạm về an toàn.')
      } else if (type === 'APPEAL_REJECT') {
        await requestService.rejectRequest(requestId, trimmedNote)
        toast.success('Đã từ chối kháng cáo.')
      } else if (type === 'ESCROW_REFUND') {
        const orderId = item.orderId || item.order?.id
        await escrowService.refundByOrder(orderId, trimmedNote || 'Admin phân xử hoàn tiền 100% cho người mua do Shop vi phạm')
        toast.success('Đã kích hoạt hoàn tiền ký quỹ Escrow về Ví người mua thành công!')
      } else if (type === 'ESCROW_RELEASE') {
        const orderId = item.orderId || item.order?.id
        await escrowService.releaseByOrder(orderId)
        toast.success('Đã giải ngân tiền ký quỹ về Ví người bán!')
      }

      setActionModal({ isOpen: false, type: '', item: null, note: '' })
      setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })
      fetchData()
    } catch (err) {
      console.error('Action error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi thực hiện thao tác.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Đã sao chép mã ID vào bộ nhớ đệm')
  }

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  const getTargetIcon = (targetType) => {
    switch (targetType) {
      case 'SHOP':
        return <HiOutlineShoppingBag className="h-5 w-5 text-amber-500" />
      case 'PRODUCT':
        return <HiOutlineTag className="h-5 w-5 text-indigo-500" />
      case 'USER':
        return <HiOutlineUser className="h-5 w-5 text-sky-500" />
      case 'REVIEW':
        return <HiOutlineStar className="h-5 w-5 text-yellow-500" />
      default:
        return <HiOutlineExclamationCircle className="h-5 w-5 text-stone-400" />
    }
  }

  const getTargetLabel = (targetType) => {
    switch (targetType) {
      case 'SHOP':
        return 'Gian hàng (Shop)'
      case 'PRODUCT':
        return 'Sản phẩm (Product)'
      case 'USER':
        return 'Tài khoản người dùng (User)'
      case 'REVIEW':
        return 'Đánh giá / Nhận xét (Review)'
      default:
        return 'Đối tượng chưa xác định'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-sm">
            <HiOutlineShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Kiểm Soát An Toàn, Vi Phạm & Kháng Cáo (Trust & Safety)
            </h1>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Thẩm định báo cáo vi phạm, xét duyệt kháng cáo và phân xử ký quỹ Escrow bảo vệ người mua
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className={cn(
            'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
            isDark
              ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100',
          )}
          title="Tải lại dữ liệu"
        >
          <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border transition-all',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-100/90',
        )}
      >
        {[
          { key: 'REPORTS', label: `Báo Cáo Vi Phạm (${reports.length})`, icon: HiOutlineExclamationCircle },
          { key: 'APPEALS', label: `Hàng Đợi Kháng Cáo (${appeals.length})`, icon: HiOutlineScale },
          { key: 'ESCROW', label: `Xử Lý Ký Quỹ Escrow (${escrows.length})`, icon: HiOutlineCash },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all',
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Container */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm overflow-hidden transition-colors',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className="mt-3 text-xs text-stone-400">Đang tải dữ liệu kiểm duyệt...</p>
          </div>
        ) : activeTab === 'REPORTS' ? (
          /* TAB 1: REPORTS */
          reports.length === 0 ? (
            <div className="py-16 text-center">
              <HiOutlineCheck className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">Không có báo cáo vi phạm nào cần xử lý</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-slate-800">
              {reports.map((item) => (
                <div
                  key={item.requestId || item.id}
                  className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div
                    onClick={() => handleOpenDetail(item)}
                    className="space-y-1.5 flex-1 min-w-0 cursor-pointer"
                    title="Bấm để xem chi tiết đầy đủ"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          item.status === 'APPROVED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : item.status === 'REJECTED'
                              ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        )}
                      >
                        {item.status === 'APPROVED'
                          ? 'Đã xử phạt'
                          : item.status === 'REJECTED'
                            ? 'Đã bác đơn'
                            : 'Chờ thẩm định'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        #{String(item.requestId || item.id).substring(0, 8)}
                      </span>
                      <span className="text-xs text-stone-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-xs font-medium group-hover:text-amber-500 transition-colors line-clamp-2',
                        isDark ? 'text-slate-200' : 'text-stone-800',
                      )}
                    >
                      {item.description || 'Báo cáo vi phạm tiêu chuẩn cộng đồng'}
                    </p>

                    {(() => {
                      const covImgs = parseImages(item.coverImageUrl)
                      const evImgs = parseImages(item.evidenceUrl)
                      if (!covImgs.length && !evImgs.length) return null
                      return (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {evImgs.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenDetail(item)
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:underline font-medium"
                            >
                              <HiOutlineExternalLink className="h-3.5 w-3.5" />
                              Bằng chứng ({evImgs.length} ảnh)
                            </button>
                          )}
                          {covImgs.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenDetail(item)
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-medium"
                            >
                              <HiOutlineExternalLink className="h-3.5 w-3.5" />
                              Minh họa shop ({covImgs.length} ảnh)
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Nút Xem Chi Tiết */}
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95',
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:border-amber-500/50 hover:text-amber-400'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-400 hover:text-amber-600',
                      )}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                      Chi tiết
                    </button>

                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'REPORT_APPROVE', item, note: '' })}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-sm transition-all"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Xác nhận vi phạm
                        </button>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'REPORT_REJECT', item, note: '' })}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Bác bỏ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'APPEALS' ? (
          /* TAB 2: APPEALS */
          appeals.length === 0 ? (
            <div className="py-16 text-center">
              <HiOutlineCheck className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">Không có hồ sơ kháng cáo nào đang chờ</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-slate-800">
              {appeals.map((item) => (
                <div
                  key={item.requestId || item.id}
                  className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div
                    onClick={() => handleOpenDetail(item)}
                    className="space-y-1.5 flex-1 min-w-0 cursor-pointer"
                    title="Bấm để xem chi tiết kháng cáo"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          item.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : item.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        )}
                      >
                        {item.status === 'APPROVED'
                          ? 'Đã gỡ phạt'
                          : item.status === 'REJECTED'
                            ? 'Bị từ chối'
                            : 'Chờ xét duyệt'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        #{String(item.requestId || item.id).substring(0, 8)}
                      </span>
                      <span className="text-xs text-stone-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-xs font-medium group-hover:text-amber-500 transition-colors line-clamp-2',
                        isDark ? 'text-slate-200' : 'text-stone-800',
                      )}
                    >
                      <strong>Giải trình:</strong> {item.description || 'Không có mô tả'}
                    </p>

                    {item.coverImageUrl && (() => {
                      const imgs = parseImages(item.coverImageUrl)
                      if (!imgs.length) return null
                      return (
                        <a
                          href={imgs[0]}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-amber-500 hover:underline mt-0.5"
                        >
                          <HiOutlineExternalLink className="h-3.5 w-3.5" />
                          {imgs.length === 1 ? 'Xem bằng chứng đính kèm' : `Xem bằng chứng đính kèm (${imgs.length} ảnh)`}
                        </a>
                      )
                    })()}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Nút Xem Chi Tiết */}
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95',
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:border-amber-500/50 hover:text-amber-400'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-400 hover:text-amber-600',
                      )}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                      Chi tiết
                    </button>

                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'APPEAL_APPROVE', item, note: '' })}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Chấp thuận gỡ phạt
                        </button>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'APPEAL_REJECT', item, note: '' })}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* TAB 3: ESCROW */
          escrows.length === 0 ? (
            <div className="py-16 text-center">
              <HiOutlineCash className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">Không có giao dịch ký quỹ nào</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-slate-800">
              {escrows.map((item) => (
                <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          item.status === 'RELEASED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : item.status === 'REFUNDED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-500">
                        {formatVND(item.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Mã đơn hàng: #{item.orderNumber || item.orderId || item.id}
                    </p>
                  </div>

                  {(item.status === 'HELD' || item.status === 'DISPUTED') && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActionModal({ isOpen: true, type: 'ESCROW_RELEASE', item, note: '' })}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        Giải ngân cho Shop
                      </button>
                      <button
                        onClick={() => setActionModal({ isOpen: true, type: 'ESCROW_REFUND', item, note: '' })}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Hoàn tiền cho Người mua
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Detail Modal (Xem Chi Tiết Đầy Đủ) */}
      <AnimatePresence>
        {detailModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-2xl rounded-3xl border p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
              )}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between pb-4 border-b dark:border-slate-800 border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold border',
                        (detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
                      )}
                    >
                      {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
                        ? 'Báo Cáo Vi Phạm'
                        : 'Đơn Kháng Cáo'}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold border',
                        (detailModal.data?.status || detailModal.rawItem?.status) === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : (detailModal.data?.status || detailModal.rawItem?.status) === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                      )}
                    >
                      {(detailModal.data?.status || detailModal.rawItem?.status) === 'APPROVED'
                        ? 'Đã duyệt'
                        : (detailModal.data?.status || detailModal.rawItem?.status) === 'REJECTED'
                          ? 'Từ chối / Bác bỏ'
                          : 'Chờ thẩm định'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mt-2 flex items-center gap-2">
                    Chi tiết hồ sơ #{String(detailModal.data?.requestId || detailModal.rawItem?.requestId || detailModal.rawItem?.id).substring(0, 8)}
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          detailModal.data?.requestId || detailModal.rawItem?.requestId || detailModal.rawItem?.id,
                        )
                      }
                      title="Sao chép toàn bộ ID"
                      className="text-stone-400 hover:text-amber-500 transition-colors p-1"
                    >
                      <HiOutlineClipboardCopy className="h-4 w-4" />
                    </button>
                  </h2>
                  <p className="text-xs text-stone-400">
                    Thời gian gửi:{' '}
                    {detailModal.data?.createdAt || detailModal.rawItem?.createdAt
                      ? new Date(
                        detailModal.data?.createdAt || detailModal.rawItem?.createdAt,
                      ).toLocaleString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              {/* Body Modal (Cuộn được) */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {detailModal.loading ? (
                  <div className="py-12 text-center">
                    <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
                    <p className="mt-2 text-xs text-stone-400">Đang tải thông tin chi tiết...</p>
                  </div>
                ) : (
                  <>
                    {/* Phần 1: Đối tượng bị báo cáo / kháng cáo */}
                    <div
                      className={cn(
                        'rounded-2xl border p-4 space-y-2',
                        isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {getTargetIcon(detailModal.data?.detail?.targetType)}
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                          Đối tượng liên quan: {getTargetLabel(detailModal.data?.detail?.targetType)}
                        </span>
                      </div>

                      {detailModal.data?.detail ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px]">
                              Tên đối tượng:
                            </span>
                            <span className="text-sm font-bold text-stone-900 dark:text-white">
                              {detailModal.data.detail.targetName || 'Chưa có thông tin'}
                            </span>
                          </div>

                          {detailModal.data.detail.targetInfo && (
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px]">
                                Thông tin bổ sung:
                              </span>
                              <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
                                {detailModal.data.detail.targetInfo}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 dark:text-slate-400 italic">
                          Không tìm thấy thông tin đối tượng chi tiết trong hồ sơ.
                        </p>
                      )}
                    </div>

                    {/* Phần 2: Nội dung báo cáo / giải trình */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                        {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT'
                          ? 'Mô tả vi phạm từ người tố cáo:'
                          : 'Nội dung trần tình & giải trình kháng cáo:'}
                      </label>
                      <div
                        className={cn(
                          'p-3.5 rounded-2xl border text-xs leading-relaxed',
                          isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-white text-stone-800',
                        )}
                      >
                        {detailModal.data?.description || detailModal.rawItem?.description || 'Không có mô tả chi tiết'}
                      </div>
                    </div>

                    {/* Phần 3: Bằng chứng / Ảnh / Chứng từ đính kèm (Phân tách rõ ràng) */}
                    {(() => {
                      const evImgs = parseImages(detailModal.data?.detail?.evidenceUrl)
                      const covImgs = parseImages(
                        detailModal.data?.coverImageUrl,
                        detailModal.rawItem?.coverImageUrl
                      )

                      if (!evImgs.length && !covImgs.length) {
                        return (
                          <div
                            className={cn(
                              'p-4 rounded-2xl border text-center text-xs text-stone-400',
                              isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50',
                            )}
                          >
                            Không có tệp hình ảnh hoặc tài liệu bằng chứng đính kèm.
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-4">
                          {/* Mục 1: Bằng chứng vi phạm từ người tố cáo */}
                          {evImgs.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                                  Hình ảnh bằng chứng vi phạm ({evImgs.length} tệp):
                                </label>
                                <span className="text-[11px] text-stone-400">Do người tố cáo tải lên làm bằng chứng</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {evImgs.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    className="relative group overflow-hidden rounded-2xl border border-red-500/25 bg-stone-900/10 h-36 flex items-center justify-center p-1.5"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Bằng chứng vi phạm ${idx + 1}`}
                                      className="h-full w-full object-cover rounded-xl"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                                      <span className="text-[11px] text-white font-medium">Bằng chứng #{idx + 1}</span>
                                      <a
                                        href={imgUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-transform active:scale-95"
                                      >
                                        <HiOutlineExternalLink className="h-4 w-4" />
                                        Mở tab mới
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mục 2: Hình ảnh minh họa của gian hàng / sản phẩm */}
                          {covImgs.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                                  Hình ảnh minh họa của gian hàng / sản phẩm ({covImgs.length} tệp):
                                </label>
                                <span className="text-[11px] text-stone-400">Hình ảnh gian hàng hoặc sản phẩm bị tố cáo</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {covImgs.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    className="relative group overflow-hidden rounded-2xl border border-blue-500/25 bg-stone-900/10 h-36 flex items-center justify-center p-1.5"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Minh họa shop ${idx + 1}`}
                                      className="h-full w-full object-cover rounded-xl"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                                      <span className="text-[11px] text-white font-medium">Minh họa #{idx + 1}</span>
                                      <a
                                        href={imgUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition-transform active:scale-95"
                                      >
                                        <HiOutlineExternalLink className="h-4 w-4" />
                                        Mở tab mới
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Phần 4: Lịch sử thẩm định (nếu đã xử lý) */}
                    {(detailModal.data?.status || detailModal.rawItem?.status) !== 'PENDING' && (
                      <div
                        className={cn(
                          'rounded-2xl border p-4 space-y-2',
                          isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                            Kết quả thẩm định của Quản trị viên:
                          </span>
                          <span className="text-xs text-stone-400">
                            {detailModal.data?.reviewedAt
                              ? new Date(detailModal.data.reviewedAt).toLocaleString('vi-VN')
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {detailModal.data?.note || detailModal.data?.detail?.moderatorNote || 'Không có ghi chú phản hồi'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t dark:border-slate-800 border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDetailModal({ isOpen: false, loading: false, data: null, rawItem: null })}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                    isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100',
                  )}
                >
                  Đóng
                </button>

                {/* Các nút hành động nếu hồ sơ đang chờ duyệt */}
                {(detailModal.data?.status || detailModal.rawItem?.status) === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    {(detailModal.data?.type || detailModal.rawItem?.type) === 'REPORT' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionModal({
                              isOpen: true,
                              type: 'REPORT_APPROVE',
                              item: detailModal.rawItem || detailModal.data,
                              note: '',
                            })
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-sm transition-all"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Xác nhận vi phạm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionModal({
                              isOpen: true,
                              type: 'REPORT_REJECT',
                              item: detailModal.rawItem || detailModal.data,
                              note: '',
                            })
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Bác bỏ
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionModal({
                              isOpen: true,
                              type: 'APPEAL_APPROVE',
                              item: detailModal.rawItem || detailModal.data,
                              note: '',
                            })
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                          Chấp thuận gỡ phạt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionModal({
                              isOpen: true,
                              type: 'APPEAL_REJECT',
                              item: detailModal.rawItem || detailModal.data,
                              note: '',
                            })
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                        >
                          <HiOutlineX className="h-4 w-4" />
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modal (Nhập ghi chú phán quyết) */}
      <AnimatePresence>
        {actionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
              )}
            >
              <h2 className="text-base font-bold mb-1">
                {actionModal.type === 'REPORT_APPROVE' && 'Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài'}
                {actionModal.type === 'REPORT_REJECT' && 'Phán Quyết: Bác Bỏ Báo Cáo Vi Phạm'}
                {actionModal.type === 'APPEAL_APPROVE' && 'Phán Quyết: Chấp Thuận Kháng Cáo (Gỡ Phạt)'}
                {actionModal.type === 'APPEAL_REJECT' && 'Phán Quyết: Bác Bỏ Đơn Kháng Cáo'}
                {actionModal.type === 'ESCROW_REFUND' && 'Phân Xử Ký Quỹ: Hoàn Tiền Cho Người Mua'}
                {actionModal.type === 'ESCROW_RELEASE' && 'Phân Xử Ký Quỹ: Giải Ngân Cho Người Bán'}
              </h2>
              <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Vui lòng nhập lý do / phán quyết chính thức từ Ban Quản Trị. Thông tin này sẽ được gửi trực tiếp tới gian hàng và lưu trữ trong hồ sơ vi phạm:
              </p>

              {/* Quick tags gợi ý lý do vi phạm nhanh */}
              {actionModal.type === 'REPORT_APPROVE' && (
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-amber-500 block mb-1.5">Gợi ý lý do vi phạm nhanh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Gian hàng có dấu hiệu lừa đảo người mua',
                      'Kinh doanh hàng giả, hàng nhái, vi phạm nhãn hiệu',
                      'Mô tả sản phẩm sai sự thật, gian lận thông số',
                      'Gian lận đơn hàng / Lập đơn ảo trục lợi sàn',
                      'Hàng hóa thuộc danh mục cấm giao dịch',
                      'Thái độ xúc phạm hoặc quấy rối khách hàng',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                          actionModal.note === tag
                            ? 'bg-rose-600 text-white border-rose-600 font-bold'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                        )}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionModal.type === 'REPORT_REJECT' && (
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-stone-400 block mb-1.5">Gợi ý lý do bác đơn nhanh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Không đủ bằng chứng xác thực hành vi vi phạm',
                      'Nội dung thuộc tranh chấp bảo hành / khiếu nại thông thường',
                      'Hình ảnh đính kèm không liên quan đến sản phẩm/đơn hàng',
                      'Báo cáo không có căn cứ thực tế',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                          actionModal.note === tag
                            ? 'bg-stone-600 text-white border-stone-600 font-bold'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                        )}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionModal.type === 'APPEAL_APPROVE' && (
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-emerald-500 block mb-1.5">Gợi ý lý do chấp thuận nhanh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Chấp thuận: Giấy tờ chứng từ hóa đơn hợp lệ và rõ ràng',
                      'Chấp thuận: Xác nhận nhầm lẫn trong quá trình kiểm duyệt',
                      'Chấp thuận: Gian hàng đã giải quyết thỏa đáng khiếu nại của khách',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                          actionModal.note === tag
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                        )}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionModal.type === 'APPEAL_REJECT' && (
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-rose-400 block mb-1.5">Gợi ý lý do từ chối nhanh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Từ chối: Hóa đơn chứng từ không có giá trị pháp lý / mờ không rõ',
                      'Từ chối: Bằng chứng giải trình không làm rõ được vi phạm',
                      'Từ chối: Không cung cấp được ủy quyền phân phối chính hãng',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                          actionModal.note === tag
                            ? 'bg-rose-600 text-white border-rose-600 font-bold'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                        )}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                rows={3}
                placeholder="Nhập chi tiết phán quyết của Ban Quản Trị (bắt buộc)..."
                value={actionModal.note}
                onChange={(e) => setActionModal({ ...actionModal, note: e.target.value })}
                className={cn(
                  'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none mb-4',
                  isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900',
                )}
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: '', item: null, note: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleActionConfirm}
                  disabled={submitting}
                  className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận xử lý'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
