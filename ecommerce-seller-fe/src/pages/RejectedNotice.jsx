import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineXCircle, HiOutlinePencilAlt, HiOutlineHome } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function RejectedNotice() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5">
            <HiOutlineXCircle className="h-10 w-10" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold px-3 py-1 uppercase tracking-wider mb-2">
              Hồ sơ chưa được duyệt
            </span>
            <h1 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
              Hồ Sơ Cần Bổ Sung Thông Tin
            </h1>
            <p className="mt-2 text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Rất tiếc, hồ sơ đăng ký mở gian hàng của bạn chưa đạt yêu cầu do một số thông tin (ảnh CCCD, giấy phép kinh doanh hoặc địa chỉ kho GHN) chưa chính xác hoặc còn thiếu.
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-4 border border-stone-200/80 dark:border-slate-700/80 text-left">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">Gợi ý kiểm tra lại:</h4>
            <ul className="list-disc list-inside text-xs text-stone-600 dark:text-slate-300 space-y-1">
              <li>Ảnh CCCD eKYC rõ nét, không bị lóa hoặc mất góc.</li>
              <li>Tên công ty trùng khớp với Mã số thuế và Giấy phép kinh doanh (đối với Doanh nghiệp).</li>
              <li>Địa chỉ kho hàng có đầy đủ thông tin Tỉnh/Thành, Quận/Huyện để kết nối GHN Express.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/seller-register"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all"
            >
              <HiOutlinePencilAlt className="h-4 w-4" />
              Chỉnh sửa & Nộp lại hồ sơ
            </Link>

            <a
              href="http://localhost:3000"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-slate-700 py-3 px-4 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineHome className="h-4 w-4" />
              Về sàn mua sắm
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
