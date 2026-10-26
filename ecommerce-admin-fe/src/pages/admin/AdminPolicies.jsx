import { useState, useEffect, useMemo } from 'react'
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineTag,
  HiOutlineX,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import policyService from '../../services/policy'

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
        policyAudienceFilter === 'ALL' ||
        p.targetAudience === policyAudienceFilter

      const matchCategory =
        policyCategoryFilter === 'ALL' ||
        p.category === policyCategoryFilter

      const matchStatus =
        policyStatusFilter === 'ALL' ||
        (policyStatusFilter === 'ACTIVE' && p.isActive) ||
        (policyStatusFilter === 'INACTIVE' && !p.isActive)

      return matchSearch && matchAudience && matchCategory && matchStatus
    })
  }, [policies, policySearch, policyAudienceFilter, policyCategoryFilter, policyStatusFilter])

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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chính sách "${policy.title}" (${policy.policyKey}) không?`)) {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <HiOutlineDocumentText className="h-7 w-7 text-amber-500" />
            Chính Sách & Quy Định Nền Tảng (Platform Policies)
          </h1>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hệ thống chính sách động tập trung: toàn bộ quy chế sàn, điều khoản bảo vệ Escrow, đổi trả, phân hạng hàng và căn cứ phán quyết tranh chấp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreatePolicy}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Thêm Chính Sách Mới
          </button>

          <button
            onClick={fetchPolicies}
            title="Làm mới dữ liệu"
            className={cn(
              'rounded-xl border p-2.5 transition',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={cn('rounded-2xl border p-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Tổng văn bản chính sách</p>
          <p className="mt-1 text-2xl font-black text-amber-500">{policies.length}</p>
        </div>
        <div className={cn('rounded-2xl border p-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Đang có hiệu lực</p>
          <p className="mt-1 text-2xl font-black text-emerald-500">{policies.filter((p) => p.isActive).length}</p>
        </div>
        <div className={cn('rounded-2xl border p-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Dành cho Người bán</p>
          <p className="mt-1 text-2xl font-black text-purple-500">
            {policies.filter((p) => p.targetAudience === 'SELLER').length}
          </p>
        </div>
        <div className={cn('rounded-2xl border p-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Toàn sàn / Người mua</p>
          <p className="mt-1 text-2xl font-black text-blue-500">
            {policies.filter((p) => p.targetAudience === 'ALL' || p.targetAudience === 'BUYER').length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className={cn(
          'rounded-2xl border p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between',
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
              'w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-stone-50 border-stone-200 text-stone-900'
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={policyAudienceFilter}
            onChange={(e) => setPolicyAudienceFilter(e.target.value)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-stone-50 border-stone-200 text-stone-900'
            )}
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="SELLER">Chỉ Người bán (SELLER)</option>
            <option value="BUYER">Chỉ Người mua (BUYER)</option>
          </select>

          <select
            value={policyCategoryFilter}
            onChange={(e) => setPolicyCategoryFilter(e.target.value)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-stone-50 border-stone-200 text-stone-900'
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
              'px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-stone-50 border-stone-200 text-stone-900'
            )}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Đang tắt</option>
          </select>
        </div>
      </div>

      {/* Policies Table */}
      <div className={cn('rounded-2xl border overflow-hidden shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
        {loadingPolicies ? (
          <div className="py-16 text-center text-sm text-stone-400">Đang tải danh sách chính sách nền tảng...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">Không tìm thấy chính sách nào phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={cn('border-b uppercase font-bold text-[11px]', isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-500')}>
                <tr>
                  <th className="py-3.5 px-4">Thứ tự</th>
                  <th className="py-3.5 px-4">Mã Key & Tiêu đề</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Phiên bản</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
                {filteredPolicies.map((p) => {
                  const audienceInfo = AUDIENCE_OPTIONS.find((a) => a.value === p.targetAudience) || AUDIENCE_OPTIONS[0]
                  const categoryInfo = CATEGORY_OPTIONS.find((c) => c.value === p.category)

                  return (
                    <tr key={p.id} className={cn('transition hover:bg-amber-500/5', !p.isActive && 'opacity-60')}>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{p.displayOrder}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-sm line-clamp-1">{p.title}</div>
                        <div className="font-mono text-[11px] text-amber-500/80 mt-0.5">{p.policyKey}</div>
                        {p.summary && <div className="text-[11px] opacity-70 line-clamp-1 mt-0.5">{p.summary}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border', audienceInfo.color)}>
                          {audienceInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-400">{categoryInfo?.label || p.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold bg-stone-500/10 px-2 py-0.5 rounded text-[11px]">
                          v{p.version || '1.0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePolicyActive(p)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition',
                            p.isActive
                              ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
                          )}
                        >
                          {p.isActive ? <HiOutlineCheckCircle className="h-3.5 w-3.5" /> : <HiOutlineXCircle className="h-3.5 w-3.5" />}
                          {p.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewPolicy(p)}
                            title="Xem nội dung chi tiết"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition"
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditPolicy(p)}
                            title="Chỉnh sửa chính sách"
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition"
                          >
                            <HiOutlinePencilAlt className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(p)}
                            title="Xóa chính sách"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE / EDIT POLICY */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className={cn('w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden my-auto', isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900')}>
            {/* Modal Header */}
            <div className={cn('flex items-center justify-between px-6 py-4 border-b', isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-100 bg-stone-50')}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5 text-amber-500" />
                {editingPolicy ? 'Chỉnh Sửa Chính Sách Nền Tảng' : 'Thêm Chính Sách Mới'}
              </h2>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-500/10 transition"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePolicy} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Mã Định Danh (Policy Key) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPolicy}
                    value={policyForm.policyKey}
                    onChange={(e) => setPolicyForm({ ...policyForm, policyKey: e.target.value.toUpperCase() })}
                    placeholder="VD: ESCROW_PAYMENT_PROTECTION"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200',
                      editingPolicy && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Viết hoa, dùng dấu gạch dưới (VD: SELLER_OPERATING_POLICY)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Tiêu Đề Văn Bản *
                  </label>
                  <input
                    type="text"
                    required
                    value={policyForm.title}
                    onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                    placeholder="VD: Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Đối Tượng Áp Dụng
                  </label>
                  <select
                    value={policyForm.targetAudience}
                    onChange={(e) => setPolicyForm({ ...policyForm, targetAudience: e.target.value })}
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  >
                    {AUDIENCE_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Danh Mục
                  </label>
                  <select
                    value={policyForm.category}
                    onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Phiên Bản
                  </label>
                  <input
                    type="text"
                    value={policyForm.version}
                    onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                    placeholder="VD: 2.0"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                    Thứ Tự Hiển Thị
                  </label>
                  <input
                    type="number"
                    value={policyForm.displayOrder}
                    onChange={(e) => setPolicyForm({ ...policyForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                  Tóm Tắt Nhanh (Summary)
                </label>
                <textarea
                  rows={2}
                  value={policyForm.summary}
                  onChange={(e) => setPolicyForm({ ...policyForm, summary: e.target.value })}
                  placeholder="Mô tả tóm tắt ngắn gọn mục đích và nội dung cốt lõi của chính sách..."
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                  Nội Dung Đầy Đủ (Hỗ trợ định dạng Markdown) *
                </label>
                <textarea
                  rows={12}
                  required
                  value={policyForm.content}
                  onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                  placeholder="Nhập nội dung chính sách chi tiết bằng Markdown (# Tiêu đề, ## Mục con, - Gạch đầu dòng, | Bảng |)..."
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200'
                  )}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policyForm.isActive}
                    onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold">Kích hoạt chính sách ngay lập tức</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-500/10">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-500/10 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingPolicy ? 'Cập Nhật Chính Sách' : 'Tạo Mới Chính Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW POLICY */}
      {previewPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className={cn('w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden my-auto', isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900')}>
            <div className={cn('flex items-center justify-between px-6 py-4 border-b', isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-100 bg-stone-50')}>
              <div>
                <span className="font-mono text-xs text-amber-500 font-bold">{previewPolicy.policyKey}</span>
                <h2 className="text-lg font-bold">{previewPolicy.title}</h2>
              </div>
              <button
                onClick={() => setPreviewPolicy(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-500/10 transition"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {previewPolicy.summary && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                  <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <HiOutlineTag className="h-4 w-4" /> Tóm tắt chính sách
                  </div>
                  <p>{previewPolicy.summary}</p>
                </div>
              )}

              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-line text-xs leading-relaxed font-sans opacity-90">
                {previewPolicy.content}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-stone-500/10 flex items-center justify-between text-xs text-stone-400">
              <div>Phiên bản: v{previewPolicy.version || '1.0'}</div>
              <button
                onClick={() => setPreviewPolicy(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
