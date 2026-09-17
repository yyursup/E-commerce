import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../services/voucher'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import VoucherTable from './components/voucher/VoucherTable'
import CreateVoucherModal from './components/voucher/CreateVoucherModal'
import VoucherDetailModal from './components/voucher/VoucherDetailModal'

export default function ShopVouchers() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)

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
    return vouchers.filter((v) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        v.code?.toLowerCase().includes(term) ||
        v.title?.toLowerCase().includes(term) ||
        (v.voucherType && v.voucherType.toLowerCase().includes(term))

      if (!matchesSearch) return false

      // 2. Status filter
      const isExpired = v.endDate && new Date(v.endDate) < new Date()
      if (statusFilter === 'ALL') return true
      if (statusFilter === 'ACTIVE') return v.status === 'ACTIVE' && !isExpired
      if (statusFilter === 'INACTIVE') return v.status !== 'ACTIVE' && !isExpired
      if (statusFilter === 'EXPIRED') return isExpired

      return true
    })
  }, [vouchers, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions (Đồng bộ chuẩn với Quản lý Sản phẩm) */}
      <div className={cn(
        'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản Lý Voucher Gian Hàng
          </h1>
          <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tổng số: <span className="font-extrabold text-amber-500">{vouchers.length}</span> mã giảm giá độc quyền
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadVouchers}
            disabled={loading}
            className={cn(
              'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
              isDark
                ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
            title="Tải lại danh sách"
          >
            <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all"
          >
            <HiOutlinePlus className="h-4 w-4 stroke-[2.5]" />
            Tạo voucher mới
          </button>
        </div>
      </div>

      {/* Filter Bar & Search (Layout chung đồng bộ với ShopProducts) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Tìm theo mã voucher hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs border outline-none transition-all focus:ring-2 focus:ring-amber-500/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
            )}
          />
          <HiOutlineSearch className={cn('absolute left-3.5 top-3 h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
        </div>

        {/* Status Filter Tabs */}
        <div className={cn(
          'flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border transition-all self-start lg:self-auto',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-100/90'
        )}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'ACTIVE', label: 'Đang chạy' },
            { key: 'INACTIVE', label: 'Tạm dừng' },
            { key: 'EXPIRED', label: 'Hết hạn' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all',
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vouchers Data List */}
      <VoucherTable
        vouchers={filteredVouchers}
        loading={loading}
        isDark={isDark}
        search={searchTerm}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onSelectVoucher={(v) => setSelectedVoucher(v)}
      />

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <VoucherDetailModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      {/* Create Voucher Modal */}
      <CreateVoucherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVouchers}
        isDark={isDark}
      />
    </div>
  )
}
