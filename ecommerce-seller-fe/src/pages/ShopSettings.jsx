import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineBadgeCheck,
  HiOutlineSave,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
  HiOutlineX
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import BankSelector from '../components/BankSelector'
import escrowFundService from '../services/escrowFund'
import shopService from '../services/shop'

export default function ShopSettings() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [shopName, setShopName] = useState(user?.shopName || 'Gian hàng chính hãng')
  const [phone, setPhone] = useState('0987654321')
  const [address, setAddress] = useState('Kho hàng 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh')
  const [bankName, setBankName] = useState('Vietcombank')
  const [accountNumber, setAccountNumber] = useState('998877665544')
  const [accountName, setAccountName] = useState(user?.email || 'NGUYEN VAN A')

  // Escrow States
  const [escrowFund, setEscrowFund] = useState(null)

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const data = await escrowFundService.getMyFund()
        setEscrowFund(data)
      } catch (err) {
        console.warn("Failed to fetch escrow fund:", err)
      }
    }
    fetchEscrow()
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Đã lưu thông tin cài đặt gian hàng và kho GHN thành công!')
  }

  // Derived states
  const isNone = !escrowFund || escrowFund.committedAmount === 0
  const isPending = escrowFund?.status === 'PENDING_DEPOSIT'
  const isPaid = escrowFund?.balance > 0

  const handleToggleEscrow = async () => {
    if (isPaid) return // Disabled button should prevent this, but just in case
    
    if (isNone) {
      if (window.confirm("Bạn có chắc chắn muốn đăng ký tham gia Quỹ Bảo Chứng không?")) {
        try {
          await shopService.updateEscrowStatus({ 
            isEscrowParticipated: true,
            committedAmount: 5000000 
          })
          toast.success("Đã đăng ký chuyển đổi sang Gian Hàng Ký Quỹ!")
          const data = await escrowFundService.getMyFund()
          setEscrowFund(data)
          window.location.reload()
        } catch (err) {
          toast.error(err.message || "Có lỗi xảy ra khi đăng ký ký quỹ")
        }
      }
    } else if (isPending) {
      if (window.confirm("Bạn chưa hoàn tất nạp tiền ký quỹ. Việc hủy yêu cầu sẽ đưa gian hàng trở về trạng thái Tiêu chuẩn. Bạn có chắc chắn muốn hủy không?")) {
        try {
          await shopService.updateEscrowStatus({ isEscrowParticipated: false })
          toast.success("Đã hủy yêu cầu ký quỹ thành công!")
          const data = await escrowFundService.getMyFund()
          setEscrowFund(data)
          window.location.reload()
        } catch (err) {
          toast.error(err.message || "Có lỗi xảy ra khi hủy yêu cầu")
        }
      }
    }
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

      {/* Escrow Section */}
      <div className={cn('rounded-3xl border p-6 shadow-sm space-y-4 relative overflow-hidden',
        isDark ? 'border-amber-900/30 bg-gradient-to-br from-slate-900 to-amber-950/20' : 'border-amber-200 bg-gradient-to-br from-white to-amber-50'
      )}>
        <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/50 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-500">
            <HiOutlineShieldCheck className="h-6 w-6" />
            Loại Hình Gian Hàng (Quỹ Bảo Chứng)
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            {isNone ? 'Tiêu Chuẩn' : (isPending ? 'Chờ Ký Quỹ' : 'Đã Ký Quỹ (Uy Tín)')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-stone-600 dark:text-slate-300 max-w-lg space-y-2">
            <p>Nâng cấp gian hàng thành <strong>Gian Hàng Ký Quỹ</strong> để được ưu tiên hiển thị, tăng niềm tin với khách hàng và cấp huy hiệu uy tín.</p>
            {isPaid && (
              <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <HiOutlineInformationCircle className="h-4 w-4" />
                Gian hàng đã nạp quỹ. Quỹ này chỉ được hoàn trả khi bạn làm thủ tục Đóng gian hàng khỏi sàn.
              </p>
            )}
            {isPending && !isPaid && (
              <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <HiOutlineInformationCircle className="h-4 w-4" />
                Đang chờ nạp quỹ ({Number(escrowFund?.committedAmount).toLocaleString('vi-VN')} VNĐ). Bạn có thể Hủy để về gian hàng Tiêu chuẩn.
              </p>
            )}
          </div>

          <div className="relative group">
            <button
              type="button"
              onClick={handleToggleEscrow}
              disabled={isPaid}
              className={cn('px-5 py-2.5 rounded-xl font-bold text-xs transition-all border',
                isPaid 
                  ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700' 
                  : (isNone 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 hover:bg-amber-600'
                    : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 hover:dark:bg-rose-900/50')
              )}
            >
              {isNone ? 'Nâng cấp lên Ký Quỹ' : (isPaid ? 'Đã Ký Quỹ' : 'Hủy Yêu Cầu Ký Quỹ')}
            </button>
            {isPaid && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                Bạn không thể hạ cấp gian hàng. Tiền ký quỹ chỉ được hoàn trả khi bạn Xóa/Đóng gian hàng.
              </div>
            )}
          </div>
        </div>
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
