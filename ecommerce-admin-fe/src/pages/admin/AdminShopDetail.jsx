import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineBadgeCheck,
  HiOutlineCash,
  HiOutlineShoppingBag,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlinePencilAlt,
  HiOutlineMinusCircle,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineIdentification,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import shopService from '../../services/shop'
import orderService from '../../services/order'
import trustConfigService from '../../services/trustConfig'
import statisticsService from '../../services/statistics'
import { ADMIN_ORDER_STATUSES } from './components/order/orderHelpers'
import AdminOrderListCard from './components/order/AdminOrderListCard'
import AdjustFundModal from './components/escrow-fund/modals/AdjustFundModal'
import DeductCompensationModal from './components/escrow-fund/modals/DeductCompensationModal'
import FundLedgerModal from './components/escrow-fund/modals/FundLedgerModal'

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

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminShopDetail() {
  const { shopId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  // State
  const [shop, setShop] = useState(null)
  const [fund, setFund] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sub-tabs: 'orders', 'escrow', 'analytics'
  const [activeTab, setActiveTab] = useState('orders')

  // Orders tab filters
  const [orderStatus, setOrderStatus] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Analytics tab period
  const [period, setPeriod] = useState('14d')

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showDeductModal, setShowDeductModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !shopId) return
    loadShopFullData()
  }, [isAuthenticated, shopId, period])

  useEffect(() => {
    if (!isAuthenticated || !shopId) return
    loadShopOrders()
  }, [isAuthenticated, shopId, orderStatus])

  const loadShopFullData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Parallel fetch: shop profile, escrow fund, analytics
      const [shopData, fundData, analyticsData] = await Promise.all([
        shopService.getRawShopById ? shopService.getRawShopById(shopId) : shopService.getShopById(shopId),
        trustConfigService.getFundByShopId(shopId).catch(() => null),
        statisticsService.getAdminShopAnalytics(shopId, { period }).catch(() => null),
      ])

      setShop(shopData)
      setFund(fundData)
      setAnalytics(analyticsData)
    } catch (err) {
      console.error('Lỗi tải chi tiết gian hàng:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin gian hàng')
      toast.error('Không thể tải thông tin gian hàng')
    } finally {
      setLoading(false)
    }
  }

  const loadShopOrders = async () => {
    try {
      setLoadingOrders(true)
      const data = await orderService.getAllOrders(orderStatus || null, shopId)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải đơn hàng của shop:', err)
      toast.error('Không thể tải danh sách đơn hàng của gian hàng')
    } finally {
      setLoadingOrders(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Vui lòng đăng nhập để xem thông tin gian hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        <p className={cn('mt-4 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang tải dữ liệu toàn diện gian hàng...
        </p>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className={cn('min-h-screen p-8 text-center', isDark ? 'bg-slate-950 text-white' : 'bg-stone-50 text-stone-900')}>
        <div className="mx-auto max-w-md py-16">
          <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-bold">Không tìm thấy gian hàng</h2>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            {error || 'Gian hàng không tồn tại hoặc đã bị gỡ bỏ.'}
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-sm"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản lý Gian hàng & Đơn hàng</span>
          </Link>
        </div>
      </div>
    )
  }

  const stars = Number(shop.trustLevel) || 1
  const isDeficit = fund?.isDeficit === true

  // Normalized shop object for modals
  const shopModalPayload = {
    shopId: shop.id,
    shopName: shop.name,
    committedAmount: fund?.committedAmount || 0,
    balance: fund?.balance || 0,
    currentTrustLevel: fund?.currentTrustLevel || shop.trustLevel || 1,
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản lý Gian hàng & Đơn hàng</span>
          </Link>

          <button
            type="button"
            onClick={loadShopFullData}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className="h-4 w-4 text-amber-500" />
            <span>Tải lại</span>
          </button>
        </div>

        {/* 1. Header Card: Shop Overview & Action Buttons */}
        <div
          className={cn(
            'rounded-2xl border p-6 transition-all shadow-sm space-y-6',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Shop Brand Info */}
            <div className="flex items-center gap-4">
              <img
                src={shop.logoUrl || '/shop-placeholder.svg'}
                alt={shop.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 shrink-0 shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = '/shop-placeholder.svg'
                }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
                    {shop.name}
                  </h1>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      shop.status === 'ACTIVE'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : shop.status === 'WARNED'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                    )}
                  >
                    {shop.status === 'ACTIVE' ? 'Đang hoạt động' : shop.status === 'WARNED' ? 'Bị cảnh báo' : 'Tạm khóa'}
                  </span>
                  {shop.sellerType && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      {shop.sellerType === 'BUSINESS' ? 'Doanh nghiệp / Mall' : 'Cá nhân'}
                    </span>
                  )}
                  {analytics?.isKycVerified && (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <HiOutlineBadgeCheck className="h-4 w-4" />
                      eKYC Đã Xác Thực
                    </span>
                  )}
                </div>

                {/* Stars and Rating */}
                <div className="flex items-center gap-3 text-xs pt-1">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <HiOutlineStar
                        key={i}
                        className={cn('h-4 w-4', i < stars ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-slate-600')}
                      />
                    ))}
                    <span className="font-bold ml-1.5 text-stone-700 dark:text-slate-200">
                      Bậc {stars} Sao
                    </span>
                  </div>
                  <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                    Ngày tham gia: {formatDate(shop.createdAt)}
                  </span>
                  <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                    Vi phạm: <strong className={shop.violationCount > 0 ? 'text-rose-500' : 'text-emerald-500'}>{shop.violationCount || 0}</strong> lần
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Admin */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAdjustModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                )}
              >
                <HiOutlinePencilAlt className="h-4 w-4 text-amber-500" />
                <span>Điều chỉnh Quỹ & Bậc Sao</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeductModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    : 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                )}
              >
                <HiOutlineMinusCircle className="h-4 w-4 text-rose-500" />
                <span>Trích Đền Bù Khiếu Nại</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLedgerModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                <HiOutlineClipboardList className="h-4 w-4 text-blue-500" />
                <span>Sổ Cái Biến Động</span>
              </button>
            </div>
          </div>

          {/* Detailed Merchant Information Grid */}
          <div
            className={cn(
              'grid grid-cols-1 gap-3 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-4 text-xs border',
              isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-stone-100 bg-stone-50/80'
            )}
          >
            {/* Chủ sở hữu */}
            <div className="space-y-1">
              <span className={cn('font-semibold uppercase tracking-wider text-[10px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Chủ sở hữu & Liên hệ
              </span>
              <p className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-stone-900')}>
                {shop.businessName || shop.name}
              </p>
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300">
                <HiOutlinePhone className="h-3.5 w-3.5 text-stone-400" />
                <span>{shop.phoneNumber || 'Chưa có SĐT'}</span>
              </div>
              {shop.invoiceEmail && (
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300 truncate">
                  <HiOutlineMail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{shop.invoiceEmail}</span>
                </div>
              )}
            </div>

            {/* Kho lấy hàng & trả hàng GHN */}
            <div className="space-y-1">
              <span className={cn('font-semibold uppercase tracking-wider text-[10px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Kho Hàng & Địa Chỉ GHN
              </span>
              <div className="flex items-start gap-1.5 text-stone-600 dark:text-slate-300">
                <HiOutlineLocationMarker className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{shop.pickupAddress || shop.address || 'Chưa cập nhật'}</span>
              </div>
              <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                Mã quận/huyện GHN: {shop.districtId || 'N/A'} | Mã phường: {shop.wardCode || 'N/A'}
              </p>
            </div>

            {/* Tài khoản ngân hàng thụ hưởng */}
            <div className="space-y-1">
              <span className={cn('font-semibold uppercase tracking-wider text-[10px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Thụ Hưởng Quyết Toán
              </span>
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-slate-200">
                <HiOutlineCreditCard className="h-3.5 w-3.5 text-blue-500" />
                <span>{shop.bankName || 'Chưa có ngân hàng'}</span>
              </div>
              <p className="font-mono text-xs text-stone-600 dark:text-slate-300">
                STK: {shop.bankAccountNumber || 'N/A'}
              </p>
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Chủ TK: {shop.bankAccountName || 'N/A'}
              </p>
            </div>

            {/* Pháp lý & Thuế */}
            <div className="space-y-1">
              <span className={cn('font-semibold uppercase tracking-wider text-[10px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Pháp Lý & Định Danh
              </span>
              <div className="flex items-center gap-1.5 text-stone-700 dark:text-slate-300">
                <HiOutlineIdentification className="h-3.5 w-3.5 text-emerald-500" />
                <span>Mã số thuế: <strong>{shop.taxCode || 'N/A'}</strong></span>
              </div>
              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Mô hình: {shop.businessType || 'Hộ kinh doanh / Bán lẻ'}
              </p>
              {shop.businessLicenseUrl && (
                <a
                  href={shop.businessLicenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-500 hover:underline font-semibold"
                >
                  <span>Xem GPKD / Giấy tờ</span>
                  <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 2. Top Financial Performance KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Quỹ bảo chứng Shop */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDeficit
                ? isDark
                  ? 'border-rose-900/50 bg-rose-950/20'
                  : 'border-rose-200 bg-rose-50'
                : isDark
                  ? 'border-slate-800 bg-slate-900/80'
                  : 'border-stone-200 bg-white'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDeficit ? 'text-rose-500' : isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Quỹ Bảo Chứng (Ký Quỹ)
                </p>
                <h3 className={cn('mt-2 text-2xl font-black', isDeficit ? 'text-rose-500' : 'text-emerald-500')}>
                  {formatShortCurrency(fund?.balance)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Yêu cầu: {formatShortCurrency(fund?.committedAmount)} ({isDeficit ? '⚠️ Thiếu hụt' : '✓ Đủ cọc'})
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDeficit
                    ? 'bg-rose-500/20 text-rose-400'
                    : isDark
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-600'
                )}
              >
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* KPI 2: Ký quỹ đơn hàng đang giữ */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Ký Quỹ Đơn Đang Giữ
                </p>
                <h3 className="mt-2 text-2xl font-black text-amber-500">
                  {formatShortCurrency(analytics?.pendingEscrowRevenue)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Chờ khách xác nhận/hết khiếu nại
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                )}
              >
                <HiOutlineCash className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* KPI 3: Doanh số GMV trong kỳ */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Doanh Số GMV ({period})
                </p>
                <h3 className="mt-2 text-2xl font-black text-blue-500">
                  {formatShortCurrency(analytics?.totalRevenue)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Tăng trưởng: <strong>{analytics?.revenueGrowthRate || 0}%</strong>
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                )}
              >
                <HiOutlineTrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* KPI 4: Doanh thu thực nhận & hoa hồng */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Thực Nhận & Hoa Hồng
                </p>
                <h3 className="mt-2 text-2xl font-black text-purple-500">
                  {formatShortCurrency(analytics?.settledNetIncome)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Hoa hồng sàn: {formatShortCurrency(analytics?.totalCommissionPaid)}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                )}
              >
                <HiOutlineShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sub-tabs Switcher: Đơn hàng | Ký Quỹ & Sổ Cái | Hiệu Suất */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
          {[
            { id: 'orders', label: 'Đơn Hàng Của Gian Hàng', icon: HiOutlineShoppingBag, count: orders.length },
            { id: 'escrow', label: 'Giám Sát Ký Quỹ & Sổ Cái', icon: HiOutlineShieldCheck },
            { id: 'analytics', label: 'Hiệu Suất & Phân Tích', icon: HiOutlineTrendingUp },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border',
                  active
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                      active ? 'bg-amber-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 4. Tab Contents */}

        {/* TAB 1: ĐƠN HÀNG CỦA GIAN HÀNG */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border',
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn('text-xs font-bold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Trạng thái đơn:
                </span>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                  )}
                >
                  {ADMIN_ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={loadShopOrders}
                disabled={loadingOrders}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                )}
              >
                <HiOutlineRefresh className={cn('h-4 w-4', loadingOrders && 'animate-spin text-amber-500')} />
                <span>Làm mới đơn</span>
              </button>
            </div>

            {/* Orders list */}
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                <p className={cn('mt-3 text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Đang tải danh sách đơn hàng của gian hàng...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div
                className={cn(
                  'rounded-2xl border p-12 text-center',
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
                )}
              >
                <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
                <p className={cn('mt-3 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Gian hàng chưa có đơn hàng nào theo bộ lọc này
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <AdminOrderListCard key={order.id} order={order} isDark={isDark} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GIÁM SÁT KÝ QUỸ & SỔ CÁI */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            <div
              className={cn(
                'rounded-2xl border p-6 space-y-6 shadow-sm',
                isDark ? 'border-slate-800 bg-slate-900/70' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-slate-800 pb-5">
                <div>
                  <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    Quản Lý Quỹ Bảo Chứng Gian Hàng (Shop Escrow Fund)
                  </h3>
                  <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Duy trì mức ký quỹ theo bậc sao uy tín để đảm bảo quyền lợi khách hàng và xử lý bồi thường.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Điều chỉnh quỹ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLedgerModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                  >
                    Mở sổ cái toàn màn hình
                  </button>
                </div>
              </div>

              {/* Fund Details Card */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px] font-semibold uppercase', isDark ? 'text-slate-400' : 'text-stone-500')}>Số dư thực tế</span>
                  <p className="text-xl font-bold text-emerald-500 mt-1">{formatCurrency(fund?.balance)}</p>
                  <span className="text-[10px] text-stone-400">Đang được sàn bảo chứng</span>
                </div>

                <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px] font-semibold uppercase', isDark ? 'text-slate-400' : 'text-stone-500')}>Hạn mức cam kết</span>
                  <p className="text-xl font-bold text-stone-800 dark:text-slate-200 mt-1">{formatCurrency(fund?.committedAmount)}</p>
                  <span className="text-[10px] text-stone-400">Theo Bậc {fund?.currentTrustLevel || 1} Sao</span>
                </div>

                <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px] font-semibold uppercase', isDark ? 'text-slate-400' : 'text-stone-500')}>Trạng thái quỹ</span>
                  <div className="mt-1">
                    {fund?.isDeficit ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        ⚠️ Thiếu hụt ({formatCurrency(fund?.deficitAmount)})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        ✓ An toàn (Đủ hạn mức)
                      </span>
                    )}
                  </div>
                  {fund?.deficitDeadline && (
                    <span className="text-[10px] text-rose-400 block mt-1">
                      Hạn bù tiền: {formatDate(fund.deficitDeadline)}
                    </span>
                  )}
                </div>

                <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px] font-semibold uppercase', isDark ? 'text-slate-400' : 'text-stone-500')}>Trạng thái bán hàng</span>
                  <p className="text-sm font-bold text-amber-500 mt-1">
                    {fund?.status === 'ACTIVE' ? 'Cho phép bán hàng' : fund?.status || 'Bình thường'}
                  </p>
                  <span className="text-[10px] text-stone-400">Cập nhật: {formatDate(fund?.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HIỆU SUẤT & PHÂN TÍCH */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Period selector */}
            <div
              className={cn(
                'flex items-center justify-between p-4 rounded-2xl border',
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Kỳ phân tích:
                </span>
                {['7d', '14d', '30d'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs font-semibold border transition-all',
                      period === p
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                    )}
                  >
                    {p === '7d' ? '7 ngày qua' : p === '14d' ? '14 ngày qua' : '30 ngày (1 tháng)'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-stone-500 dark:text-slate-400">
                Từ <strong>{analytics?.startDate}</strong> đến <strong>{analytics?.endDate}</strong>
              </div>
            </div>

            {/* Performance KPIs Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Tỷ lệ hoàn tất đơn</span>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{analytics?.fulfillmentRate || 0}%</p>
                <span className="text-[11px] text-stone-400">{analytics?.completedOrders || 0} / {analytics?.totalOrders || 0} đơn</span>
              </div>

              <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Tỷ lệ hoàn trả / hủy</span>
                <p className="text-2xl font-bold text-rose-500 mt-1">{analytics?.returnRate || 0}%</p>
                <span className="text-[11px] text-stone-400">{analytics?.returnedOrders || 0} đơn hoàn trả</span>
              </div>

              <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Giá trị đơn TB (AOV)</span>
                <p className="text-2xl font-bold text-blue-500 mt-1">{formatShortCurrency(analytics?.averageOrderValue)}</p>
                <span className="text-[11px] text-stone-400">Trên mỗi đơn thành công</span>
              </div>

              <div className={cn('p-4 rounded-xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold">Lũy kế toàn thời gian</span>
                <p className="text-2xl font-bold text-purple-500 mt-1">{formatShortCurrency(analytics?.allTimeRevenue)}</p>
                <span className="text-[11px] text-stone-400">Tổng doanh số lịch sử</span>
              </div>
            </div>

            {/* Daily Sales Points Table */}
            {analytics?.salesTimeline && analytics.salesTimeline.length > 0 && (
              <div
                className={cn(
                  'rounded-2xl border p-5 space-y-4 shadow-sm',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
              >
                <h4 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-stone-900')}>
                  Biến Động Doanh Số Theo Ngày ({period})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className={cn('border-b font-bold uppercase', isDark ? 'border-slate-800 text-slate-400' : 'border-stone-200 text-stone-500')}>
                        <th className="py-2 px-3">Ngày</th>
                        <th className="py-2 px-3 text-right">Doanh Số</th>
                        <th className="py-2 px-3 text-center">Số Đơn Hàng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                      {analytics.salesTimeline.map((item) => (
                        <tr key={item.date} className="hover:bg-stone-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono">{formatDate(item.date)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-500">{formatCurrency(item.revenue)}</td>
                          <td className="py-2 px-3 text-center font-semibold">{item.orderCount} đơn</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAdjustModal && (
        <AdjustFundModal
          shop={shopModalPayload}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={() => {
            loadShopFullData()
            toast.success('Đã cập nhật quỹ ký quỹ thành công!')
          }}
          formatVND={formatCurrency}
        />
      )}

      {showDeductModal && fund && (
        <DeductCompensationModal
          fund={{ ...fund, shopName: shop.name }}
          onClose={() => setShowDeductModal(false)}
          onSuccess={() => {
            loadShopFullData()
            toast.success('Đã trích đền bù thành công!')
          }}
          formatVND={formatCurrency}
        />
      )}

      {showLedgerModal && fund && (
        <FundLedgerModal
          fund={fund}
          onClose={() => setShowLedgerModal(false)}
          formatVND={formatCurrency}
          formatDateTime={formatDate}
        />
      )}
    </div>
  )
}
