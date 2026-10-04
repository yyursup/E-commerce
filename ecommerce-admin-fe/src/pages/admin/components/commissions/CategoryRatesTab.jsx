import { useState, useEffect } from 'react'
import {
  HiOutlineCog,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import categoryService from '../../../../services/category'
import platformService from '../../../../services/platform'

export default function CategoryRatesTab() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCatId, setEditingCatId] = useState(null)
  const [editRateValue, setEditRateValue] = useState('')
  const [savingCatId, setSavingCatId] = useState(null)

  const [commissionRate, setCommissionRate] = useState('')
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getAllCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      toast.error('Không thể tải danh sách ngành hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatformSettings = async () => {
    try {
      const settings = await platformService.getPlatformSettings()
      setCommissionRate(settings?.value || '5.0')
    } catch (err) {
      console.error('Error fetching platform settings:', err)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchPlatformSettings()
  }, [])

  const handleStartEdit = (cat) => {
    setEditingCatId(cat.id)
    setEditRateValue(cat.commissionRate != null ? String(cat.commissionRate) : '5.0')
  }

  const handleCancelEdit = () => {
    setEditingCatId(null)
    setEditRateValue('')
  }

  const handleSaveCategoryRate = async (catId) => {
    const rate = parseFloat(editRateValue)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ hoa hồng phải từ 0% đến 100%')
      return
    }

    try {
      setSavingCatId(catId)
      await categoryService.updateCommissionRate(catId, rate)
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, commissionRate: rate } : c))
      )
      setEditingCatId(null)
      toast.success('Cập nhật biểu phí ngành hàng thành công!')
    } catch (err) {
      console.error('Error updating category commission rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ hoa hồng')
    } finally {
      setSavingCatId(null)
    }
  }

  const handleUpdateFallbackRate = async () => {
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ hoa hồng dự phòng phải từ 0 đến 100')
      return
    }

    try {
      setIsUpdatingCommission(true)
      await platformService.updateCommissionRate(rate)
      toast.success('Cập nhật tỷ lệ hoa hồng dự phòng thành công')
    } catch (err) {
      console.error('Error updating commission rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ dự phòng')
    } finally {
      setIsUpdatingCommission(false)
    }
  }

  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase()
    if (n.includes('điện thoại') || n.includes('máy tính bảng')) return '📱'
    if (n.includes('laptop') || n.includes('máy tính')) return '💻'
    if (n.includes('linh kiện') || n.includes('pc build')) return '🧩'
    if (n.includes('âm thanh')) return '🎧'
    if (n.includes('phụ kiện') || n.includes('gaming gear')) return '🎮'
    if (n.includes('đeo') || n.includes('đồng hồ')) return '⌚'
    if (n.includes('nhà thông minh') || n.includes('iot')) return '🏠'
    if (n.includes('máy ảnh') || n.includes('quay phim')) return '📷'
    return '📦'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineCog className="h-5 w-5 text-amber-500" />
            Biểu Phí Hoa Hồng Theo Danh Mục Ngành Hàng (Category Rates)
          </h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Admin thiết lập tỷ lệ hoa hồng cơ bản riêng biệt cho từng nhóm sản phẩm công nghệ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>Sàn tối thiểu: 1.5%</span>
          </div>
          <button
            onClick={fetchCategories}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
            )}
          >
            <HiOutlineRefresh className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div
        className={cn(
          'rounded-2xl border p-5 flex items-start gap-4',
          isDark ? 'border-blue-500/20 bg-blue-500/5 text-slate-300' : 'border-blue-200 bg-blue-50/60 text-slate-800'
        )}
      >
        <HiOutlineInformationCircle className="h-6 w-6 flex-shrink-0 text-blue-500 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-blue-500 text-sm">Cơ chế áp dụng biểu phí ngành hàng:</p>
          <p>
            - Khi người mua đặt hàng, hệ thống tự động dò tìm tỷ lệ hoa hồng cơ bản theo danh mục của từng sản phẩm trong đơn.
          </p>
          <p>
            - Tỷ lệ này là <strong>Base Rate</strong> trong công thức: <code>FinalRate = Math.max(BaseRate - DepositDiscount - SeniorityDiscount, 1.5%)</code>.
          </p>
        </div>
      </div>

      {/* Grid các nhóm ngành hàng */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mb-2" />
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>Đang tải biểu phí ngành hàng...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories
            .filter((c) => !c.parentId)
            .map((cat) => {
              const isEditing = editingCatId === cat.id
              const isSaving = savingCatId === cat.id
              const currentRate = cat.commissionRate != null ? Number(cat.commissionRate) : 5.0

              return (
                <div
                  key={cat.id}
                  className={cn(
                    'relative rounded-2xl border p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-4',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                      <div>
                        <h3 className={cn('text-sm font-bold line-clamp-1', isDark ? 'text-white' : 'text-stone-900')}>
                          {cat.name}
                        </h3>
                        <span className="text-[11px] text-slate-400">Ngành hàng cấp 1</span>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(cat)}
                        title="Chỉnh sửa tỷ lệ hoa hồng"
                        className={cn(
                          'rounded-xl p-2 transition text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20',
                          isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-100',
                        )}
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-700/30">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editRateValue}
                            onChange={(e) => setEditRateValue(e.target.value)}
                            className={cn(
                              'w-full rounded-xl border px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500',
                              isDark
                                ? 'border-slate-700 bg-slate-950 text-white'
                                : 'border-stone-300 bg-white text-stone-900',
                            )}
                            autoFocus
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>

                        <button
                          onClick={() => handleSaveCategoryRate(cat.id)}
                          disabled={isSaving}
                          className="rounded-xl bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                          title="Lưu thay đổi"
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                        </button>

                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className={cn(
                            'rounded-xl p-2.5 transition',
                            isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-stone-200 text-stone-600 hover:text-stone-900',
                          )}
                          title="Hủy"
                        >
                          <HiOutlineX className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tỷ lệ cơ bản thu sàn:</span>
                        <span className="inline-flex items-center rounded-xl bg-amber-500/10 px-3 py-1 text-sm font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {currentRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Cấu hình tỷ lệ dự phòng toàn sàn */}
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between text-xs border shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-stone-200 bg-white text-stone-600',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold text-sm">⚙️ Tỷ lệ dự phòng toàn sàn:</span>
          <span>
            Áp dụng khi sản phẩm chưa được phân loại vào danh mục nào trên sàn.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-24">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className={cn(
                'w-full rounded-xl border px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500',
                isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-900',
              )}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
          </div>
          <button
            onClick={handleUpdateFallbackRate}
            disabled={isUpdatingCommission}
            className="rounded-xl bg-amber-500 px-4 py-1.5 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
          >
            {isUpdatingCommission ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
