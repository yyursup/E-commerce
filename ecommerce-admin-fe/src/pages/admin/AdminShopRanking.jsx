import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineTrendingUp,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import orderService from '../../services/order'
import HorizontalRankingChart from './components/analytics/HorizontalRankingChart'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatCurrencyShort(amount) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return String(Math.round(amount || 0))
}

export default function AdminShopRanking() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchShopRanking()
  }, [])

  const fetchShopRanking = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await orderService.getShopRanking()
      const normalized = Array.isArray(data)
        ? [...data].sort((a, b) => Number(a?.rank || 0) - Number(b?.rank || 0))
        : []
      setRanking(normalized)
    } catch (err) {
      console.error('Error fetching shop ranking:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải bảng xếp hạng shop')
      toast.error('Không thể tải bảng xếp hạng shop')
    } finally {
      setLoading(false)
    }
  }

  const leader = ranking[0] || null
  const totalRevenue = ranking.reduce((sum, shop) => sum + (Number(shop?.totalRevenue) || 0), 0)
  const totalOrders = ranking.reduce((sum, shop) => sum + (Number(shop?.orderCount) || 0), 0)
  const topThree = ranking.slice(0, 3)

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Xếp hạng shop
            </h1>
            <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Theo dõi doanh thu từ đơn đã giao để nhìn nhanh shop nào đang dẫn đầu hệ thống.
            </p>
          </div>

          <button
            onClick={fetchShopRanking}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100',
            )}
          >
            <HiOutlineRefresh className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l opacity-60',
              isDark ? 'from-amber-500/10 to-transparent' : 'from-amber-100 to-transparent',
            )}
          />

          {loading ? (
            <div className="flex h-44 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
              <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>{error}</p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl xl:self-center">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                    isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700',
                  )}
                >
                  Top performer
                </span>
                <h2 className="mt-4 text-2xl font-bold">
                  {leader?.shopName || 'Chưa có shop đủ dữ liệu để xếp hạng'}
                </h2>
                <p className={cn('mt-2 max-w-xl text-sm leading-6', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Bảng xếp hạng lấy từ doanh thu của các đơn,
                  giúp admin theo dõi shop dẫn đầu và mức độ tập trung doanh thu theo thời gian thực.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                {[
                  {
                    title: 'Doanh thu shop dẫn đầu',
                    value: formatCurrency(leader?.totalRevenue),
                    icon: HiOutlineTrendingUp,
                    tone: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700',
                  },
                  {
                    title: 'Tổng shop trong bảng',
                    value: ranking.length,
                    icon: HiOutlineChartBar,
                    tone: isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700',
                  },
                  {
                    title: 'Tổng doanh thu tracked',
                    value: formatCurrency(totalRevenue),
                    icon: HiOutlineCurrencyDollar,
                    tone: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
                  },
                  {
                    title: 'Tổng đơn delivered',
                    value: totalOrders,
                    icon: HiOutlineShoppingBag,
                    tone: isDark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-700',
                  },
                ].map((metric) => (
                  <div
                    key={metric.title}
                    className={cn(
                      'rounded-xl border p-4',
                      isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-200 bg-stone-50/80',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>
                          {metric.title}
                        </p>
                        <p className="mt-2 text-lg font-bold">{metric.value}</p>
                      </div>
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', metric.tone)}>
                        <metric.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={cn(
                'rounded-2xl border p-6 shadow-sm xl:col-span-2',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isDark ? 'bg-amber-500/15' : 'bg-amber-100')}>
                    <HiOutlineChartBar className={cn('h-5 w-5', isDark ? 'text-amber-300' : 'text-amber-700')} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Biểu đồ doanh thu theo shop</h2>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      So sánh tương quan doanh thu giữa các shop đã có đơn thành công.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[32rem] overflow-y-auto pr-1">
                <HorizontalRankingChart
                  items={ranking}
                  isDark={isDark}
                  accent="amber"
                  emptyIcon={HiOutlineChartBar}
                  emptyText="Chưa có dữ liệu xếp hạng shop"
                  getLabel={(shop) => shop.shopName || 'Chưa có tên shop'}
                  getValue={(shop) => shop.totalRevenue}
                  getMeta={(shop) => `${Number(shop?.orderCount || 0)} đơn hàng đã giao`}
                  valueFormatter={(value) => formatCurrencyShort(value)}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className={cn(
                'rounded-2xl border p-6 shadow-sm',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
              )}
            >
              <div className="mb-4 flex items-center gap-2">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isDark ? 'bg-purple-500/15' : 'bg-purple-100')}>
                  <HiOutlineStar className={cn('h-5 w-5', isDark ? 'text-purple-300' : 'text-purple-700')} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Top 3 nổi bật</h2>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Nhìn nhanh các shop đang chiếm tỷ trọng doanh thu lớn nhất.
                  </p>
                </div>
              </div>

              {topThree.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center gap-3">
                  <HiOutlineStar className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                  <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topThree.map((shop, index) => (
                    <div
                      key={shop.shopId || index}
                      className={cn(
                        'rounded-xl border p-4',
                        isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-200 bg-stone-50/80',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                                index === 0
                                  ? 'bg-amber-500 text-white'
                                  : index === 1
                                    ? 'bg-slate-400 text-white'
                                    : 'bg-orange-500 text-white',
                              )}
                            >
                              #{shop.rank || index + 1}
                            </span>
                            <p className="truncate text-sm font-semibold">{shop.shopName || 'Chưa có tên shop'}</p>
                          </div>
                          <p className={cn('mt-2 text-xs leading-5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            {Number(shop?.orderCount || 0)} đơn giao thành công
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-500">{formatCurrencyShort(Number(shop?.totalRevenue || 0))}</p>
                          <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            {formatCurrency(Number(shop?.totalRevenue || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className={cn(
              'overflow-hidden rounded-2xl border shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className={cn('flex items-center justify-between border-b px-6 py-4', isDark ? 'border-slate-800' : 'border-stone-200')}>
              <div>
                <h2 className="text-base font-semibold">Bảng dữ liệu chi tiết</h2>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Dùng khi admin cần so sánh số đơn và doanh thu tuyệt đối giữa các shop.
                </p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium', isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600')}>
                {ranking.length} shop
              </span>
            </div>

            <div className="overflow-x-auto">
              {ranking.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3">
                  <HiOutlineShoppingBag className={cn('h-10 w-10', isDark ? 'text-slate-600' : 'text-stone-300')} />
                  <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-stone-400')}>Chưa có dữ liệu xếp hạng</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b text-left', isDark ? 'border-slate-800' : 'border-stone-200')}>
                      {['Hạng', 'Shop', 'Doanh thu', 'Đơn delivered'].map((col) => (
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
                    {ranking.map((shop) => (
                      <tr
                        key={shop.shopId || shop.rank}
                        className={cn(
                          'border-b transition-colors',
                          isDark ? 'border-slate-800 hover:bg-slate-800/60' : 'border-stone-100 hover:bg-stone-50',
                        )}
                      >
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                              Number(shop?.rank) === 1
                                ? 'bg-amber-500 text-white'
                                : Number(shop?.rank) === 2
                                  ? 'bg-slate-400 text-white'
                                  : Number(shop?.rank) === 3
                                    ? 'bg-orange-500 text-white'
                                    : isDark
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'bg-stone-100 text-stone-600',
                            )}
                          >
                            #{shop.rank}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold">{shop.shopName || 'Chưa có tên shop'}</p>
                            <p className={cn('mt-1 font-mono text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                              {shop.shopId}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-amber-500">
                            {formatCurrency(Number(shop?.totalRevenue || 0))}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm">{Number(shop?.orderCount || 0)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
