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

    try {
      setSubmitting(true)
      const requestId = item.requestId || item.id

      if (type === 'REPORT_APPROVE') {
        await reportService.handleReport(requestId, 'APPROVE', note || 'Xác nhận vi phạm chính sách sàn')
        toast.success('Đã xác nhận vi phạm! Hệ thống đã tự động áp dụng chế tài & tính chu kỳ hoàn lương 30 ngày.')
      } else if (type === 'REPORT_REJECT') {
        await reportService.handleReport(requestId, 'REJECT', note || 'Bác bỏ báo cáo: Không đủ bằng chứng vi phạm')
        toast.success('Đã bác bỏ báo cáo vi phạm.')
      } else if (type === 'APPEAL_APPROVE') {
        await requestService.approveRequest(requestId, note || 'Chấp thuận kháng cáo: Khôi phục trạng thái hoạt động')
        toast.success('Đã chấp thuận kháng cáo! Đã khôi phục trạng thái và điều chỉnh điểm vi phạm về an toàn.')
      } else if (type === 'APPEAL_REJECT') {
        await requestService.rejectRequest(requestId, note || 'Từ chối kháng cáo: Bằng chứng giải trình không hợp lệ')
        toast.success('Đã từ chối kháng cáo.')
      } else if (type === 'ESCROW_REFUND') {
        const orderId = item.orderId || item.order?.id
        await escrowService.refundByOrder(orderId, note || 'Admin phân xử hoàn tiền 100% cho người mua do Shop vi phạm')
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

                    {item.coverImageUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                        <HiOutlineExternalLink className="h-3.5 w-3.5" />
                        Có tệp bằng chứng đính kèm
                      </span>
                    )}
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

                    {item.coverImageUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                        <HiOutlineExternalLink className="h-3.5 w-3.5" />
                        Có chứng từ gỡ tội đính kèm
                      </span>
                    )}
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

                    {/* Phần 3: Bằng chứng / Ảnh / Chứng từ đính kèm */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                        Bằng chứng & Tài liệu xác minh:
                      </label>
                      {detailModal.data?.coverImageUrl ||
                        detailModal.data?.detail?.evidenceUrl ||
                        detailModal.rawItem?.coverImageUrl ? (
                        <div className="space-y-2">
                          <div className="overflow-hidden rounded-2xl border dark:border-slate-800 border-stone-200 max-h-64 bg-stone-900/10 flex items-center justify-center p-2">
                            <img
                              src={
                                detailModal.data?.coverImageUrl ||
                                detailModal.data?.detail?.evidenceUrl ||
                                detailModal.rawItem?.coverImageUrl
                              }
                              alt="Bằng chứng vi phạm"
                              className="max-h-60 object-contain rounded-xl"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <a
                            href={
                              detailModal.data?.coverImageUrl ||
                              detailModal.data?.detail?.evidenceUrl ||
                              detailModal.rawItem?.coverImageUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-600 font-semibold"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                            Mở tệp bằng chứng trong tab mới
                          </a>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'p-4 rounded-2xl border text-center text-xs text-stone-400',
                            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50',
                          )}
                        >
                          Không có tệp hình ảnh hoặc liên kết bằng chứng đính kèm.
                        </div>
                      )}
                    </div>

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
                'w-full max-w-md rounded-3xl border p-6 shadow-2xl relative',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
              )}
            >
              <h2 className="text-lg font-bold mb-2">Xác Nhận Thao Tác Phán Quyết</h2>
              <p className={cn('text-xs mb-4', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Ghi chú lý do thẩm định của Quản trị viên (lý do này sẽ được lưu trữ và phản hồi trực tiếp cho đương sự):
              </p>

              <textarea
                rows={3}
                placeholder="Nhập lý do phán quyết..."
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
