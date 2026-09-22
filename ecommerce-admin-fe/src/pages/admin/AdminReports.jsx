import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineCash,
  HiOutlineScale,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineStar,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import reportService from '../../services/report'
import requestService from '../../services/request'
import escrowService from '../../services/escrow'
import toast from 'react-hot-toast'

import AdminReportsTab from './components/reports/AdminReportsTab'
import AdminAppealsTab from './components/reports/AdminAppealsTab'
import AdminEscrowTab from './components/reports/AdminEscrowTab'
import AdminReportDetailModal from './components/reports/AdminReportDetailModal'
import AdminActionModal from './components/reports/AdminActionModal'

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
          <AdminReportsTab
            reports={reports}
            isDark={isDark}
            handleOpenDetail={handleOpenDetail}
            setActionModal={setActionModal}
            parseImages={parseImages}
          />
        ) : activeTab === 'APPEALS' ? (
          <AdminAppealsTab
            appeals={appeals}
            isDark={isDark}
            handleOpenDetail={handleOpenDetail}
            setActionModal={setActionModal}
            parseImages={parseImages}
          />
        ) : (
          <AdminEscrowTab
            escrows={escrows}
            isDark={isDark}
            formatVND={formatVND}
            setActionModal={setActionModal}
          />
        )}
      </div>

      {/* Detail Modal (Xem Chi Tiết Đầy Đủ) */}
      <AdminReportDetailModal
        detailModal={detailModal}
        setDetailModal={setDetailModal}
        isDark={isDark}
        copyToClipboard={copyToClipboard}
        getTargetIcon={getTargetIcon}
        getTargetLabel={getTargetLabel}
        parseImages={parseImages}
        setActionModal={setActionModal}
      />

      {/* Action Modal (Nhập ghi chú phán quyết) */}
      <AdminActionModal
        actionModal={actionModal}
        setActionModal={setActionModal}
        isDark={isDark}
        submitting={submitting}
        handleActionConfirm={handleActionConfirm}
      />
    </div>
  )
}
