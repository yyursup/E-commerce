import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../services/voucher'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import { getVoucherDisplayStatus, VOUCHER_STATUS_FILTER_OPTIONS, canEditVoucher, canDeleteVoucher } from '../../lib/voucherStatus'
import AdminVoucherMetrics from './components/voucher/AdminVoucherMetrics'
import AdminVoucherTable from './components/voucher/AdminVoucherTable'
import CreateAdminVoucherModal from './components/voucher/CreateAdminVoucherModal'
import EditAdminVoucherModal from './components/voucher/EditAdminVoucherModal'
import DeleteAdminVoucherConfirmModal from './components/voucher/DeleteAdminVoucherConfirmModal'
import AdminVoucherDetailModal from './components/voucher/AdminVoucherDetailModal'

export default function AdminVouchers() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [deletingVoucher, setDeletingVoucher] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleOpenEdit = (v) => {
    if (!canEditVoucher(v)) {
      toast.error('Voucher này không đủ điều kiện để chỉnh sửa')
      return
    }
    setEditingVoucher(v)
  }

  const handleOpenDelete = (v) => {
    if (!canDeleteVoucher(v)) {
      toast.error('Voucher này không đủ điều kiện để xóa hoặc dừng')
      return
    }
    setDeletingVoucher(v)
  }

  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return
    try {
      setDeleteLoading(true)
      const res = await voucherService.deleteVoucher(deletingVoucher.id)
      if (res?.status === 'DELETED') {
        toast.success(`Đã hủy voucher sàn ${res.code || deletingVoucher.code} thành công!`)
      } else if (res?.status === 'INACTIVE') {
        toast.success(`Đã kết thúc sớm voucher sàn ${res.code || deletingVoucher.code}!`)
      } else {
        toast.success('Thao tác trên voucher sàn thành công!')
      }
      setDeletingVoucher(null)
      await loadVouchers()
    } catch (err) {
      console.error('Delete platform voucher error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Thao tác trên voucher sàn thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      const data = await voucherService.getPlatformVouchers()
      setVouchers(data?.content || (Array.isArray(data) ? data : []))
    } catch (err) {
      console.error('Load platform vouchers error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Không thể tải danh sách voucher toàn sàn')
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
        v.title?.toLowerCase().includes(term)

      if (!matchesSearch) return false

      // 2. Status filter
      if (statusFilter === 'ALL') return true
      const displayStatus = getVoucherDisplayStatus(v)
      return displayStatus.key === statusFilter
    })
  }, [vouchers, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản Trị Voucher Toàn Sàn
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
            Quản lý ngân sách khuyến mãi, mã trợ giá FreeShip GHN và chiến dịch voucher kích cầu toàn sàn
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all active:scale-95 shrink-0"
        >
          <HiOutlinePlus className="h-5 w-5" />
          Tạo Voucher Toàn Sàn
        </button>
      </div>

      {/* 1. Metrics Overview */}
      <AdminVoucherMetrics vouchers={vouchers} isDark={isDark} />

      {/* 2. Filter & Search Bar */}
      <div className={cn('rounded-2xl border p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo mã voucher hoặc tên chiến dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full rounded-xl pl-9 pr-4 py-2 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
              isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400' : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400'
            )}
          />
          <HiOutlineSearch className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        </div>

        {/* Status Filter Tabs */}
        <div className={cn(
          'flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border transition-all self-start lg:self-auto',
          isDark ? 'border-slate-800 bg-slate-800/60' : 'border-stone-200 bg-stone-100/80'
        )}>
          {VOUCHER_STATUS_FILTER_OPTIONS.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-xl transition-all',
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Vouchers Data Table */}
      <AdminVoucherTable
        vouchers={filteredVouchers}
        loading={loading}
        isDark={isDark}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onEditVoucher={handleOpenEdit}
        onDeleteVoucher={handleOpenDelete}
        onSelectVoucher={setSelectedVoucher}
      />

      {/* 4. Create Platform Voucher Modal */}
      <CreateAdminVoucherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVouchers}
        isDark={isDark}
      />

      {/* 5. Edit Platform Voucher Modal */}
      {editingVoucher && (
        <EditAdminVoucherModal
          isOpen={Boolean(editingVoucher)}
          onClose={() => setEditingVoucher(null)}
          onSuccess={loadVouchers}
          voucher={editingVoucher}
          isDark={isDark}
        />
      )}

      {/* 6. Admin Voucher Detail Modal */}
      {selectedVoucher && (
        <AdminVoucherDetailModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          onEditVoucher={(v) => {
            setSelectedVoucher(null)
            handleOpenEdit(v)
          }}
          onDeleteVoucher={(v) => {
            setSelectedVoucher(null)
            handleOpenDelete(v)
          }}
          isDark={isDark}
        />
      )}

      {/* 7. Delete / End Platform Voucher Confirm Modal */}
      {deletingVoucher && (
        <DeleteAdminVoucherConfirmModal
          isOpen={Boolean(deletingVoucher)}
          onClose={() => !deleteLoading && setDeletingVoucher(null)}
          onConfirm={handleConfirmDelete}
          voucher={deletingVoucher}
          loading={deleteLoading}
          isDark={isDark}
        />
      )}
    </div>
  )
}
