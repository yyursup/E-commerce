import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import authService from '../../services/auth'
import platformService from '../../services/platform'
import { HiOutlineCog } from 'react-icons/hi'

export default function AdminDashboard() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)
  const [platformSettings, setPlatformSettings] = useState(null)
  const [commissionRate, setCommissionRate] = useState('')
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const usersData = await authService.getAllUsers()

        // Transform API response to match UI format
        // API returns: [{ email, role }]
        const transformedUsers = usersData.map((user, index) => ({
          id: index + 1, // Temporary ID since API doesn't return ID
          email: user.email,
          role: user.role || 'CUSTOMER',
          status: 'active', // API doesn't return status, defaulting to active
          createdAt: new Date().toLocaleDateString('vi-VN'), // API doesn't return createdAt
        }))

        setUsers(transformedUsers)

        // Calculate stats from users data
        const totalUsers = usersData.length
        const totalBusinesses = usersData.filter(u => u.role === 'BUSINESS').length
        const totalCustomers = usersData.filter(u => u.role === 'CUSTOMER').length
        const totalAdmins = usersData.filter(u => u.role === 'ADMIN').length

        // Mock data for stats (for demo purposes)
        const mockStats = {
          totalOrders: 42,
          totalRevenue: 12500000,
          pendingRequests: 3,
        }

        setStats({
          totalUsers,
          totalBusinesses,
          totalOrders: mockStats.totalOrders,
          totalRevenue: mockStats.totalRevenue,
          pendingRequests: mockStats.pendingRequests,
        })
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách người dùng')
        toast.error('Không thể tải danh sách người dùng')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
    fetchPlatformSettings()
  }, [])

  const fetchPlatformSettings = async () => {
    try {
      const settings = await platformService.getPlatformSettings()
      setPlatformSettings(settings)
      setCommissionRate(settings.value || '10')
    } catch (err) {
      console.error('Error fetching platform settings:', err)
      toast.error('Không thể tải cài đặt nền tảng')
    }
  }

  const handleUpdateCommissionRate = async () => {
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ hoa hồng phải từ 0 đến 100')
      return
    }

    try {
      setIsUpdatingCommission(true)
      const updated = await platformService.updateCommissionRate(rate)
      setPlatformSettings(updated)
      toast.success('Cập nhật tỷ lệ hoa hồng thành công')
    } catch (err) {
      console.error('Error updating commission rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ hoa hồng')
    } finally {
      setIsUpdatingCommission(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats.totalUsers,
      icon: HiOutlineUsers,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Doanh nghiệp',
      value: stats.totalBusinesses,
      icon: HiOutlineShoppingBag,
      color: 'bg-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders,
      icon: HiOutlineChartBar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Yêu cầu chờ duyệt',
      value: stats.pendingRequests,
      icon: HiOutlineShieldCheck,
      color: 'bg-red-500',
      bgColor: 'bg-red-500/10',
    },
  ]

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'BUSINESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'CUSTOMER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusBadgeColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div
      className={cn(
        'min-h-screen px-4 py-8 sm:px-6 lg:px-8',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={cn(
              'text-3xl font-bold',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Admin Dashboard
          </h1>
          <p
            className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}
          >
            Chào mừng trở lại, {user?.email}
          </p>
        </div>

        <div className="space-y-6">
            {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'rounded-xl border p-6',
                  isDark
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-stone-200 bg-white',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={cn(
                        'mt-2 text-2xl font-bold',
                        isDark ? 'text-white' : 'text-stone-900',
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      stat.bgColor,
                    )}
                  >
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </motion.div>
            )
          })}
          </div>

          {/* Users Management Section */}
          <div
          className={cn(
            'rounded-xl border',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="border-b p-6">
            <h2
              className={cn(
                'text-xl font-semibold',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              Quản lý người dùng
            </h2>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p
                className={cn(
                  'mt-4 text-sm',
                  isDark ? 'text-slate-400' : 'text-stone-600',
                )}
              >
                Đang tải danh sách người dùng...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-12 text-center">
              <p
                className={cn(
                  'text-sm text-red-500',
                  isDark ? 'text-red-400' : 'text-red-600',
                )}
              >
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  'mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  'bg-amber-500 text-white hover:bg-amber-600',
                )}
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={cn(
                      'border-b',
                      isDark ? 'border-slate-700' : 'border-stone-200',
                    )}
                  >
                    <th
                      className={cn(
                        'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      Email
                    </th>
                    <th
                      className={cn(
                        'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      Vai trò
                    </th>
                    <th
                      className={cn(
                        'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      Trạng thái
                    </th>
                    <th
                      className={cn(
                        'px-6 py-3 text-right text-xs font-medium uppercase tracking-wider',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      isDark
                        ? 'border-slate-700 hover:bg-slate-800'
                        : 'border-stone-200 hover:bg-stone-50',
                    )}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <p
                        className={cn(
                          'font-medium',
                          isDark ? 'text-white' : 'text-stone-900',
                        )}
                      >
                        {user.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          getRoleBadgeColor(user.role),
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          getStatusBadgeColor(user.status),
                        )}
                      >
                        {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'active' ? (
                          <button
                            className={cn(
                              'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                              'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                            )}
                            onClick={() => toast.success('Đã vô hiệu hóa người dùng')}
                          >
                            <HiOutlineBan className="h-4 w-4" />
                            Vô hiệu hóa
                          </button>
                        ) : (
                          <button
                            className={cn(
                              'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                              'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
                            )}
                            onClick={() => toast.success('Đã kích hoạt người dùng')}
                          >
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            Kích hoạt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="p-12 text-center">
              <HiOutlineUsers
                className={cn(
                  'mx-auto h-12 w-12',
                  isDark ? 'text-slate-600' : 'text-stone-400',
                )}
              />
              <p
                className={cn(
                  'mt-4 text-sm',
                  isDark ? 'text-slate-400' : 'text-stone-600',
                )}
              >
                Chưa có người dùng nào.
              </p>
            </div>
          )}
          </div>

          {/* Platform Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-xl border',
              isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="border-b p-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isDark ? 'bg-amber-500/20' : 'bg-amber-100',
                  )}
                >
                  <HiOutlineCog
                    className={cn('h-5 w-5', isDark ? 'text-amber-400' : 'text-amber-600')}
                  />
                </div>
                <div>
                  <h2
                    className={cn(
                      'text-xl font-semibold',
                      isDark ? 'text-white' : 'text-stone-900',
                    )}
                  >
                    Cài đặt nền tảng
                  </h2>
                  <p
                    className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}
                  >
                    Quản lý tỷ lệ hoa hồng của nền tảng
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="commissionRate"
                    className={cn(
                      'block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Tỷ lệ hoa hồng (%)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      id="commissionRate"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className={cn(
                        'block w-32 rounded-lg border px-3 py-2 text-sm',
                        'focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-400'
                          : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
                      )}
                      placeholder="10"
                    />
                    <span
                      className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}
                    >
                      %
                    </span>
                    <button
                      onClick={handleUpdateCommissionRate}
                      disabled={isUpdatingCommission}
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                        'bg-amber-500 text-white hover:bg-amber-600',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      {isUpdatingCommission ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                  </div>
                  <p
                    className={cn('mt-2 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}
                  >
                    Tỷ lệ hoa hồng hiện tại: {platformSettings?.value || '10'}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-2xl border p-6 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Request approvals</h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Review and approve seller registrations or reports.
                </p>
              </div>
              <Link
                to="/admin/requests"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
                )}
              >
                <HiOutlineClipboardCheck className="h-4 w-4" />
                Open requests
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
