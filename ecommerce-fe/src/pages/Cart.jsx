import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineTrash, HiMinus, HiPlus, HiArrowLeft } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { cn } from '../lib/cn'
import cartService from '../services/cart'

export default function Cart() {
    const isDark = useThemeStore((s) => s.theme) === 'dark'
    const { isAuthenticated } = useAuthStore()
    const { updateCartCount } = useCartStore()
    const navigate = useNavigate()
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [updatingItems, setUpdatingItems] = useState(new Set())

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để xem giỏ hàng')
            navigate('/login')
            return
        }

        fetchCart()
    }, [isAuthenticated])

    const fetchCart = async () => {
        if (!isAuthenticated) return

        try {
            setLoading(true)
            setError(null)
            const data = await cartService.getCart()
            setCart(data)
            // Update cart count in store
            updateCartCount(data)
        } catch (err) {
            console.error('Error fetching cart:', err)
            setError(err.message || 'Không thể tải giỏ hàng')
            toast.error('Không thể tải giỏ hàng')
        } finally {
            setLoading(false)
        }
    }

    const handleIncreaseQuantity = async (cartItemId) => {
        if (updatingItems.has(cartItemId)) return

        try {
            setUpdatingItems(prev => new Set(prev).add(cartItemId))
            const data = await cartService.increaseQuantity(cartItemId)
            setCart(data)
            // Update cart count in store
            updateCartCount(data)
            toast.success('Đã cập nhật số lượng')
        } catch (err) {
            console.error('Error increasing quantity:', err)
            toast.error(err?.response?.data?.message || 'Không thể cập nhật số lượng')
        } finally {
            setUpdatingItems(prev => {
                const next = new Set(prev)
                next.delete(cartItemId)
                return next
            })
        }
    }

    const handleDecreaseQuantity = async (cartItemId) => {
        if (updatingItems.has(cartItemId)) return

        try {
            setUpdatingItems(prev => new Set(prev).add(cartItemId))
            const data = await cartService.decreaseQuantity(cartItemId)
            setCart(data)
            // Update cart count in store
            updateCartCount(data)
            toast.success('Đã cập nhật số lượng')
        } catch (err) {
            console.error('Error decreasing quantity:', err)
            toast.error(err?.response?.data?.message || 'Không thể cập nhật số lượng')
        } finally {
            setUpdatingItems(prev => {
                const next = new Set(prev)
                next.delete(cartItemId)
                return next
            })
        }
    }

    const handleRemoveItem = async (cartItemId) => {
        if (updatingItems.has(cartItemId)) return

        try {
            setUpdatingItems(prev => new Set(prev).add(cartItemId))
            const data = await cartService.removeItem(cartItemId)
            setCart(data)
            // Update cart count in store
            updateCartCount(data)
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
        } catch (err) {
            console.error('Error removing item:', err)
            toast.error(err?.response?.data?.message || 'Không thể xóa sản phẩm')
        } finally {
            setUpdatingItems(prev => {
                const next = new Set(prev)
                next.delete(cartItemId)
                return next
            })
        }
    }

    const items = cart?.items || []
    const totalPrice = cart?.totalPrice ? Number(cart.totalPrice) : 0

    if (loading) {
        return (
            <div className={cn(
                'flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4',
                isDark ? 'bg-slate-950 text-slate-300' : 'bg-stone-50 text-stone-600'
            )}>
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
                    <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                        Đang tải giỏ hàng...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={cn(
                'flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4',
                isDark ? 'bg-slate-950 text-slate-300' : 'bg-stone-50 text-stone-600'
            )}>
                <div className="text-center">
                    <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
                        {error}
                    </p>
                    <button
                        onClick={fetchCart}
                        className={cn(
                            'mt-4 rounded-xl px-4 py-2 text-sm font-medium',
                            isDark
                                ? 'bg-slate-700 text-white hover:bg-slate-600'
                                : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
                        )}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className={cn(
                'flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4',
                isDark ? 'bg-slate-950 text-slate-300' : 'bg-stone-50 text-stone-600'
            )}>
                <img
                    src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png"
                    alt="Empty Cart"
                    className="mb-8 w-64 opacity-80 mix-blend-multiply dark:mix-blend-normal"
                />
                <h2 className="text-2xl font-bold">Giỏ hàng trống</h2>
                <p className="mt-2 text-center text-sm opacity-80">
                    Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.
                </p>
                <Link
                    to="/"
                    className="mt-6 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600"
                >
                    Tiếp tục mua sắm
                </Link>
            </div>
        )
    }

    return (
        <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
            <div className="mx-auto max-w-4xl">
                <h1 className={cn('mb-8 text-3xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    Giỏ hàng ({items.length} sản phẩm)
                </h1>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Items List */}
                    <div className="space-y-4 lg:col-span-2">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={cn(
                                        'flex gap-4 rounded-2xl border p-4 shadow-sm transition-colors',
                                        isDark
                                            ? 'border-slate-800 bg-slate-900'
                                            : 'border-stone-200 bg-white',
                                    )}
                                >
                                    <Link to={`/products/${item.productId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-stone-100 dark:border-slate-700">
                                        <img
                                            src={item.productImageUrl || 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop'}
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                        />
                                    </Link>

                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <Link to={`/products/${item.productId}`}>
                                                <h3 className={cn('font-semibold line-clamp-1 transition hover:text-amber-600 dark:hover:text-amber-400', isDark ? 'text-slate-100' : 'text-stone-800')}>
                                                    {item.productName}
                                                </h3>
                                            </Link>
                                            <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.unitPrice || 0))}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className={cn(
                                                'flex items-center gap-3 rounded-lg border px-2 py-1',
                                                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50'
                                            )}>
                                                <button
                                                    onClick={() => handleDecreaseQuantity(item.id)}
                                                    disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                                    className={cn('p-1', isDark ? 'hover:text-white disabled:opacity-30' : 'hover:text-black disabled:opacity-30')}
                                                >
                                                    <HiMinus className="h-3 w-3" />
                                                </button>
                                                <span className={cn('min-w-[1.5rem] text-center text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleIncreaseQuantity(item.id)}
                                                    disabled={updatingItems.has(item.id)}
                                                    className={cn('p-1', isDark ? 'hover:text-white disabled:opacity-30' : 'hover:text-black disabled:opacity-30')}
                                                >
                                                    <HiPlus className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={updatingItems.has(item.id)}
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                                                title="Xóa sản phẩm"
                                            >
                                                <HiOutlineTrash className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Checkout Summary */}
                    <div className="lg:col-span-1">
                        <div className={cn(
                            'rounded-2xl border p-6 shadow-lg',
                            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                        )}>
                            <h3 className={cn('mb-4 text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                                Tổng kết đơn hàng
                            </h3>

                            <div className="space-y-3 border-b border-stone-200 pb-4 dark:border-slate-700">
                                <div className={cn('flex justify-between text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                                    <span>Tạm tính</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                                </div>
                                <div className={cn('flex justify-between text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                                    <span>Phí vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between text-xl font-bold text-amber-600 dark:text-amber-400">
                                <span>Tổng cộng</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                            </div>

                            <button className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 font-bold text-white shadow-lg transition hover:bg-amber-600 active:scale-[0.98]">
                                Thanh toán ngay
                            </button>

                            <Link
                                to="/"
                                className={cn(
                                    'mt-4 flex items-center justify-center gap-2 text-sm font-medium transition',
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                                )}
                            >
                                <HiArrowLeft className="h-4 w-4" />
                                Tiếp tục mua hàng
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
