import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlinePencilAlt,
  HiOutlineRefresh,
  HiStar,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineExternalLink,
  HiOutlineCalculator,
  HiOutlineCash,
  HiOutlineSparkles,
} from 'react-icons/hi'
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

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-amber-500" />
            Ưu Đãi Thâm Niên & Ma Trận Phí Sàn (Seniority & Fee Simulator)
          </h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Quản trị ưu đãi thâm niên hoạt động, tra cứu ma trận giảm trừ ký quỹ tập trung và công cụ mô phỏng phí sàn đa chiều.
          </p>
        </div>
        <button
          onClick={() => {
            loadTrustConfigs()
            loadSeniorityPolicies()
            loadCategoriesAndSettings()
          }}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          )}
        >
          <HiOutlineRefresh className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* SECTION 1: MA TRẬN GIẢM TRỪ KÝ QUỸ (READ-ONLY REFERENCE CARD) */}
      <div
        className={cn(
          'rounded-2xl border p-5 space-y-4 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-700/20">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <HiStar className="h-4 w-4 text-amber-400" />
              Ma Trận Ưu Đãi Ký Quỹ Đang Áp Dụng (Trust Level Discounts)
            </h3>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hạn mức tiền ký quỹ và mức % hoa hồng được giảm trừ tương ứng cho 5 bậc sao uy tín.
            </p>
          </div>

          <button
            onClick={() => navigate('/trust-config?tab=configs')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm self-start sm:self-auto',
              'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white'
            )}
            title="Chuyển đến Hub Quỹ Ký Quỹ để cấu hình số tiền và quyền lợi bậc sao"
          >
            <HiOutlineExternalLink className="h-4 w-4" />
            <span>Quản lý Bậc Sao tại Hub Ký Quỹ</span>
          </button>
        </div>

        {/* 5 Bậc sao Bento Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {loadingTrust ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Đang tải dữ liệu ma trận ký quỹ...
            </div>
          ) : (
            trustConfigs.map((cfg) => {
              const discount = Number(cfg.commissionDiscount || 0)
              return (
                <div
                  key={cfg.starLevel}
                  className={cn(
                    'rounded-xl border p-3 flex flex-col justify-between gap-2 transition hover:border-amber-500/50',
                    isDark ? 'border-slate-800 bg-slate-950/60' : 'border-stone-200 bg-stone-50/80'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-amber-500 text-xs">
                        {cfg.starLevel} ★
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[11px] font-extrabold',
                          discount > 0
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-400'
                        )}
                      >
                        {discount > 0 ? `-${discount}%` : '0%'}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate" title={cfg.tierName}>
                      {cfg.tierName}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/20 text-[11px]">
                    <span className={cn('block font-medium truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      {formatRange(cfg.minDeposit, cfg.maxDeposit)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <HiOutlineInformationCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>
            Bậc sao ký quỹ được quản lý tập trung tại <strong>Trung Tâm Quỹ Ký Quỹ & Bậc Sao</strong> nhằm bảo toàn nguyên tắc duy nhất nguồn dữ liệu (Single Source of Truth).
          </span>
        </div>
      </div>

      {/* SECTION 2: QUẢN LÝ CHÍNH SÁCH THÂM NIÊN (CRUD) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <HiOutlineClock className="h-5 w-5 text-blue-500" />
            2. Chính Sách Ưu Đãi Thâm Niên Hoạt Động (Seniority Policy CRUD)
          </h3>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Chính sách khuyến khích các gian hàng đồng hành lâu dài cùng sàn và duy trì tiêu chuẩn vận hành không vi phạm.
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl border shadow-sm overflow-hidden',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <table className="w-full text-left text-sm">
            <thead
              className={cn(
                'text-xs uppercase border-b',
                isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-stone-50 text-stone-600 border-stone-200'
              )}
            >
              <tr>
                <th className="px-4 py-3.5 w-48">Mốc Thâm Niên</th>
                <th className="px-4 py-3.5 w-32 text-center">Giảm Thêm</th>
                <th className="px-4 py-3.5 min-w-[220px]">Quy Chuẩn Áp Dụng</th>
                <th className="px-4 py-3.5 w-44 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
              {loadingSeniority ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-5 w-5 animate-spin text-blue-500 mb-2" />
                    Đang tải chính sách thâm niên...
                  </td>
                </tr>
              ) : seniorityPolicies.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    Chưa có chính sách thâm niên nào được thiết lập.
                  </td>
                </tr>
              ) : (
                seniorityPolicies.map((pol) => (
                  <tr
                    key={pol.id}
                    onClick={() => handleOpenEditSeniority(pol)}
                    className={cn(
                      'group transition cursor-pointer',
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'
                    )}
                    title="Nhấn để chỉnh sửa chính sách này"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-xs text-blue-500 flex items-center gap-1.5">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>{pol.tierName || `Mốc ${pol.minMonths} tháng`}</span>
                      </div>
                      <div className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Hoạt động liên tục ≥ <strong>{pol.minMonths} tháng</strong>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/20">
                        -{Number(pol.discountRate || 0)}%
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
                        {pol.description || 'Áp dụng cho shop không có vi phạm trong kỳ đánh giá.'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        {pol.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Bật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <HiOutlineXCircle className="h-3.5 w-3.5" /> Tắt
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEditSeniority(pol)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm',
                            'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                          )}
                        >
                          <HiOutlinePencilAlt className="h-3.5 w-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: TRÌNH MÔ PHỎNG & THỬ NGHIỆM PHÍ SÀN LIVE (INTERACTIVE SIMULATOR) */}
      <div
        className={cn(
          'rounded-2xl border p-6 space-y-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-700/20">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <HiOutlineCalculator className="h-5 w-5 text-emerald-500" />
              3. Trình Mô Phỏng & Thử Nghiệm Phí Sàn Live (Interactive Fee Calculator)
            </h3>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Thử nghiệm trực tiếp công thức tính hoa hồng động 3 tầng theo từng thông số ngành hàng, mức ký quỹ và thâm niên hoạt động.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <HiOutlineSparkles className="h-4 w-4" />
            <span>Ngưỡng sàn bảo vệ: {platformSettings.commission_floor_rate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Controls Form (7 Cols) */}
          <div className="space-y-4 lg:col-span-7">
            {/* Row 1: Category & Condition */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Ngành hàng sản phẩm</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                >
                  <option value="">Toàn sàn / Chưa phân loại ({platformSettings.commission_rate}%)</option>
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
                <label className="block text-xs font-semibold mb-1.5">Tình trạng thiết bị</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                >
                  <option value="GRADE_NEW">Mới 100% Nguyên Seal (Áp dụng Base Rate ngành)</option>
                  <option value="GRADE_LIKE_NEW">Like New 99% (Thu {platformSettings.commission_used_goods_rate}%)</option>
                  <option value="GRADE_FAIR">Cũ Dùng Tốt 90-95% (Thu {platformSettings.commission_used_goods_rate}%)</option>
                  <option value="GRADE_AS_IS">Xác / Linh Kiện Bán Đứt (Thu {platformSettings.commission_used_goods_rate}%)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Star Level & Active Months */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Bậc sao Ký Quỹ gian hàng</label>
                <select
                  value={selectedStarLevel}
                  onChange={(e) => setSelectedStarLevel(Number(e.target.value))}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                >
                  {trustConfigs.map((t) => (
                    <option key={t.starLevel} value={t.starLevel}>
                      {t.starLevel} ★ - {t.tierName} (Giảm {Number(t.commissionDiscount || 0)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold">Thâm niên hoạt động</label>
                  <span className="text-xs font-bold text-blue-500">{simActiveMonths} tháng</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={simActiveMonths}
                  onChange={(e) => setSimActiveMonths(Number(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-slate-700/20 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Row 3: Violation toggle & Test Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasViolation}
                  onChange={(e) => setHasViolation(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500"
                />
                <span className={cn('text-xs font-semibold', hasViolation ? 'text-rose-500' : '')}>
                  Gian hàng có vi phạm / kỷ luật (Mất ưu đãi thâm niên)
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold mb-1">Giá trị đơn hàng thử nghiệm (VNĐ)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="500000"
                    min="100000"
                    value={testOrderAmount}
                    onChange={(e) => setTestOrderAmount(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500',
                      isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Card (5 Cols) */}
          <div
            className={cn(
              'rounded-2xl border p-5 flex flex-col justify-between gap-4 lg:col-span-5 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-950/80' : 'border-stone-200 bg-stone-50'
            )}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/20">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả tính toán</span>
                <span className="inline-flex items-center rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-extrabold text-amber-500">
                  {simulationResult.finalRate.toFixed(2)}%
                </span>
              </div>

              {/* Breakdown steps */}
              <div className="space-y-2.5 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>
                    Tỷ lệ cơ bản ({simulationResult.selectedCondition !== 'GRADE_NEW' ? 'Hàng cũ' : 'Danh mục'}):
                  </span>
                  <span className="font-bold">{simulationResult.baseRate.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between text-emerald-500">
                  <span>- Ưu đãi Ký Quỹ ({simulationResult.trustTierName}):</span>
                  <span className="font-bold">-{simulationResult.depositDiscount.toFixed(2)}%</span>
                </div>

                <div className="flex items-center justify-between text-blue-500">
                  <span>- Ưu đãi Thâm Niên ({simulationResult.matchedPolicyName}):</span>
                  <span className="font-bold">-{simulationResult.seniorityDiscount.toFixed(2)}%</span>
                </div>

                {simulationResult.isFloorApplied && (
                  <div className="flex items-center justify-between text-amber-500 bg-amber-500/10 p-2 rounded-lg text-[11px]">
                    <span>⚠️ Kích hoạt ngưỡng sàn tối thiểu (Floor Rate):</span>
                    <span className="font-bold">{simulationResult.floorRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payout simulation */}
            <div className="pt-3 border-t border-slate-700/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Giá trị đơn hàng:</span>
                <span className="font-bold">{formatVND(simulationResult.orderAmt)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-500 font-semibold">Phí hoa hồng sàn thu:</span>
                <span className="font-bold text-rose-500">-{formatVND(simulationResult.feeAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/20">
                <span className="font-bold text-emerald-500">Shop thực nhận (Net):</span>
                <span className="text-sm font-extrabold text-emerald-500">{formatVND(simulationResult.sellerPayout)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT SENIORITY POLICY */}
      {editingSeniority && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
              <h3 className="text-base font-bold flex items-center gap-2">
                <HiOutlineClock className="h-5 w-5 text-blue-500" />
                <span>Chỉnh Sửa Chính Sách Thâm Niên</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSeniority(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeniority} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Mốc thâm niên tối thiểu (tháng)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={seniorityMonths}
                    onChange={(e) => setSeniorityMonths(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500',
                      isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Giảm Trừ Hoa Hồng (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.05"
                    required
                    value={seniorityDiscount}
                    onChange={(e) => setSeniorityDiscount(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500',
                      isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tên Hạng / Nhãn Chính Sách</label>
                <input
                  type="text"
                  required
                  value={seniorityTierName}
                  onChange={(e) => setSeniorityTierName(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Mô Tả Áp Dụng</label>
                <textarea
                  rows="3"
                  value={seniorityDesc}
                  onChange={(e) => setSeniorityDesc(e.target.value)}
                  placeholder="Áp dụng cho shop hoạt động liên tục trên X tháng..."
                  className={cn(
                    'w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSeniority"
                  checked={seniorityActive}
                  onChange={(e) => setSeniorityActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isActiveSeniority" className="text-xs font-semibold cursor-pointer">
                  Kích hoạt chính sách thâm niên này
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  disabled={submittingSeniority}
                  onClick={() => setEditingSeniority(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingSeniority}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
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
