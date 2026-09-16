import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineHeart,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineMenu,
  HiOutlineX,
  HiChevronDown,
  HiOutlineLogout,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineSearch,
  HiOutlineChat,
} from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { useChatStore } from '../store/useChatStore'
import { useWishlistStore } from '../store/useWishlistStore'
import cartService from '../services/cart'
import notificationService from '../services/notification'
import AdvancedSearchBar from './AdvancedSearchBar'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'Tất cả sản phẩm' },
  { to: '/deals', label: 'Khuyến mãi & Voucher' },
  { to: '/marketplace', label: 'Khám phá Gian hàng' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, updateCartCount, resetCart } = useCartStore()

  const openInbox = useChatStore((s) => s.openInbox)
  const unreadTotal = useChatStore((s) => s.unreadTotal)

  const { wishlistCount, fetchMyWishlist, resetWishlist } = useWishlistStore()
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Get user role
  const userRole = user?.role?.toUpperCase()
  const isBusiness = userRole === 'BUSINESS' || userRole === 'ADMIN'
  const isAdmin = userRole === 'ADMIN'

  // Fetch cart, wishlist & notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCart = async () => {
        try {
          const cartData = await cartService.getCart()
          updateCartCount(cartData)
        } catch (error) {
          console.log('Cart fetch error:', error)
          updateCartCount(null)
        }
      }
      const fetchNotifCount = async () => {
        try {
          const count = await notificationService.getUnreadCount()
          setUnreadNotifCount(count || 0)
        } catch (e) {
          // ignore
        }
      }
      fetchCart()
      fetchMyWishlist()
      fetchNotifCount()

      const interval = setInterval(fetchNotifCount, 30000)
      return () => clearInterval(interval)
    } else {
      resetCart()
      resetWishlist()
      setUnreadNotifCount(0)
    }
  }, [isAuthenticated, updateCartCount, resetCart, fetchMyWishlist, resetWishlist])

  const handleLogout = () => {
    logout()
    resetCart()
    resetWishlist()
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors',
        isDark
          ? 'border-slate-700/50 bg-slate-900/95 backdrop-blur'
          : 'border-stone-200/80 bg-white/95 backdrop-blur',
      )}
    >
      {/* Top micro bar */}
      <div className={cn('border-b py-1 px-4 sm:px-8 text-[11px] flex justify-between items-center transition-colors',
        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-stone-50 border-stone-200 text-stone-500'
      )}>
        <div className="flex items-center gap-4">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            🏪 Kênh Người Bán
          </a>
          <span className="hidden sm:inline text-stone-300 dark:text-slate-700">|</span>
          <a
            href="http://localhost:3001/register"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline hover:text-amber-500 transition-colors"
          >
            Trở thành Người bán
          </a>
        </div>
        <div className="flex items-center gap-3 text-stone-400 text-[10px]">
          <span>Hotline CSKH: 1900 1234</span>
        </div>
      </div>
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 md:gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold tracking-tight shrink-0"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
          >
            <HiOutlineShoppingBag className="h-6 w-6" />
          </span>
          <span
            className={cn(
              'text-xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            E-<span className="text-amber-500">commerce</span>
          </span>
        </Link>

        <AdvancedSearchBar />

        {/* Desktop nav links moved to secondary bar below */}

        {/* Right: theme + dropdown + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <Link
            to="/profile?tab=notifications"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-amber-400'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-amber-500',
            )}
            title="Thông báo của tôi"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </Link>

          {/* Wishlist Button */}
          <Link
            to="/profile?tab=wishlist"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-rose-400'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-rose-500',
            )}
            title="Sản phẩm yêu thích"
          >
            <HiOutlineHeart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Button */}
          <Link
            to="/cart"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900',
            )}
            title="Giỏ hàng"
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Chat / Inbox Button */}
          <button
            type="button"
            onClick={() => openInbox()}
            title="Hộp thư & Trò chuyện"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900',
            )}
          >
            <HiOutlineChat className="h-5 w-5" />
            {unreadTotal > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={cn(
              'relative flex h-8 w-14 shrink-0 items-center rounded-full transition-colors',
              isDark
                ? 'bg-slate-700'
                : 'bg-stone-200',
            )}
          >
            <motion.div
              className="absolute left-1 h-6 w-6 rounded-full bg-amber-500 shadow-md"
              animate={{ x: isDark ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
            <HiOutlineSun
              className={cn(
                'absolute left-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2',
                !isDark ? 'text-amber-600' : 'text-slate-500',
              )}
            />
            <HiOutlineMoon
              className={cn(
                'absolute right-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-amber-400' : 'text-stone-400',
              )}
            />
          </button>

          {/* Account dropdown (desktop) */}
          <Menu as="div" className="relative hidden md:block">
            <MenuButton
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-stone-600 hover:bg-stone-100',
              )}
            >
              {isAuthenticated ? (
                <span className="max-w-[150px] truncate">{user?.email || 'Tài khoản'}</span>
              ) : (
                'Tài khoản'
              )}
              <HiChevronDown className="h-4 w-4" />
            </MenuButton>
            <MenuItems
              className={cn(
                'absolute right-0 mt-2 w-56 origin-top-right rounded-xl border py-1 shadow-xl outline-none',
                isDark
                  ? 'border-slate-700 bg-slate-800'
                  : 'border-stone-200 bg-white',
              )}
            >
              {!isAuthenticated ? (
                <>
                  <MenuItem>
                    <Link
                      to="/login"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineUser className="h-4 w-4" />
                      Đăng nhập
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/register"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineUser className="h-4 w-4" />
                      Đăng ký
                    </Link>
                  </MenuItem>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-stone-100 dark:border-slate-700/50">
                    <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                      Xin chào,
                    </p>
                    <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-stone-900")}>
                      {user?.email}
                    </p>
                    {userRole && (
                      <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-stone-500")}>
                        {userRole === 'ADMIN' ? 'Quản trị viên' : userRole === 'BUSINESS' ? 'Doanh nghiệp' : 'Khách hàng'}
                      </p>
                    )}
                  </div>
                  {/* Seller Portal Link */}
                  <MenuItem>
                    <a
                      href="http://localhost:3001"
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-colors',
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-amber-50'
                      )}
                    >
                      <HiOutlineShoppingBag className="h-4 w-4" />
                      Kênh Người Bán (Seller Centre)
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/my-orders"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineShoppingBag className="h-4 w-4" />
                      Đơn hàng của tôi
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/profile?tab=wishlist"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineHeart className="h-4 w-4 text-rose-500" />
                      <span>Yêu thích</span>
                      {wishlistCount > 0 && (
                        <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/profile?tab=notifications"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineBell className="h-4 w-4 text-amber-500" />
                      <span>Thông báo</span>
                      {unreadNotifCount > 0 && (
                        <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                          {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                        </span>
                      )}
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/profile"
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      <HiOutlineUser className="h-4 w-4" />
                      Tài khoản
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button className={cn(
                      'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                      isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                    )}>
                      <HiOutlineCog className="h-4 w-4" />
                      Cài đặt
                    </button>
                  </MenuItem>
                  <div className="my-1 border-t border-stone-100 dark:border-slate-700/50" />
                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors',
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-red-50'
                      )}
                    >
                      <HiOutlineLogout className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </MenuItem>
                </>
              )}
            </MenuItems>
          </Menu>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={cn(
              'rounded-lg p-2.5 md:hidden',
              isDark ? 'text-slate-400' : 'text-stone-600',
            )}
          >
            {mobileOpen ? (
              <HiOutlineX className="h-6 w-6" />
            ) : (
              <HiOutlineMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Secondary Nav Bar for Links (Desktop) */}
      <div className={cn(
          "hidden md:flex border-t items-center",
          isDark ? "border-slate-800 bg-slate-900/90" : "border-stone-100 bg-white"
      )}>
        <div className="mx-auto flex h-10 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'text-sm font-medium transition-colors hover:text-amber-500',
                isDark ? 'text-slate-300' : 'text-stone-600'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'overflow-hidden border-t md:hidden',
              isDark ? 'border-slate-700/50 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e)
                  setMobileOpen(false)
                }}
                className="mb-2 flex items-center relative"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, shop..."
                  className={cn(
                    'w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-stone-100 border-stone-200 text-stone-900 placeholder-stone-400',
                  )}
                />
                <HiOutlineSearch className="absolute left-3.5 h-4 w-4 text-stone-400 dark:text-slate-400" />
              </form>
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-lg px-4 py-3 text-sm font-medium',
                    isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-stone-600 hover:bg-stone-50',
                  )}
                >
                  {label}
                </Link>
              ))}
              <div className="my-2 border-t border-stone-200 dark:border-slate-700" />

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400"
                  >
                    Đăng ký
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 text-sm text-stone-500 dark:text-slate-400">
                    Xin chào, <span className="font-semibold text-stone-900 dark:text-white">{user?.email}</span>
                    {userRole && (
                      <span className="ml-2 text-xs">
                        ({userRole === 'ADMIN' ? 'Quản trị viên' : userRole === 'BUSINESS' ? 'Doanh nghiệp' : 'Khách hàng'})
                      </span>
                    )}
                  </div>
                  {/* Seller Portal Link - Mobile */}
                  <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-slate-800"
                  >
                    🏪 Kênh Người Bán (Seller Centre)
                  </a>
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/profile?tab=wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <HiOutlineHeart className="h-4 w-4 text-rose-500" />
                      Sản phẩm yêu thích
                    </span>
                    {wishlistCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile?tab=notifications"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <HiOutlineBell className="h-4 w-4 text-amber-500" />
                      Thông báo
                    </span>
                    {unreadNotifCount > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
                  >
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
