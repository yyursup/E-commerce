import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import walletService from '../../../../services/wallet'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN')
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export default function WalletLookupTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const [userName, setUserName] = useState('')
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLookup = async (e) => {
    e.preventDefault()
    const trimmed = userName.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập Username hoặc Email tài khoản.')
      return
    }

    try {
      setLoading(true)
      const res = await walletService.getAdminWallet(trimmed)
      setWallet(res)
    } catch (err) {
      console.error('Admin wallet lookup error:', err)
      setWallet(null)
      toast.error(err?.message || 'Không tìm thấy ví của tài khoản này.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Tra Cứu Số Dư Ví Thành Viên (User / Seller Wallet)</h2>
        <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Tra cứu số dư thực tế, tiền khả dụng và tiền đóng băng của bất kỳ người dùng hoặc gian hàng nào
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <form onSubmit={handleLookup} className="space-y-3">
          <label
            htmlFor="wallet-user-name"
            className={cn('text-xs font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}
          >
            Tên người dùng hoặc Email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="wallet-user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ví dụ: seller1 hoặc seller1@marketplace.local"
              className={cn(
                'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition',
                isDark
                  ? 'border-slate-700 bg-slate-950 text-slate-100 focus:border-amber-500'
                  : 'border-stone-300 bg-white text-stone-700 focus:border-amber-500',
              )}
            />
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-sm',
                'bg-amber-500 text-white hover:bg-amber-600',
                loading && 'cursor-not-allowed opacity-60',
              )}
            >
              {loading ? 'Đang tra cứu...' : 'Tra cứu ví'}
            </button>
          </div>
        </form>

        {wallet && (
          <div className="mt-6 border-t border-slate-700/30 pt-6">
            <h3 className="text-sm font-bold mb-4">Kết Quả Tra Cứu</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                className={cn(
                  'rounded-xl border p-4',
                  isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-100 bg-stone-50',
                )}
              >
                <p className="text-xs text-slate-400">Chủ tài khoản</p>
                <p className="mt-1 font-bold text-sm">{wallet.ownerName || wallet.username || userName}</p>
                <p className="text-[11px] text-slate-500">Mã ví: {wallet.id?.slice?.(0, 8) || wallet.id || 'N/A'}</p>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-4',
                  isDark ? 'border-emerald-900/30 bg-emerald-950/20' : 'border-emerald-100 bg-emerald-50',
                )}
              >
                <p className="text-xs text-emerald-500 font-semibold">Số dư khả dụng</p>
                <p className="mt-1 font-extrabold text-xl text-emerald-500">
                  {formatCurrency(wallet.availableBalance)}
                </p>
                <p className="text-[11px] text-slate-400">Có thể rút hoặc thanh toán</p>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-4',
                  isDark ? 'border-amber-900/30 bg-amber-950/20' : 'border-amber-100 bg-amber-50',
                )}
              >
                <p className="text-xs text-amber-500 font-semibold">Đang đóng băng</p>
                <p className="mt-1 font-extrabold text-xl text-amber-500">
                  {formatCurrency(wallet.lockedBalance)}
                </p>
                <p className="text-[11px] text-slate-400">Chờ hoàn tất giao dịch</p>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Lần cập nhật cuối: {formatDate(wallet.updatedAt || wallet.lastModifiedDate)}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
