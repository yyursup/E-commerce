import { useState, useEffect } from 'react'
import {
  HiOutlinePencilAlt,
  HiStar,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../../store/useThemeStore'
import { cn } from '../../../../../lib/cn'
import trustConfigService from '../../../../../services/trustConfig'

export default function AdjustFundModal({ shop, onClose, onSuccess, formatVND }) {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [committed, setCommitted] = useState('0')
  const [balance, setBalance] = useState('0')
  const [starLevel, setStarLevel] = useState('1')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (shop) {
      setCommitted(shop.committedAmount !== null && shop.committedAmount !== undefined ? String(shop.committedAmount) : '0')
      setBalance(shop.balance !== null && shop.balance !== undefined ? String(shop.balance) : '0')
      setStarLevel(shop.currentTrustLevel ? String(shop.currentTrustLevel) : '1')
      setReason('')
    }
  }, [shop])

  if (!shop) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh quỹ ký quỹ')
      return
    }

    try {
      setSubmitting(true)
      await trustConfigService.adjustShopFund(shop.shopId, {
        committedAmount: Number(committed),
        balance: Number(balance),
        targetTrustLevel: Number(starLevel),
        reason: reason.trim(),
      })
      toast.success(`Đã cập nhật quỹ ký quỹ & cấp sao cho gian hàng ${shop.shopName || ''}!`)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('Lỗi điều chỉnh quỹ:', err)
      toast.error(err?.message || 'Điều chỉnh quỹ thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <HiOutlinePencilAlt className="h-6 w-6 text-amber-500 shrink-0" />
          Điều Chỉnh Quỹ Ký Quỹ & Cấp Sao Uy Tín
        </h2>
        <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Gian hàng: <span className="font-bold text-amber-500">{shop.shopName}</span>
          {' '}| Cấp hiện tại: <span className="font-bold text-amber-500">{shop.currentTrustLevel}★</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Số dư Quỹ ký quỹ (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="100000"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                  isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                )}
              />
              <div className="text-[11px] text-amber-500 font-medium mt-1">
                {balance !== '' ? `→ ${formatVND(balance)}` : '0 ₫'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Mức cọc cam kết (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="100000"
                required
                value={committed}
                onChange={(e) => setCommitted(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                  isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                )}
              />
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {committed !== '' ? `→ ${formatVND(committed)}` : '0 ₫'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Cấp sao uy tín (1★ - 5★)
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setStarLevel(String(star))}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border py-2 text-xs font-bold transition',
                    starLevel === String(star)
                      ? 'border-amber-500 bg-amber-500/15 text-amber-500 ring-1 ring-amber-500'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  )}
                >
                  <div className="flex items-center gap-0.5">
                    <HiStar className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="mt-1 text-[11px] sm:text-xs">{star} Sao</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Lý do điều chỉnh (ghi vào sổ cái)</label>
            <textarea
              rows="2"
              required
              placeholder="Ví dụ: Ký hợp đồng đối tác chiến lược, điều chỉnh hạn mức cam kết theo thỏa thuận..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500',
                isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
              )}
            />
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            <span className="font-bold">Lưu ý:</span> Khi điều chỉnh số dư, hệ thống sẽ tự động ghi nhận một giao dịch biến động sổ cái loại <strong>ADMIN_ADJUSTMENT</strong> để đảm bảo tính minh bạch và đối soát tài chính.
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
              )}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Đang lưu...' : 'Lưu điều chỉnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
