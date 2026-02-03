import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineHeart,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineMenu,
  HiOutlineX,
  HiChevronDown,
  HiOutlineLogout,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import cartService from '../services/cart'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/products', label: 'AirPods & Tai nghe' },
  { to: '/#deals', label: 'Ưu đãi' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, updateCartCount, resetCart } = useCartStore()
  const navigate = useNavigate()

  // Get user role
  const userRole = user?.role?.toUpperCase()
  const isBusiness = userRole === 'BUSINESS' || userRole === 'ADMIN'
  const isAdmin = userRole === 'ADMIN'

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCart = async () => {
        try {
          const cartData = await cartService.getCart()
          updateCartCount(cartData)
        } catch (error) {
          // Cart might be empty or error, reset count
          console.log('Cart fetch error:', error)
          updateCartCount(null)
        }
      }
      fetchCart()
    } else {
      // Reset cart when logged out
      resetCart()
    }
  }, [isAuthenticated, updateCartCount, resetCart])

  const handleLogout = () => {
    logout()
    resetCart() // Clear cart count on logout
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
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-600',
            )}
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
          </span>
          <span
            className={cn(
              'text-lg',
              isDark ? 'text-slate-100' : 'text-stone-800',
            )}
          >
            AirPod Store
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: theme + dropdown + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <Link
            to="/cart"
            className={cn(
              'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900',
            )}
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {totalItems}
              </span>
            )}
          </Link>

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
                  {isAdmin && (
                    <MenuItem>
                      <Link
                        to="/admin"
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <HiOutlineCog className="h-4 w-4" />
                        Admin
                      </Link>
                    </MenuItem>
                  )}

                  {/* Business Dashboard Link */}
                  {isBusiness && (
                    <MenuItem>
                      <Link
                        to="/business"
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <HiOutlineChartBar className="h-4 w-4" />
                        Dashboard Doanh Nghiệp
                      </Link>
                    </MenuItem>
                  )}

                  {/* Admin Dashboard Link */}
                  {isAdmin && (
                    <MenuItem>
                      <Link
                        to="/admin"
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <HiOutlineShieldCheck className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </MenuItem>
                  )}

                  {/* Seller Register - only for CUSTOMER */}
                  {userRole === 'CUSTOMER' && (
                    <MenuItem>
                      <Link
                        to="/seller/register"
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <HiOutlineShoppingBag className="h-4 w-4" />
                        Đăng ký bán hàng
                      </Link>
                    </MenuItem>
                  )}
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
                    <button className={cn(
                      'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                      isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-stone-600 hover:bg-stone-50'
                    )}>
                      <HiOutlineHeart className="h-4 w-4" />
                      Yêu thích
                    </button>
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
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Admin
                    </Link>
                  )}

                  {/* Business Dashboard Link - Mobile */}
                  {isBusiness && (
                    <Link
                      to="/business"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Dashboard Doanh Nghiệp
                    </Link>
                  )}

                  {/* Admin Dashboard Link - Mobile */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {/* Seller Register - only for CUSTOMER - Mobile */}
                  {userRole === 'CUSTOMER' && (
                    <Link
                      to="/seller/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Đăng ký bán hàng
                    </Link>
                  )}
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Đơn hàng của tôi
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
