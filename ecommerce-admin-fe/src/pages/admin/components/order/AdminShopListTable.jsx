import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
  HiOutlineShoppingBag,
  HiOutlineExclamationCircle,
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlineExternalLink,
  HiOutlineCalendar,
  HiOutlineArrowNarrowRight,
  HiOutlineBadgeCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import statisticsService from '../../../../services/statistics'
import Pagination from './Pagination'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatShortCurrency(amount) {
  const val = Number(amount) || 0
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} tr`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return `${val}đ`
}

export default function AdminShopListTable({ isDark }) {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [period, setPeriod] = useState('14d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, WARNED, DEFICIT

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
    fetchShopsPerformance()
  }, [period])

  const fetchShopsPerformance = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { period }
      if (period === 'custom' && startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      }
      if (search.trim()) {
        params.search = search.trim()
      }
      const data = await statisticsService.getAdminShopsPerformance(params)
      setShops(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải danh sách hiệu suất gian hàng:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách gian hàng')
      toast.error('Không thể tải danh sách gian hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCustomDate = () => {
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc')
      return
    }
    fetchShopsPerformance()
  }

  // Filter local for quick status filter
  const filteredShops = shops.filter((s) => {
    if (statusFilter === 'DEFICIT') return s.isDeficit === true
    if (statusFilter === 'ACTIVE') return s.shopStatus === 'ACTIVE'
    if (statusFilter === 'WARNED') return s.shopStatus === 'WARNED' || (s.violationCount && s.violationCount > 0)
    return true
  })

  // Pagination calculation
  const totalItems = filteredShops.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedShops = filteredShops.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Summary Metrics
  const totalShopsCount = shops.length
  const totalGmv = shops.reduce((sum, s) => sum + (Number(s.totalGmv) || 0), 0)
  const totalOrders = shops.reduce((sum, s) => sum + (Number(s.totalOrders) || 0), 0)
  const deficitShopsCount = shops.filter((s) => s.isDeficit).length

  return (
    <div className="space-y-6">
      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng Gian Hàng */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tổng Gian Hàng
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">{totalShopsCount}</h3>
              <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Đang có trên hệ thống
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
              )}
            >
              <HiOutlineOfficeBuilding className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Tổng GMV trong kỳ */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tổng GMV ({period === '7d' ? '7 ngày' : period === '14d' ? '14 ngày' : period === '30d' ? '30 ngày' : 'Tùy chọn'})
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">
                {formatShortCurrency(totalGmv)}
              </h3>
              <p className={cn('mt-1 text-xs truncate max-w-[170px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                {formatCurrency(totalGmv)}
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              )}
            >
              <HiOutlineCash className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Tổng Đơn Hàng trong kỳ */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tổng Đơn Hàng
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">{totalOrders.toLocaleString()}</h3>
              <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Đơn phát sinh trong kỳ
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
              )}
            >
              <HiOutlineShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Cảnh báo ký quỹ */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all shadow-sm',
            deficitShopsCount > 0
              ? isDark
                ? 'border-rose-900/50 bg-rose-950/20 text-rose-300'
                : 'border-rose-200 bg-rose-50 text-rose-800'
              : isDark
                ? 'border-slate-800 bg-slate-900/80 text-white'
                : 'border-stone-200 bg-white text-stone-900'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-wider', deficitShopsCount > 0 ? 'text-rose-500' : isDark ? 'text-slate-400' : 'text-stone-500')}>
                Cảnh Báo Ký Quỹ
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                {deficitShopsCount}{' '}
                <span className="text-sm font-normal">shop thiếu hụt</span>
              </h3>
              <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Cần bù quỹ để duy trì bán hàng
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                deficitShopsCount > 0
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-rose-100 text-rose-600'
                  : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-stone-100 text-stone-600'
              )}
            >
              <HiOutlineExclamationCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-5 transition-all shadow-sm space-y-4',
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Period selector buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-xs font-bold mr-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Thời gian:
            </span>
            {[
              { label: '7 ngày qua', val: '7d' },
              { label: '14 ngày qua', val: '14d' },
              { label: '30 ngày (1 tháng)', val: '30d' },
              { label: 'Tùy chọn', val: 'custom' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setPeriod(p.val)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                  period === p.val
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : isDark
                      ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={fetchShopsPerformance}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 self-start lg:self-auto',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin text-amber-500')} />
            <span>Làm mới số liệu</span>
          </button>
        </div>

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dashed border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                )}
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                )}
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomDate}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              Áp dụng
            </button>
          </div>
        )}

        {/* Search bar & status filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchShopsPerformance()}
              placeholder="Tìm theo tên gian hàng, chủ sở hữu, số điện thoại, email..."
              className={cn(
                'w-full rounded-xl border pl-10 pr-4 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400'
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
              )}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="DEFICIT">⚠️ Thiếu hụt ký quỹ</option>
              <option value="WARNED">Bị cảnh báo</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setCurrentPage(1)
                fetchShopsPerformance()
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition-all shrink-0"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table of Shops */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden transition-all shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
        )}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p className={cn('mt-3 text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang phân tích hiệu suất các gian hàng...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-rose-500">{error}</p>
            <button
              onClick={fetchShopsPerformance}
              className="mt-3 px-4 py-1.5 rounded-xl border border-rose-400 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              Thử lại
            </button>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineOfficeBuilding className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
            <p className={cn('mt-3 text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Không tìm thấy gian hàng nào phù hợp với bộ lọc
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={cn('border-b text-xs font-bold uppercase tracking-wider', isDark ? 'border-slate-800 bg-slate-800/50 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-500')}>
                  <th className="px-5 py-3.5">Gian Hàng</th>
                  <th className="px-5 py-3.5">Chủ Gian Hàng</th>
                  <th className="px-5 py-3.5 text-right">Doanh Số GMV ({period})</th>
                  <th className="px-5 py-3.5 text-center">Đơn Hàng</th>
                  <th className="px-5 py-3.5">Quỹ Bảo Chứng (Ký Quỹ)</th>
                  <th className="px-5 py-3.5 text-right">Ký Quỹ Đơn Đang Giữ</th>
                  <th className="px-5 py-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 text-xs sm:text-sm">
                {paginatedShops.map((shop) => {
                  const stars = Number(shop.trustLevel) || 1
                  return (
                    <tr
                      key={shop.shopId}
                      className={cn(
                        'transition-colors group hover:bg-stone-50/80 dark:hover:bg-slate-800/40',
                        shop.isDeficit && 'bg-rose-50/20 dark:bg-rose-950/10'
                      )}
                    >
                      {/* Cột 1: Thông tin shop */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={shop.logoUrl || '/shop-placeholder.svg'}
                            alt={shop.shopName}
                            className="h-10 w-10 rounded-xl object-cover border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = '/shop-placeholder.svg'
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn('font-bold truncate max-w-[180px]', isDark ? 'text-white' : 'text-stone-900')}>
                                {shop.shopName}
                              </span>
                              {shop.isKycVerified && (
                                <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400">
                                  <HiOutlineBadgeCheck className="h-3 w-3" />
                                  eKYC
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <HiOutlineStar
                                    key={i}
                                    className={cn('h-3.5 w-3.5', i < stars ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-slate-600')}
                                  />
                                ))}
                              </div>
                              <span className={cn('text-[11px] font-medium ml-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Cấp {stars}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Chủ sở hữu */}
                      <td className="px-5 py-4">
                        <div>
                          <p className={cn('font-semibold truncate max-w-[160px]', isDark ? 'text-slate-200' : 'text-stone-800')}>
                            {shop.ownerName || 'Chưa cập nhật'}
                          </p>
                          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            {shop.ownerPhone || 'N/A'}
                          </p>
                          {shop.ownerEmail && (
                            <p className={cn('text-[11px] truncate max-w-[170px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                              {shop.ownerEmail}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Doanh số GMV trong kỳ */}
                      <td className="px-5 py-4 text-right">
                        <div>
                          <p className="font-bold text-emerald-500">
                            {formatCurrency(shop.totalGmv)}
                          </p>
                          <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Thực nhận: {formatShortCurrency(shop.settledNetIncome)}
                          </p>
                          <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                            Hoa hồng: {formatShortCurrency(shop.platformCommission)}
                          </p>
                        </div>
                      </td>

                      {/* Cột 4: Đơn hàng */}
                      <td className="px-5 py-4 text-center">
                        <div>
                          <span className={cn('font-bold px-2 py-0.5 rounded-lg text-xs', isDark ? 'bg-slate-800 text-slate-200' : 'bg-stone-100 text-stone-800')}>
                            {shop.completedOrders} / {shop.totalOrders} đơn
                          </span>
                          <div className="mt-1 flex items-center justify-center gap-2 text-[11px]">
                            {shop.returnedOrders > 0 && (
                              <span className="text-rose-500 font-medium">
                                Hoàn: {shop.returnedOrders} ({shop.returnRate}%)
                              </span>
                            )}
                            {shop.cancelledOrders > 0 && (
                              <span className={cn(isDark ? 'text-slate-500' : 'text-stone-400')}>
                                Hủy: {shop.cancelledOrders}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Quỹ bảo chứng ký quỹ */}
                      <td className="px-5 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {formatShortCurrency(shop.escrowFundBalance)}
                            </span>
                            {shop.isDeficit ? (
                              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                                ⚠️ Thiếu hụt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                                <HiOutlineShieldCheck className="h-3 w-3" />
                                An toàn
                              </span>
                            )}
                          </div>
                          <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Yêu cầu: {formatShortCurrency(shop.requiredEscrowDeposit)}
                          </p>
                          {shop.isDeficit && shop.deficitAmount > 0 && (
                            <p className="text-[11px] text-rose-500 font-medium">
                              Cần bù: {formatShortCurrency(shop.deficitAmount)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 6: Ký quỹ đơn hàng đang giữ */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-amber-500">
                          {formatCurrency(shop.pendingEscrowRevenue)}
                        </span>
                        <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                          Đang chờ tất toán
                        </p>
                      </td>

                      {/* Cột 7: Nút xem chi tiết gian hàng */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/shops/${shop.shopId}`)}
                          className={cn(
                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border',
                            isDark
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          )}
                        >
                          <span>Chi tiết</span>
                          <HiOutlineArrowNarrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && filteredShops.length > 0 && (
          <div className="border-t border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              isDark={isDark}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
