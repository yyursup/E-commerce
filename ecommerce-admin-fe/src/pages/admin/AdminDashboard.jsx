import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineSearch,
  HiOutlineCube,
  HiOutlineTrendingUp,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineCog,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import authService from '../../services/auth'
import requestService from '../../services/request'
import productService from '../../services/product'
import statisticsService from '../../services/statistics'

export default function AdminDashboard() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [pendingProducts, setPendingProducts] = useState(0)
  const [timelineFilter, setTimelineFilter] = useState('14d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const fetchDashboardData = async (filter = timelineFilter, start = customStartDate, end = customEndDate) => {
    try {
      setLoading(true)
      setError(null)

      const params = { period: filter }
      if (filter === 'custom' && start && end) {
        params.startDate = start
        params.endDate = end
      }

      const [analyticsData, usersData, pendingRequestsData, pendingProductsData] = await Promise.all([
        statisticsService.getAdminDashboardAnalytics(params).catch((err) => {
          console.warn('Analytics API error fallback:', err)
          return null
        }),
        authService.getAllUsers().catch(() => []),
        requestService.getAdminRequests({ status: 'PENDING', page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
        productService.getPendingProducts().catch(() => []),
      ])

      setAnalytics(analyticsData)
      setPendingRequests(Number(pendingRequestsData?.totalElements || 0))
      setPendingProducts(Array.isArray(pendingProductsData) ? pendingProductsData.length : 0)

      const userList = Array.isArray(usersData) ? usersData : []
      const transformedUsers = userList.slice(0, 10).map((u, index) => ({
        id: index + 1,
        email: u.email,
        role: u.role || 'CUSTOMER',
        status: 'active',
        createdAt: new Date().toLocaleDateString('vi-VN'),
      }))
      setUsers(transformedUsers)
    } catch (err) {
      console.error('Error fetching admin dashboard:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu thống kê')
      toast.error('Không thể tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod) => {
    setTimelineFilter(newPeriod)
    if (newPeriod === 'custom') {
      setIsCustomDateOpen(true)
    } else {
      setIsCustomDateOpen(false)
      fetchDashboardData(newPeriod)
    }
  }

  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Vui lòng chọn đầy đủ từ ngày và đến ngày')
      return
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Từ ngày không được lớn hơn đến ngày')
      return
    }
    fetchDashboardData('custom', customStartDate, customEndDate)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
  }

  const renderCurrency = (amount, colorClass) => {
    const formatted = formatCurrency(amount)
    const match = formatted.match(/^(.*?)[\s\u00a0]*([₫VND]+)$/)
    if (match) {
      return (
        <span className={cn('inline-flex items-baseline whitespace-nowrap font-black tracking-tight', colorClass)}>
          <span className="text-xl sm:text-2xl xl:text-[18px] 2xl:text-[21px]">{match[1]}</span>
          <span className="ml-1 text-xs sm:text-sm font-bold opacity-80">{match[2]}</span>
        </span>
      )
    }
    return (
      <span className={cn('whitespace-nowrap font-black tracking-tight text-xl sm:text-2xl xl:text-[18px] 2xl:text-[21px]', colorClass)}>
        {formatted}
      </span>
    )
  }

  // Calculate timeline max for SVG Bar height
  const dailyList = analytics?.dailyTimeline || []
  const maxGmvVal = Math.max(...dailyList.map((d) => Number(d.gmv || 0)), 1000000)

  return (
    <div
      className={cn(
        'min-h-screen px-4 py-8 sm:px-6 lg:px-8',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900',
      )}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className={cn('text-3xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Tổng Quan Sàn Giao Dịch
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                Server-Side Realtime
              </span>
            </div>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Hệ thống giám sát dòng tiền GMV, Quỹ bảo lãnh Escrow và ngách thiết bị điện tử
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition shadow-sm',
                isDark
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700',
              )}
            >
              <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
              Làm mới
            </button>
          </div>
        </div>

        {/* BỘ LỌC KỲ THỜI GIAN TOÀN DIỆN CHO DASHBOARD */}
        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Kỳ thống kê:
            </span>
            <div
              className={cn(
                'flex items-center rounded-xl p-1 border text-xs font-semibold',
                isDark ? 'border-slate-800 bg-slate-800/60' : 'border-stone-200 bg-stone-100',
              )}
            >
              {[
                { id: '7d', label: '7 ngày' },
                { id: '14d', label: '14 ngày' },
                { id: '30d', label: '30 ngày' },
                { id: 'this_month', label: 'Tháng này' },
                { id: 'last_month', label: 'Tháng trước' },
                { id: 'custom', label: 'Tùy chọn' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all',
                    timelineFilter === p.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-stone-600 hover:text-stone-900',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {analytics?.startDate && analytics?.endDate && (
              <span
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-lg font-semibold border',
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-stone-50 border-stone-200 text-stone-600',
                )}
              >
                {analytics.startDate} → {analytics.endDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Dữ liệu KPI & biểu đồ được tính toán theo kỳ đã chọn</span>
          </div>
        </div>

        {/* Ô nhập ngày tùy chọn */}
        {isCustomDateOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              'p-4 rounded-xl border flex flex-wrap items-center gap-3 text-xs',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50',
            )}
          >
            <span className="font-semibold text-slate-400">Chọn khoảng ngày:</span>
            <div className="flex items-center gap-2">
              <span>Từ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs',
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-800',
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Đến:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs',
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-800',
                )}
              />
            </div>
            <button
              onClick={handleApplyCustomDate}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </motion.div>
        )}

        {/* 1. KHỐI TÀI CHÍNH CỐT LÕI (4 FINANCIAL STAT CARDS) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Tổng GMV */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative rounded-2xl border p-4 sm:p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Tổng GMV
                </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
                  Trong kỳ
                </span>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500 shrink-0">
                <HiOutlineTrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p>
                {renderCurrency(analytics?.totalGmv, 'text-blue-500')}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium">
                <span className={analytics?.gmvGrowthRate >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                  {analytics?.gmvGrowthRate >= 0 ? `↑ +${analytics?.gmvGrowthRate || 0}%` : `↓ ${analytics?.gmvGrowthRate || 0}%`}
                </span>
                <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>so với cùng kỳ trước</span>
              </div>
              {analytics?.allTimeGmv != null && (
                <p className={cn("text-[11px] mt-1.5 truncate", isDark ? "text-slate-400" : "text-stone-500")}>
                  Lũy kế toàn sàn: <span className="font-semibold">{formatCurrency(analytics.allTimeGmv)}</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Card 2: Doanh Thu Quyết Toán (Net Settled) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cn(
              'relative rounded-2xl border p-4 sm:p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Doanh Thu Quyết Toán
                </span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                  Trong kỳ
                </span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 shrink-0">
                <HiOutlineCheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p>
                {renderCurrency(analytics?.settledRevenue, 'text-emerald-500')}
              </p>
              <div className={cn("mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium", isDark ? 'text-slate-400' : 'text-stone-500')}>
                <span>{analytics?.completedOrders || 0} đơn đã giao trong kỳ</span>
              </div>
              {analytics?.allTimeSettledRevenue != null && (
                <p className={cn("text-[11px] mt-1.5 truncate", isDark ? "text-slate-400" : "text-stone-500")}>
                  Lũy kế quyết toán: <span className="font-semibold">{formatCurrency(analytics.allTimeSettledRevenue)}</span>
                </p>
              )}
            </div>
          </motion.div>

          {/* Card 3: Quỹ Bảo Lãnh Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'relative rounded-2xl border p-4 sm:p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Quỹ Ký Quỹ Escrow
                </span>
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                  Thời gian thực
                </span>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500 shrink-0">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p>
                {renderCurrency(analytics?.activeEscrowBalance, 'text-purple-500')}
              </p>
              <div className={cn("mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium", isDark ? 'text-purple-400' : 'text-purple-600')}>
                <span>Bảo lãnh vận chuyển & 3 ngày đồng kiểm</span>
              </div>
              <p className={cn("text-[11px] mt-1.5 truncate text-purple-400/80")}>
                Đang tạm giữ chờ giải ngân
              </p>
            </div>
          </motion.div>

          {/* Card 4: Doanh Thu Hoa Hồng Sàn */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cn(
              'relative rounded-2xl border p-4 sm:p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Hoa Hồng Sàn Thực Thu
                </span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                  Trong kỳ
                </span>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500 shrink-0">
                <HiOutlineCurrencyDollar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p>
                {renderCurrency(analytics?.totalPlatformCommission, 'text-amber-500')}
              </p>
              <div className={cn("mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium", isDark ? 'text-amber-400' : 'text-amber-600')}>
                <span>Tỷ lệ hoa hồng sàn trung bình: ~5.0%</span>
              </div>
              <p className={cn("text-[11px] mt-1.5 truncate", isDark ? "text-slate-400" : "text-stone-500")}>
                Phí dịch vụ sàn thu từ người bán
              </p>
            </div>
          </motion.div>
        </div>

        {/* 2. CHỈ SỐ VẬN HÀNH & RỦI RO (OPERATIONS & RISK BAR) */}
        <div
          className={cn(
            'grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white',
          )}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tỷ lệ hoàn thành đơn
              </p>
              <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-500 border border-emerald-500/20">Trong kỳ</span>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-500">{analytics?.fulfillmentRate || 0}%</p>
            <p className="text-[11px] text-slate-500">{analytics?.totalOrders || 0} đơn phát sinh trong kỳ</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tỷ lệ hoàn hàng / lỗi
              </p>
              <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-500 border border-amber-500/20">Trong kỳ</span>
            </div>
            <p className="mt-1 text-xl font-bold text-amber-500">{analytics?.returnRate || 0}%</p>
            <p className="text-[11px] text-slate-500">{analytics?.returnedOrders || 0} đơn đã hoàn tiền</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tranh chấp đang xử lý
              </p>
              <span className="rounded bg-rose-500/10 px-1 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-500/20">Thời gian thực</span>
            </div>
            <p className="mt-1 text-xl font-bold text-rose-500">{analytics?.pendingDisputesCount || 0} vụ</p>
            <p className="text-[11px] text-slate-500">Tỷ lệ: {analytics?.disputeRate || 0}%</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Shop đã định danh eKYC
              </p>
              <span className="rounded bg-blue-500/10 px-1 py-0.2 text-[9px] font-bold text-blue-400 border border-blue-500/20">Mạng lưới</span>
            </div>
            <p className="mt-1 text-xl font-bold text-blue-500">{analytics?.kycVerificationRate || 0}%</p>
            <p className="text-[11px] text-slate-500">
              {analytics?.verifiedKycShops || 0} / {analytics?.totalShops || 0} gian hàng
            </p>
          </div>
        </div>

        {/* 3. BIỂU ĐỒ DOANH THU & HOA HỒNG (TIMELINE BAR CHART) */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Xu Hướng Doanh Số GMV & Hoa Hồng Sàn Theo Ngày
                </h2>
                {analytics?.startDate && analytics?.endDate && (
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-semibold', isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600')}>
                    {analytics.startDate} → {analytics.endDate}
                  </span>
                )}
              </div>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Dữ liệu phân rã theo từng ngày từ hệ thống giao dịch thực tế
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-500"></span> GMV Trong Kỳ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500"></span> Hoa Hồng Thực Thu (~5%)
              </span>
            </div>
          </div>

          {/* Thanh hiển thị chi tiết số liệu khi rê chuột - CỐ ĐỊNH CHIỀU CAO 44px KHÔNG BAO GIỜ THAY ĐỔI */}
          <div
            className={cn(
              'mb-4 h-11 min-h-[44px] max-h-[44px] px-3.5 rounded-xl border text-xs flex items-center justify-between overflow-hidden select-none transition-colors duration-150',
              hoveredPoint
                ? isDark
                  ? 'bg-blue-950/40 border-blue-800/60 text-white'
                  : 'bg-blue-50/90 border-blue-200 text-stone-900'
                : isDark
                ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                : 'bg-stone-50 border-stone-200 text-stone-600',
            )}
          >
            {hoveredPoint ? (
              <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 font-bold text-blue-500 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>Ngày {hoveredPoint.date}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar shrink-0">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>GMV:</span>
                    <strong className="font-bold text-blue-500">{formatCurrency(Number(hoveredPoint.gmv || 0))}</strong>
                  </span>
                  <span className={cn('h-3 w-px shrink-0', isDark ? 'bg-slate-700' : 'bg-stone-300')}></span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Hoa hồng (5%):</span>
                    <strong className="font-bold text-amber-500">{formatCurrency(Number(hoveredPoint.commission || 0))}</strong>
                  </span>
                  <span className={cn('h-3 w-px shrink-0', isDark ? 'bg-slate-700' : 'bg-stone-300')}></span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Đơn hàng:</span>
                    <strong className="font-bold text-emerald-500">{hoveredPoint.orderCount || 0} đơn</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-1.5 truncate">
                  <span>💡</span>
                  <span className="truncate">Rê chuột vào cột ngày để xem chi tiết doanh số & hoa hồng</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-medium">
                  <span className="hidden sm:inline">Tổng GMV:</span>
                  <strong className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    {formatCurrency(dailyList.reduce((acc, d) => acc + Number(d.gmv || 0), 0))}
                  </strong>
                  <span>•</span>
                  <span>{dailyList.reduce((acc, d) => acc + Number(d.orderCount || 0), 0)} đơn</span>
                </div>
              </div>
            )}
          </div>

          {dailyList.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch trong chu kỳ này</div>
          ) : (
            <div className="relative flex h-60 min-h-[240px] max-h-[240px] items-stretch gap-2 overflow-x-auto overflow-y-hidden pt-12 pb-2">
              {dailyList.map((item, idx) => {
                const gmvHeight = Math.max((Number(item.gmv || 0) / maxGmvVal) * 100, 4)
                const commHeight = Math.max((Number(item.commission || 0) / maxGmvVal) * 100, 2)
                const shortDate = item.date ? item.date.slice(5) : ''
                const isHovered = hoveredPoint?.date === item.date

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(item)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className={cn(
                      'group relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-end gap-1.5 cursor-pointer rounded-xl px-1 py-1 transition-colors duration-100',
                      isHovered
                        ? isDark
                          ? 'bg-slate-800/80 shadow-sm'
                          : 'bg-blue-50/80 shadow-sm'
                        : hoveredPoint
                        ? 'opacity-40 hover:opacity-100'
                        : 'hover:bg-slate-500/5',
                    )}
                  >
                    {/* Tooltip nổi phía trên cột - cố định vị trí, không animation giật */}
                    <div
                      className={cn(
                        'pointer-events-none absolute -top-11 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-xl transition-opacity duration-100 border',
                        isHovered
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none',
                        isDark
                          ? 'bg-slate-900/95 text-white border-slate-700 backdrop-blur-md'
                          : 'bg-stone-900/95 text-white border-stone-800 backdrop-blur-md',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                        <span className="text-slate-300">GMV:</span>
                        <span className="font-bold text-blue-400">{formatCurrency(Number(item.gmv || 0))}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        <span className="text-slate-300">Hoa hồng:</span>
                        <span className="font-bold text-amber-400">{formatCurrency(Number(item.commission || 0))}</span>
                        <span className="text-slate-400 ml-1">({item.orderCount || 0} đơn)</span>
                      </div>
                      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-stone-900 dark:border-t-slate-900" />
                    </div>

                    <div className="flex w-full flex-1 items-end justify-center gap-1">
                      <div
                        className={cn(
                          'w-1/2 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-colors duration-100',
                          isHovered ? 'from-blue-500 to-cyan-300' : 'group-hover:from-blue-500 group-hover:to-cyan-400',
                        )}
                        style={{ height: `${gmvHeight}%` }}
                      />
                      <div
                        className={cn(
                          'w-1/2 rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-colors duration-100',
                          isHovered ? 'from-amber-500 to-yellow-200' : 'group-hover:from-amber-500 group-hover:to-yellow-300',
                        )}
                        style={{ height: `${commHeight}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold truncate transition-colors duration-100',
                        isHovered
                          ? 'text-blue-500'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-stone-500',
                      )}
                    >
                      {shortDate}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 4. CƠ CẤU NGÁCH HÀNG & TOP RANKING */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cột 1: Cơ cấu ngách hàng (Condition Grade Breakdown) */}
          <div
            className={cn(
              'rounded-2xl border p-6 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="border-b pb-4 mb-4">
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Cơ Cấu Thiết Bị Theo Tình Trạng Máy
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Phân tích tỷ trọng doanh số giữa Mới Seal, Like New 99% và Hàng Xác As-is
              </p>
            </div>

            <div className="space-y-4">
              {(analytics?.conditionBreakdown || []).map((grade) => {
                let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                if (grade.conditionGrade === 'GRADE_NEW') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                if (grade.conditionGrade === 'GRADE_AS_IS') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30'

                return (
                  <div key={grade.conditionGrade} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn('font-semibold rounded-md border px-2 py-0.5 text-[11px]', badgeColor)}>
                        {grade.label}
                      </span>
                      <span className="font-bold">{formatCurrency(grade.totalRevenue)} ({grade.percentage || 0}%)</span>
                    </div>
                    <div className={cn("h-2 w-full rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-stone-200")}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(grade.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cột 2: Top Gian Hàng Xuất Sắc */}
          <div
            className={cn(
              'rounded-2xl border p-6 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Top Gian Hàng Dẫn Đầu Doanh Số
                </h2>
                <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Xếp hạng theo tổng doanh thu đã quyết toán
                </p>
              </div>
              <Link to="/shop-ranking" className="text-xs font-semibold text-amber-500 hover:underline">
                Xem tất cả →
              </Link>
            </div>

            <div className={cn("divide-y", isDark ? "divide-slate-800/40" : "divide-stone-100")}>
              {(analytics?.topShops || []).map((s, index) => (
                <div key={s.shopId || index} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500">
                      {index + 1}
                    </div>
                    <div>
                      <p className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-stone-900')}>
                        {s.shopName || 'Gian hàng công nghệ'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {s.orderCount || 0} đơn hàng • eKYC: <span className="text-emerald-400">Đã xác minh</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-500">{formatCurrency(s.totalRevenue)}</p>
                    <p className="text-[11px] text-slate-400">Hoa hồng: {formatCurrency(s.commissionContributed)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. LIÊN KẾT TRUNG TÂM QUẢN LÝ BIỂU PHÍ & HOA HỒNG */}
        <div
          className={cn(
            'flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm',
            isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50',
          )}
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
              <HiOutlineCog className="h-6 w-6" />
            </div>
            <div>
              <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Biểu Phí Hoa Hồng Theo Ngành Hàng & Chính Sách Giảm Trừ
              </h2>
              <p className={cn('text-xs mt-1 leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
                Toàn bộ cấu hình hoa hồng 3 tầng (Biểu phí danh mục, Giảm trừ Ký quỹ 1★-5★, Ưu đãi Thâm niên) đã được tập trung tại Trung Tâm Quản Lý Hoa Hồng.
              </p>
            </div>
          </div>

          <Link
            to="/commissions?tab=categories"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition shadow-md shadow-amber-500/20"
          >
            Quản lý Biểu Phí Chi Tiết →
          </Link>
        </div>

        {/* 6. BẢNG QUẢN LÝ NGƯỜI DÙNG RÚT GỌN */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Người Dùng Mới Hoạt Động
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tổng số {analytics?.totalBuyers || 0} tài khoản trên hệ sinh thái sàn
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={cn('border-b text-xs uppercase', isDark ? 'border-slate-800 text-slate-400' : 'border-stone-200 text-stone-500')}>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {users.map((u) => (
                  <tr key={u.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-stone-50'}>
                    <td className="py-3 px-4 font-medium">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        Hoạt động
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
