import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../store/useThemeStore'
import walletService from '../../services/wallet'
import toast from 'react-hot-toast'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

export default function AdminPlatformWallet() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchWallet = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const data = await walletService.getMyWallet()
      setWallet(data)
    } catch (err) {
      console.error('Error fetching platform wallet:', err)
      setError(err?.message || 'Không thể tải thông tin ví')
      toast.error('Không thể tải thông tin ví của sàn')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchWallet() }, [])

  const available = wallet?.availableBalance || 0
  const locked = wallet?.lockedBalance || 0
  const total = available + locked

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Ví của sàn
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi số dư ví hệ thống của nền tảng
          </p>
        </div>
        <button
          onClick={() => fetchWallet(true)}
          disabled={refreshing}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
            refreshing && 'cursor-not-allowed opacity-50',
          )}
        >
          <HiOutlineRefresh className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Làm mới
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-12 text-center">
          <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
          <button
            onClick={() => fetchWallet()}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && wallet && (
        <>
          {/* Total Balance Banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg shadow-amber-500/20"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-sm font-medium text-amber-100">Tổng số dư ví sàn</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(total)}</p>
              <p className="mt-3 text-xs text-amber-200">
                Khả dụng + Đang bị khóa &bull; Đơn vị: {wallet.currency || 'VND'}
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
                  : 'border-emerald-100 bg-emerald-50',
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2">
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
                Số dư khả dụng của ví sàn, sẵn sàng cho các giao dịch.
              </p>
            </motion.div>

            {/* Locked / Escrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                'rounded-xl border p-5',
                isDark
                  ? 'border-amber-800/30 bg-amber-900/20'
                  : 'border-amber-100 bg-amber-50',
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-amber-500/10 p-2">
                  <HiOutlineLockClosed className="h-5 w-5 text-amber-500" />
                </div>
                <span className={cn('text-sm font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  Đang bị khóa (Escrow)
                </span>
              </div>
              <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                {formatCurrency(locked)}
              </p>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tiền đang được giữ trong escrow, chờ giải phóng sau khi giao dịch hoàn tất.
              </p>
            </motion.div>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'rounded-xl border p-5',
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-stone-50',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <HiOutlineShieldCheck className="h-5 w-5 text-amber-500" />
              <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                Thông tin ví hệ thống
              </h3>
            </div>
            <ul className={cn('space-y-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              <li>• <strong className={isDark ? 'text-slate-300' : 'text-stone-700'}>Số dư khả dụng</strong>: Tiền hoa hồng và các khoản thu khác của sàn chưa được phân bổ.</li>
              <li>• <strong className={isDark ? 'text-slate-300' : 'text-stone-700'}>Đang bị khóa</strong>: Tiền của người mua đang được giữ trong hệ thống escrow, chờ xác nhận giao hàng.</li>
            </ul>
          </motion.div>
        </>
      )}
    </div>
  )
}
