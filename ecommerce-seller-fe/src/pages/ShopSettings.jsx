import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineBadgeCheck,
  HiOutlineSave,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import BankSelector from '../components/BankSelector'

export default function ShopSettings() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [shopName, setShopName] = useState(user?.shopName || 'Gian hàng chính hãng')
  const [phone, setPhone] = useState('0987654321')
  const [address, setAddress] = useState('Kho hàng 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh')
  const [bankName, setBankName] = useState('Vietcombank')
  const [accountNumber, setAccountNumber] = useState('998877665544')
  const [accountName, setAccountName] = useState(user?.email || 'NGUYEN VAN A')

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Đã lưu thông tin cài đặt gian hàng và kho GHN thành công!')
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className={cn('rounded-3xl border p-6 shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
          Cài Đặt Gian Hàng & Kho Vận Chuyển
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
          Cập nhật thông tin nhận diện cửa hàng và cấu hình kho lấy hàng cho GHN Express
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Thông tin Shop */}
        <div className={cn('rounded-3xl border p-6 shadow-sm space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineOfficeBuilding className="h-5 w-5" />
            Thông Tin Gian Hàng
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên Gian Hàng</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Hotline Cửa Hàng</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Địa chỉ kho lấy hàng GHN */}
        <div className={cn('rounded-3xl border p-6 shadow-sm space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineTruck className="h-5 w-5" />
            Kho Lấy Hàng GHN Express (Giao Hàng Nhanh)
          </div>

          <div className="text-xs space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Địa Chỉ Kho Chi Tiết (Shipper GHN sẽ đến đây lấy hàng)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3.5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <HiOutlineBadgeCheck className="h-5 w-5 shrink-0" />
              <span>Kho hàng đã được liên kết trực tiếp với API GHN Express. Đơn hàng mới sẽ tự động sinh mã vận đơn giao toàn quốc.</span>
            </div>
          </div>
        </div>

        {/* Section 3: Tài khoản ngân hàng nhận doanh thu */}
        <div className={cn('rounded-3xl border p-6 shadow-sm space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineCreditCard className="h-5 w-5" />
            Tài Khoản Ngân Hàng Nhận Doanh Thu
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên Ngân Hàng</label>
              <BankSelector
                value={bankName}
                onChange={(val) => setBankName(val)}
                isDark={isDark}
                placeholder="Chọn ngân hàng..."
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Số Tài Khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên Chủ Tài Khoản</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all"
        >
          <HiOutlineSave className="h-4 w-4" />
          Lưu thay đổi cài đặt
        </button>
      </form>
    </div>
  )
}
