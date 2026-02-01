import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlinePhone,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function Register() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      await authService.register(data)
      toast.success('Đăng ký thành công! Vui lòng xác thực tài khoản.')
      navigate('/verify', { state: { email: data.email } })
    } catch (error) {
      console.error('Register error:', error)
      const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      toast.error(errorMessage)

      // If validation errors come from backend, set them here
      if (error.errors) {
        // Example: backend returns { errors: { email: "Email already exists" } }
        // You might need to adjust based on actual backend error structure
      }
    }
  }

  return (
    <div
      className={cn(
        'min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl',
            isDark
              ? 'border-slate-700/50 bg-slate-900/80'
              : 'border-stone-200/80 bg-white',
          )}
        >
          <div className="mb-8 text-center">
            <h1
              className={cn(
                'text-2xl font-bold tracking-tight',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              Tạo tài khoản
            </h1>
            <p
              className={cn(
                'mt-2 text-sm',
                isDark ? 'text-slate-400' : 'text-stone-500',
              )}
            >
              Tham gia AirPod Store và bắt đầu mua sắm
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Họ tên
              </label>
              <div className="relative">
                <HiOutlineUser
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.name && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('name', {
                    required: 'Vui lòng nhập họ tên',
                    minLength: { value: 3, message: 'Ít nhất 3 ký tự' },
                    maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
                  })}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Số điện thoại
              </label>
              <div className="relative">
                <HiOutlinePhone
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.phoneNumber && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('phoneNumber', {
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: {
                      value: /(84|0[3|5|7|8|9])+(\d{8})/,
                      message: 'Số điện thoại không hợp lệ (VN)',
                    },
                  })}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Email
              </label>
              <div className="relative">
                <HiOutlineMail
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.email && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <HiOutlineLockClosed
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.password && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Ít nhất 6 ký tự',
                    },
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <HiOutlineLockClosed
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.confirm && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('confirm', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (v) =>
                      v === password || 'Mật khẩu không khớp',
                  })}
                />
              </div>
              {errors.confirm && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.confirm.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition',
                isSubmitting
                  ? 'cursor-not-allowed bg-amber-500/60'
                  : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99]',
              )}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p
            className={cn(
              'mt-6 text-center text-sm',
              isDark ? 'text-slate-400' : 'text-stone-500',
            )}
          >
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

