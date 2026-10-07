import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    HiOutlineCurrencyDollar,
    HiOutlineTrendingUp,
    HiOutlineShoppingBag,
    HiOutlineFilter,
    HiOutlineSearch,
    HiOutlineRefresh,
    HiOutlineStar,
    HiOutlineViewGrid,
} from 'react-icons/hi'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import commissionService from '../../../../services/commission'
import HorizontalRankingChart from '../analytics/HorizontalRankingChart'

function formatCurrencyShort(amount) {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
    return String(amount)
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

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

function BarChart({ data, isDark }) {
    if (!data || data.length === 0) return null
    const maxVal = Math.max(...data.map((d) => Number(d.totalCommission || 0)), 1)

    return (
        <div className="flex h-48 items-stretch gap-1.5 overflow-x-auto pb-2">
            {data.map((item, idx) => {
                const height = (Number(item.totalCommission || 0) / maxVal) * 100
                const label = `T${item.month}/${String(item.year).slice(-2)}`
                return (
                    <div key={idx} className="group relative flex h-full min-w-[40px] flex-1 flex-col items-center justify-end gap-2">
                        <div
                            className={cn(
                                'pointer-events-none absolute bottom-full mb-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100',
                                isDark ? 'bg-slate-700 text-white' : 'bg-stone-800 text-white',
                            )}
                        >
                            <div className="font-semibold">{formatCurrency(Number(item.totalCommission || 0))}</div>
                            <div className={cn('mt-0.5 text-[11px]', isDark ? 'text-slate-300' : 'text-stone-200')}>
                                {label}
                            </div>
                        </div>

                        <div className="flex w-full flex-1 items-end">
                            <div
                                title={`${label}: ${formatCurrency(Number(item.totalCommission || 0))}`}
                                className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.18)] transition-all duration-500 group-hover:from-amber-500 group-hover:to-yellow-300"
                                style={{ height: `${Math.max(height, 2)}%` }}
                            />
                        </div>

                        <span className={cn('text-[10px] font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            {label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function MonthlyCommissionSummary({ item, isDark }) {
    const label = `T${item.month}/${String(item.year).slice(-2)}`
    return (
        <div
            className={cn(
                'flex h-48 flex-col justify-between rounded-2xl border p-5',
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-200 bg-stone-50/80',
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Tháng ghi nhận
                    </p>
                    <p className="mt-2 text-2xl font-bold">{label}</p>
                </div>
                <div className={cn('rounded-full px-3 py-1 text-xs font-medium', isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700')}>
                    1 tháng dữ liệu
                </div>
            </div>

            <div>
                <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Tổng hoa hồng
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-500">{formatCurrency(Number(item.totalCommission || 0))}</p>
            </div>
        </div>
    )
}

export default function CommissionAnalyticsTab() {
    const isDark = useThemeStore((s) => s.theme) === 'dark'

    const [overview, setOverview] = useState(null)
    const [byMonth, setByMonth] = useState([])
    const [byCategory, setByCategory] = useState([])
    const [topSellers, setTopSellers] = useState([])
    const [commissions, setCommissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingList, setLoadingList] = useState(false)

    const [filterFrom, setFilterFrom] = useState('')
    const [filterTo, setFilterTo] = useState('')
    const [filterSeller, setFilterSeller] = useState('')
    const [topLimit] = useState(5)

    useEffect(() => {
        fetchStats()
        fetchCommissions()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const [overviewData, byMonthData, byCategoryData, topData] = await Promise.all([
                commissionService.getOverview(),
                commissionService.getByMonth(),
                commissionService.getByCategory(),
                commissionService.getTopSellers(topLimit),
            ])
            setOverview(overviewData)
            setByMonth(byMonthData || [])
            setByCategory(Array.isArray(byCategoryData) ? byCategoryData : [])
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

    const categoryBreakdown = useMemo(() => {
        return [...byCategory].sort(
            (a, b) => Number(b?.totalCommission || 0) - Number(a?.totalCommission || 0),
        )
    }, [byCategory])

    const cards = useMemo(
        () => [
            {
                title: 'Tổng hoa hồng sàn',
                value: formatCurrency(overview?.totalCommission),
                icon: HiOutlineCurrencyDollar,
                color: 'from-amber-500 to-orange-500',
                bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
                iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
            },
            {
                title: 'Tổng đơn hàng phát sinh',
                value: overview?.totalOrders ?? 0,
                icon: HiOutlineShoppingBag,
                color: 'from-blue-500 to-indigo-500',
                bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
            },
            {
                title: 'Tỷ lệ thu sàn trung bình',
                value: overview ? `${Number(overview.averageCommissionRate || 0).toFixed(2)}%` : '—',
                icon: HiOutlineTrendingUp,
                color: 'from-green-500 to-emerald-500',
                bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
                iconColor: isDark ? 'text-green-400' : 'text-green-600',
            },
        ],
        [overview, isDark],
    )

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">Thống kê & Lịch sử Thu Phí Hoa Hồng</h2>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Theo dõi tổng doanh thu phí sàn, biến động theo tháng và chi tiết từng đơn hàng
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchStats()
                        fetchCommissions()
                    }}
                    className={cn(
                        'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
                        isDark
                            ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
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
                                'rounded-2xl border p-5 shadow-sm',
                                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                        {card.title}
                                    </p>
                                    <p className="mt-2 text-2xl font-black">{card.value}</p>
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
                        'rounded-2xl border p-6 shadow-sm',
                        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                    )}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
                            <HiOutlineTrendingUp className={cn('h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold">Hoa hồng theo tháng</h3>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Doanh thu hoa hồng ghi nhận qua các tháng gần nhất
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                        </div>
                    ) : byMonth.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2">
                            <HiOutlineTrendingUp className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Chưa có dữ liệu</p>
                        </div>
                    ) : byMonth.length === 1 ? (
                        <MonthlyCommissionSummary item={byMonth[0]} isDark={isDark} />
                    ) : (
                        <BarChart data={byMonth} isDark={isDark} />
                    )}
                </motion.div>

                {/* Top Sellers */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                    className={cn(
                        'rounded-2xl border p-6 shadow-sm',
                        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                    )}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
                            <HiOutlineStar className={cn('h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold">Top người bán đóng góp</h3>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Top shop đóng góp nhiều hoa hồng nhất cho sàn
                            </p>
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
                                        'flex items-center justify-between rounded-xl px-3.5 py-2.5',
                                        isDark ? 'bg-slate-800/80' : 'bg-stone-50',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
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
                                            <p className="text-sm font-semibold">{seller.shopName || 'Chưa có tên'}</p>
                                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                                {seller.sellerId?.slice(0, 8)}…
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">
                                        {formatCurrency(seller.totalCommission)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Category Share Chart */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className={cn(
                    'rounded-2xl border p-6 shadow-sm',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                )}
            >
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-emerald-500/20' : 'bg-emerald-100')}>
                            <HiOutlineViewGrid className={cn('h-4 w-4', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold">Tỷ trọng hoa hồng theo ngành hàng</h3>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Phân tích category nào đang đóng góp hoa hồng lớn nhất cho nền tảng
                            </p>
                        </div>
                    </div>

                    <div className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600')}>
                        {categoryBreakdown.length} ngành hàng
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto pr-1">
                    <HorizontalRankingChart
                        items={categoryBreakdown}
                        isDark={isDark}
                        accent="emerald"
                        emptyIcon={HiOutlineViewGrid}
                        emptyText="Chưa có dữ liệu theo ngành hàng"
                        getLabel={(category) => category.categoryName || 'Chưa có tên category'}
                        getValue={(category) => category.totalCommission}
                        getMeta={(category, index, share) => `${share.toFixed(1)}% tổng hoa hồng`}
                        valueFormatter={(value) => formatCurrencyShort(value)}
                    />
                </div>
            </motion.div>

            {/* Commission List with Filters */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className={cn(
                    'rounded-2xl border shadow-sm overflow-hidden',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                )}
            >
                <div className={cn('flex items-center justify-between border-b px-6 py-4', isDark ? 'border-slate-800' : 'border-stone-200')}>
                    <div className="flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isDark ? 'bg-green-500/20' : 'bg-green-100')}>
                            <HiOutlineFilter className={cn('h-4 w-4', isDark ? 'text-green-400' : 'text-green-600')} />
                        </div>
                        <h3 className="text-base font-semibold">Danh sách đơn hàng thu phí hoa hồng</h3>
                    </div>
                </div>

                {/* Filters */}
                <form
                    onSubmit={handleFilter}
                    className={cn('flex flex-wrap items-end gap-3 border-b px-6 py-4', isDark ? 'border-slate-800' : 'border-stone-200')}
                >
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={filterFrom}
                            onChange={(e) => setFilterFrom(e.target.value)}
                            className={cn(
                                'rounded-xl border px-3 py-1.5 text-xs outline-none',
                                isDark
                                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                                    : 'border-stone-200 bg-white text-stone-800',
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={filterTo}
                            onChange={(e) => setFilterTo(e.target.value)}
                            className={cn(
                                'rounded-xl border px-3 py-1.5 text-xs outline-none',
                                isDark
                                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                                    : 'border-stone-200 bg-white text-stone-800',
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Tên người bán
                        </label>
                        <div className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs', isDark ? 'border-slate-700 bg-slate-950' : 'border-stone-200 bg-white')}>
                            <HiOutlineSearch className={cn('h-4 w-4 shrink-0', isDark ? 'text-slate-400' : 'text-stone-400')} />
                            <input
                                type="text"
                                value={filterSeller}
                                onChange={(e) => setFilterSeller(e.target.value)}
                                placeholder="Nhập tên shop..."
                                className="bg-transparent outline-none placeholder-stone-400 text-xs w-36"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition shadow-sm"
                    >
                        Lọc
                    </button>
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className={cn(
                            'rounded-xl px-4 py-2 text-xs font-semibold transition',
                            isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
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
                        <table className="w-full text-left text-sm">
                            <thead className={cn('text-xs uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
                                <tr>
                                    {['Mã đơn hàng', 'Người bán', 'Giá trị đơn', 'Hoa hồng thực thu', 'Tỷ lệ áp dụng', 'Thời điểm quyết toán'].map((col) => (
                                        <th key={col} className="px-5 py-3.5 font-bold">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {commissions.map((c, i) => (
                                    <tr
                                        key={c.id || i}
                                        className={cn(
                                            'transition-colors',
                                            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50',
                                        )}
                                    >
                                        <td className="px-5 py-3">
                                            <span className={cn('font-mono text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                                {String(c.orderId || '').slice(0, 8)}…
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="font-semibold">{c.sellerName || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3 font-medium">
                                            {formatCurrency(c.orderAmount)}
                                        </td>
                                        <td className="px-5 py-3 font-bold text-amber-500">
                                            {formatCurrency(c.commissionAmount ?? c.totalCommission)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border',
                                                    isDark
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-blue-100 text-blue-700 border-blue-200',
                                                )}
                                            >
                                                {c.commissionRate != null ? `${Number(c.commissionRate)}%` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')} title={c.createdAt}>
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
