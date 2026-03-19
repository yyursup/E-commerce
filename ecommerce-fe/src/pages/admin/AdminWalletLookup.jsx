import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import walletService from '../../services/wallet'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export default function AdminWalletLookup() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const [userName, setUserName] = useState('')
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLookup = async (e) => {
    e.preventDefault()
    const trimmed = userName.trim()
    if (!trimmed) {
      toast.error('Username is required.')
      return
    }

    try {
      setLoading(true)
      const res = await walletService.getAdminWallet(trimmed)
      setWallet(res)
    } catch (err) {
      console.error('Admin wallet lookup error:', err)
      setWallet(null)
      toast.error(err?.message || 'Failed to lookup wallet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin wallet lookup</h1>
        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Lookup wallet by username.
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
            className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}
          >
            Username
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="wallet-user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter username"
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
                  : 'border-stone-300 bg-white text-stone-700 focus:border-amber-500',
              )}
            />
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                'bg-amber-500 text-white hover:bg-amber-600',
                loading && 'cursor-not-allowed opacity-60',
              )}
            >
              {loading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
        </form>
      </motion.div>

      {wallet && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <h2 className="text-lg font-semibold">Wallet detail</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Wallet ID</p>
              <p className="mt-1 break-all text-sm">{wallet.walletId || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">User ID</p>
              <p className="mt-1 break-all text-sm">{wallet.userId || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Currency</p>
              <p className="mt-1 text-sm">{wallet.currency || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Updated</p>
              <p className="mt-1 text-sm">{formatDate(wallet.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Available balance</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(wallet.availableBalance)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Held balance</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(wallet.heldBalance)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Total balance</p>
              <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-amber-300' : 'text-amber-700')}>
                {formatCurrency(wallet.totalBalance)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
