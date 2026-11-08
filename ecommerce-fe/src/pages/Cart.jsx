import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import cartService from '../services/cart'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineTrash, HiMinus, HiPlus, HiArrowRight, HiTicket } from 'react-icons/hi'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'

import { getConditionBadge, getWarrantyBadge } from '../lib/techBadges'

export default function Cart() {
    const { isAuthenticated } = useAuthStore()
    const { updateCartCount } = useCartStore() // Only use available methods
    const isDark = useThemeStore((state) => state.theme) === 'dark'
    const navigate = useNavigate()

    // Local state management
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)

    const items = cart?.items || []
    const total = cart?.totalPrice || 0

    const fetchCart = async () => {
        try {
            setLoading(true)
            const data = await cartService.getCart()
            setCart(data)
            updateCartCount(data) // Sync with Navbar
        } catch (error) {
            console.error("Failed to fetch cart", error)
            toast.error("Không thể tải giỏ hàng")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart()
        }
    }, [isAuthenticated])

    const handleQuantityChange = async (itemId, currentQty, change) => {
        const newQty = currentQty + change
        if (newQty < 1) return
        if (newQty > 10) {
            toast.error("Số lượng tối đa là 10 sản phẩm")
            return
        }

        try {
            // Optimistic update (optional) or just wait for reload
            // For simplicity, wait for API
            let data;
            if (change > 0) {
                data = await cartService.increaseQuantity(itemId)
            } else {
                data = await cartService.decreaseQuantity(itemId)
            }
            setCart(data)
            updateCartCount(data)
        } catch (error) {
            toast.error('Không thể cập nhật số lượng')
        }
    }

    const handleRemoveItem = async (itemId) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                const data = await cartService.removeItem(itemId)
                setCart(data)
                updateCartCount(data)
                toast.success('Đã xóa sản phẩm')
            } catch (error) {
                toast.error('Không thể xóa sản phẩm')
            }
        }
    }

    const handleCheckout = (shopId) => {
        navigate('/checkout', { state: { shopId } });
    }

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + '₫'
    const ink = isDark ? 'text-white' : 'text-stone-950'
    const muted = isDark ? 'text-slate-400' : 'text-stone-600'
    const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
    const page = cn('min-h-screen flex flex-col', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-950')
    const primaryBtn = cn('inline-flex items-center justify-center gap-2 rounded-md px-5 py-3.5 text-[15px] font-bold transition-colors', isDark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800')
    const ghostBtn = cn('inline-flex items-center justify-center rounded-md border px-5 py-3.5 text-[15px] font-bold', isDark ? 'border-white text-white' : 'border-stone-950 text-stone-950')

    const emptyState = ({ kicker, title, body, children }) => (
        <div className={page}>
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-5 px-4 py-16 sm:px-6 lg:px-8">
                <span className={cn('font-mono text-xs uppercase tracking-[0.06em]', muted)}>{kicker}</span>
                <h1 className={cn('max-w-xl text-5xl font-bold leading-none tracking-[-0.04em] sm:text-6xl', ink)}>{title}</h1>
                <p className={cn('max-w-md text-[17px] leading-relaxed', muted)}>{body}</p>
                <div className="flex flex-wrap gap-2.5">{children}</div>
            </main>
            <Footer />
        </div>
    )

    if (!isAuthenticated) {
        return (
            emptyState({ kicker: "Giỏ hàng", title: "Đăng nhập để xem giỏ hàng.", body: "Giỏ hàng được lưu theo tài khoản, nên bạn đổi thiết bị vẫn còn nguyên.", children: (<>
                <Link to="/login" className={primaryBtn}>Đăng nhập</Link>
                <Link to="/products" className={ghostBtn}>Xem sản phẩm</Link>
            </>) })
        )
    }

    if (loading) {
        return (
            <div className={page}>
                <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8" aria-busy="true" aria-label="Đang tải giỏ hàng">
                    <div className="flex flex-col gap-3">
                        {[0, 1, 2].map((i) => <div key={i} className={cn('h-36 animate-pulse rounded-lg border', panel)} />)}
                    </div>
                    <div className={cn('h-64 animate-pulse rounded-lg border', panel)} />
                </main>
                <Footer />
            </div>
        )
    }

    if (!items || items.length === 0) {
        return (
            emptyState({ kicker: "Giỏ hàng · 0 sản phẩm", title: "Giỏ hàng đang trống.", body: "Những gì bạn thêm sẽ được giữ ở đây khi đăng nhập, kể cả khi đổi thiết bị.", children: (<>
                <Link to="/products" className={primaryBtn}>Xem sản phẩm</Link>
                <Link to="/deals" className={ghostBtn}>Xem ưu đãi</Link>
            </>) })
        )
    }

    // Group items by shop: each shop checks out as its own order
    const groupedItems = items.reduce((groups, item) => {
        const key = item.shopId ?? item.shopName ?? 'unknown'
        if (!groups[key]) groups[key] = { shopId: item.shopId, shopName: item.shopName || 'Gian hàng', items: [] }
        groups[key].items.push(item)
        return groups
    }, {})
    const shops = Object.values(groupedItems)
    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <div className={page}>
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h1 className={cn('text-4xl font-bold tracking-[-0.03em] sm:text-5xl', ink)}>Giỏ hàng</h1>
                    <span className={cn('font-mono text-sm', muted)}>{totalQty} SẢN PHẨM · {shops.length} GIAN HÀNG</span>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-4">
                        <AnimatePresence>
                            {shops.map((group) => {
                                const shopTotal = group.items.reduce((a, it) => a + Number(it.totalPrice || 0), 0)
                                return (
                                    <motion.section
                                        key={group.shopId ?? group.shopName}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        aria-label={`Sản phẩm của ${group.shopName}`}
                                        className={cn('overflow-hidden rounded-lg border', panel)}
                                    >
                                        <header className={cn('flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3', isDark ? 'border-slate-800' : 'border-stone-100')}>
                                            <span className="flex items-center gap-2">
                                                <span className={cn('font-mono text-[11px]', muted)}>BÁN BỞI</span>
                                                {group.shopId ? (
                                                    <Link to={`/shop/${group.shopId}`} className={cn('font-semibold hover:underline', ink)}>{group.shopName}</Link>
                                                ) : (
                                                    <span className={cn('font-semibold', ink)}>{group.shopName}</span>
                                                )}
                                            </span>
                                            <span className={cn('font-mono text-sm', ink)}>{fmt(shopTotal)}</span>
                                        </header>

                                        <ul className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
                                            {group.items.map((item) => {
                                                const cond = item.conditionGrade ? getConditionBadge(item.conditionGrade) : null
                                                const war = item.warrantyType ? getWarrantyBadge(item.warrantyType, item.warrantyMonths) : null
                                                const meta = [cond?.label, war?.label, [item.variantColor, item.variantSize].filter(Boolean).join(' · ')].filter(Boolean).join(' · ')
                                                return (
                                                    <li key={item.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                                                        <Link to={`/products/${item.productId}`} className={cn('block aspect-square overflow-hidden rounded-md', isDark ? 'bg-slate-800' : 'bg-stone-100')}>
                                                            <img
                                                                src={item.productImageUrl || '/product-placeholder.svg'}
                                                                alt={item.productName}
                                                                className={cn('h-full w-full object-contain p-2', !isDark && 'mix-blend-multiply')}
                                                                onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                                                            />
                                                        </Link>
                                                        <div className="flex min-w-0 flex-col gap-2.5">
                                                            <div className="flex flex-wrap justify-between gap-2">
                                                                <div className="flex min-w-0 flex-col gap-1">
                                                                    <Link to={`/products/${item.productId}`} className={cn('text-[17px] font-semibold leading-snug hover:underline', ink)}>{item.productName}</Link>
                                                                    {meta && <span className={cn('font-mono text-xs uppercase', muted)}>{meta}</span>}
                                                                </div>
                                                                <div className="text-right">
                                                                    <strong className={cn('block font-mono text-lg', ink)}>{fmt(item.totalPrice)}</strong>
                                                                    <span className={cn('font-mono text-xs', muted)}>{fmt(item.unitPrice)} / chiếc</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-auto flex flex-wrap items-center gap-3">
                                                                <div role="group" aria-label={`Số lượng ${item.productName}`} className={cn('flex items-center rounded-md border', isDark ? 'border-slate-700' : 'border-stone-300')}>
                                                                    <button type="button" aria-label="Giảm" onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={item.quantity <= 1} className="flex h-10 w-10 items-center justify-center disabled:opacity-30">
                                                                        <HiMinus className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <span aria-live="polite" className={cn('w-8 text-center font-mono font-semibold', ink)}>{item.quantity}</span>
                                                                    <button type="button" aria-label="Tăng" onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="flex h-10 w-10 items-center justify-center">
                                                                        <HiPlus className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="inline-flex items-center gap-1.5 px-1 py-2 text-[13px] text-red-700 underline dark:text-red-400">
                                                                    <HiOutlineTrash className="h-4 w-4" /> Xóa
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                )
                                            })}
                                        </ul>

                                        <footer className={cn('flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3', isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-100 bg-stone-50')}>
                                            <span className={cn('text-[13px]', muted)}>Mỗi gian hàng là một đơn riêng, phí giao tính ở bước thanh toán.</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCheckout(group.shopId)}
                                                disabled={!group.shopId}
                                                className={cn(primaryBtn, 'px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40')}
                                            >
                                                Thanh toán đơn này <HiArrowRight className="h-4 w-4" />
                                            </button>
                                        </footer>
                                    </motion.section>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <aside aria-labelledby="cart-summary" className={cn('sticky top-36 flex flex-col gap-4 rounded-lg border p-5', panel)}>
                        <h2 id="cart-summary" className={cn('text-2xl font-bold', ink)}>Tóm tắt</h2>
                        <dl className="flex flex-col gap-2.5 text-sm">
                            <div className="flex justify-between"><dt className={muted}>Số lượng</dt><dd className={cn('font-mono', ink)}>{totalQty} sản phẩm</dd></div>
                            <div className="flex justify-between"><dt className={muted}>Gian hàng</dt><dd className={cn('font-mono', ink)}>{shops.length}</dd></div>
                            <div className="flex justify-between"><dt className={muted}>Phí giao hàng</dt><dd className={muted}>Tính ở bước tiếp</dd></div>
                        </dl>
                        <div className={cn('flex items-baseline justify-between border-t pt-4', isDark ? 'border-slate-800' : 'border-stone-200')}>
                            <span className="font-semibold">Tạm tính</span>
                            <strong className={cn('font-mono text-2xl', ink)}>{fmt(total)}</strong>
                        </div>
                        {shops.length === 1 && shops[0].shopId && (
                            <button type="button" onClick={() => handleCheckout(shops[0].shopId)} className={primaryBtn}>Thanh toán</button>
                        )}
                        <p className={cn('flex items-start gap-2 text-xs leading-relaxed', muted)}>
                            <HiTicket className="mt-0.5 h-4 w-4 shrink-0" />
                            Mã giảm giá áp dụng ở bước thanh toán. Thanh toán qua VNPay hoặc ví; tiền được giữ an toàn đến khi bạn xác nhận đã nhận hàng.
                        </p>
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    )
}
