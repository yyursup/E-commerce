import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineCheckCircle } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'

export default function Verify() {
    const isDark = useThemeStore((s) => s.theme) === 'dark'
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email

    // If no email in state (user accessed /verify directly), redirect to register or login
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
        // Only allow numbers
        if (isNaN(value)) return

        const newOtp = [...otp]

        // Handle paste (e.g., user pastes "123456")
        if (value.length > 1) {
            const pastedData = value.split('').slice(0, 6)
            for (let i = 0; i < 6; i++) {
                if (pastedData[i]) newOtp[i] = pastedData[i]
            }
            setOtp(newOtp)
            // Focus last filled input
            const lastIndex = Math.min(pastedData.length - 1, 5)
            inputRefs.current[lastIndex]?.focus()
        } else {
            // Handle single character input
            newOtp[index] = value
            setOtp(newOtp)

            // Move to next input if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus()
            }
        }
    }

    const handleKeyDown = (index, e) => {
        // Move to previous input on Backspace if current is empty
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
            toast.success('Xác thực thành công! Vui lòng đăng nhập.')
            navigate('/login')
        } catch (error) {
            console.error('Verify error:', error)
            const errorMessage = error.message || 'Xác thực thất bại. OTP không đúng.'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
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
                            Xác thực tài khoản
                        </h1>
                        <p
                            className={cn(
                                'mt-2 text-sm',
                                isDark ? 'text-slate-400' : 'text-stone-500',
                            )}
                        >
                            Nhập mã OTP 6 số đã được gửi tới <strong>{email}</strong>
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={6} // Allow paste logic to capture full string if focused here
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className={cn(
                                        'h-12 w-12 rounded-lg border text-center text-xl font-bold outline-none transition',
                                        isDark
                                            ? 'border-slate-600 bg-slate-800/50 text-white focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                                            : 'border-stone-300 bg-stone-50/80 text-stone-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                                    )}
                                />
                            ))}
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
                            {isSubmitting ? 'Đang xác thực...' : 'Xác thực'}
                        </button>
                    </form>

                    <p
                        className={cn(
                            'mt-6 text-center text-sm',
                            isDark ? 'text-slate-400' : 'text-stone-500',
                        )}
                    >
                        Không nhận được mã?{' '}
                        <button
                            type="button"
                            className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                            onClick={() => toast.success('Đã gửi lại mã!')}
                        >
                            Gửi lại
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
