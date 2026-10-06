import { useState } from 'react'
import { HiOutlineExclamation } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../../store/useThemeStore'
import { cn } from '../../../../../lib/cn'
import trustConfigService from '../../../../../services/trustConfig'

export default function RejectCloseShopModal({ shop, onClose, onSuccess }) {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!shop) return null

  const handleReject = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối yêu cầu đóng shop')
      return
    }

    try {
      setSubmitting(true)
      await trustConfigService.rejectCloseShopRefund(shop.shopId, reason.trim())
      toast.success(`Đã từ chối yêu cầu đóng shop của gian hàng ${shop.shopName || ''}!`)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('Lỗi từ chối đóng shop:', err)
      toast.error(err?.message || 'Từ chối đóng shop thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        <h2 className="text-lg sm:text-xl font-bold text-rose-500 flex items-center gap-2">
          <HiOutlineExclamation className="h-6 w-6 shrink-0" />
          Từ Chối Yêu Cầu Đóng Shop
        </h2>
        <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Gian hàng: <span className="font-bold text-amber-500">{shop.shopName}</span>
        </p>

        <form onSubmit={handleReject} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Lý do từ chối yêu cầu đóng shop *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Ví dụ: Gian hàng vẫn còn nghĩa vụ giao hàng hoặc đối soát đơn khiếu nại chưa hoàn tất..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500',
                isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
              )}
            />
          </div>

          <div className={cn(
            'rounded-xl border p-3 text-xs leading-relaxed',
            isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-900'
          )}>
            Sau khi từ chối, Quỹ ký quỹ và trạng thái Shop sẽ được phục hồi lại trạng thái <strong>ACTIVE</strong> để tiếp tục kinh doanh bình thường.
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
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
