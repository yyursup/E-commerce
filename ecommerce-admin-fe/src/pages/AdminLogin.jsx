import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function AdminLogin() {
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

      // Strict Guard: ONLY ROLE_ADMIN ALLOWED
      if (res.role !== 'ADMIN') {
        toast.error('Truy cập bị từ chối! Tài khoản của bạn không có đặc quyền Quản trị viên.')
        return
      }

      const userPayload = {
        email: res.email,
        role: res.role,
        accountId: res.accountId,
      }
      login(res.token, userPayload, res.refreshToken)

      toast.success(`Chào mừng Quản trị viên, ${res.email}!`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Admin Login error:', error)
      toast.error(error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    }
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-12', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={cn('rounded-3xl border p-8 shadow-2xl', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/25">
              <HiOutlineShieldCheck className="h-8 w-8" />
            </div>
            <h1 className={cn('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Cổng Quản Trị Sàn
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 font-medium">
              E-commerce Platform Administration Portal (Port 3002)
            </p>
          </div>

          <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
            🔒 Khu vực bảo mật cao. Chỉ dành cho Ban Quản Trị sàn.
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Tên đăng nhập Admin
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập username quản trị"
                  {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-rose-500',
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
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-rose-500',
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
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/25 hover:from-rose-700 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực bảo mật...' : 'Đăng nhập Cổng Quản Trị'}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 dark:border-slate-800 pt-4 text-center space-y-1 text-[11px] text-stone-400">
            <p>
              <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:underline text-amber-500">
                &larr; Đến Sàn mua sắm (Port 3000)
              </a>
            </p>
            <p>
              <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="hover:underline">
                Đến Kênh Người Bán (Port 3001)
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
