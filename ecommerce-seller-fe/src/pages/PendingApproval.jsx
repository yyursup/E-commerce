import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineClock, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineHome } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import client from '../api/axiosClient'

export default function PendingApproval() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user, login, token } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  const handleCheckStatus = async () => {
    try {
      setChecking(true)
      const res = await client.get('/auth/me')
      const profile = res.data

      if (profile.role === 'BUSINESS' || profile.hasShop || profile.sellerStatus === 'APPROVED') {
        toast.success('Chúc mừng! Hồ sơ của bạn đã được phê duyệt thành công!')
        login(token, {
          ...user,
          role: profile.role,
          hasShop: profile.hasShop,
          shopId: profile.shopId,
          shopName: profile.shopName,
          sellerStatus: 'APPROVED',
        })
        navigate('/dashboard')
      } else if (profile.sellerStatus === 'REJECTED') {
        toast.error('Hồ sơ của bạn đã bị từ chối. Vui lòng kiểm tra lại.')
        navigate('/rejected')
      } else {
        toast('Hồ sơ vẫn đang trong quá trình xét duyệt. Vui lòng kiên nhẫn đợi thêm.', { icon: '⏳' })
      }
    } catch (err) {
      console.error('Check status error:', err)
      toast.error('Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className={cn('rounded-3xl border p-8 shadow-xl text-center space-y-6',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <HiOutlineClock className="h-10 w-10 animate-pulse" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold px-3 py-1 uppercase tracking-wider mb-2">
              Hồ sơ đang chờ duyệt
            </span>
            <h1 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
              Gian Hàng Đang Được Xét Duyệt
            </h1>
            <p className="mt-2 text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Cảm ơn bạn đã đăng ký mở gian hàng cùng chúng tôi. Ban quản trị đang tiến hành kiểm tra thông tin pháp lý, mã số thuế và định danh eKYC của bạn.
            </p>
          </div>

          {/* Stepper */}
          <div className="border-t border-b border-stone-100 dark:border-slate-800 py-4 text-left space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">1. Nộp hồ sơ đăng ký & eKYC CCCD (Hoàn tất)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <HiOutlineClock className="h-5 w-5 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">2. Ban quản trị kiểm tra hồ sơ (Đang xử lý - Thường mất 12-24h)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-slate-500">
              <div className="h-5 w-5 rounded-full border-2 border-stone-300 dark:border-slate-700 flex items-center justify-center text-[10px] shrink-0">3</div>
              <span>3. Kích hoạt gian hàng & Phân bổ kho GHN</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              <HiOutlineRefresh className={cn('h-4 w-4', checking && 'animate-spin')} />
              {checking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}
            </button>

            <a
              href="http://localhost:3000"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-slate-700 py-3 px-4 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineHome className="h-4 w-4" />
              Về sàn mua sắm
            </a>
          </div>

          <p className="text-[11px] text-stone-400">
            Cần hỗ trợ gấp? Vui lòng liên hệ Hotline: <span className="font-semibold text-amber-500">1900 1234</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
