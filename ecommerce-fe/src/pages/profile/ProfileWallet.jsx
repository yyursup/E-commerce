import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    HiOutlineCash,
    HiOutlineClock,
    HiOutlineXCircle,
    HiOutlineBan,
    HiOutlineX,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import BankSelector from '../../components/BankSelector'
import authService from '../../services/auth'
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
    const [escrowHeld, setEscrowHeld] = useState(0)
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

    // Withdrawal State
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawNote, setWithdrawNote] = useState('')
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false)

    // Withdrawals History State
    const [withdrawals, setWithdrawals] = useState([])
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
    const [withdrawalPage, setWithdrawalPage] = useState(0)
    const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(0)
    const [cancellingId, setCancellingId] = useState(null)

    // Load saved bank info (User entity backend + localStorage cache)
    useEffect(() => {
        try {
            if (user?.bankAccountNumber && user?.bankName) {
                const info = {
                    bankName: user.bankName,
                    accountNumber: user.bankAccountNumber,
                    accountName: (user.bankAccountName || user?.fullName || user?.name || '').toUpperCase(),
                    bankData: null,
                }
                setLinkedBank(info)
                setBankName(info.bankName)
                setAccountNumber(info.accountNumber)
                setAccountName(info.accountName)
                setIsEditingBank(false)
                return
            }

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

                // Fetch latest profile from DB to restore bank link if available
                authService.getUserProfile().then((profile) => {
                    if (profile?.bankName && profile?.bankAccountNumber) {
                        const info = {
                            bankName: profile.bankName,
                            accountNumber: profile.bankAccountNumber,
                            accountName: (profile.bankAccountName || profile.fullName || '').toUpperCase(),
                            bankData: null,
                        }
                        setLinkedBank(info)
                        setBankName(info.bankName)
                        setAccountNumber(info.accountNumber)
                        setAccountName(info.accountName)
                        useAuthStore.getState().updateUser({
                            bankName: profile.bankName,
                            bankAccountNumber: profile.bankAccountNumber,
                            bankAccountName: profile.bankAccountName,
                        })
                    }
                }).catch(() => {})
            }
        } catch (e) {
            console.error('Lỗi khi tải thông tin ngân hàng đã lưu:', e)
        }
    }, [storageKey, user])

    const handleSaveBank = async (e) => {
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
            // Save to backend database
            await walletService.updateBankInfo({
                bankName: payload.bankName,
                bankAccountNumber: payload.accountNumber,
                bankAccountName: payload.accountName,
            })

            // Cache to local storage
            localStorage.setItem(storageKey, JSON.stringify(payload))
            setLinkedBank(payload)
            setIsEditingBank(false)
            toast.success('Cập nhật tài khoản ngân hàng thành công!')
        } catch (err) {
            console.error('Lỗi lưu ngân hàng:', err)
            toast.error(err?.message || 'Không thể lưu thông tin ngân hàng')
        }
    }

    const handleUnlinkBank = async () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này?')) {
            try {
                await walletService.updateBankInfo({
                    bankName: '',
                    bankAccountNumber: '',
                    bankAccountName: '',
                })
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
                toast.error('Lỗi khi hủy liên kết ngân hàng')
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

            const [walletData, ordersData] = await Promise.all([
                walletService.getMyWallet(),
                orderService.getMyOrders(null),
            ])

            setWallet(walletData)

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

    const fetchWithdrawals = async (page = 0) => {
        try {
            setLoadingWithdrawals(true)
            const res = await walletService.getMyWithdrawals({ page, size: 5 })
            setWithdrawals(Array.isArray(res?.content) ? res.content : [])
            setWithdrawalTotalPages(res?.totalPages || 0)
            setWithdrawalPage(page)
        } catch (err) {
            console.error('Lỗi khi tải lịch sử rút tiền:', err)
        } finally {
            setLoadingWithdrawals(false)
        }
    }

    useEffect(() => {
        fetchData()
        fetchWithdrawals()
    }, [])

    const handleRequestWithdrawal = async (e) => {
        if (e) e.preventDefault()
        const num = Number(withdrawAmount)
        if (!num || isNaN(num) || num < 100000) {
            toast.error('Số tiền rút tối thiểu là 100.000 VNĐ!')
            return
        }
        const available = wallet?.availableBalance || 0
        if (num > available) {
            toast.error('Số tiền rút vượt quá số dư khả dụng!')
            return
        }
        if (!linkedBank || !linkedBank.bankName || !linkedBank.accountNumber) {
            toast.error('Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền!')
            return
        }

        try {
            setSubmittingWithdraw(true)
            await walletService.requestWithdrawal({
                amount: num,
                note: withdrawNote.trim() || undefined,
            })
            toast.success('Tạo yêu cầu rút tiền thành công! Vui lòng kiểm tra email xác nhận.')
            setIsWithdrawModalOpen(false)
            setWithdrawAmount('')
            setWithdrawNote('')
            await Promise.all([fetchData(true), fetchWithdrawals(0)])
        } catch (err) {
            console.error('Lỗi yêu cầu rút tiền:', err)
            toast.error(err?.message || 'Không thể tạo yêu cầu rút tiền')
        } finally {
            setSubmittingWithdraw(false)
        }
    }

    const handleCancelWithdrawal = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu rút tiền này? Số tiền sẽ được hoàn trả lại số dư khả dụng ngay lập tức.')) {
            return
        }
        try {
            setCancellingId(id)
            await walletService.cancelWithdrawal(id)
            toast.success('Đã hủy yêu cầu rút tiền thành công!')
            await Promise.all([fetchData(true), fetchWithdrawals(withdrawalPage)])
        } catch (err) {
            console.error('Lỗi khi hủy rút tiền:', err)
            toast.error(err?.message || 'Không thể hủy yêu cầu rút tiền')
        } finally {
            setCancellingId(null)
        }
    }

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
                    className="mt-4 rounded-lg px-4 py-2 text-sm font-medium bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    const available = wallet?.availableBalance || 0
    const total = available + escrowHeld

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={cn('text-3xl font-bold tracking-[-0.03em]', isDark ? 'text-white' : 'text-stone-900')}>
                        Ví của tôi
                    </h2>
                    <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Theo dõi số dư và trạng thái thanh toán
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchData(true)
                        fetchWithdrawals(withdrawalPage)
                    }}
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
                className="relative overflow-hidden rounded-2xl p-6 bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
            >
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
                        'rounded-lg border p-5',
                        isDark
                            ? 'border-slate-800 bg-slate-900'
                            : 'border-stone-200 bg-white'
                    )}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-md bg-stone-100 dark:bg-slate-800">
                            <HiOutlineCurrencyDollar className="h-5 w-5 text-stone-950 dark:text-white" />
                        </div>
                        <span className={cn('font-mono text-xs uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-600')}>
                            Số dư khả dụng
                        </span>
                    </div>
                    <p className={cn('font-mono text-3xl font-semibold', isDark ? 'text-white' : 'text-stone-950')}>
                        {formatCurrency(available)}
                    </p>
                    <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Số dư trong ví, có thể rút về tài khoản ngân hàng hoặc thanh toán đơn hàng.
                    </p>
                </motion.div>

                {/* Escrow Held (computed from orders) */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={cn(
                        'rounded-lg border p-5',
                        isDark
                            ? 'border-slate-800 bg-slate-900'
                            : 'border-stone-200 bg-white'
                    )}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-md bg-amber-500">
                            <HiOutlineLockClosed className="h-5 w-5 text-stone-950" />
                        </div>
                        <span className={cn('font-mono text-xs uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-600')}>
                            Đang trong Escrow
                        </span>
                    </div>
                    <p className={cn('font-mono text-3xl font-semibold', isDark ? 'text-white' : 'text-stone-950')}>
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
                    'rounded-2xl border p-6 space-y-4',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-stone-100 text-stone-950">
                            <HiOutlineCreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                                Tài khoản ngân hàng liên kết
                            </h3>
                            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Dùng để nhận tiền hoàn trả từ khiếu nại hoặc rút tiền từ số dư ví về tài khoản
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
                                <div className="h-12 w-16 rounded-xl bg-white p-1 flex items-center justify-center border border-stone-200 shrink-0">
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

                        {/* Rút tiền Action Bar */}
                        <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                                <HiOutlineInformationCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>Rút tiền khả dụng ({formatCurrency(available)}) về ngân hàng này. Tối thiểu 100.000 VNĐ.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setWithdrawAmount('')
                                    setWithdrawNote('')
                                    setIsWithdrawModalOpen(true)
                                }}
                                disabled={available < 100000}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm shrink-0',
                                    available >= 100000
                                        ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold active:scale-95 cursor-pointer'
                                        : 'bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                                )}
                                title={available < 100000 ? 'Số dư khả dụng tối thiểu để rút là 100.000 VNĐ' : 'Rút tiền về ngân hàng'}
                            >
                                <HiOutlineCash className="h-4 w-4" />
                                Rút tiền về ngân hàng
                            </button>
                        </div>
                    </div>
                ) : isEditingBank ? (
                    /* Form State (New or Edit) */
                    <form onSubmit={handleSaveBank} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
                                        'w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none text-xs',
                                        isDark
                                            ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                                            : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                                    )}
                                />
                            </div>

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
                                        'w-full rounded-xl px-4 py-2.5 border uppercase transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none text-xs',
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
                                className="flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all cursor-pointer bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
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
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-3 bg-stone-100 text-stone-950">
                            <HiOutlineCreditCard className="h-6 w-6" />
                        </div>
                        <p className={cn('text-sm font-bold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                            Chưa có tài khoản ngân hàng nào được liên kết
                        </p>
                        <p className={cn('mt-1 text-xs max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            Liên kết ngân hàng giúp việc nhận tiền hoàn trả khi có sự cố đơn hàng hoặc rút tiền số dư ví diễn ra nhanh chóng, tiện lợi.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsEditingBank(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                        >
                            <HiOutlinePlus className="h-4 w-4" />
                            Liên kết ngân hàng ngay
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Section: Lịch Sử Yêu Cầu Rút Tiền */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className={cn(
                    'rounded-2xl border p-6 space-y-4',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <HiOutlineCash className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                                Lịch sử yêu cầu rút tiền
                            </h3>
                            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Theo dõi trạng thái giải ngân tiền về tài khoản ngân hàng của bạn
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchWithdrawals(withdrawalPage)}
                        disabled={loadingWithdrawals}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer self-start sm:self-center',
                            isDark
                                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                        )}
                    >
                        <HiOutlineRefresh className={cn('h-3.5 w-3.5', loadingWithdrawals && 'animate-spin')} />
                        Làm mới
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className={cn('uppercase font-semibold', isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-stone-50 text-stone-600')}>
                            <tr>
                                <th className="px-4 py-3 rounded-l-xl">Mã GD</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3">Số tiền</th>
                                <th className="px-4 py-3">Tài khoản nhận</th>
                                <th className="px-4 py-3">Ghi chú</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3 text-right rounded-r-xl">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                            {loadingWithdrawals ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-stone-400">
                                        <HiOutlineRefresh className="mx-auto h-5 w-5 animate-spin text-amber-500 mb-1" />
                                        Đang tải lịch sử rút tiền...
                                    </td>
                                </tr>
                            ) : withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-stone-400">
                                        Chưa có yêu cầu rút tiền nào.
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3.5 font-mono font-medium text-stone-700 dark:text-slate-300">
                                            {w.txRef || w.id?.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3.5 text-stone-500 dark:text-slate-400">
                                            {w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-4 py-3.5 font-bold font-mono text-stone-900 dark:text-white">
                                            {formatCurrency(w.amount)}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-stone-800 dark:text-slate-200">{w.bankName}</div>
                                            <div className="font-mono text-[11px] text-stone-500 dark:text-slate-400">
                                                {w.bankAccountNumber} - {w.bankAccountName}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-stone-500 dark:text-slate-400 max-w-[150px] truncate" title={w.userNote || w.adminNote}>
                                            {w.adminNote ? (
                                                <span className="text-rose-500">Lý do: {w.adminNote}</span>
                                            ) : (
                                                w.userNote || '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {w.status === 'PENDING' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    <HiOutlineClock className="h-3 w-3 animate-spin" /> Chờ xử lý
                                                </span>
                                            )}
                                            {w.status === 'APPROVED' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <HiOutlineCheckCircle className="h-3 w-3" /> Thành công
                                                </span>
                                            )}
                                            {w.status === 'REJECTED' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-500 border border-rose-500/20" title={w.adminNote || 'Yêu cầu bị từ chối'}>
                                                    <HiOutlineXCircle className="h-3 w-3" /> Bị từ chối
                                                </span>
                                            )}
                                            {w.status === 'CANCELLED' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-500/20">
                                                    <HiOutlineBan className="h-3 w-3" /> Đã hủy
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {w.status === 'PENDING' ? (
                                                <button
                                                    type="button"
                                                    disabled={cancellingId === w.id}
                                                    onClick={() => handleCancelWithdrawal(w.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    {cancellingId === w.id ? (
                                                        <HiOutlineRefresh className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <HiOutlineX className="h-3 w-3" />
                                                    )}
                                                    Hủy lệnh
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-stone-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {withdrawalTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800 text-xs">
                        <span className="text-stone-500 dark:text-slate-400">
                            Trang {withdrawalPage + 1} / {withdrawalTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={withdrawalPage === 0 || loadingWithdrawals}
                                onClick={() => fetchWithdrawals(withdrawalPage - 1)}
                                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-40"
                            >
                                Trước
                            </button>
                            <button
                                type="button"
                                disabled={withdrawalPage >= withdrawalTotalPages - 1 || loadingWithdrawals}
                                onClick={() => fetchWithdrawals(withdrawalPage + 1)}
                                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-40"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* How Escrow Works */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                    'rounded-lg border p-5',
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

            {/* Modal: Rút Tiền Về Ngân Hàng */}
            <AnimatePresence>
                {isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative space-y-4',
                                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
                            )}
                        >
                            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800 border-stone-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                        <HiOutlineCash className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold">Rút tiền về ngân hàng</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawModalOpen(false)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
                                >
                                    <HiOutlineX className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Linked Bank Card Preview */}
                            {linkedBank && (
                                <div className={cn(
                                    'p-3.5 rounded-xl border text-xs space-y-1',
                                    isDark ? 'border-slate-800 bg-slate-800/50' : 'border-amber-100 bg-amber-50/50'
                                )}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-stone-900 dark:text-white">{linkedBank.bankName}</span>
                                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{linkedBank.accountNumber}</span>
                                    </div>
                                    <div className="text-[11px] text-stone-500 dark:text-slate-400">
                                        Chủ tài khoản: <span className="font-semibold uppercase text-stone-700 dark:text-slate-300">{linkedBank.accountName}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleRequestWithdrawal} className="space-y-4 text-xs">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-semibold text-stone-700 dark:text-slate-300">
                                            Số tiền muốn rút <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-stone-500 dark:text-slate-400">
                                            Khả dụng: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(available)}</strong>
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={withdrawAmount ? Number(withdrawAmount).toLocaleString('vi-VN') : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '')
                                                setWithdrawAmount(raw)
                                            }}
                                            placeholder="Tối thiểu 100.000"
                                            className={cn(
                                                'w-full rounded-xl px-4 py-2.5 font-mono text-sm font-bold border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none pr-12',
                                                isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                                            )}
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">₫</span>
                                    </div>

                                    {/* Quick amount chips */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {[100000, 200000, 500000, 1000000].map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setWithdrawAmount(String(amt))}
                                                className={cn(
                                                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
                                                    Number(withdrawAmount) === amt
                                                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'border-stone-200 dark:border-slate-700 hover:border-amber-500/50 text-stone-600 dark:text-slate-400'
                                                )}
                                            >
                                                {amt.toLocaleString('vi-VN')} ₫
                                            </button>
                                        ))}
                                        {available >= 100000 && (
                                            <button
                                                type="button"
                                                onClick={() => setWithdrawAmount(String(Math.floor(available)))}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                            >
                                                Tất cả số dư
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] text-stone-400">
                                        Số tiền rút tối thiểu: <strong>100.000 VNĐ</strong>
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">
                                        Ghi chú rút tiền (Không bắt buộc)
                                    </label>
                                    <input
                                        type="text"
                                        value={withdrawNote}
                                        onChange={(e) => setWithdrawNote(e.target.value)}
                                        placeholder="VD: Rút tiền tiêu dùng"
                                        maxLength={100}
                                        className={cn(
                                            'w-full rounded-xl px-4 py-2 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                                            isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                                        )}
                                    />
                                </div>

                                <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-stone-700 dark:text-slate-300 text-[11px] space-y-1">
                                    <div className="flex items-start gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                        <HiOutlineInformationCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>Quy trình xử lý rút tiền:</span>
                                    </div>
                                    <p className="text-stone-500 dark:text-slate-400 pl-5">
                                        Số tiền rút sẽ được tạm khóa trong ví. Ban Quản Trị sẽ duyệt và chuyển khoản vào tài khoản ngân hàng của bạn. Thông báo xác nhận sẽ được gửi qua email.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        className={cn(
                                            'px-4 py-2.5 rounded-xl font-semibold border transition-colors cursor-pointer',
                                            isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        )}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingWithdraw || !withdrawAmount || Number(withdrawAmount) < 100000 || Number(withdrawAmount) > available}
                                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold transition-all bg-amber-500 hover:bg-amber-600 text-stone-950 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingWithdraw ? (
                                            <>
                                                <HiOutlineRefresh className="h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <HiOutlineCheckCircle className="h-4 w-4" />
                                                Xác nhận rút tiền
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
