import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import requestService from '../services/request'

export default function SellerRegister() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng ký bán hàng.')
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục.')
      navigate('/login')
      return
    }

    try {
      await requestService.registerSeller(data)
      toast.success('Gửi yêu cầu đăng ký bán hàng thành công!')
      reset()
    } catch (error) {
      console.error('Register seller error:', error)
      const message =
        error?.message || 'Đăng ký bán hàng thất bại. Vui lòng thử lại.'
      toast.error(message)
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
        className="w-full max-w-2xl"
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
              Đăng ký bán hàng
            </h1>
            <p
              className={cn(
                'mt-2 text-sm',
                isDark ? 'text-slate-400' : 'text-stone-500',
              )}
            >
              Gửi thông tin shop để xét duyệt mở bán.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="shopName"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Tên shop
              </label>
              <div className="relative">
                <HiOutlineUser
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="shopName"
                  type="text"
                  placeholder="AirPod Store"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.shopName &&
                      'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('shopName', {
                    required: 'Vui lòng nhập tên shop',
                    maxLength: { value: 150, message: 'Tối đa 150 ký tự' },
                  })}
                />
              </div>
              {errors.shopName && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.shopName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Địa chỉ
              </label>
              <div className="relative">
                <HiOutlineLocationMarker
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="address"
                  type="text"
                  placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.address &&
                      'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('address', {
                    required: 'Vui lòng nhập địa chỉ',
                    maxLength: { value: 2000, message: 'Tối đa 2000 ký tự' },
                  })}
                />
              </div>
              {errors.address && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="shopPhone"
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
                    id="shopPhone"
                    type="tel"
                    placeholder="0912345678"
                    className={cn(
                      'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                      isDark
                        ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                      errors.shopPhone &&
                        'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                    )}
                    {...register('shopPhone', {
                      maxLength: { value: 20, message: 'Tối đa 20 ký tự' },
                    })}
                  />
                </div>
                {errors.shopPhone && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.shopPhone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="shopEmail"
                  className={cn(
                    'mb-1.5 block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Email shop
                </label>
                <div className="relative">
                  <HiOutlineMail
                    className={cn(
                      'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                      isDark ? 'text-slate-500' : 'text-stone-400',
                    )}
                  />
                  <input
                    id="shopEmail"
                    type="email"
                    placeholder="shop@example.com"
                    className={cn(
                      'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                      isDark
                        ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                      errors.shopEmail &&
                        'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                    )}
                    {...register('shopEmail', {
                      maxLength: { value: 120, message: 'Tối đa 120 ký tự' },
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ',
                      },
                    })}
                  />
                </div>
                {errors.shopEmail && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.shopEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="taxCode"
                  className={cn(
                    'mb-1.5 block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Mã số thuế
                </label>
                <div className="relative">
                  <HiOutlineDocumentText
                    className={cn(
                      'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                      isDark ? 'text-slate-500' : 'text-stone-400',
                    )}
                  />
                  <input
                    id="taxCode"
                    type="text"
                    placeholder="0101234567"
                    className={cn(
                      'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                      isDark
                        ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                      errors.taxCode &&
                        'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                    )}
                    {...register('taxCode', {
                      maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
                    })}
                  />
                </div>
                {errors.taxCode && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.taxCode.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="coverImageUrl"
                  className={cn(
                    'mb-1.5 block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Ảnh bìa (URL)
                </label>
                <div className="relative">
                  <HiOutlinePhotograph
                    className={cn(
                      'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                      isDark ? 'text-slate-500' : 'text-stone-400',
                    )}
                  />
                  <input
                    id="coverImageUrl"
                    type="url"
                    placeholder="https://..."
                    className={cn(
                      'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                      isDark
                        ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                      errors.coverImageUrl &&
                        'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                    )}
                    {...register('coverImageUrl', {
                      maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
                    })}
                  />
                </div>
                {errors.coverImageUrl && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.coverImageUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Mô tả shop
              </label>
              <div className="relative">
                <HiOutlineDocumentText
                  className={cn(
                    'absolute left-3 top-3 h-5 w-5',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Giới thiệu ngắn về shop..."
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                    errors.description &&
                      'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('description', {
                    maxLength: { value: 5000, message: 'Tối đa 5000 ký tự' },
                  })}
                />
              </div>
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.description.message}
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
              {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </form>

          <p
            className={cn(
              'mt-6 text-center text-sm',
              isDark ? 'text-slate-400' : 'text-stone-500',
            )}
          >
            Yêu cầu sẽ được xét duyệt trong thời gian sớm nhất.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
