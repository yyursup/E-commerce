import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    HiOutlineCurrencyDollar,
    HiOutlineLockClosed,
    HiOutlineRefresh,
    HiOutlineShieldCheck,
    HiOutlineInformationCircle,
    HiOutlineCreditCard,
    HiOutlineSave,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheckCircle,
    HiOutlineClipboardCopy,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlinePlus,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import BankSelector from '../../components/BankSelector'
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

    const { user } = useAuthStore()
    const storageKey = `buyer_bank_info_${user?.id || user?.accountId || user?.email || 'default'}`

    const [wallet, setWallet] = useState(null)
    const [escrowHeld, setEscrowHeld] = useState(0)   // computed from orders
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    // Bank Account Link State
    const [linkedBank, setLinkedBank] = useState(null)
    const [isEditingBank, setIsEditingBank] = useState(false)
    const [bankName, setBankName] = useState('')
    const [bankData, setBankData] = useState(null)
    const [accountNumber, setAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')
    const [showAccountNumber, setShowAccountNumber] = useState(false)

    // Load saved bank info
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const parsed = JSON.parse(saved)
                setLinkedBank(parsed)
                setBankName(parsed.bankName || '')
                setBankData(parsed.bankData || null)
                setAccountNumber(parsed.accountNumber || '')
                setAccountName(parsed.accountName || '')
                setIsEditingBank(false)
            } else {
                setAccountName((user?.fullName || user?.name || '').toUpperCase())
                setIsEditingBank(false)
            }
        } catch (e) {
            console.error('Lỗi khi tải thông tin ngân hàng đã lưu:', e)
        }
    }, [storageKey, user])

    const handleSaveBank = (e) => {
        if (e) e.preventDefault()
        if (!bankName.trim()) {
            toast.error('Vui lòng chọn ngân hàng!')
            return
        }
        if (!accountNumber.trim() || accountNumber.length < 5) {
            toast.error('Vui lòng nhập số tài khoản hợp lệ!')
            return
        }
        if (!accountName.trim()) {
            toast.error('Vui lòng nhập tên chủ tài khoản!')
            return
        }

        const payload = {
            bankName: bankName.trim(),
            bankData: bankData || (linkedBank?.bankName === bankName ? linkedBank.bankData : null),
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim().toUpperCase(),
            updatedAt: new Date().toISOString(),
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(payload))
            setLinkedBank(payload)
            setIsEditingBank(false)
            toast.success('Liên kết tài khoản ngân hàng thành công!')
        } catch (err) {
            console.error('Lỗi lưu ngân hàng:', err)
            toast.error('Không thể lưu thông tin ngân hàng')
        }
    }

    const handleUnlinkBank = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này?')) {
            try {
                localStorage.removeItem(storageKey)
                setLinkedBank(null)
                setBankName('')
                setBankData(null)
                setAccountNumber('')
                setAccountName((user?.fullName || user?.name || '').toUpperCase())
                setIsEditingBank(false)
                toast.success('Đã hủy liên kết tài khoản ngân hàng')
            } catch (err) {
                console.error('Lỗi khi hủy liên kết ngân hàng:', err)
            }
        }
    }

    const handleCopyAccountNumber = () => {
        if (linkedBank?.accountNumber) {
            navigator.clipboard.writeText(linkedBank.accountNumber)
            toast.success('Đã sao chép số tài khoản!')
        }
    }

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

            {/* Section: Tài Khoản Ngân Hàng Liên Kết */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className={cn(
                    'rounded-2xl border p-6 shadow-sm space-y-4',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <HiOutlineCreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                                Tài Khoản Ngân Hàng Liên Kết
                            </h3>
                            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Dùng để nhận tiền hoàn trả từ khiếu nại hoặc rút tiền từ số dư ví
                            </p>
                        </div>
                    </div>

                    {linkedBank && !isEditingBank && (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                                type="button"
                                onClick={() => setIsEditingBank(true)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer',
                                    isDark
                                        ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                                )}
                            >
                                <HiOutlinePencil className="h-3.5 w-3.5 text-amber-500" />
                                Thay đổi
                            </button>
                            <button
                                type="button"
                                onClick={handleUnlinkBank}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer',
                                    isDark
                                        ? 'border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-900/40'
                                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                )}
                            >
                                <HiOutlineTrash className="h-3.5 w-3.5" />
                                Hủy liên kết
                            </button>
                        </div>
                    )}
                </div>

                {linkedBank && !isEditingBank ? (
                    /* Display Linked Bank Card */
                    <div className={cn(
                        'relative overflow-hidden rounded-2xl p-5 border transition-all',
                        isDark
                            ? 'border-slate-700/80 bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900'
                            : 'border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-stone-50 to-stone-100/50 shadow-xs'
                    )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Bank Logo */}
                                <div className="h-12 w-16 rounded-xl bg-white p-1 flex items-center justify-center border border-stone-200 shadow-xs shrink-0">
                                    {linkedBank.bankData?.logo ? (
                                        <img
                                            src={linkedBank.bankData.logo}
                                            alt={linkedBank.bankName}
                                            className="h-full w-full object-contain"
                                            onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                    ) : (
                                        <HiOutlineCreditCard className="h-7 w-7 text-amber-500" />
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                                            {linkedBank.bankName}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                                            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                                            Đã liên kết
                                        </span>
                                    </div>
                                    <p className={cn('text-xs mt-0.5 font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                        Chủ tài khoản: <span className="font-semibold text-amber-600 dark:text-amber-400 tracking-wide">{linkedBank.accountName}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Account Number with Eye toggle & Copy */}
                            <div className={cn(
                                'flex items-center gap-2 rounded-xl px-4 py-2 border self-start sm:self-center',
                                isDark ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white border-stone-200 text-stone-800'
                            )}>
                                <span className="text-xs font-mono font-bold tracking-wider">
                                    {showAccountNumber
                                        ? linkedBank.accountNumber
                                        : linkedBank.accountNumber.length > 4
                                            ? `•••• •••• •••• ${linkedBank.accountNumber.slice(-4)}`
                                            : linkedBank.accountNumber}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                                    className="p-1 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                                    title={showAccountNumber ? 'Ẩn số tài khoản' : 'Hiện số tài khoản'}
                                >
                                    {showAccountNumber ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyAccountNumber}
                                    className="p-1 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                                    title="Sao chép số tài khoản"
                                >
                                    <HiOutlineClipboardCopy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isEditingBank ? (
                    /* Form State (New or Edit) */
                    <form onSubmit={handleSaveBank} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            {/* Bank Selector using VietQR API */}
                            <div>
                                <label className={cn('block font-semibold mb-1 text-stone-700 dark:text-slate-300')}>
                                    Tên Ngân Hàng <span className="text-red-500">*</span>
                                </label>
                                <BankSelector
                                    value={bankName}
                                    onChange={(val, bankObj) => {
                                        setBankName(val)
                                        if (bankObj) setBankData(bankObj)
                                    }}
                                    isDark={isDark}
                                    placeholder="Chọn hoặc tìm ngân hàng..."
                                />
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className={cn('block font-semibold mb-1 text-stone-700 dark:text-slate-300')}>
                                    Số Tài Khoản <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="VD: 19036888888888"
                                    className={cn(
                                        'w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs',
                                        isDark
                                            ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                                            : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                                    )}
                                />
                            </div>

                            {/* Account Name */}
                            <div>
                                <label className={cn('block font-semibold mb-1 text-stone-700 dark:text-slate-300')}>
                                    Tên Chủ Tài Khoản <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                                    placeholder="VD: NGUYEN VAN A"
                                    className={cn(
                                        'w-full rounded-xl px-4 py-2.5 border uppercase transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs',
                                        isDark
                                            ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                                            : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all cursor-pointer"
                            >
                                <HiOutlineSave className="h-4 w-4" />
                                {linkedBank ? 'Lưu thay đổi' : 'Lưu liên kết ngân hàng'}
                            </button>

                            {linkedBank && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBankName(linkedBank.bankName || '')
                                        setBankData(linkedBank.bankData || null)
                                        setAccountNumber(linkedBank.accountNumber || '')
                                        setAccountName(linkedBank.accountName || '')
                                        setIsEditingBank(false)
                                    }}
                                    className={cn(
                                        'px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer',
                                        isDark
                                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    )}
                                >
                                    Hủy bỏ
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    /* Empty State: Prompt to Link */
                    <div className={cn(
                        'py-8 px-4 text-center border-2 border-dashed rounded-2xl transition-all',
                        isDark ? 'border-slate-800 bg-slate-900/40' : 'border-stone-200 bg-stone-50/50'
                    )}>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
                            <HiOutlineCreditCard className="h-6 w-6" />
                        </div>
                        <p className={cn('text-sm font-bold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                            Chưa có tài khoản ngân hàng nào được liên kết
                        </p>
                        <p className={cn('mt-1 text-xs max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Liên kết ngân hàng giúp việc nhận tiền hoàn trả khi có sự cố đơn hàng hoặc đối soát diễn ra nhanh chóng, tiện lợi.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsEditingBank(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all cursor-pointer"
                        >
                            <HiOutlinePlus className="h-4 w-4" />
                            Liên kết ngân hàng ngay
                        </button>
                    </div>
                )}
            </motion.div>

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
