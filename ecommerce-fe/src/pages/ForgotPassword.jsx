import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineKey } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function ForgotPassword() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  
  // step 1: email, step 2: otp & new password
  const [step, setStep] = useState(1)
  const [savedEmail, setSavedEmail] = useState('')

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
  } = useForm()

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm()

  const onEmailSubmit = async (data) => {
    try {
      await authService.forgotPasswordSendOtp(data.email)
      setSavedEmail(data.email)
      toast.success('Mã OTP đã được gửi đến email của bạn!')
      setStep(2)
    } catch (error) {
      toast.error(error?.message || 'Không thể gửi email. Vui lòng thử lại.')
    }
  }

  const onResetSubmit = async (data) => {
    try {
      await authService.forgotPasswordReset({
        email: savedEmail,
        otp: data.otp,
        newPassword: data.newPassword
      })
      toast.success('Đổi mật khẩu thành công! Hãy đăng nhập lại.')
      navigate('/login')
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  return (
    <div
      className={cn(
        'min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <div className="w-full max-w-md">
        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl overflow-hidden',
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
              Quên mật khẩu
            </h1>
            <p
              className={cn(
                'mt-2 text-sm',
                isDark ? 'text-slate-400' : 'text-stone-500',
              )}
            >
              {step === 1 ? 'Nhập email để nhận mã khôi phục' : 'Nhập mã OTP và mật khẩu mới'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailSubmit(onEmailSubmit)}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className={cn(
                      'mb-1.5 block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Email của bạn
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
                      placeholder="example@gmail.com"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        emailErrors.email && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...registerEmail('email', {
                        required: 'Vui lòng nhập email',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email không hợp lệ',
                        }
                      })}
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {emailErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isEmailSubmitting}
                  className={cn(
                    'w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition',
                    isEmailSubmitting
                      ? 'cursor-not-allowed bg-amber-500/60'
                      : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99]',
                  )}
                >
                  {isEmailSubmitting ? 'Đang gửi mã...' : 'Nhận mã OTP'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetSubmit(onResetSubmit)}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="otp"
                    className={cn(
                      'mb-1.5 block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Mã xác thực (OTP)
                  </label>
                  <div className="relative">
                    <HiOutlineKey
                      className={cn(
                        'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                        isDark ? 'text-slate-500' : 'text-stone-400',
                      )}
                    />
                    <input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        resetErrors.otp && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...registerReset('otp', {
                        required: 'Vui lòng nhập mã OTP',
                      })}
                    />
                  </div>
                  {resetErrors.otp && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {resetErrors.otp.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className={cn(
                      'mb-1.5 block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed
                      className={cn(
                        'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                        isDark ? 'text-slate-500' : 'text-stone-400',
                      )}
                    />
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        resetErrors.newPassword && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...registerReset('newPassword', {
                        required: 'Vui lòng nhập mật khẩu mới',
                        minLength: {
                          value: 6,
                          message: 'Mật khẩu phải có ít nhất 6 ký tự',
                        }
                      })}
                    />
                  </div>
                  {resetErrors.newPassword && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {resetErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
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
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        resetErrors.confirmPassword && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...registerReset('confirmPassword', {
                        required: 'Vui lòng xác nhận mật khẩu',
                        validate: (val) => {
                          if (watch('newPassword') != val) {
                            return 'Mật khẩu không khớp';
                          }
                        },
                      })}
                    />
                  </div>
                  {resetErrors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {resetErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isResetSubmitting}
                    className={cn(
                      'flex-1 rounded-xl py-3.5 text-sm font-semibold transition border',
                      isDark 
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-800' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className={cn(
                      'flex-1 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition',
                      isResetSubmitting
                        ? 'cursor-not-allowed bg-amber-500/60'
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99]',
                    )}
                  >
                    {isResetSubmitting ? 'Đang xử lý...' : 'Xác nhận đổi'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p
            className={cn(
              'mt-6 text-center text-sm',
              isDark ? 'text-slate-400' : 'text-stone-500',
            )}
          >
            Nhớ ra mật khẩu?{' '}
            <Link
              to="/login"
              className="font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
