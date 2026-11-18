import { useState, useEffect } from 'react'
import { HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'
import categoryService from '../../../../services/category'
import platformService from '../../../../services/platform'

// Cấu hình hoa hồng áp dụng toàn sàn (key lưu ở platform settings)
const PLATFORM_SETTINGS = [
  {
    id: 'default',
    key: 'commission_rate',
    label: 'Tỷ lệ cơ bản mặc định',
    description: 'Áp dụng khi sản phẩm chưa phân loại hoặc danh mục chưa có biểu phí riêng.',
    initial: '5.0',
    success: 'Cập nhật tỷ lệ hoa hồng mặc định toàn sàn thành công',
    invalid: 'Tỷ lệ hoa hồng mặc định phải từ 0 đến 100',
    failure: 'Không thể cập nhật tỷ lệ dự phòng',
  },
  {
    id: 'floor',
    key: 'commission_floor_rate',
    label: 'Ngưỡng sàn tối thiểu',
    description: 'Mức hoa hồng thấp nhất còn thu được sau khi trừ ưu đãi ký quỹ và thâm niên.',
    initial: '1.5',
    success: 'Cập nhật ngưỡng sàn tối thiểu thành công',
    invalid: 'Tỷ lệ sàn tối thiểu phải từ 0 đến 100',
    failure: 'Không thể cập nhật tỷ lệ sàn tối thiểu',
  },
  {
    id: 'used',
    key: 'commission_used_goods_rate',
    label: 'Hàng cũ / đã qua sử dụng',
    description: 'Tỷ lệ thu cho thiết bị LIKE NEW, 99%, hàng cũ hoặc linh kiện tháo máy.',
    initial: '6.0',
    success: 'Cập nhật tỷ lệ hoa hồng hàng cũ thành công',
    invalid: 'Tỷ lệ hàng cũ phải từ 0 đến 100',
    failure: 'Không thể cập nhật tỷ lệ hàng cũ',
  },
]

const initialValues = () => Object.fromEntries(PLATFORM_SETTINGS.map((s) => [s.id, s.initial]))

export default function CategoryRatesTab() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCatId, setEditingCatId] = useState(null)
  const [editRateValue, setEditRateValue] = useState('')
  const [savingCatId, setSavingCatId] = useState(null)

  const [values, setValues] = useState(initialValues)
  const [savingSettingId, setSavingSettingId] = useState(null)

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
          setValues((prev) => {
            const next = { ...prev }
            PLATFORM_SETTINGS.forEach((s) => {
              if (map[s.key] != null) next[s.id] = String(map[s.key])
            })
            return next
          })
          return
        }
      }
      const single = await platformService.getPlatformSettings()
      if (single?.value) setValues((prev) => ({ ...prev, default: String(single.value) }))
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
      setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, commissionRate: rate } : c)))
      setEditingCatId(null)
      toast.success('Cập nhật biểu phí ngành hàng thành công!')
    } catch (err) {
      console.error('Error updating category commission rate:', err)
      toast.error(err?.response?.data?.message || 'Không thể cập nhật tỷ lệ hoa hồng')
    } finally {
      setSavingCatId(null)
    }
  }

  const handleSaveSetting = async (setting) => {
    const rate = parseFloat(values[setting.id])
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(setting.invalid)
      return
    }

    try {
      setSavingSettingId(setting.id)
      await platformService.updatePlatformSetting(setting.key, rate)
      toast.success(setting.success)
    } catch (err) {
      console.error(`Error updating ${setting.key}:`, err)
      toast.error(err?.response?.data?.message || setting.failure)
    } finally {
      setSavingSettingId(null)
    }
  }

  const muted = isDark ? 'text-slate-400' : 'text-stone-500'
  const panel = cn('rounded-md border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')
  const divider = isDark ? 'divide-slate-800 border-slate-800' : 'divide-stone-200 border-stone-200'
  const inputCls = cn(
    'w-full rounded-md border py-1.5 pl-3 pr-7 text-right font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-950/20 dark:focus:ring-white/30',
    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-900',
  )
  const primaryBtn =
    'rounded-md bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200'

  const defaultRate = parseFloat(values.default)
  const floorRate = values.floor
  const rootCategories = categories.filter((c) => !c.parentId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Biểu phí hoa hồng</h2>
          <p className={cn('mt-0.5 text-sm', muted)}>
            Tỷ lệ cơ bản theo ngành hàng và các ngưỡng áp dụng toàn sàn.
          </p>
        </div>
        <button
          onClick={() => {
            fetchCategories()
            fetchPlatformSettings()
          }}
          className={cn(
            'inline-flex items-center gap-2 self-start rounded-md border px-3 py-1.5 text-xs font-semibold transition sm:self-auto',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
          )}
        >
          <HiOutlineRefresh className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Cấu hình toàn sàn */}
      <section>
        <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
          Cấu hình toàn sàn
        </h3>
        <div className={cn(panel, 'divide-y', divider)}>
          {PLATFORM_SETTINGS.map((setting) => (
            <div
              key={setting.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{setting.label}</p>
                <p className={cn('mt-0.5 text-xs leading-relaxed', muted)}>{setting.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative w-28">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={values[setting.id]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [setting.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSetting(setting)}
                    aria-label={setting.label}
                    className={inputCls}
                  />
                  <span className={cn('pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs', muted)}>%</span>
                </div>
                <button
                  onClick={() => handleSaveSetting(setting)}
                  disabled={savingSettingId === setting.id}
                  className={primaryBtn}
                >
                  {savingSettingId === setting.id ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className={cn('mt-3 text-xs leading-relaxed', muted)}>
          Công thức áp dụng khi đặt hàng:{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-800 dark:bg-slate-800 dark:text-slate-200">
            Tỷ lệ cuối = max(Tỷ lệ cơ bản − Ưu đãi ký quỹ − Ưu đãi thâm niên, {floorRate}%)
          </code>
        </p>
      </section>

      {/* Biểu phí theo ngành hàng */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Theo ngành hàng cấp 1
          </h3>
          {!loading && <span className={cn('text-xs', muted)}>{rootCategories.length} ngành hàng</span>}
        </div>

        <div className={cn(panel, 'overflow-hidden')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr
                  className={cn(
                    'border-b text-left font-mono text-[11px] uppercase tracking-wider',
                    isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-stone-200 bg-stone-50 text-stone-500',
                  )}
                >
                  <th className="px-5 py-2.5 font-semibold">Ngành hàng</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Tỷ lệ cơ bản</th>
                  <th className="px-5 py-2.5 text-right font-semibold">So với mặc định</th>
                  <th className="w-28 px-5 py-2.5 text-right font-semibold">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', divider)}>
                {loading ? (
                  <tr>
                    <td colSpan={4} className={cn('px-5 py-12 text-center text-sm', muted)}>
                      Đang tải biểu phí ngành hàng...
                    </td>
                  </tr>
                ) : rootCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={cn('px-5 py-12 text-center text-sm', muted)}>
                      Chưa có ngành hàng nào.
                    </td>
                  </tr>
                ) : (
                  rootCategories.map((cat) => {
                    const isEditing = editingCatId === cat.id
                    const isSaving = savingCatId === cat.id
                    const currentRate = cat.commissionRate != null ? Number(cat.commissionRate) : 5.0
                    const delta = isNaN(defaultRate) ? null : currentRate - defaultRate

                    return (
                      <tr key={cat.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'}>
                        <td className="px-5 py-3 font-medium">{cat.name}</td>
                        <td className="px-5 py-3 text-right">
                          {isEditing ? (
                            <div className="relative ml-auto w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCategoryRate(cat.id)
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                aria-label={`Tỷ lệ hoa hồng ${cat.name}`}
                                className={inputCls}
                                autoFocus
                              />
                              <span className={cn('pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs', muted)}>%</span>
                            </div>
                          ) : (
                            <span className="font-mono tabular-nums">{currentRate.toFixed(1)}%</span>
                          )}
                        </td>
                        <td className={cn('px-5 py-3 text-right font-mono text-xs tabular-nums', muted)}>
                          {delta === null || Math.abs(delta) < 0.05
                            ? '—'
                            : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} điểm %`}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleSaveCategoryRate(cat.id)}
                                disabled={isSaving}
                                className="rounded-md bg-stone-950 p-1.5 text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
                                title="Lưu thay đổi"
                                aria-label="Lưu thay đổi"
                              >
                                <HiOutlineCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className={cn(
                                  'rounded-md p-1.5 transition',
                                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
                                )}
                                title="Hủy"
                                aria-label="Hủy"
                              >
                                <HiOutlineX className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(cat)}
                              title="Chỉnh sửa tỷ lệ hoa hồng"
                              aria-label={`Chỉnh sửa tỷ lệ hoa hồng ${cat.name}`}
                              className={cn(
                                'rounded-md p-1.5 transition',
                                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
                              )}
                            >
                              <HiOutlinePencil className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
