import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { useThemeStore } from '../../../../store/useThemeStore'
import walletService from '../../../../services/wallet'
import toast from 'react-hot-toast'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

export default function PlatformWalletTab() {
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
          <h2 className="text-lg font-bold">Số Dư Ví Hệ Thống Của Nền Tảng</h2>
          <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Giám sát nguồn tiền khả dụng và tiền cọc tạm giữ đang bảo chứng giao dịch
          </p>
        </div>
        <button
          onClick={() => fetchWallet(true)}
          disabled={refreshing}
          className={cn(
            'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
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
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-sm"
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
              <p className="text-sm font-medium text-amber-100">Tổng số dư toàn sàn</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatCurrency(total)}</p>
              <p className="mt-3 text-xs text-amber-200">
                Khả dụng + Đang bị khóa (Escrow) &bull; Đơn vị tiền tệ: {wallet.currency || 'VND'}
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
                'rounded-2xl border p-5 shadow-sm',
                isDark
                  ? 'border-emerald-800/30 bg-emerald-950/20'
                  : 'border-emerald-100 bg-emerald-50/70',
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2.5">
                  <HiOutlineCurrencyDollar className="h-5 w-5 text-emerald-500" />
                </div>
                <span className={cn('text-sm font-bold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  Số dư khả dụng
                </span>
              </div>
              <p className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
                {formatCurrency(available)}
              </p>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tiền thu từ hoa hồng nền tảng và các khoản phí dịch vụ đã được ghi nhận.
              </p>
            </motion.div>

            {/* Locked / Escrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                'rounded-2xl border p-5 shadow-sm',
                isDark
                  ? 'border-amber-800/30 bg-amber-950/20'
                  : 'border-amber-100 bg-amber-50/70',
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2.5">
                  <HiOutlineLockClosed className="h-5 w-5 text-amber-500" />
                </div>
                <span className={cn('text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  Đang bị khóa (Escrow)
                </span>
              </div>
              <p className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
                {formatCurrency(locked)}
              </p>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tiền của khách hàng đang được bảo chứng trong đơn hàng, chờ giao thành công để giải ngân.
              </p>
            </motion.div>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'rounded-2xl border p-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <HiOutlineShieldCheck className="h-5 w-5 text-amber-500" />
              <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Quy tắc vận hành dòng tiền hệ thống
              </h3>
            </div>
            <ul className={cn('space-y-2 text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
              <li>• <strong>Số dư khả dụng:</strong> Tiền thực thu từ phí hoa hồng các đơn hàng đã hoàn tất. Sàn có thể rút hoặc sử dụng để vận hành.</li>
              <li>• <strong>Đang bị khóa:</strong> Tiền tạm giữ an toàn qua Escrow Smart Contract / DB Ledger. Chỉ được giải phóng cho Người bán sau khi Đơn hàng đạt trạng thái DELIVERED và hết thời hạn khiếu nại (3 ngày đồng kiểm).</li>
            </ul>
          </motion.div>
        </>
      )}
    </div>
  )
}
