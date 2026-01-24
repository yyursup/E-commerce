import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function Login() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    await new Promise((r) => setTimeout(r, 800))
    toast.success(`Chào bạn! (demo: ${data.email})`)
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
              Đăng nhập tài khoản
            </h1>
            <p
              className={cn(
                'mt-2 text-sm',
                isDark ? 'text-slate-400' : 'text-stone-500',
              )}
            >
              Nhập email và mật khẩu để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className={cn(
                    'block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Quên mật khẩu?
                </Link>
              </div>
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
                  autoComplete="current-password"
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
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p
            className={cn(
              'mt-6 text-center text-sm',
              isDark ? 'text-slate-400' : 'text-stone-500',
            )}
          >
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
