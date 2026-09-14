import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../services/voucher'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import VoucherMetrics from './components/voucher/VoucherMetrics'
import VoucherTable from './components/voucher/VoucherTable'
import CreateVoucherModal from './components/voucher/CreateVoucherModal'

export default function ShopVouchers() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      const data = await voucherService.getShopManageVouchers()
      setVouchers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load shop vouchers error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Không thể tải danh sách voucher của shop')
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredVouchers = useMemo(() => {
    if (!searchTerm.trim()) return vouchers
    const term = searchTerm.toLowerCase()
    return vouchers.filter(
      (v) =>
        v.code?.toLowerCase().includes(term) ||
        v.title?.toLowerCase().includes(term)
    )
  }, [vouchers, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản Lý Voucher Gian Hàng
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
            Thiết lập mã giảm giá và chương trình ưu đãi độc quyền để tăng trưởng doanh số của shop
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all active:scale-95 shrink-0"
        >
          <HiOutlinePlus className="h-5 w-5" />
          Tạo Mã Giảm Giá Mới
        </button>
      </div>

      {/* 1. Metrics Overview */}
      <VoucherMetrics vouchers={vouchers} isDark={isDark} />

      {/* 2. Filter & Search Bar */}
      <div className={cn('rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo mã voucher hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full rounded-xl pl-9 pr-4 py-2 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
              isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400' : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400'
            )}
          />
          <HiOutlineSearch className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        </div>
      </div>

      {/* 3. Vouchers Data Table */}
      <VoucherTable
        vouchers={filteredVouchers}
        loading={loading}
        isDark={isDark}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      {/* 4. Create Voucher Modal */}
      <CreateVoucherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVouchers}
        isDark={isDark}
      />
    </div>
  )
}
