import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import AdminShopListTable from './components/order/AdminShopListTable'

export default function AdminOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div className={cn('p-12 text-center rounded-2xl border', isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-600')}>
        <p className="text-base font-medium">Vui lòng đăng nhập để xem thông tin gian hàng và đơn hàng.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <HiOutlineOfficeBuilding className="h-7 w-7 text-amber-500" />
            <span>Gian Hàng & Đơn Hàng</span>
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Danh sách tất cả các gian hàng trên sàn. Click vào gian hàng bất kỳ để xem toàn bộ đơn hàng và quản lý ký quỹ.
          </p>
        </div>
      </div>

      {/* Danh sách gian hàng (Phân trang + Search + Lọc thời gian) */}
      <AdminShopListTable isDark={isDark} />
    </div>
  )
}
