import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineShoppingBag, HiOutlineLockClosed, HiOutlineUser, HiOutlineArrowLeft } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function Login() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      const res = await authService.login(data)

      // Guard: Admin accounts should not manage shop through seller portal
      if (res.role === 'ADMIN') {
        toast.error('Tài khoản Quản trị vui lòng đăng nhập tại Cổng Quản Trị (Port 3002).')
        return
      }

      const userPayload = {
        email: res.email,
        role: res.role,
        accountId: res.accountId,
        hasShop: res.hasShop,
        shopId: res.shopId,
        shopName: res.shopName,
        sellerStatus: res.sellerStatus,
      }
      login(res.token, userPayload)

      toast.success(`Đăng nhập thành công, ${res.shopName || res.email}!`)

      // Smart routing based on role and seller status
      if (res.role === 'BUSINESS') {
        navigate('/dashboard')
      } else if (res.sellerStatus === 'PENDING' || res.sellerStatus === 'REJECTED') {
        navigate('/pending')
      } else {
        // Customer who hasn't registered shop yet
        toast('Tài khoản của bạn chưa có gian hàng. Vui lòng hoàn tất hồ sơ đăng ký.', { icon: '📝' })
        navigate('/register')
      }
    } catch (error) {
      console.error('Seller Login error:', error)
      toast.error(error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.')
    }
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={cn('rounded-3xl border p-8 shadow-xl', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                <HiOutlineShoppingBag className="h-8 w-8" />
              </div>
            </Link>
            <h1 className={cn('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Kênh Người Bán
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              Đăng nhập để quản lý gian hàng, xử lý đơn GHN và doanh thu
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập username của bạn"
                  {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
                <HiOutlineUser className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.username && <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.username.message}</p>}
            </div>

            <div>
              <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
                <HiOutlineLockClosed className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Kênh Người Bán'}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 dark:border-slate-800 pt-4 text-center space-y-2.5">
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Chưa có gian hàng?{' '}
              <Link to="/register" className="font-bold text-amber-500 hover:underline">
                Đăng ký mở Shop ngay
              </Link>
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
              <Link to="/" className="hover:text-amber-500 flex items-center gap-1">
                <HiOutlineArrowLeft className="h-3 w-3" /> Trang chủ Kênh Người Bán
              </Link>
              <span>•</span>
              <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-amber-500">
                Sàn mua sắm
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
