import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineChartBar,
  HiOutlineViewGrid,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import CommissionAnalyticsTab from './components/commissions/CommissionAnalyticsTab'
import CategoryRatesTab from './components/commissions/CategoryRatesTab'
import DiscountPoliciesTab from './components/commissions/DiscountPoliciesTab'

const TABS = [
  {
    id: 'analytics',
    label: 'Thống Kê & Lịch Sử Thu Phí',
    icon: HiOutlineChartBar,
    desc: 'Tổng quan doanh thu, biểu đồ phân tích và danh sách đơn hàng',
  },
  {
    id: 'categories',
    label: 'Biểu Phí Ngành Hàng (Base Rate)',
    icon: HiOutlineViewGrid,
    desc: 'Cấu hình tỷ lệ hoa hồng cơ bản theo danh mục sản phẩm công nghệ',
  },
  {
    id: 'policies',
    label: 'Chính Sách Giảm Trừ Ký Quỹ & Thâm Niên',
    icon: HiOutlineShieldCheck,
    desc: 'Thiết lập ưu đãi giảm trừ theo Bậc sao Ký quỹ và Thâm niên hoạt động',
  },
]

export default function AdminCommissions() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') || 'analytics'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <HiOutlineChartBar className="h-7 w-7 text-amber-500" />
          Trung Tâm Quản Lý Hoa Hồng & Biểu Phí Toàn Sàn
        </h1>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Quản lý toàn diện cơ chế tính hoa hồng động 3 tầng (Biểu phí ngành hàng - Giảm trừ ký quỹ - Ưu đãi thâm niên)
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        className={cn(
          'flex flex-wrap gap-2 border-b p-1.5 rounded-2xl',
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200 shadow-sm'
        )}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200',
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-amber-500')} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {currentTab === 'analytics' && <CommissionAnalyticsTab />}
        {currentTab === 'categories' && <CategoryRatesTab />}
        {currentTab === 'policies' && <DiscountPoliciesTab />}
      </div>
    </div>
  )
}
