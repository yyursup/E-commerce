import { useState, useEffect, useMemo } from 'react'
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineScale,
  HiOutlineShieldCheck,
  HiOutlineX,
  HiOutlineFilter,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import policyService from '../../services/policy'
import PolicyTable from './components/policies/PolicyTable'
import PolicyModal from './components/policies/PolicyModal'
import PolicyPreviewModal from './components/policies/PolicyPreviewModal'

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Toàn sàn (Tất cả)', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'SELLER', label: 'Dành cho Người bán', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'BUYER', label: 'Dành cho Người mua', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
]

const CATEGORY_OPTIONS = [
  { value: 'ESCROW', label: 'Bảo Vệ Escrow' },
  { value: 'RETURN_REFUND', label: 'Đổi Trả & Khiếu Nại' },
  { value: 'CONDITION_GRADE', label: 'Phân Hạng Hàng Cũ & Like New' },
  { value: 'SHIPPING', label: 'Vận Chuyển GHN & Đồng Kiểm' },
  { value: 'SELLER_RULES', label: 'Quy Chế Người Bán' },
  { value: 'DISCIPLINE', label: 'Kỷ Luật & Điểm Uy Tín' },
  { value: 'PRIVACY', label: 'Chính Sách Bảo Mật' },
  { value: 'GENERAL', label: 'Quy Chế Hoạt Động Chung' },
]

const CATEGORY_MAP = {
  ...CATEGORY_OPTIONS.reduce((acc, curr) => {
    acc[curr.value] = curr.label
    return acc
  }, {}),
  SELLER: 'Quy Chế Người Bán',
  RETURN: 'Đổi Trả & Khiếu Nại',
  CONDITION: 'Phân Hạng Hàng Cũ & Like New',
  GRADING: 'Phân Hạng Hàng Cũ & Like New',
  TERMS: 'Quy Chế Hoạt Động',
}

const AUDIENCE_MAP = AUDIENCE_OPTIONS.reduce((acc, curr) => {
  acc[curr.value] = curr
  return acc
}, {})

export default function AdminPolicies() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  // Policies state
  const [policies, setPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [policySearch, setPolicySearch] = useState('')
  const [policyAudienceFilter, setPolicyAudienceFilter] = useState('ALL')
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState('ALL')
  const [policyStatusFilter, setPolicyStatusFilter] = useState('ALL')

  // Modals state
  const [editingPolicy, setEditingPolicy] = useState(null)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    policyKey: '',
    title: '',
    summary: '',
    content: '',
    category: 'GENERAL',
    targetAudience: 'ALL',
    version: '1.0',
    displayOrder: 0,
    isActive: true,
  })

  const [saving, setSaving] = useState(false)

  // Fetch Policies
  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true)
      const data = await policyService.getAllPoliciesAdmin()
      setPolicies(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi khi tải danh sách chính sách:', err)
      toast.error(err.message || 'Không thể tải danh sách chính sách nền tảng')
    } finally {
      setLoadingPolicies(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        !policySearch ||
        p.title?.toLowerCase().includes(policySearch.toLowerCase()) ||
        p.policyKey?.toLowerCase().includes(policySearch.toLowerCase()) ||
        p.summary?.toLowerCase().includes(policySearch.toLowerCase())

      const matchAudience =
        policyAudienceFilter === 'ALL' || p.targetAudience === policyAudienceFilter

      const matchCategory =
        policyCategoryFilter === 'ALL' || p.category === policyCategoryFilter

      const matchStatus =
        policyStatusFilter === 'ALL' ||
        (policyStatusFilter === 'ACTIVE' && p.isActive) ||
        (policyStatusFilter === 'INACTIVE' && !p.isActive)

      return matchSearch && matchAudience && matchCategory && matchStatus
    })
  }, [policies, policySearch, policyAudienceFilter, policyCategoryFilter, policyStatusFilter])

  const hasActiveFilters =
    Boolean(policySearch) ||
    policyAudienceFilter !== 'ALL' ||
    policyCategoryFilter !== 'ALL' ||
    policyStatusFilter !== 'ALL'

  const handleClearFilters = () => {
    setPolicySearch('')
    setPolicyAudienceFilter('ALL')
    setPolicyCategoryFilter('ALL')
    setPolicyStatusFilter('ALL')
  }

  // Handlers for Policy Modal
  const handleOpenCreatePolicy = () => {
    setEditingPolicy(null)
    setPolicyForm({
      policyKey: '',
      title: '',
      summary: '',
      content: '',
      category: 'GENERAL',
      targetAudience: 'ALL',
      version: '1.0',
      displayOrder: (policies.length + 1) * 10,
      isActive: true,
    })
    setIsPolicyModalOpen(true)
  }

  const handleOpenEditPolicy = (policy) => {
    setEditingPolicy(policy)
    setPolicyForm({
      policyKey: policy.policyKey,
      title: policy.title,
      summary: policy.summary || '',
      content: policy.content || '',
      category: policy.category || 'GENERAL',
      targetAudience: policy.targetAudience || 'ALL',
      version: policy.version || '1.0',
      displayOrder: policy.displayOrder || 0,
      isActive: policy.isActive ?? true,
    })
    setIsPolicyModalOpen(true)
  }

  const handleSavePolicy = async (e) => {
    e.preventDefault()
    if (!policyForm.policyKey?.trim() || !policyForm.title?.trim() || !policyForm.content?.trim()) {
      toast.error('Vui lòng điền mã chính sách, tiêu đề và nội dung đầy đủ')
      return
    }

    try {
      setSaving(true)
      if (editingPolicy) {
        await policyService.updatePolicy(editingPolicy.id, policyForm)
        toast.success(`Cập nhật chính sách "${policyForm.title}" thành công!`)
      } else {
        await policyService.createPolicy(policyForm)
        toast.success(`Thêm mới chính sách "${policyForm.title}" thành công!`)
      }
      setIsPolicyModalOpen(false)
      fetchPolicies()
    } catch (err) {
      toast.error(err.message || 'Không thể lưu chính sách')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (policy) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa chính sách "${policy.title}" (${policy.policyKey}) không?`
      )
    ) {
      return
    }
    try {
      await policyService.deletePolicy(policy.id)
      toast.success('Đã xóa chính sách thành công')
      fetchPolicies()
    } catch (err) {
      toast.error(err.message || 'Không thể xóa chính sách')
    }
  }

  const handleTogglePolicyActive = async (policy) => {
    try {
      await policyService.updatePolicy(policy.id, {
        ...policy,
        isActive: !policy.isActive,
      })
      toast.success(`Đã ${!policy.isActive ? 'kích hoạt' : 'tắt kích hoạt'} chính sách`)
      fetchPolicies()
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái')
    }
  }

  return (
    <div className={cn('space-y-6', isDark ? 'text-slate-100' : 'text-stone-900')}>
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
            <HiOutlineShieldCheck className="h-4 w-4" />
            Hệ Thống Quản Lý Quy Chế Tập Trung
          </div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
            <HiOutlineDocumentText className="h-7 w-7 text-amber-500 shrink-0" />
            <span>Chính Sách & Quy Định Nền Tảng</span>
          </h1>
          <p className={cn('mt-1.5 text-xs sm:text-sm max-w-2xl', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hệ thống chính sách động: cấu hình toàn bộ quy chế hoạt động sàn, điều khoản ký quỹ Escrow, đổi trả, phân hạng và căn cứ phán quyết tranh chấp
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreatePolicy}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition active:scale-95"
          >
            <HiOutlinePlus className="h-4 w-4" />
            <span>Thêm Chính Sách Mới</span>
          </button>

          <button
            type="button"
            onClick={fetchPolicies}
            title="Làm mới danh sách"
            className={cn(
              'rounded-2xl border p-2.5 transition active:scale-95 shadow-xs',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            )}
          >
            <HiOutlineRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={cn(
            'rounded-3xl border p-4 sm:p-5 relative overflow-hidden transition shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tổng văn bản
            </p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <HiOutlineDocumentText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-500">{policies.length}</p>
        </div>

        <div
          className={cn(
            'rounded-3xl border p-4 sm:p-5 relative overflow-hidden transition shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang có hiệu lực
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <HiOutlineCheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-500">
            {policies.filter((p) => p.isActive).length}
          </p>
        </div>

        <div
          className={cn(
            'rounded-3xl border p-4 sm:p-5 relative overflow-hidden transition shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Dành cho Người bán
            </p>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <HiOutlineScale className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-purple-500">
            {policies.filter((p) => p.targetAudience === 'SELLER').length}
          </p>
        </div>

        <div
          className={cn(
            'rounded-3xl border p-4 sm:p-5 relative overflow-hidden transition shadow-xs',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Toàn sàn & Người mua
            </p>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <HiOutlineShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-blue-500">
            {policies.filter((p) => p.targetAudience === 'ALL' || p.targetAudience === 'BUYER').length}
          </p>
        </div>
      </div>

      {/* 3. Filters Bar */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={policySearch}
            onChange={(e) => setPolicySearch(e.target.value)}
            placeholder="Tìm theo tên chính sách, mã key hoặc tóm tắt..."
            className={cn(
              'w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
            )}
          />
          {policySearch && (
            <button
              type="button"
              onClick={() => setPolicySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
            >
              <HiOutlineX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={policyAudienceFilter}
            onChange={(e) => setPolicyAudienceFilter(e.target.value)}
            className={cn(
              'px-3 py-2.5 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-stone-50 border-stone-200 text-stone-700'
            )}
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="SELLER">Chỉ Người bán</option>
            <option value="BUYER">Chỉ Người mua</option>
          </select>

          <select
            value={policyCategoryFilter}
            onChange={(e) => setPolicyCategoryFilter(e.target.value)}
            className={cn(
              'px-3 py-2.5 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-stone-50 border-stone-200 text-stone-700'
            )}
          >
            <option value="ALL">Tất cả danh mục</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={policyStatusFilter}
            onChange={(e) => setPolicyStatusFilter(e.target.value)}
            className={cn(
              'px-3 py-2.5 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-stone-50 border-stone-200 text-stone-700'
            )}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đang tạm ẩn</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-2xl text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition"
            >
              <HiOutlineFilter className="h-3.5 w-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter Bar */}
      <div className="flex items-center justify-between text-xs px-1 text-stone-400">
        <span>
          Hiển thị <strong>{filteredPolicies.length}</strong> / <strong>{policies.length}</strong> văn bản chính sách
        </span>
      </div>

      {/* 4. Policies Table & Mobile Cards */}
      <div
        className={cn(
          'rounded-3xl border overflow-hidden shadow-xs',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <PolicyTable
          policies={filteredPolicies}
          isDark={isDark}
          loading={loadingPolicies}
          audienceOptions={AUDIENCE_OPTIONS}
          categoryOptions={CATEGORY_OPTIONS}
          categoryMap={CATEGORY_MAP}
          onPreview={(p) => setPreviewPolicy(p)}
          onEdit={handleOpenEditPolicy}
          onDelete={handleDeletePolicy}
          onToggleActive={handleTogglePolicyActive}
        />
      </div>

      {/* 5. Create / Edit Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        isDark={isDark}
        onClose={() => setIsPolicyModalOpen(false)}
        onSubmit={handleSavePolicy}
        editingPolicy={editingPolicy}
        policyForm={policyForm}
        setPolicyForm={setPolicyForm}
        saving={saving}
        audienceOptions={AUDIENCE_OPTIONS}
        categoryOptions={CATEGORY_OPTIONS}
      />

      {/* 6. Preview Policy Modal */}
      <PolicyPreviewModal
        policy={previewPolicy}
        isDark={isDark}
        onClose={() => setPreviewPolicy(null)}
        categoryMap={CATEGORY_MAP}
        audienceMap={AUDIENCE_MAP}
      />
    </div>
  )
}
