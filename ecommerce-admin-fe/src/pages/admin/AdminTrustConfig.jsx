import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineCash,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import EscrowFundSupervisionTab from './components/escrow-fund/EscrowFundSupervisionTab'
import TrustLevelConfigTab from './components/escrow-fund/TrustLevelConfigTab'

const TABS = [
  {
    id: 'funds',
    label: 'Giám Sát Quỹ & Xử Lý Trích Cọc',
    icon: HiOutlineCash,
    desc: 'Theo dõi số dư quỹ bảo chứng của các gian hàng, cảnh báo hụt quỹ và bồi thường tranh chấp',
  },
  {
    id: 'configs',
    label: 'Cấu Hình 5 Bậc Sao & Ngưỡng Ký Quỹ',
    icon: HiOutlineShieldCheck,
    desc: 'Thiết lập các mốc tiền ký quỹ, mức giảm trừ hoa hồng và đặc quyền theo bậc sao',
  },
]

export default function AdminTrustConfig() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') || 'funds'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <HiOutlineShieldCheck className="h-7 w-7 text-amber-500" />
          Quản Lý Quỹ Ký Quỹ & Độ Uy Tín Gian Hàng (Trust & Escrow)
        </h1>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Trung tâm điều hành vốn bảo chứng cam kết, giám sát hụt quỹ và cấu hình định lượng độ uy tín nhà bán
        </p>
      </div>

      {/* Tabs Navigation */}
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
        {currentTab === 'funds' && <EscrowFundSupervisionTab />}
        {currentTab === 'configs' && <TrustLevelConfigTab />}
      </div>
    </div>
  )
}
