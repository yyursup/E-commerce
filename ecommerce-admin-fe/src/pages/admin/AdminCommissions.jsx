import { useSearchParams } from 'react-router-dom'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import CommissionAnalyticsTab from './components/commissions/CommissionAnalyticsTab'
import CategoryRatesTab from './components/commissions/CategoryRatesTab'
import DiscountPoliciesTab from './components/commissions/DiscountPoliciesTab'

const TABS = [
  {
    id: 'analytics',
    label: 'Thống kê & lịch sử thu phí',
  },
  {
    id: 'categories',
    label: 'Biểu phí ngành hàng',
  },
  {
    id: 'policies',
    label: 'Ưu đãi thâm niên & mô phỏng phí',
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
        <h1 className="text-2xl font-bold">Hoa hồng & biểu phí</h1>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Hoa hồng tính theo ba lớp: biểu phí ngành hàng, giảm trừ theo ký quỹ và ưu đãi thâm niên.
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div role="tablist" className={cn('flex flex-wrap gap-x-6 border-b', isDark ? 'border-slate-800' : 'border-stone-200')}>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                '-mb-px border-b-2 py-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-stone-950 text-stone-950 dark:border-white dark:text-white'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-white'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
              )}
            >
              {tab.label}
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
