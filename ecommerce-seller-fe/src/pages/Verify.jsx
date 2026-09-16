import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineShoppingBag, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function Verify() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const email = location.state?.email
  const username = location.state?.username
  const password = location.state?.password
  const autoProceed = location.state?.autoProceedToSellerRegister

  // If no email in state (user accessed /verify directly), redirect to register
  useEffect(() => {
    if (!email) {
      toast.error('Vui lòng đăng ký hoặc đăng nhập trước')
      navigate('/register')
    }
  }, [email, navigate])

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef([])

  const handleChange = (index, value) => {
    if (isNaN(value)) return

    const newOtp = [...otp]

    // Handle paste
    if (value.length > 1) {
      const pastedData = value.split('').slice(0, 6)
      for (let i = 0; i < 6; i++) {
        if (pastedData[i]) newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      const lastIndex = Math.min(pastedData.length - 1, 5)
      inputRefs.current[lastIndex]?.focus()
    } else {
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
    const newOtp = [...otp]
    pastedData.forEach((char, i) => {
      if (!isNaN(char)) newOtp[i] = char
    })
    setOtp(newOtp)
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số OTP')
      return
    }

    setIsSubmitting(true)
    try {
      await authService.verify({ email, otp: otpValue })

      // Nếu có đầy đủ username và password từ bước đăng ký -> Tự động đăng nhập và nhảy ngay vào luồng mở Shop!
      if (username && password) {
        try {
          const res = await authService.login({ username, password })
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

          toast.success(
            '🎉 Xác thực tài khoản thành công! Hãy hoàn tất hồ sơ để mở gian hàng của bạn.',
            { duration: 5000 }
          )
          navigate('/seller-register')
          return
        } catch (loginErr) {
          console.warn('Auto login after verify failed:', loginErr)
        }
      }

      toast.success('Xác thực tài khoản thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error) {
      console.error('Verify error:', error)
      const errorMessage = error?.message || 'Xác thực thất bại. Mã OTP không chính xác.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
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
              Xác Thực Tài Khoản
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              Nhập mã OTP 6 số đã được gửi tới địa chỉ <strong className="text-amber-500">{email}</strong>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    'h-12 w-12 rounded-xl border text-center text-lg font-bold outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  )}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Xác Thực & Mở Gian Hàng'}
            </button>
          </form>

          {/* Resend & Return */}
          <div className="mt-6 border-t border-stone-100 dark:border-slate-800 pt-4 text-center space-y-2.5">
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Không nhận được mã?{' '}
              <button
                type="button"
                className="font-bold text-amber-500 hover:underline"
                onClick={() => toast.success('Đã gửi lại mã OTP vào email của bạn!')}
              >
                Gửi lại mã
              </button>
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
              <Link to="/register" className="hover:text-amber-500 flex items-center gap-1">
                <HiOutlineArrowLeft className="h-3 w-3" /> Quay lại đăng ký
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
