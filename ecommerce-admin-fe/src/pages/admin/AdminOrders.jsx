import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { HiOutlineOfficeBuilding, HiOutlineDocumentReport } from 'react-icons/hi'
import AdminShopListTable from './components/order/AdminShopListTable'
import AdminExportSettlementModal from './components/order/AdminExportSettlementModal'
import orderService from '../../services/order'

export default function AdminOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [showExport, setShowExport] = useState(false)
  const [exportOrders, setExportOrders] = useState([])
  const [loadingExport, setLoadingExport] = useState(false)

  // Tải toàn bộ đơn của sàn khi mở modal (không tải sẵn vì danh sách có thể lớn)
  const openExport = async () => {
    try {
      setLoadingExport(true)
      const data = await orderService.getAllOrders()
      setExportOrders(Array.isArray(data) ? data : [])
      setShowExport(true)
    } catch (err) {
      toast.error(err?.message || 'Không thể tải đơn hàng để đối soát')
    } finally {
      setLoadingExport(false)
    }
  }

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
            <span>Gian hàng & đơn hàng</span>
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Danh sách tất cả các gian hàng trên sàn. Click vào gian hàng bất kỳ để xem toàn bộ đơn hàng và quản lý ký quỹ.
          </p>
        </div>
        <button
          type="button"
          onClick={openExport}
          disabled={loadingExport}
          className={cn(
            'inline-flex items-center gap-2 self-start rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-60',
            isDark
              ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
              : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
          )}
        >
          <HiOutlineDocumentReport className="h-4 w-4 text-amber-500" />
          <span>{loadingExport ? 'Đang tải đơn...' : 'Xuất báo cáo đối soát'}</span>
        </button>
      </div>

      {/* Danh sách gian hàng (Phân trang + Search + Lọc thời gian) */}
      <AdminShopListTable isDark={isDark} />

      <AdminExportSettlementModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        orders={exportOrders}
        isDark={isDark}
      />
    </div>
  )
}
