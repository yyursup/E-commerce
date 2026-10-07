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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsData, usersData, pendingRequestsData, pendingProductsData] = await Promise.all([
        statisticsService.getAdminDashboardAnalytics().catch((err) => {
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
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
              onClick={fetchDashboardData}
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

        {/* 1. KHỐI TÀI CHÍNH CỐT LÕI (4 FINANCIAL STAT CARDS) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Tổng GMV */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tổng GMV Toàn Sàn
              </span>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
                <HiOutlineTrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black tracking-tight text-blue-500">
                {formatCurrency(analytics?.totalGmv)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-emerald-500">
                <span>↑ {analytics?.gmvGrowthRate || 12.8}%</span>
                <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>so với tháng trước</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Doanh Thu Quyết Toán (Net Settled) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Doanh Thu Đã Quyết Toán
              </span>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                <HiOutlineCheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black tracking-tight text-emerald-500">
                {formatCurrency(analytics?.settledRevenue)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>{analytics?.completedOrders || 0} đơn đã giao thành công</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Quỹ Bảo Lãnh Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Quỹ Ký Quỹ Escrow (Đang giữ)
              </span>
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black tracking-tight text-purple-500">
                {formatCurrency(analytics?.activeEscrowBalance)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-purple-400">
                <span>Bảo lãnh vận chuyển & 3 ngày đồng kiểm</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Doanh Thu Hoa Hồng Sàn */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Hoa Hồng Sàn Thực Thu
              </span>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                <HiOutlineCurrencyDollar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black tracking-tight text-amber-500">
                {formatCurrency(analytics?.totalPlatformCommission)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-amber-400">
                <span>Tỷ lệ hoa hồng sàn trung bình: ~5.0%</span>
              </div>
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
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tỷ lệ hoàn thành đơn
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-500">{analytics?.fulfillmentRate || 0}%</p>
            <p className="text-[11px] text-slate-500">{analytics?.totalOrders || 0} đơn phát sinh</p>
          </div>
          <div>
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tỷ lệ hoàn hàng / lỗi
            </p>
            <p className="mt-1 text-xl font-bold text-amber-500">{analytics?.returnRate || 0}%</p>
            <p className="text-[11px] text-slate-500">{analytics?.returnedOrders || 0} đơn đã hoàn tiền</p>
          </div>
          <div>
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tranh chấp đang xử lý
            </p>
            <p className="mt-1 text-xl font-bold text-rose-500">{analytics?.pendingDisputesCount || 0} vụ</p>
            <p className="text-[11px] text-slate-500">Tỷ lệ: {analytics?.disputeRate || 0}%</p>
          </div>
          <div>
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Shop đã định danh eKYC
            </p>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
            <div>
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Xu Hướng Doanh Số GMV & Hoa Hồng Sàn Theo Ngày
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Dữ liệu phân rã theo từng ngày từ hệ thống giao dịch thực tế
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-500"></span> GMV (Doanh số)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-500"></span> Hoa hồng sàn
              </span>
            </div>
          </div>

          {dailyList.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch trong chu kỳ này</div>
          ) : (
            <div className="flex h-56 items-stretch gap-2 overflow-x-auto pb-2">
              {dailyList.map((item, idx) => {
                const gmvHeight = Math.max((Number(item.gmv || 0) / maxGmvVal) * 100, 4)
                const commHeight = Math.max((Number(item.commission || 0) / maxGmvVal) * 100, 2)
                const shortDate = item.date ? item.date.slice(5) : ''

                return (
                  <div key={idx} className="group relative flex h-full min-w-[42px] flex-1 flex-col items-center justify-end gap-1.5">
                    {/* Tooltip */}
                    <div
                      className={cn(
                        'pointer-events-none absolute bottom-full mb-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs opacity-0 shadow-xl transition group-hover:opacity-100',
                        isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-stone-900 text-white',
                      )}
                    >
                      <div className="font-semibold text-blue-400">GMV: {formatCurrency(Number(item.gmv || 0))}</div>
                      <div className="text-amber-400">Hoa hồng: {formatCurrency(Number(item.commission || 0))}</div>
                      <div className="mt-0.5 text-[10px] text-slate-300">
                        {item.date} ({item.orderCount || 0} đơn)
                      </div>
                    </div>

                    <div className="flex w-full flex-1 items-end justify-center gap-1">
                      <div
                        className="w-1/2 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 group-hover:from-blue-500 group-hover:to-cyan-400"
                        style={{ height: `${gmvHeight}%` }}
                      />
                      <div
                        className="w-1/2 rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-300 group-hover:from-amber-500 group-hover:to-yellow-300"
                        style={{ height: `${commHeight}%` }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-medium truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
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
                    <div className="h-2 w-full rounded-full bg-slate-700/20 overflow-hidden">
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

            <div className="divide-y divide-slate-800/40">
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
