import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineRefresh, HiOutlineExternalLink } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import trustConfigService from '../../../../services/trustConfig'
import seniorityPolicyService from '../../../../services/seniorityPolicy'
import categoryService from '../../../../services/category'
import platformService from '../../../../services/platform'

export default function DiscountPoliciesTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const navigate = useNavigate()

  // --- Trust Level Config State (Read-only Reference) ---
  const [trustConfigs, setTrustConfigs] = useState([])
  const [loadingTrust, setLoadingTrust] = useState(true)

  // --- Seniority Policies State (CRUD) ---
  const [seniorityPolicies, setSeniorityPolicies] = useState([])
  const [loadingSeniority, setLoadingSeniority] = useState(true)

  // Edit Seniority Policy Modal State
  const [editingSeniority, setEditingSeniority] = useState(null)
  const [seniorityMonths, setSeniorityMonths] = useState('')
  const [seniorityDiscount, setSeniorityDiscount] = useState('')
  const [seniorityTierName, setSeniorityTierName] = useState('')
  const [seniorityDesc, setSeniorityDesc] = useState('')
  const [seniorityActive, setSeniorityActive] = useState(true)
  const [submittingSeniority, setSubmittingSeniority] = useState(false)

  // --- Simulator State ---
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('GRADE_NEW')
  const [selectedStarLevel, setSelectedStarLevel] = useState(3) // Mặc định 3 sao
  const [simActiveMonths, setSimActiveMonths] = useState(6) // Mặc định 6 tháng
  const [hasViolation, setHasViolation] = useState(false)
  const [testOrderAmount, setTestOrderAmount] = useState('10000000')

  // Platform general settings for simulation (Floor rate, default rate, used goods rate)
  const [platformSettings, setPlatformSettings] = useState({
    commission_rate: 5.0,
    commission_floor_rate: 1.5,
    commission_used_goods_rate: 6.0,
  })

  const loadTrustConfigs = useCallback(async () => {
    try {
      setLoadingTrust(true)
      const data = await trustConfigService.getAdminTrustLevels()
      setTrustConfigs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải cấu hình bậc sao:', err)
    } finally {
      setLoadingTrust(false)
    }
  }, [])

  const loadSeniorityPolicies = useCallback(async () => {
    try {
      setLoadingSeniority(true)
      const data = await seniorityPolicyService.getAll()
      setSeniorityPolicies(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải chính sách thâm niên:', err)
      toast.error(err?.message || 'Không thể tải chính sách thâm niên.')
    } finally {
      setLoadingSeniority(false)
    }
  }, [])

  const loadCategoriesAndSettings = useCallback(async () => {
    try {
      setLoadingCategories(true)
      const [catData, settingsData] = await Promise.allSettled([
        categoryService.getAllCategories(),
        platformService.getAllPlatformSettings ? platformService.getAllPlatformSettings() : platformService.getPlatformSettings(),
      ])

      if (catData.status === 'fulfilled' && Array.isArray(catData.value)) {
        setCategories(catData.value)
      }

      if (settingsData.status === 'fulfilled') {
        const val = settingsData.value
        if (Array.isArray(val)) {
          const map = {}
          val.forEach((s) => {
            map[s.key] = parseFloat(s.value)
          })
          setPlatformSettings((prev) => ({
            ...prev,
            commission_rate: map['commission_rate'] ?? prev.commission_rate,
            commission_floor_rate: map['commission_floor_rate'] ?? prev.commission_floor_rate,
            commission_used_goods_rate: map['commission_used_goods_rate'] ?? prev.commission_used_goods_rate,
          }))
        }
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu mô phỏng:', err)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    loadTrustConfigs()
    loadSeniorityPolicies()
    loadCategoriesAndSettings()
  }, [loadTrustConfigs, loadSeniorityPolicies, loadCategoriesAndSettings])

  const formatVND = (val) => {
    if (val === null || val === undefined || val === '') return 'Không giới hạn'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const formatRange = (min, max) => {
    if ((min === 0 || min === '0') && (max === null || max === undefined || max === '')) {
      return 'Chưa ký quỹ'
    }
    if (max === null || max === undefined || max === '') {
      return `≥ ${formatVND(min)}`
    }
    return `${formatVND(min)} - ${formatVND(max)}`
  }

  const handleOpenEditSeniority = (policy) => {
    setEditingSeniority(policy)
    setSeniorityMonths(String(policy.minMonths || '0'))
    setSeniorityDiscount(String(policy.discountRate || '0'))
    setSeniorityTierName(policy.tierName || '')
    setSeniorityDesc(policy.description || '')
    setSeniorityActive(policy.isActive !== false)
  }

  const handleSaveSeniority = async (e) => {
    e.preventDefault()
    if (!editingSeniority) return

    const monthsNum = Number(seniorityMonths)
    const discountNum = Number(seniorityDiscount)

    if (monthsNum < 0) {
      toast.error('Số tháng thâm niên không được âm')
      return
    }

    if (discountNum < 0 || discountNum > 10) {
      toast.error('Tỷ lệ chiết khấu thâm niên phải từ 0% đến 10%')
      return
    }

    try {
      setSubmittingSeniority(true)
      await seniorityPolicyService.update(editingSeniority.id, {
        minMonths: monthsNum,
        discountRate: discountNum,
        tierName: seniorityTierName.trim(),
        description: seniorityDesc.trim(),
        isActive: seniorityActive,
      })
      toast.success(`Cập nhật chính sách "${seniorityTierName}" thành công!`)
      setEditingSeniority(null)
      loadSeniorityPolicies()
    } catch (err) {
      console.error('Lỗi cập nhật chính sách thâm niên:', err)
      toast.error(err?.message || 'Cập nhật chính sách thâm niên thất bại.')
    } finally {
      setSubmittingSeniority(false)
    }
  }

  // --- Real-time Simulation Engine ---
  const simulationResult = useMemo(() => {
    // 1. Base Rate
    let baseRate = platformSettings.commission_rate
    let categoryName = 'Toàn sàn (Mặc định)'

    if (selectedCondition !== 'GRADE_NEW') {
      baseRate = platformSettings.commission_used_goods_rate
    } else if (selectedCatId) {
      const found = categories.find((c) => String(c.id) === String(selectedCatId))
      if (found) {
        categoryName = found.name
        if (found.commissionRate != null && Number(found.commissionRate) > 0) {
          baseRate = Number(found.commissionRate)
        } else if (found.parentId) {
          const parent = categories.find((c) => String(c.id) === String(found.parentId))
          if (parent?.commissionRate != null && Number(parent.commissionRate) > 0) {
            baseRate = Number(parent.commissionRate)
          }
        }
      }
    }

    // 2. Deposit Discount
    const trustCfg = trustConfigs.find((t) => t.starLevel === selectedStarLevel)
    const depositDiscount = trustCfg?.commissionDiscount ? Number(trustCfg.commissionDiscount) : 0

    // 3. Seniority Discount
    let seniorityDiscount = 0
    let matchedPolicyName = 'Chưa đạt mốc'
    if (!hasViolation && simActiveMonths > 0) {
      const activePolicies = seniorityPolicies
        .filter((p) => p.isActive !== false)
        .sort((a, b) => (b.minMonths || 0) - (a.minMonths || 0))

      for (const policy of activePolicies) {
        if (simActiveMonths >= (policy.minMonths || 0)) {
          seniorityDiscount = policy.discountRate ? Number(policy.discountRate) : 0
          matchedPolicyName = policy.tierName || `${policy.minMonths} tháng`
          break
        }
      }
    } else if (hasViolation) {
      matchedPolicyName = 'Bị vô hiệu (do có vi phạm)'
    }

    // 4. Formula & Floor constraint
    const calculatedRate = Math.max(0, baseRate - depositDiscount - seniorityDiscount)
    const floorRate = platformSettings.commission_floor_rate
    const isFloorApplied = calculatedRate < floorRate
    const finalRate = isFloorApplied ? floorRate : calculatedRate

    // 5. Sample Financial Breakdown
    const orderAmt = parseFloat(testOrderAmount) || 0
    const feeAmount = Math.round((orderAmt * finalRate) / 100)
    const sellerPayout = Math.max(0, orderAmt - feeAmount)

    return {
      baseRate,
      categoryName,
      depositDiscount,
      trustTierName: trustCfg?.tierName || `${selectedStarLevel} sao`,
      seniorityDiscount,
      matchedPolicyName,
      floorRate,
      calculatedRate,
      finalRate,
      isFloorApplied,
      orderAmt,
      feeAmount,
      sellerPayout,
      isUsedGoods: selectedCondition !== 'GRADE_NEW',
    }
  }, [
    categories,
    selectedCatId,
    selectedCondition,
    selectedStarLevel,
    simActiveMonths,
    hasViolation,
    testOrderAmount,
    platformSettings,
    trustConfigs,
    seniorityPolicies,
  ])

  const muted = isDark ? 'text-slate-400' : 'text-stone-500'
  const divider = isDark ? 'divide-slate-800 border-slate-800' : 'divide-stone-200 border-stone-200'
  const panel = cn('rounded-md border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')
  const sectionLabel = 'font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400'
  const thCls = cn(
    'px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider',
    isDark ? 'text-slate-400' : 'text-stone-500'
  )
  const theadCls = isDark ? 'border-b border-slate-800 bg-slate-950/40' : 'border-b border-stone-200 bg-stone-50'
  const fieldCls = cn(
    'w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-950/20 dark:focus:ring-white/30',
    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-white text-stone-800'
  )
  const labelCls = 'mb-1.5 block text-xs font-medium'
  const primaryBtn =
    'rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200'

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Ưu đãi thâm niên & mô phỏng phí</h2>
          <p className={cn('mt-0.5 text-sm', muted)}>
            Ưu đãi theo ký quỹ và thâm niên hoạt động, kèm công cụ tính thử hoa hồng cho một đơn hàng.
          </p>
        </div>
        <button
          onClick={() => {
            loadTrustConfigs()
            loadSeniorityPolicies()
            loadCategoriesAndSettings()
          }}
          className={cn(
            'inline-flex items-center gap-2 self-start rounded-md border px-3 py-1.5 text-xs font-semibold transition sm:self-auto',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          )}
        >
          <HiOutlineRefresh className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Giảm trừ theo ký quỹ (chỉ đọc) */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className={sectionLabel}>Giảm trừ theo bậc ký quỹ</h3>
          <button
            onClick={() => navigate('/trust-config?tab=configs')}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:underline',
              isDark ? 'text-slate-200' : 'text-stone-800'
            )}
          >
            Cấu hình tại Ký quỹ & bậc sao
            <HiOutlineExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className={cn(panel, 'overflow-x-auto')}>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Bậc</th>
                <th className={thCls}>Tên bậc</th>
                <th className={thCls}>Hạn mức ký quỹ</th>
                <th className={cn(thCls, 'text-right')}>Giảm hoa hồng</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', divider)}>
              {loadingTrust ? (
                <tr>
                  <td colSpan={4} className={cn('px-5 py-8 text-center text-sm', muted)}>
                    Đang tải ma trận ký quỹ...
                  </td>
                </tr>
              ) : trustConfigs.length === 0 ? (
                <tr>
                  <td colSpan={4} className={cn('px-5 py-8 text-center text-sm', muted)}>
                    Chưa có cấu hình bậc sao.
                  </td>
                </tr>
              ) : (
                trustConfigs.map((cfg) => {
                  const discount = Number(cfg.commissionDiscount || 0)
                  return (
                    <tr key={cfg.starLevel} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'}>
                      <td className="px-5 py-3 font-mono tabular-nums">{cfg.starLevel} ★</td>
                      <td className="px-5 py-3 font-medium">{cfg.tierName}</td>
                      <td className={cn('px-5 py-3 font-mono text-xs tabular-nums', muted)}>
                        {formatRange(cfg.minDeposit, cfg.maxDeposit)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">
                        {discount > 0 ? `−${discount}%` : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <p className={cn('mt-2 text-xs', muted)}>
          Bảng này chỉ để tra cứu; bậc sao được quản lý tại một nơi duy nhất là trang Ký quỹ & bậc sao.
        </p>
      </section>

      {/* Chính sách thâm niên */}
      <section>
        <h3 className={cn(sectionLabel, 'mb-2')}>Ưu đãi thâm niên hoạt động</h3>
        <div className={cn(panel, 'overflow-x-auto')}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Mốc thâm niên</th>
                <th className={cn(thCls, 'text-right')}>Giảm thêm</th>
                <th className={thCls}>Điều kiện áp dụng</th>
                <th className={thCls}>Trạng thái</th>
                <th className={cn(thCls, 'w-24')}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', divider)}>
              {loadingSeniority ? (
                <tr>
                  <td colSpan={5} className={cn('px-5 py-8 text-center text-sm', muted)}>
                    Đang tải chính sách thâm niên...
                  </td>
                </tr>
              ) : seniorityPolicies.length === 0 ? (
                <tr>
                  <td colSpan={5} className={cn('px-5 py-8 text-center text-sm', muted)}>
                    Chưa có chính sách thâm niên nào được thiết lập.
                  </td>
                </tr>
              ) : (
                seniorityPolicies.map((pol) => (
                  <tr key={pol.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{pol.tierName || `Mốc ${pol.minMonths} tháng`}</p>
                      <p className={cn('text-xs', muted)}>Hoạt động liên tục từ {pol.minMonths} tháng</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">−{Number(pol.discountRate || 0)}%</td>
                    <td className={cn('max-w-xs px-5 py-3 text-xs leading-relaxed', muted)}>
                      {pol.description || 'Áp dụng cho shop không có vi phạm trong kỳ đánh giá.'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full', pol.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400')}
                        />
                        {pol.isActive !== false ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenEditSeniority(pol)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-semibold transition',
                          isDark
                            ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                            : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                        )}
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mô phỏng phí */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className={sectionLabel}>Mô phỏng hoa hồng</h3>
          <span className={cn('text-xs', muted)}>
            Ngưỡng sàn tối thiểu: <span className="font-mono tabular-nums">{platformSettings.commission_floor_rate}%</span>
          </span>
        </div>

        <div className={cn(panel, 'grid grid-cols-1 lg:grid-cols-12')}>
          <div className="space-y-4 p-5 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Ngành hàng</label>
                <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className={fieldCls}>
                  <option value="">Toàn sàn / chưa phân loại ({platformSettings.commission_rate}%)</option>
                  {categories
                    .filter((c) => !c.parentId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.commissionRate != null ? `${cat.commissionRate}%` : `${platformSettings.commission_rate}%`})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Tình trạng thiết bị</label>
                <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className={fieldCls}>
                  <option value="GRADE_NEW">Mới 100% nguyên seal (tỷ lệ theo ngành hàng)</option>
                  <option value="GRADE_LIKE_NEW">Like New 99% (thu {platformSettings.commission_used_goods_rate}%)</option>
                  <option value="GRADE_FAIR">Cũ dùng tốt 90–95% (thu {platformSettings.commission_used_goods_rate}%)</option>
                  <option value="GRADE_AS_IS">Xác / linh kiện bán đứt (thu {platformSettings.commission_used_goods_rate}%)</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Bậc sao ký quỹ</label>
                <select
                  value={selectedStarLevel}
                  onChange={(e) => setSelectedStarLevel(Number(e.target.value))}
                  className={fieldCls}
                >
                  {trustConfigs.map((t) => (
                    <option key={t.starLevel} value={t.starLevel}>
                      {t.starLevel} ★ – {t.tierName} (giảm {Number(t.commissionDiscount || 0)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="sim-months" className="text-xs font-medium">
                    Thâm niên hoạt động
                  </label>
                  <span className="font-mono text-xs tabular-nums">{simActiveMonths} tháng</span>
                </div>
                <input
                  id="sim-months"
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={simActiveMonths}
                  onChange={(e) => setSimActiveMonths(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-stone-900 dark:accent-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Giá trị đơn hàng thử (VNĐ)</label>
                <input
                  type="number"
                  step="500000"
                  min="100000"
                  value={testOrderAmount}
                  onChange={(e) => setTestOrderAmount(e.target.value)}
                  className={cn(fieldCls, 'font-mono tabular-nums sm:max-w-xs')}
                />
              </div>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={hasViolation}
                onChange={(e) => setHasViolation(e.target.checked)}
                className="h-4 w-4 rounded border-stone-400 accent-stone-900 dark:accent-white"
              />
              <span className="text-sm">Gian hàng có vi phạm (mất ưu đãi thâm niên)</span>
            </label>
          </div>

          {/* Kết quả */}
          <div
            className={cn(
              'border-t p-5 lg:col-span-5 lg:border-l lg:border-t-0',
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-stone-50'
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className={sectionLabel}>Tỷ lệ áp dụng</span>
              <span className="font-mono text-2xl font-bold tabular-nums">{simulationResult.finalRate.toFixed(2)}%</span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className={muted}>Tỷ lệ cơ bản ({simulationResult.isUsedGoods ? 'hàng cũ' : simulationResult.categoryName})</dt>
                <dd className="font-mono tabular-nums">{simulationResult.baseRate.toFixed(2)}%</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className={muted}>Ưu đãi ký quỹ ({simulationResult.trustTierName})</dt>
                <dd className="font-mono tabular-nums">−{simulationResult.depositDiscount.toFixed(2)}%</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className={muted}>Ưu đãi thâm niên ({simulationResult.matchedPolicyName})</dt>
                <dd className="font-mono tabular-nums">−{simulationResult.seniorityDiscount.toFixed(2)}%</dd>
              </div>
              {simulationResult.isFloorApplied && (
                <div className="flex items-center justify-between gap-4 border-t border-dashed pt-2 text-xs">
                  <dt className={muted}>Áp dụng ngưỡng sàn tối thiểu</dt>
                  <dd className="font-mono tabular-nums">{simulationResult.floorRate.toFixed(2)}%</dd>
                </div>
              )}
            </dl>

            <dl className={cn('mt-5 space-y-2 border-t pt-4 text-sm', isDark ? 'border-slate-800' : 'border-stone-200')}>
              <div className="flex items-center justify-between gap-4">
                <dt className={muted}>Giá trị đơn hàng</dt>
                <dd className="font-mono tabular-nums">{formatVND(simulationResult.orderAmt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className={muted}>Hoa hồng sàn thu</dt>
                <dd className="font-mono tabular-nums">−{formatVND(simulationResult.feeAmount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 font-semibold">
                <dt>Shop thực nhận</dt>
                <dd className="font-mono text-base tabular-nums">{formatVND(simulationResult.sellerPayout)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Modal sửa chính sách thâm niên */}
      {editingSeniority && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              'w-full max-w-md rounded-md border p-6 shadow-xl',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className={cn('flex items-center justify-between border-b pb-3', isDark ? 'border-slate-800' : 'border-stone-200')}>
              <h3 className="text-base font-bold">Chỉnh sửa chính sách thâm niên</h3>
              <button
                type="button"
                onClick={() => setEditingSeniority(null)}
                aria-label="Đóng"
                className={cn('rounded p-1 text-sm', muted)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeniority} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mốc tối thiểu (tháng)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={seniorityMonths}
                    onChange={(e) => setSeniorityMonths(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Giảm hoa hồng (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.05"
                    required
                    value={seniorityDiscount}
                    onChange={(e) => setSeniorityDiscount(e.target.value)}
                    className={fieldCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Tên hạng</label>
                <input
                  type="text"
                  required
                  value={seniorityTierName}
                  onChange={(e) => setSeniorityTierName(e.target.value)}
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Mô tả áp dụng</label>
                <textarea
                  rows="3"
                  value={seniorityDesc}
                  onChange={(e) => setSeniorityDesc(e.target.value)}
                  placeholder="Áp dụng cho shop hoạt động liên tục trên X tháng..."
                  className={fieldCls}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={seniorityActive}
                  onChange={(e) => setSeniorityActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-400 accent-stone-900 dark:accent-white"
                />
                <span className="text-sm">Kích hoạt chính sách này</span>
              </label>

              <div className={cn('flex justify-end gap-2 border-t pt-4', isDark ? 'border-slate-800' : 'border-stone-200')}>
                <button
                  type="button"
                  disabled={submittingSeniority}
                  onClick={() => setEditingSeniority(null)}
                  className={cn('rounded-md px-4 py-2 text-sm font-semibold', muted)}
                >
                  Hủy
                </button>
                <button type="submit" disabled={submittingSeniority} className={primaryBtn}>
                  {submittingSeniority ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
