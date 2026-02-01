import { useState } from 'react'
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
} from 'react-icons/hi'
import { cn } from '../lib/cn'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/#products', label: 'AirPods & Tai nghe' },
  { to: '/#deals', label: 'Ưu đãi' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
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
                  </div>
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
                  </div>
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
