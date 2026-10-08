import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineSearch,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import PlatformWalletTab from './components/finances/PlatformWalletTab'
import OrderEscrowsTab from './components/finances/OrderEscrowsTab'
import WalletLookupTab from './components/finances/WalletLookupTab'

const TABS = [
  {
    id: 'wallet',
    label: 'Ví Hệ Thống Sàn',
    icon: HiOutlineCreditCard,
    desc: 'Số dư khả dụng và tiền đóng băng của toàn sàn giao dịch',
  },
  {
    id: 'escrows',
    label: 'Tạm Giữ Đơn Hàng (Order Escrow)',
    icon: HiOutlineCurrencyDollar,
    desc: 'Bảo lãnh tiền người mua thanh toán trước, giải ngân cưỡng chế',
  },
  {
    id: 'lookup',
    label: 'Tra Cứu Ví Thành Viên',
    icon: HiOutlineSearch,
    desc: 'Kiểm tra số dư và trạng thái ví của User và Shop',
  },
]

export default function AdminPlatformWallet() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') || 'wallet'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <HiOutlineCreditCard className="h-7 w-7 text-amber-500" />
          Trung Tâm Tài Chính & Dòng Tiền (Financial Hub)
        </h1>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Quản lý tổng thể dòng tiền hệ thống, bảo chứng giao dịch Escrow và tra cứu ví thành viên
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
        {currentTab === 'wallet' && <PlatformWalletTab />}
        {currentTab === 'escrows' && <OrderEscrowsTab />}
        {currentTab === 'lookup' && <WalletLookupTab />}
      </div>
    </div>
  )
}
