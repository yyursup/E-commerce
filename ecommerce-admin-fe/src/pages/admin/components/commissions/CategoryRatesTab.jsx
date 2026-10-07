import { useState, useEffect } from 'react'
import {
  HiOutlineCog,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
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

  // 3 Platform Settings
  const [defaultRate, setDefaultRate] = useState('5.0')
  const [isUpdatingDefaultRate, setIsUpdatingDefaultRate] = useState(false)

  const [floorRate, setFloorRate] = useState('1.5')
  const [isUpdatingFloorRate, setIsUpdatingFloorRate] = useState(false)

  const [usedGoodsRate, setUsedGoodsRate] = useState('6.0')
  const [isUpdatingUsedGoodsRate, setIsUpdatingUsedGoodsRate] = useState(false)

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
      if (platformService.getAllPlatformSettings) {
        const settings = await platformService.getAllPlatformSettings()
        if (Array.isArray(settings)) {
          const map = {}
          settings.forEach((s) => {
            map[s.key] = s.value
          })
          if (map['commission_rate'] != null) setDefaultRate(map['commission_rate'])
          if (map['commission_floor_rate'] != null) setFloorRate(map['commission_floor_rate'])
          if (map['commission_used_goods_rate'] != null) setUsedGoodsRate(map['commission_used_goods_rate'])
          return
        }
      }
      const single = await platformService.getPlatformSettings()
      if (single?.value) setDefaultRate(single.value)
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

  const handleUpdateDefaultRate = async () => {
    const rate = parseFloat(defaultRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ hoa hồng mặc định phải từ 0 đến 100')
      return
    }

    try {
      setIsUpdatingDefaultRate(true)
      await platformService.updatePlatformSetting('commission_rate', rate)
      toast.success('Cập nhật tỷ lệ hoa hồng mặc định toàn sàn thành công')
    } catch (err) {
      console.error('Error updating commission rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ dự phòng')
    } finally {
      setIsUpdatingDefaultRate(false)
    }
  }

  const handleUpdateFloorRate = async () => {
    const rate = parseFloat(floorRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ sàn tối thiểu phải từ 0 đến 100')
      return
    }

    try {
      setIsUpdatingFloorRate(true)
      await platformService.updatePlatformSetting('commission_floor_rate', rate)
      toast.success('Cập nhật ngưỡng sàn tối thiểu (Floor Rate) thành công')
    } catch (err) {
      console.error('Error updating floor rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ sàn tối thiểu')
    } finally {
      setIsUpdatingFloorRate(false)
    }
  }

  const handleUpdateUsedGoodsRate = async () => {
    const rate = parseFloat(usedGoodsRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ hàng cũ phải từ 0 đến 100')
      return
    }

    try {
      setIsUpdatingUsedGoodsRate(true)
      await platformService.updatePlatformSetting('commission_used_goods_rate', rate)
      toast.success('Cập nhật tỷ lệ hoa hồng hàng cũ (Used Goods) thành công')
    } catch (err) {
      console.error('Error updating used goods rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ hàng cũ')
    } finally {
      setIsUpdatingUsedGoodsRate(false)
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
            <span>Sàn tối thiểu: {floorRate}%</span>
          </div>
          <button
            onClick={() => {
              fetchCategories()
              fetchPlatformSettings()
            }}
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
            - Tỷ lệ này là <strong>Base Rate</strong> trong công thức: <code>FinalRate = Math.max(BaseRate - DepositDiscount - SeniorityDiscount, {floorRate}%)</code>.
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

      {/* 3 Cấu hình chính sách sàn toàn hệ thống (Platform Infrastructure Policies) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <HiOutlineShieldCheck className="h-4 w-4 text-amber-500" />
          Cấu hình chính sách hoa hồng toàn sàn (Platform Dynamic Policies)
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1: Default Rate */}
          <div
            className={cn(
              'rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-3',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
            )}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500">Tỷ lệ cơ bản mặc định</h4>
              </div>
              <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Áp dụng khi sản phẩm chưa phân loại hoặc danh mục chưa có biểu phí riêng.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/20">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-900',
                  )}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
              <button
                onClick={handleUpdateDefaultRate}
                disabled={isUpdatingDefaultRate}
                className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
              >
                {isUpdatingDefaultRate ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* Card 2: Floor Rate */}
          <div
            className={cn(
              'rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-3',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
            )}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🛡️</span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-500">Ngưỡng sàn tối thiểu</h4>
              </div>
              <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Mức hoa hồng tối thiểu thu sau khi trừ hết ưu đãi ký quỹ và thâm niên.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/20">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={floorRate}
                  onChange={(e) => setFloorRate(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-900',
                  )}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
              <button
                onClick={handleUpdateFloorRate}
                disabled={isUpdatingFloorRate}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                {isUpdatingFloorRate ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* Card 3: Used Goods Rate */}
          <div
            className={cn(
              'rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-3',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-700'
            )}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔄</span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-purple-500">Hàng cũ / Đã qua sử dụng</h4>
              </div>
              <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tỷ lệ thu cho các thiết bị LIKE NEW, 99%, hàng Cũ hoặc Linh kiện tháo máy.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/20">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={usedGoodsRate}
                  onChange={(e) => setUsedGoodsRate(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-purple-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-900',
                  )}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
              <button
                onClick={handleUpdateUsedGoodsRate}
                disabled={isUpdatingUsedGoodsRate}
                className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition shadow-sm"
              >
                {isUpdatingUsedGoodsRate ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
