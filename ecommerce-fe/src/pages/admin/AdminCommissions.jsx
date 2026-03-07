import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    HiOutlineCurrencyDollar,
    HiOutlineChartBar,
    HiOutlineTrendingUp,
    HiOutlineShoppingBag,
    HiOutlineFilter,
    HiOutlineSearch,
    HiOutlineRefresh,
    HiOutlineStar,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import commissionService from '../../services/commission'

// --- Simple Bar Chart Component (no external lib needed) ---
function BarChart({ data, isDark }) {
    if (!data || data.length === 0) return null

    const maxVal = Math.max(...data.map((d) => Number(d.totalCommission || 0)), 1)

    return (
        <div className="flex h-48 items-end gap-1.5 overflow-x-auto pb-2">
            {data.map((item, idx) => {
                const height = (Number(item.totalCommission || 0) / maxVal) * 100
                const label = `T${item.month}/${String(item.year).slice(-2)}`
                return (
                    <div key={idx} className="group relative flex flex-1 min-w-[32px] flex-col items-center justify-end gap-1">
                        {/* Tooltip */}
                        <div
                            className={cn(
                                'pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10',
                                isDark ? 'bg-slate-700 text-white' : 'bg-stone-800 text-white',
                            )}
                        >
                            {formatCurrencyShort(Number(item.totalCommission || 0))}
                        </div>
                        {/* Bar */}
                        <div
                            className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
                            style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span
                            className={cn('text-[10px] font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}
                        >
                            {label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function formatCurrencyShort(amount) {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
    return String(amount)
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr))
}

/** Ngày + giờ (danh sách hoa hồng sắp theo mới nhất trước, có cả giờ) */
function formatDateTime(dateStr) {
    if (!dateStr) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateStr))
}

// --- Status Badge ---
function StatusBadge({ status }) {
    const map = {
        PENDING: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
        COMPLETED: { label: 'Hoàn tất', cls: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
        CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
    }
    const { label, cls } = map[status] || { label: status, cls: 'bg-stone-100 text-stone-600' }
    return (
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', cls)}>
            {label}
        </span>
    )
}

// ============================================================
export default function AdminCommissions() {
    const isDark = useThemeStore((s) => s.theme) === 'dark'

    // --- State ---
    const [overview, setOverview] = useState(null)
    const [byMonth, setByMonth] = useState([])
    const [topSellers, setTopSellers] = useState([])
    const [commissions, setCommissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingList, setLoadingList] = useState(false)

    // Filter state
    const [filterFrom, setFilterFrom] = useState('')
    const [filterTo, setFilterTo] = useState('')
    const [filterSeller, setFilterSeller] = useState('')
    const [topLimit, setTopLimit] = useState(5)

    // --- Fetch overview + chart + top sellers on mount ---
    useEffect(() => {
        fetchStats()
    }, [])

    // --- Fetch commission list on mount ---
    useEffect(() => {
        fetchCommissions()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const [overviewData, byMonthData, topData] = await Promise.all([
                commissionService.getOverview(),
                commissionService.getByMonth(),
                commissionService.getTopSellers(topLimit),
            ])
            setOverview(overviewData)
            setByMonth(byMonthData || [])
            setTopSellers(topData || [])
        } catch (err) {
            console.error(err)
            toast.error('Không thể tải dữ liệu thống kê hoa hồng')
        } finally {
            setLoading(false)
        }
    }

    const fetchCommissions = async (filter = {}) => {
        setLoadingList(true)
        try {
            const data = await commissionService.getCommissions(filter)
            setCommissions(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error(err)
            toast.error('Không thể tải danh sách hoa hồng')
        } finally {
            setLoadingList(false)
        }
    }

    const handleFilter = (e) => {
        e.preventDefault()
        fetchCommissions({
            from: filterFrom || undefined,
            to: filterTo || undefined,
            sellerName: filterSeller || undefined,
        })
    }

    const handleResetFilter = () => {
        setFilterFrom('')
        setFilterTo('')
        setFilterSeller('')
        fetchCommissions()
    }

    const handleRefreshTopSellers = async () => {
        try {
            const data = await commissionService.getTopSellers(topLimit)
            setTopSellers(data || [])
        } catch {
            toast.error('Không thể tải top người bán')
        }
    }

    // --- Overview cards config ---
    const cards = useMemo(
        () => [
            {
                title: 'Tổng hoa hồng',
                value: formatCurrency(overview?.totalCommission),
                icon: HiOutlineCurrencyDollar,
                color: 'from-amber-500 to-orange-500',
                bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
                iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
            },
            {
                title: 'Tổng đơn hàng',
                value: overview?.totalOrders ?? 0,
                icon: HiOutlineShoppingBag,
                color: 'from-blue-500 to-indigo-500',
                bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
            },
            {
                title: 'Tỷ lệ trung bình',
                value: overview ? `${Number(overview.averageCommissionRate || 0).toFixed(2)}%` : '—',
                icon: HiOutlineTrendingUp,
                color: 'from-green-500 to-emerald-500',
                bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
                iconColor: isDark ? 'text-green-400' : 'text-green-600',
            },
        ],
        [overview, isDark],
    )

    // ---- UI ----
    return (
        <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Thống kê hoa hồng</h1>
                    <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Tổng quan doanh thu hoa hồng nền tảng
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className={cn(
                        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                        isDark
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50',
                    )}
                >
                    <HiOutlineRefresh className="h-4 w-4" />
                    Làm mới
                </button>
            </div>

            {/* Overview Cards */}
            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                'rounded-xl border p-5 shadow-sm',
                                isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                        {card.title}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">{card.value}</p>
                                </div>
                                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', card.bg)}>
                                    <card.icon className={cn('h-5 w-5', card.iconColor)} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Monthly Chart + Top Sellers Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Monthly Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        'rounded-xl border p-6 shadow-sm',
                        isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
                    )}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
                            <HiOutlineChartBar className={cn('h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                        </div>
                        <h2 className="text-base font-semibold">Hoa hồng theo tháng</h2>
                    </div>
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                        </div>
                    ) : byMonth.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2">
                            <HiOutlineChartBar className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <BarChart data={byMonth} isDark={isDark} />
                    )}
                </motion.div>

                {/* Top Sellers */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className={cn(
                        'rounded-xl border p-6 shadow-sm',
                        isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
                    )}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-purple-500/20' : 'bg-purple-100')}>
                                <HiOutlineStar className={cn('h-4 w-4', isDark ? 'text-purple-400' : 'text-purple-600')} />
                            </div>
                            <h2 className="text-base font-semibold">Top người bán</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={topLimit}
                                onChange={(e) => setTopLimit(Number(e.target.value))}
                                className={cn(
                                    'rounded-lg border px-2 py-1 text-xs',
                                    isDark
                                        ? 'border-slate-600 bg-slate-800 text-slate-200'
                                        : 'border-stone-200 bg-white text-stone-700',
                                )}
                            >
                                {[5, 10, 20].map((n) => (
                                    <option key={n} value={n}>Top {n}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleRefreshTopSellers}
                                className={cn(
                                    'rounded-lg p-1.5 transition-colors',
                                    isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-stone-100 hover:bg-stone-200',
                                )}
                            >
                                <HiOutlineRefresh className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                        </div>
                    ) : topSellers.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2">
                            <HiOutlineStar className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="space-y-2 overflow-y-auto max-h-56">
                            {topSellers.map((seller, idx) => (
                                <div
                                    key={seller.sellerId || idx}
                                    className={cn(
                                        'flex items-center justify-between rounded-lg px-3 py-2.5',
                                        isDark ? 'bg-slate-800' : 'bg-stone-50',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Rank badge */}
                                        <span
                                            className={cn(
                                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                                idx === 0
                                                    ? 'bg-amber-400 text-white'
                                                    : idx === 1
                                                        ? 'bg-slate-400 text-white'
                                                        : idx === 2
                                                            ? 'bg-orange-400 text-white'
                                                            : isDark
                                                                ? 'bg-slate-700 text-slate-300'
                                                                : 'bg-stone-200 text-stone-600',
                                            )}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{seller.shopName || 'Chưa có tên'}</p>
                                            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                                                {seller.sellerId?.slice(0, 8)}…
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-amber-500">
                                        {formatCurrency(seller.totalCommission)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Commission List with Filters */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className={cn(
                    'rounded-xl border shadow-sm',
                    isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
                )}
            >
                {/* Header */}
                <div className={cn('flex items-center justify-between border-b px-6 py-4', isDark ? 'border-slate-700' : 'border-stone-200')}>
                    <div className="flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-green-500/20' : 'bg-green-100')}>
                            <HiOutlineFilter className={cn('h-4 w-4', isDark ? 'text-green-400' : 'text-green-600')} />
                        </div>
                        <h2 className="text-base font-semibold">Danh sách hoa hồng</h2>
                    </div>
                </div>

                {/* Filters */}
                <form
                    onSubmit={handleFilter}
                    className={cn('flex flex-wrap items-end gap-3 border-b px-6 py-4', isDark ? 'border-slate-700' : 'border-stone-200')}
                >
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={filterFrom}
                            onChange={(e) => setFilterFrom(e.target.value)}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-sm',
                                isDark
                                    ? 'border-slate-600 bg-slate-800 text-slate-100'
                                    : 'border-stone-200 bg-white text-stone-800',
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={filterTo}
                            onChange={(e) => setFilterTo(e.target.value)}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-sm',
                                isDark
                                    ? 'border-slate-600 bg-slate-800 text-slate-100'
                                    : 'border-stone-200 bg-white text-stone-800',
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Tên người bán
                        </label>
                        <div className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm', isDark ? 'border-slate-600 bg-slate-800' : 'border-stone-200 bg-white')}>
                            <HiOutlineSearch className={cn('h-4 w-4 shrink-0', isDark ? 'text-slate-400' : 'text-stone-400')} />
                            <input
                                type="text"
                                value={filterSeller}
                                onChange={(e) => setFilterSeller(e.target.value)}
                                placeholder="Nhập tên shop..."
                                className="bg-transparent outline-none placeholder-stone-400 text-sm w-40"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                        Lọc
                    </button>
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                            isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                        )}
                    >
                        Xóa lọc
                    </button>
                </form>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loadingList ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2">
                            <HiOutlineCurrencyDollar className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Không có dữ liệu</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className={cn('border-b text-left', isDark ? 'border-slate-700' : 'border-stone-200')}>
                                    {['Order ID', 'Người bán', 'Giá trị đơn', 'Hoa hồng', 'Tỷ lệ', 'Ngày giờ tạo'].map((col) => (
                                        <th
                                            key={col}
                                            className={cn(
                                                'px-5 py-3 text-xs font-semibold uppercase tracking-wider',
                                                isDark ? 'text-slate-400' : 'text-stone-500',
                                            )}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map((c, i) => (
                                    <tr
                                        key={c.id || i}
                                        className={cn(
                                            'border-b transition-colors',
                                            isDark ? 'border-slate-800 hover:bg-slate-800/60' : 'border-stone-100 hover:bg-stone-50',
                                        )}
                                    >
                                        <td className="px-5 py-3">
                                            <span className={cn('font-mono text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                                {String(c.orderId || '').slice(0, 8)}…
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-sm font-medium">{c.sellerName || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-sm">{formatCurrency(c.orderAmount)}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-sm font-semibold text-amber-500">
                                                {formatCurrency(c.commissionAmount ?? c.totalCommission)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                                    isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
                                                )}
                                            >
                                                {c.commissionRate != null ? `${Number(c.commissionRate)}%` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')} title={c.createdAt}>
                                                {formatDateTime(c.createdAt)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
