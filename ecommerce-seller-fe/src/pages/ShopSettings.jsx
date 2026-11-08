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
import authService from '../services/auth'
import escrowFundService from '../services/escrowFund'
import shopService from '../services/shop'
import walletService from '../services/wallet'

export default function ShopSettings() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user, updateUser } = useAuthStore()

  const [shopName, setShopName] = useState(user?.shopName || 'Gian hàng chính hãng')
  const [phone, setPhone] = useState('0987654321')
  const [address, setAddress] = useState('Kho hàng 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh')
  const [bankName, setBankName] = useState(user?.bankName || 'Vietcombank')
  const [accountNumber, setAccountNumber] = useState(user?.bankAccountNumber || '998877665544')
  const [accountName, setAccountName] = useState(user?.bankAccountName || user?.fullName || user?.email || 'NGUYEN VAN A')

  // Escrow States
  const [escrowFund, setEscrowFund] = useState(null)

  useEffect(() => {
    if (user) {
      if (user.bankName) setBankName(user.bankName)
      if (user.bankAccountNumber) setAccountNumber(user.bankAccountNumber)
      if (user.bankAccountName) setAccountName(user.bankAccountName)
    }

    // Sync latest user profile with bank info from backend
    authService.getUserProfile().then((profile) => {
      if (profile) {
        if (profile.bankName) setBankName(profile.bankName)
        if (profile.bankAccountNumber) setAccountNumber(profile.bankAccountNumber)
        if (profile.bankAccountName) setAccountName(profile.bankAccountName)
        if (updateUser) {
          updateUser({
            bankName: profile.bankName,
            bankAccountNumber: profile.bankAccountNumber,
            bankAccountName: profile.bankAccountName,
          })
        }
      }
    }).catch(() => {})
  }, [user, updateUser])

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

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (bankName && accountNumber && accountName) {
        await walletService.updateBankInfo({
          bankName: bankName.trim(),
          bankAccountNumber: accountNumber.trim(),
          bankAccountName: accountName.trim().toUpperCase(),
        })
        if (updateUser) {
          updateUser({
            bankName: bankName.trim(),
            bankAccountNumber: accountNumber.trim(),
            bankAccountName: accountName.trim().toUpperCase(),
          })
        }
      }
      toast.success('Đã lưu thông tin cài đặt gian hàng và tài khoản ngân hàng thành công!')
    } catch (err) {
      console.error('Lỗi cập nhật bank info:', err)
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu thông tin')
    }
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
          Cài đặt gian hàng & kho vận chuyển
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
          Cập nhật thông tin nhận diện cửa hàng và cấu hình kho lấy hàng cho GHN Express
        </p>
      </div>

      {/* Escrow Section */}
      <div className={cn('rounded-3xl border p-6 space-y-4 relative overflow-hidden',
        isDark ? 'border-amber-900/30 bg-gradient-to-br from-slate-900 to-amber-950/20' : 'border-amber-200 bg-gradient-to-br from-white to-amber-50'
      )}>
        <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/50 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-500">
            <HiOutlineShieldCheck className="h-6 w-6" />
            Loại hình gian hàng (Quỹ bảo chứng)
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-full dark:bg-amber-900/40 dark:text-amber-400 bg-stone-100 text-stone-950">
            {isNone ? 'Tiêu Chuẩn' : (isPending ? 'Chờ Ký Quỹ' : 'Đã Ký Quỹ (Uy Tín)')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-stone-600 dark:text-slate-300 max-w-lg space-y-2">
            <p>Nâng cấp gian hàng thành <strong>Gian hàng ký quỹ</strong> để được ưu tiên hiển thị, tăng niềm tin với khách hàng và cấp huy hiệu uy tín.</p>
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
                    ? 'border-amber-600 bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 hover:dark:bg-rose-900/50')
              )}
            >
              {isNone ? 'Nâng cấp lên Ký Quỹ' : (isPaid ? 'Đã Ký Quỹ' : 'Hủy Yêu Cầu Ký Quỹ')}
            </button>
            {isPaid && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                Bạn không thể hạ cấp gian hàng. Tiền ký quỹ chỉ được hoàn trả khi bạn Xóa/Đóng gian hàng.
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Thông tin Shop */}
        <div className={cn('rounded-3xl border p-6 space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineOfficeBuilding className="h-5 w-5" />
            Thông tin gian hàng
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên gian hàng</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Hotline cửa hàng</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Địa chỉ kho lấy hàng GHN */}
        <div className={cn('rounded-3xl border p-6 space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineTruck className="h-5 w-5" />
            Kho lấy hàng GHN Express (Giao hàng nhanh)
          </div>

          <div className="text-xs space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Địa Chỉ Kho Chi Tiết (Shipper GHN sẽ đến đây lấy hàng)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none',
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
        <div className={cn('rounded-3xl border p-6 space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 border-b border-stone-100 dark:border-slate-800 pb-3">
            <HiOutlineCreditCard className="h-5 w-5" />
            Tài khoản ngân hàng nhận doanh thu
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên ngân hàng</label>
              <BankSelector
                value={bankName}
                onChange={(val) => setBankName(val)}
                isDark={isDark}
                placeholder="Chọn ngân hàng..."
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Số tài khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-700 dark:text-slate-300">Tên chủ tài khoản</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={cn('w-full rounded-xl px-4 py-2.5 border transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40 focus:outline-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold shadow-md transition-all bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
        >
          <HiOutlineSave className="h-4 w-4" />
          Lưu thay đổi cài đặt
        </button>
      </form>
    </div>
  )
}
