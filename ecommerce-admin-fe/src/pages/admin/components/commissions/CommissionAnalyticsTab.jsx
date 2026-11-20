import { useState, useEffect, useMemo } from 'react'
import { HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import commissionService from '../../../../services/commission'
import HorizontalRankingChart from '../analytics/HorizontalRankingChart'

function formatCurrencyShort(amount) {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
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

function Panel({ isDark, className, children }) {
    return (
        <div className={cn('rounded-md border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white', className)}>
            {children}
        </div>
    )
}

function PanelHeader({ title, description, aside, isDark }) {
    return (
        <div className="flex items-start justify-between gap-4 px-5 pt-4">
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                {description && (
                    <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>{description}</p>
                )}
            </div>
            {aside}
        </div>
    )
}

function EmptyState({ text, isDark, height = 'h-48' }) {
    return (
        <div className={cn('flex items-center justify-center text-sm', height, isDark ? 'text-slate-500' : 'text-stone-400')}>
            {text}
        </div>
    )
}

function BarChart({ data, isDark }) {
    if (!data || data.length === 0) return null
    const maxVal = Math.max(...data.map((d) => Number(d.totalCommission || 0)), 1)

    return (
        <div className="flex h-48 items-stretch gap-2 overflow-x-auto">
            {data.map((item, idx) => {
                const commVal = Number(item.totalCommission || 0)
                const height = (commVal / maxVal) * 100
                const label = `T${item.month}/${String(item.year).slice(-2)}`
                return (
                    <div key={idx} className="group relative flex h-full min-w-[40px] flex-1 flex-col items-center justify-end gap-2">
                        <div
                            className={cn(
                                'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100',
                                isDark ? 'bg-slate-700 text-white' : 'bg-stone-900 text-white',
                            )}
                        >
                            {label}: <span className="font-mono tabular-nums">{formatCurrency(commVal)}</span>
                        </div>

                        <div className="flex w-full flex-1 items-end">
                            <div
                                title={`${label}: ${formatCurrency(commVal)}`}
                                className="w-full rounded-t-sm bg-stone-800 transition-colors group-hover:bg-amber-500 dark:bg-slate-300 dark:group-hover:bg-amber-400"
                                style={{ height: `${commVal > 0 ? Math.max(height, 2) : 0}%` }}
                            />
                        </div>

                        <span className={cn('font-mono text-[10px]', isDark ? 'text-slate-400' : 'text-stone-500')}>{label}</span>
                    </div>
                )
            })}
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
        return [...byCategory].sort((a, b) => Number(b?.totalCommission || 0) - Number(a?.totalCommission || 0))
    }, [byCategory])

    const kpis = [
        { title: 'Tổng hoa hồng sàn', value: formatCurrency(overview?.totalCommission) },
        { title: 'Đơn hàng phát sinh hoa hồng', value: String(overview?.totalOrders ?? 0) },
        {
            title: 'Tỷ lệ thu trung bình',
            value: overview ? `${Number(overview.averageCommissionRate || 0).toFixed(2)}%` : '—',
        },
    ]

    const muted = isDark ? 'text-slate-400' : 'text-stone-500'
    const divider = isDark ? 'divide-slate-800 border-slate-800' : 'divide-stone-200 border-stone-200'
    const fieldCls = cn(
        'rounded-md border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-stone-950/20 dark:focus:ring-white/30',
        isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-300 bg-white text-stone-800',
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold">Thống kê & lịch sử thu phí</h2>
                    <p className={cn('mt-0.5 text-sm', muted)}>
                        Doanh thu hoa hồng của sàn, biến động theo tháng và chi tiết từng đơn hàng.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchStats()
                        fetchCommissions()
                    }}
                    className={cn(
                        'inline-flex items-center gap-2 self-start rounded-md border px-3 py-1.5 text-xs font-semibold transition sm:self-auto',
                        isDark
                            ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
                    )}
                >
                    <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
                    Làm mới
                </button>
            </div>

            {/* KPI: một khối, ba chỉ số */}
            <Panel isDark={isDark}>
                <dl className={cn('grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0', divider)}>
                    {kpis.map((kpi) => (
                        <div key={kpi.title} className="px-5 py-4">
                            <dt className={cn('font-mono text-[11px] font-semibold uppercase tracking-wider', muted)}>{kpi.title}</dt>
                            <dd className="mt-1.5 font-mono text-2xl font-bold tabular-nums">{loading ? '—' : kpi.value}</dd>
                        </div>
                    ))}
                </dl>
            </Panel>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel isDark={isDark} className="pb-5">
                    <PanelHeader isDark={isDark} title="Hoa hồng theo tháng" description="Hoa hồng ghi nhận qua các tháng gần nhất" />
                    <div className="mt-4 px-5">
                        {loading ? (
                            <EmptyState isDark={isDark} text="Đang tải..." />
                        ) : byMonth.length === 0 ? (
                            <EmptyState isDark={isDark} text="Chưa có dữ liệu" />
                        ) : (
                            <BarChart data={byMonth} isDark={isDark} />
                        )}
                    </div>
                </Panel>

                <Panel isDark={isDark} className="pb-2">
                    <PanelHeader isDark={isDark} title="Top người bán đóng góp" description="Các shop đóng góp nhiều hoa hồng nhất cho sàn" />
                    <div className="mt-3">
                        {loading ? (
                            <EmptyState isDark={isDark} text="Đang tải..." />
                        ) : topSellers.length === 0 ? (
                            <EmptyState isDark={isDark} text="Chưa có dữ liệu" />
                        ) : (
                            <ol className={cn('max-h-56 divide-y overflow-y-auto border-t', divider)}>
                                {topSellers.map((seller, idx) => (
                                    <li key={seller.sellerId || idx} className="flex items-center justify-between gap-4 px-5 py-2.5">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className={cn('w-4 font-mono text-xs tabular-nums', muted)}>{idx + 1}</span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{seller.shopName || 'Chưa có tên'}</p>
                                                <p className={cn('font-mono text-[11px]', muted)}>{seller.sellerId?.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                                            {formatCurrency(seller.totalCommission)}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </Panel>
            </div>

            <Panel isDark={isDark} className="pb-5">
                <PanelHeader
                    isDark={isDark}
                    title="Tỷ trọng hoa hồng theo ngành hàng"
                    description="Ngành hàng nào đóng góp nhiều hoa hồng nhất cho nền tảng"
                    aside={<span className={cn('shrink-0 text-xs', muted)}>{categoryBreakdown.length} ngành hàng</span>}
                />
                <div className="mt-4 max-h-80 overflow-y-auto px-5">
                    <HorizontalRankingChart
                        items={categoryBreakdown}
                        isDark={isDark}
                        accent="amber"
                        emptyText="Chưa có dữ liệu theo ngành hàng"
                        getLabel={(category) => category.categoryName || 'Chưa có tên ngành hàng'}
                        getValue={(category) => category.totalCommission}
                        getMeta={(category, index, share) => `${share.toFixed(1)}% tổng hoa hồng`}
                        valueFormatter={(value) => formatCurrencyShort(value)}
                    />
                </div>
            </Panel>

            <Panel isDark={isDark} className="overflow-hidden">
                <PanelHeader isDark={isDark} title="Đơn hàng đã thu hoa hồng" />

                <form onSubmit={handleFilter} className={cn('flex flex-wrap items-end gap-3 border-b px-5 pb-4 pt-3', divider)}>
                    <label className="flex flex-col gap-1">
                        <span className={cn('text-xs font-medium', muted)}>Từ ngày</span>
                        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className={fieldCls} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={cn('text-xs font-medium', muted)}>Đến ngày</span>
                        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className={fieldCls} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={cn('text-xs font-medium', muted)}>Tên người bán</span>
                        <span className="relative">
                            <HiOutlineSearch className={cn('pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2', muted)} />
                            <input
                                type="text"
                                value={filterSeller}
                                onChange={(e) => setFilterSeller(e.target.value)}
                                placeholder="Nhập tên shop"
                                className={cn(fieldCls, 'w-44 pl-8')}
                            />
                        </span>
                    </label>
                    <button
                        type="submit"
                        className="rounded-md bg-stone-950 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                    >
                        Lọc
                    </button>
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100',
                        )}
                    >
                        Xóa lọc
                    </button>
                </form>

                <div className="overflow-x-auto">
                    {loadingList ? (
                        <EmptyState isDark={isDark} height="h-40" text="Đang tải..." />
                    ) : commissions.length === 0 ? (
                        <EmptyState isDark={isDark} height="h-40" text="Không có dữ liệu" />
                    ) : (
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead
                                className={cn(
                                    'border-b font-mono text-[11px] uppercase tracking-wider',
                                    isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-500',
                                )}
                            >
                                <tr>
                                    <th className="px-5 py-2.5 font-semibold">Mã đơn</th>
                                    <th className="px-5 py-2.5 font-semibold">Người bán</th>
                                    <th className="px-5 py-2.5 text-right font-semibold">Giá trị đơn</th>
                                    <th className="px-5 py-2.5 text-right font-semibold">Hoa hồng</th>
                                    <th className="px-5 py-2.5 text-right font-semibold">Tỷ lệ</th>
                                    <th className="px-5 py-2.5 font-semibold">Quyết toán lúc</th>
                                </tr>
                            </thead>
                            <tbody className={cn('divide-y', divider)}>
                                {commissions.map((c, i) => (
                                    <tr key={c.id || i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'}>
                                        <td className={cn('px-5 py-3 font-mono text-xs', muted)}>{String(c.orderId || '').slice(0, 8)}</td>
                                        <td className="px-5 py-3 font-medium">{c.sellerName || '—'}</td>
                                        <td className="px-5 py-3 text-right font-mono tabular-nums">{formatCurrency(c.orderAmount)}</td>
                                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">
                                            {formatCurrency(c.commissionAmount ?? c.totalCommission)}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono tabular-nums">
                                            {c.commissionRate != null ? `${Number(c.commissionRate)}%` : '—'}
                                        </td>
                                        <td className={cn('px-5 py-3 text-xs', muted)} title={c.createdAt}>
                                            {formatDateTime(c.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Panel>
        </div>
    )
}
