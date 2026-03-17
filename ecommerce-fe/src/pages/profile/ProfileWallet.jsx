import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    HiOutlineCurrencyDollar,
    HiOutlineLockClosed,
    HiOutlineRefresh,
    HiOutlineShieldCheck,
    HiOutlineInformationCircle,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import walletService from '../../services/wallet'
import orderService from '../../services/order'
import toast from 'react-hot-toast'

// Buyer money is locked in system escrow wallet during these statuses
const ESCROW_HELD_STATUSES = new Set(['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED'])

const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

export default function ProfileWallet({ isDark: isDarkProp }) {
    const storeTheme = useThemeStore((s) => s.theme)
    const isDark = isDarkProp !== undefined ? isDarkProp : storeTheme === 'dark'

    const [wallet, setWallet] = useState(null)
    const [escrowHeld, setEscrowHeld] = useState(0)   // computed from orders
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)
            setError(null)

            // Fetch wallet + all orders in parallel
            const [walletData, ordersData] = await Promise.all([
                walletService.getMyWallet(),
                orderService.getMyOrders(null),  // all orders, no filter
            ])

            setWallet(walletData)

            // Compute total money held in escrow = sum of order.total for HELD statuses
            // Note: buyer wallet.lockedBalance is always 0 because escrow funds
            // move to the SYSTEM escrow wallet, not buyer's personal wallet
            const orders = Array.isArray(ordersData) ? ordersData : []
            const held = orders
                .filter(o => ESCROW_HELD_STATUSES.has(o.status))
                .reduce((sum, o) => sum + (o.total || 0), 0)
            setEscrowHeld(held)

        } catch (err) {
            console.error('Wallet fetch error:', err)
            setError(err?.message || 'Không thể tải thông tin ví')
            toast.error('Không thể tải thông tin ví')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
                <button
                    onClick={() => fetchData()}
                    className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    const available = wallet?.availableBalance || 0
    // Total visible to user = available (wallet) + escrowHeld (from orders)
    const total = available + escrowHeld

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                        Ví của tôi
                    </h2>
                    <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Theo dõi số dư và trạng thái thanh toán
                    </p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                        refreshing && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <HiOutlineRefresh className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    Làm mới
                </button>
            </div>

            {/* Total Balance Banner */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg shadow-amber-500/20"
            >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
                <div className="relative">
                    <p className="text-sm font-medium text-amber-100">Tổng tài sản</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(total)}</p>
                    <p className="mt-3 text-xs text-amber-200">
                        Khả dụng + Đang trong escrow &bull; Đơn vị: {wallet?.currency || 'VND'}
                    </p>
                </div>
            </motion.div>

            {/* Balance Breakdown */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Available */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        'rounded-xl border p-5',
                        isDark
                            ? 'border-emerald-800/30 bg-emerald-900/20'
                            : 'border-emerald-100 bg-emerald-50'
                    )}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-emerald-500/10">
                            <HiOutlineCurrencyDollar className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className={cn('text-sm font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                            Số dư khả dụng
                        </span>
                    </div>
                    <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                        {formatCurrency(available)}
                    </p>
                    <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Số dư trong ví, có thể dùng cho các giao dịch tiếp theo.
                    </p>
                </motion.div>

                {/* Escrow Held (computed from orders) */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={cn(
                        'rounded-xl border p-5',
                        isDark
                            ? 'border-amber-800/30 bg-amber-900/20'
                            : 'border-amber-100 bg-amber-50'
                    )}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-amber-500/10">
                            <HiOutlineLockClosed className="h-5 w-5 text-amber-500" />
                        </div>
                        <span className={cn('text-sm font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                            Đang trong Escrow
                        </span>
                    </div>
                    <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                        {formatCurrency(escrowHeld)}
                    </p>
                    <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Tổng tiền của các đơn hàng đang được xử lý, chờ bạn xác nhận nhận hàng.
                    </p>
                </motion.div>
            </div>

            {/* How Escrow Works */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                    'rounded-xl border p-5',
                    isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-stone-50'
                )}
            >
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineShieldCheck className="h-5 w-5 text-amber-500" />
                    <h3 className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-stone-900')}>
                        Hệ thống Escrow hoạt động như thế nào?
                    </h3>
                </div>
                <ol className="space-y-3">
                    {[
                        {
                            step: '1',
                            title: 'Bạn thanh toán đơn hàng',
                            desc: 'Tiền của bạn được chuyển vào hệ thống escrow an toàn, không phải trực tiếp cho người bán.',
                        },
                        {
                            step: '2',
                            title: 'Đơn hàng được giao',
                            desc: 'Người bán giao hàng. Tiền vẫn đang được giữ an toàn trong escrow.',
                        },
                        {
                            step: '3',
                            title: 'Bạn xác nhận nhận hàng',
                            desc: 'Sau khi nhấn "Đã nhận được hàng", tiền sẽ được giải phóng cho người bán. Nếu không xác nhận sau 3 ngày, hệ thống sẽ tự động giải phóng.',
                        },
                    ].map((item) => (
                        <li key={item.step} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                                {item.step}
                            </span>
                            <div>
                                <p className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}>
                                    {item.title}
                                </p>
                                <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                    {item.desc}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
                <div className={cn('mt-4 flex items-start gap-2 rounded-lg p-3 text-xs', isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-stone-100 text-stone-500')}>
                    <HiOutlineInformationCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>Hệ thống escrow bảo vệ quyền lợi của cả người mua và người bán. Tiền chỉ được giải phóng khi cả hai bên hoàn tất giao dịch.</span>
                </div>
            </motion.div>
        </div>
    )
}
