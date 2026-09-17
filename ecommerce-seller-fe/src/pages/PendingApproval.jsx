import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineXCircle,
  HiOutlinePencilAlt,
  HiOutlineShoppingBag,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function PendingApproval() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user, login, token, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState(user?.sellerStatus || 'PENDING')

  // Auto-sync status on mount if authenticated
  useEffect(() => {
    if (token) {
      handleCheckStatus(true)
    }
  }, [])

  const handleCheckStatus = async (isSilent = false) => {
    try {
      if (!isSilent) setChecking(true)
      const profile = await authService.getMe()

      const isApproved =
        profile?.role === 'BUSINESS' ||
        profile?.hasShop === true ||
        profile?.sellerStatus === 'APPROVED' ||
        Boolean(profile?.shopId)

      const updatedStatus = isApproved ? 'APPROVED' : (profile?.sellerStatus || 'PENDING')
      setStatus(updatedStatus)

      if (isApproved) {
        toast.success('Chúc mừng! Hồ sơ gian hàng của bạn đã được phê duyệt!')
        const approvedUser = {
          ...user,
          role: 'BUSINESS',
          hasShop: true,
          shopId: profile?.shopId || user?.shopId,
          shopName: profile?.shopName || user?.shopName,
          sellerStatus: 'APPROVED',
        }
        updateUser(approvedUser)
        login(token, approvedUser)
        navigate('/dashboard', { replace: true })
      } else if (updatedStatus === 'REJECTED') {
        updateUser({ sellerStatus: 'REJECTED' })
        if (!isSilent) {
          toast.error('Hồ sơ của bạn đã bị từ chối. Bạn có thể bấm nút bên dưới để nộp hồ sơ mới.')
        }
      } else if (updatedStatus === 'PENDING') {
        updateUser({ sellerStatus: 'PENDING' })
        if (!isSilent) {
          toast('Hồ sơ vẫn đang trong quá trình xét duyệt. Vui lòng kiên nhẫn đợi thêm.', { icon: '⏳' })
        }
      } else if (updatedStatus === 'NONE') {
        updateUser({ sellerStatus: 'NONE' })
      }
    } catch (err) {
      console.error('Check status error:', err)
      if (!isSilent) {
        toast.error('Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau.')
      }
    } finally {
      if (!isSilent) setChecking(false)
    }
  }

  const isRejected = status === 'REJECTED'

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div
          className={cn(
            'rounded-3xl border p-8 shadow-xl text-center space-y-6',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          {/* Header Icon */}
          {isRejected ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5">
              <HiOutlineXCircle className="h-10 w-10" />
            </div>
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
              <HiOutlineClock className="h-10 w-10 animate-pulse" />
            </div>
          )}

          {/* Title and Badge */}
          <div>
            {isRejected ? (
              <span className="inline-block rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold px-3 py-1 uppercase tracking-wider mb-2">
                Hồ sơ chưa được duyệt
              </span>
            ) : (
              <span className="inline-block rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold px-3 py-1 uppercase tracking-wider mb-2">
                Hồ sơ đang chờ duyệt
              </span>
            )}

            <h1 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
              {isRejected ? 'Hồ Sơ Cần Bổ Sung / Chỉnh Sửa' : 'Gian Hàng Đang Được Xét Duyệt'}
            </h1>

            <p className="mt-2 text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {isRejected
                ? 'Rất tiếc, hồ sơ đăng ký mở gian hàng của bạn chưa đạt yêu cầu do một số thông tin (ảnh CCCD eKYC, giấy phép kinh doanh hoặc địa chỉ kho hàng) chưa đầy đủ hoặc không hợp lệ.'
                : 'Cảm ơn bạn đã nộp hồ sơ mở gian hàng. Ban quản trị đang tiến hành kiểm tra thông tin pháp lý, mã số thuế và định danh eKYC của bạn (thường mất 12-24h).'}
            </p>
          </div>

          {/* Details / Stepper */}
          {isRejected ? (
            <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-4 border border-stone-200/80 dark:border-slate-700/80 text-left">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                💡 Hướng dẫn nộp lại hồ sơ:
              </h4>
              <ul className="list-disc list-inside text-xs text-stone-600 dark:text-slate-300 space-y-1">
                <li>Đảm bảo ảnh CCCD chụp rõ 2 mặt, không bị lóa sáng hay mất góc.</li>
                <li>Tên doanh nghiệp và Mã số thuế phải trùng khớp với Giấy phép kinh doanh tải lên.</li>
                <li>Địa chỉ lấy hàng cần chọn đúng Tỉnh/Thành và Quận/Huyện để kết nối vận chuyển GHN.</li>
              </ul>
            </div>
          ) : (
            <div className="border-t border-b border-stone-100 dark:border-slate-800 py-4 text-left space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <HiOutlineCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  1. Nộp hồ sơ đăng ký & eKYC CCCD (Hoàn tất)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <HiOutlineClock className="h-5 w-5 text-amber-500 shrink-0 animate-spin" />
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  2. Ban quản trị kiểm tra hồ sơ (Đang xử lý)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-slate-500">
                <div className="h-5 w-5 rounded-full border-2 border-stone-300 dark:border-slate-700 flex items-center justify-center text-[10px] shrink-0">
                  3
                </div>
                <span>3. Kích hoạt gian hàng & Phân bổ kho GHN</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isRejected ? (
              <Link
                to="/seller-register"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <HiOutlinePencilAlt className="h-4 w-4" />
                Đăng ký lại / Nộp lại hồ sơ
              </Link>
            ) : (
              <button
                onClick={() => handleCheckStatus(false)}
                disabled={checking}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                <HiOutlineRefresh className={cn('h-4 w-4', checking && 'animate-spin')} />
                {checking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}
              </button>
            )}

            <a
              href="http://localhost:3000"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-slate-700 py-3 px-4 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineHome className="h-4 w-4" />
              Về sàn mua sắm
            </a>
          </div>

          <p className="text-[11px] text-stone-400">
            Cần hỗ trợ trực tiếp? Hotline CSKH: <span className="font-semibold text-amber-500">1900 1234</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
