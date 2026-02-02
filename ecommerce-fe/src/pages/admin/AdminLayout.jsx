import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  HiOutlineViewGrid,
  HiOutlineClipboardCheck,
  HiOutlineLogout,
  HiOutlineUserCircle,
} from 'react-icons/hi'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, end: true },
  { to: '/admin/requests', label: 'Requests', icon: HiOutlineClipboardCheck },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const isAdmin = user?.role === 'ADMIN'

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className={cn('min-h-[calc(100vh-4rem)] px-4 py-12', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-800')}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/40 bg-red-500/10 p-8">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm opacity-80">This area is restricted to admin accounts.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-[calc(100vh-4rem)]', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900')}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className={cn('rounded-2xl border p-6 shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
              <div className="mb-6 flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700')}>
                  <HiOutlineUserCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-slate-400' : 'text-stone-500')}>Admin</p>
                  <p className="text-sm font-semibold">{user?.email || 'Admin account'}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-amber-500 text-white'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-stone-600 hover:bg-stone-100',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className={cn(
                  'mt-6 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isDark ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50',
                )}
              >
                <HiOutlineLogout className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
