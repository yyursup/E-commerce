import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlus, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../services/voucher'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import { getVoucherDisplayStatus, VOUCHER_STATUS_FILTER_OPTIONS } from '../../lib/voucherStatus'
import VoucherTable from './components/voucher/VoucherTable'
import CreateVoucherModal from './components/voucher/CreateVoucherModal'
import VoucherDetailModal from './components/voucher/VoucherDetailModal'
import EditVoucherModal from './components/voucher/EditVoucherModal'
import DeleteVoucherConfirmModal from './components/voucher/DeleteVoucherConfirmModal'

export default function ShopVouchers() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const user = useAuthStore((s) => s.user)
  const isShopClosed = user?.shopStatus === 'CLOSED'
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [deletingVoucher, setDeletingVoucher] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleOpenEdit = (v) => {
    if (isShopClosed) {
      toast.error('Gian hàng đã đóng cửa (CLOSED). Không thể chỉnh sửa voucher.')
      return
    }
    setEditingVoucher(v)
  }

  const handleOpenDelete = (v) => {
    setDeletingVoucher(v)
  }

  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return
    try {
      setDeleteLoading(true)
      const res = await voucherService.deleteVoucher(deletingVoucher.id)
      if (res?.status === 'DELETED') {
        toast.success(`Đã hủy voucher ${res.code || deletingVoucher.code} thành công`)
      } else if (res?.status === 'INACTIVE') {
        toast.success(`Đã kết thúc sớm voucher ${res.code || deletingVoucher.code}`)
      } else {
        toast.success('Thao tác trên voucher thành công')
      }
      setDeletingVoucher(null)
      setSelectedVoucher(null)
      await loadVouchers()
    } catch (err) {
      console.error('Delete voucher error:', err)
      const msg = err?.message || err?.response?.data?.message || 'Không thể thực hiện thao tác trên voucher'
      toast.error(msg)
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
      if (statusFilter === 'ALL') return true
      const displayStatus = getVoucherDisplayStatus(v)
      return displayStatus.key === statusFilter
    })
  }, [vouchers, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions (Đồng bộ chuẩn với Quản lý Sản phẩm) */}
      <div className={cn(
        'rounded-3xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản lý voucher gian hàng
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
            onClick={() => {
              if (isShopClosed) {
                toast.error('Gian hàng đã đóng cửa (CLOSED). Không thể tạo voucher mới.')
                return
              }
              setShowCreateModal(true)
            }}
            disabled={isShopClosed}
            className={cn(
              "flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-md",
              isShopClosed
                ? "bg-stone-300 text-stone-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                : "active:scale-95 bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
            )}
            title={isShopClosed ? 'Gian hàng đã đóng cửa' : undefined}
          >
            <HiOutlinePlus className="h-4 w-4 stroke-[2.5]" />
            Tạo voucher mới
          </button>
        </div>
      </div>

      {/* Cảnh báo gian hàng đã đóng cửa */}
      {isShopClosed && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-300">
              Gian hàng đã hoàn tất thủ tục đóng cửa (CLOSED)
            </p>
            <p className={cn('mt-0.5', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Hệ thống đã khóa tính năng tạo mới và phát hành mã giảm giá. Danh sách voucher dưới đây chỉ phục vụ việc theo dõi lịch sử.
            </p>
          </div>
        </div>
      )}

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
              'w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs border outline-none transition-all focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-stone-950 dark:focus:border-white'
                : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-950 dark:focus:border-white'
            )}
          />
          <HiOutlineSearch className={cn('absolute left-3.5 top-3 h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
        </div>

        {/* Status Filter Tabs */}
        <div className={cn(
          'flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border transition-all self-start lg:self-auto',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-100/90'
        )}>
          {VOUCHER_STATUS_FILTER_OPTIONS.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all',
                  isActive
                    ? 'bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200'
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
        onEditVoucher={handleOpenEdit}
        onDeleteVoucher={handleOpenDelete}
        isShopClosed={isShopClosed}
      />

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <VoucherDetailModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          onEditVoucher={handleOpenEdit}
          onDeleteVoucher={handleOpenDelete}
          isShopClosed={isShopClosed}
        />
      )}

      {/* Create Voucher Modal */}
      <CreateVoucherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVouchers}
        isDark={isDark}
      />

      {/* Edit Voucher Modal */}
      {editingVoucher && (
        <EditVoucherModal
          isOpen={Boolean(editingVoucher)}
          onClose={() => setEditingVoucher(null)}
          onSuccess={loadVouchers}
          voucher={editingVoucher}
          isDark={isDark}
          isShopClosed={isShopClosed}
        />
      )}

      {/* Delete / End Voucher Confirm Modal */}
      {deletingVoucher && (
        <DeleteVoucherConfirmModal
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
