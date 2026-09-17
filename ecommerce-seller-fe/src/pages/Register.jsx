import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineShoppingBag,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineArrowLeft,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function Register() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'BUSINESS') {
        navigate('/dashboard')
      } else if (user?.sellerStatus === 'PENDING' || user?.sellerStatus === 'REJECTED') {
        navigate('/pending')
      } else {
        navigate('/seller-register')
      }
    }
  }, [isAuthenticated, user, navigate])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
      })

      toast.success('Đăng ký tài khoản thành công! Vui lòng nhập mã OTP để kích hoạt.')
      // Chuyển sang trang Verify kèm thông tin để tự động đăng nhập và nhảy vào hồ sơ mở shop
      navigate('/verify', {
        state: {
          email: data.email,
          username: data.username,
          password: data.password,
          autoProceedToSellerRegister: true,
        },
      })
    } catch (error) {
      console.error('Seller Register error:', error)
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
      toast.error(errorMessage)
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center px-4 py-12',
        isDark ? 'bg-slate-950' : 'bg-stone-50'
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div
          className={cn(
            'rounded-3xl border p-8 shadow-xl',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-block">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                <HiOutlineShoppingBag className="h-8 w-8" />
              </div>
            </Link>
            <h1
              className={cn(
                'text-2xl font-black tracking-tight',
                isDark ? 'text-white' : 'text-stone-900'
              )}
            >
              Đăng Ký Kênh Người Bán
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              Tạo tài khoản để bắt đầu kinh doanh và mở gian hàng trên E-commerce
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className={cn(
                  'mb-1.5 block text-xs font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập username"
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400',
                    errors.username && 'border-rose-500 focus:ring-rose-500'
                  )}
                  {...register('username', {
                    required: 'Vui lòng nhập tên đăng nhập',
                    minLength: {
                      value: 3,
                      message: 'Tên đăng nhập phải có ít nhất 3 ký tự',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Tên đăng nhập tối đa 50 ký tự',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'Chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang',
                    },
                  })}
                />
                <HiOutlineUser className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.username && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className={cn(
                  'mb-1.5 block text-xs font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400',
                    errors.phoneNumber && 'border-rose-500 focus:ring-rose-500'
                  )}
                  {...register('phoneNumber', {
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: {
                      value: /(84|0[3|5|7|8|9])+(\d{8})/,
                      message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
                    },
                  })}
                />
                <HiOutlinePhone className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={cn(
                  'mb-1.5 block text-xs font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seller@example.com"
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400',
                    errors.email && 'border-rose-500 focus:ring-rose-500'
                  )}
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Địa chỉ email không hợp lệ',
                    },
                  })}
                />
                <HiOutlineMail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={cn(
                  'mb-1.5 block text-xs font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400',
                    errors.password && 'border-rose-500 focus:ring-rose-500'
                  )}
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                />
                <HiOutlineLockClosed className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm"
                className={cn(
                  'mb-1.5 block text-xs font-semibold',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400',
                    errors.confirm && 'border-rose-500 focus:ring-rose-500'
                  )}
                  {...register('confirm', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (v) => v === password || 'Mật khẩu xác nhận không khớp',
                  })}
                />
                <HiOutlineLockClosed className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.confirm && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.confirm.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Tiếp Tục Mở Shop'}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 border-t border-stone-100 dark:border-slate-800 pt-4 text-center space-y-2.5">
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-amber-500 hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
              <Link to="/" className="hover:text-amber-500 flex items-center gap-1">
                <HiOutlineArrowLeft className="h-3 w-3" /> Trang chủ Kênh Người Bán
              </Link>
              <span>•</span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-500"
              >
                Sàn mua sắm
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
