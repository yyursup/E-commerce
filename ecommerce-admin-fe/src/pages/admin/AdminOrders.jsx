import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import AdminShopListTable from './components/order/AdminShopListTable'

export default function AdminOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center">
          <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Vui lòng đăng nhập để xem thông tin gian hàng và đơn hàng
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Title */}
        <div>
          <h1 className={cn('text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Gian Hàng & Đơn Hàng
          </h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Xem danh sách tất cả các gian hàng trên sàn. Bấm vào một gian hàng bất kỳ để xem chi tiết tất cả các đơn hàng và quản lý ký quỹ của gian hàng đó.
          </p>
        </div>

        {/* Danh sách gian hàng có phân trang + bộ lọc thời gian + search */}
        <AdminShopListTable isDark={isDark} />
      </div>
    </div>
  )
}
