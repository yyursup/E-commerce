import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlinePencilAlt,
  HiOutlineRefresh,
  HiStar,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import trustConfigService from '../../../../services/trustConfig'
import seniorityPolicyService from '../../../../services/seniorityPolicy'

export default function DiscountPoliciesTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  // --- Trust Level Config State ---
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit Trust Level Modal State
  const [editingConfig, setEditingConfig] = useState(null)
  const [tierName, setTierName] = useState('')
  const [minDeposit, setMinDeposit] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [commissionDiscount, setCommissionDiscount] = useState('')
  const [benefitsDescription, setBenefitsDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // --- Seniority Policies State ---
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

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await trustConfigService.getAdminTrustLevels()
      setConfigs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải cấu hình bậc sao:', err)
      toast.error(err?.message || 'Không thể tải cấu hình bậc sao.')
    } finally {
      setLoading(false)
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

  useEffect(() => {
    loadConfigs()
    loadSeniorityPolicies()
  }, [loadConfigs, loadSeniorityPolicies])

  const formatVND = (val) => {
    if (val === null || val === undefined) return 'Không giới hạn'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const handleOpenEdit = (config) => {
    setEditingConfig(config)
    setTierName(config.tierName || '')
    setMinDeposit(config.minDeposit !== null && config.minDeposit !== undefined ? String(config.minDeposit) : '0')
    setMaxDeposit(config.maxDeposit !== null && config.maxDeposit !== undefined ? String(config.maxDeposit) : '')
    setCommissionDiscount(config.commissionDiscount !== null && config.commissionDiscount !== undefined ? String(config.commissionDiscount) : '0')
    setBenefitsDescription(config.benefitsDescription || '')
    setIsActive(config.isActive !== false)
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!editingConfig) return

    const minNum = Number(minDeposit)
    const maxNum = maxDeposit !== '' ? Number(maxDeposit) : null
    const discountNum = Number(commissionDiscount)

    if (minNum < 0) {
      toast.error('Ngưỡng tiền tối thiểu không được âm')
      return
    }

    if (maxNum !== null && maxNum <= minNum) {
      toast.error('Ngưỡng tối đa phải lớn hơn ngưỡng tối thiểu')
      return
    }

    if (discountNum < 0 || discountNum > 10) {
      toast.error('Chiết khấu hoa hồng phải từ 0% đến 10%')
      return
    }

    try {
      setSubmitting(true)
      await trustConfigService.updateTrustLevel(editingConfig.starLevel, {
        tierName: tierName.trim(),
        minDeposit: minNum,
        maxDeposit: maxNum,
        commissionDiscount: discountNum,
        benefitsDescription: benefitsDescription.trim(),
        isActive,
      })
      toast.success(`Cập nhật cấu hình bậc ${editingConfig.starLevel} sao thành công!`)
      setEditingConfig(null)
      loadConfigs()
    } catch (err) {
      console.error('Lỗi cập nhật cấu hình:', err)
      toast.error(err?.message || 'Cập nhật cấu hình thất bại.')
    } finally {
      setSubmitting(false)
    }
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

  const renderStars = (level) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <HiStar
          key={i}
          className={cn(
            'h-5 w-5',
            i <= level ? 'text-amber-400' : isDark ? 'text-slate-700' : 'text-stone-300'
          )}
        />
      )
    }
    return stars
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-amber-500" />
            Chính Sách Giảm Trừ Hoa Hồng (Ký Quỹ & Thâm Niên)
          </h2>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Admin thiết lập động 2 mức chiết khấu: theo Bậc Sao Ký Quỹ và theo Số Tháng Thâm Niên hoạt động.
          </p>
        </div>
        <button
          onClick={() => {
            loadConfigs()
            loadSeniorityPolicies()
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

      {/* Guide Banner */}
      <div
        className={cn(
          'rounded-2xl border p-5 flex items-start gap-4',
          isDark ? 'border-amber-500/20 bg-amber-500/5 text-slate-300' : 'border-amber-200 bg-amber-50/60 text-slate-800'
        )}
      >
        <HiOutlineInformationCircle className="h-6 w-6 flex-shrink-0 text-amber-500 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-amber-600 dark:text-amber-400 text-sm">Công thức chiết khấu trừ dần:</p>
          <p className="font-mono text-xs bg-black/10 dark:bg-black/30 p-2 rounded-lg">
            FinalRate = Math.max(BaseRate - DepositDiscount - SeniorityDiscount, 1.5% [Sàn an toàn])
          </p>
          <p>
            - <strong>Chiết khấu Ký Quỹ:</strong> Shop nâng hạn mức tiền gửi vào Quỹ Ký Quỹ (1★ - 5★) sẽ được giảm trừ hoa hồng tương ứng.
          </p>
          <p>
            - <strong>Chiết khấu Thâm Niên:</strong> Shop có lịch sử hoạt động bền vững (≥ 3, 6, 12 tháng) sẽ nhận thêm ưu đãi thâm niên.
          </p>
        </div>
      </div>

      {/* SECTION 1: CẤU HÌNH 5 BẬC SAO KÝ QUỸ */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <HiStar className="h-5 w-5 text-amber-400" />
            1. Bậc Uy Tín Ký Quỹ & Chiết Khấu (Trust Level Discount)
          </h3>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Khoảng tiền ký quỹ và mức % hoa hồng được giảm trừ cho từng bậc sao.
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl border shadow-sm overflow-hidden',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={cn('text-xs uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
                <tr>
                  <th className="px-6 py-4">Bậc Uy Tín</th>
                  <th className="px-6 py-4">Tên Hạng / Danh Hiệu</th>
                  <th className="px-6 py-4">Ngưỡng Tiền Tối Thiểu</th>
                  <th className="px-6 py-4">Ngưỡng Tiền Tối Đa</th>
                  <th className="px-6 py-4">Giảm Hoa Hồng (%)</th>
                  <th className="px-6 py-4">Quyền Lợi & Đặc Quyền</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                      <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                      Đang tải cấu hình bậc sao...
                    </td>
                  </tr>
                ) : (
                  configs.map((cfg) => (
                    <tr key={cfg.starLevel} className={cn('hover:bg-slate-800/20 transition')}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {renderStars(cfg.starLevel)}
                          </div>
                          <span className="font-bold text-amber-500 text-xs ml-1">
                            ({cfg.starLevel}★)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-amber-500">
                        {cfg.tierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatVND(cfg.minDeposit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {formatVND(cfg.maxDeposit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-500">
                        {cfg.commissionDiscount ? `-${Number(cfg.commissionDiscount)}%` : '0%'}
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs text-slate-300">
                        {cfg.benefitsDescription || '-'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {cfg.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                            <HiOutlineCheckCircle className="h-4 w-4" /> Kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500">
                            <HiOutlineXCircle className="h-4 w-4" /> Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(cfg)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition border border-amber-500/20"
                        >
                          <HiOutlinePencilAlt className="h-4 w-4" /> Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: CẤU HÌNH CHÍNH SÁCH THÂM NIÊN */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <HiOutlineClock className="h-5 w-5 text-blue-500" />
            2. Chính Sách Chiết Khấu Theo Thâm Niên (Seniority Policies)
          </h3>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hệ thống tự động so khớp số tháng từ ngày tạo gian hàng của Shop để áp dụng mức giảm.
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl border shadow-sm overflow-hidden',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={cn('text-xs uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
                <tr>
                  <th className="px-6 py-4">Mốc Thâm Niên Tối Thiểu</th>
                  <th className="px-6 py-4">Tên Hạng Chính Sách</th>
                  <th className="px-6 py-4">Giảm Hoa Hồng (%)</th>
                  <th className="px-6 py-4">Mô Tả Áp Dụng</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {loadingSeniority ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-blue-500 mb-2" />
                      Đang tải chính sách thâm niên...
                    </td>
                  </tr>
                ) : seniorityPolicies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      Chưa có chính sách thâm niên nào được khởi tạo.
                    </td>
                  </tr>
                ) : (
                  seniorityPolicies.map((pol) => (
                    <tr key={pol.id} className={cn('hover:bg-slate-800/20 transition')}>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-400">
                        ≥ {pol.minMonths} tháng
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {pol.tierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-500">
                        -{Number(pol.discountRate || 0)}%
                      </td>
                      <td className="px-6 py-4 text-xs max-w-sm text-slate-300">
                        {pol.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {pol.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                            <HiOutlineCheckCircle className="h-4 w-4" /> Kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500">
                            <HiOutlineXCircle className="h-4 w-4" /> Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditSeniority(pol)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition border border-blue-500/20"
                        >
                          <HiOutlinePencilAlt className="h-4 w-4" /> Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA CẤU HÌNH BẬC SAO */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HiOutlineShieldCheck className="h-6 w-6 text-amber-500" />
              Chỉnh Sửa Bậc Uy Tín {editingConfig.starLevel} Sao
            </h3>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điều chỉnh tên gọi, mức tiền ký quỹ, chiết khấu hoa hồng và đặc quyền.
            </p>

            <form onSubmit={handleSaveConfig} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Tên Hạng / Danh hiệu</label>
                <input
                  type="text"
                  required
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Ngưỡng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                      isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Ngưỡng tối đa (VNĐ) <span className="text-slate-400 font-normal">(Trống = vô hạn)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="Không giới hạn"
                    value={maxDeposit}
                    onChange={(e) => setMaxDeposit(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                      isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Giảm Trừ Hoa Hồng (%) <span className="text-emerald-500 font-normal">(VD: 0.50 tương ứng giảm 0.5%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.05"
                  required
                  value={commissionDiscount}
                  onChange={(e) => setCommissionDiscount(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Mô tả đặc quyền & Cam kết</label>
                <textarea
                  rows="3"
                  value={benefitsDescription}
                  onChange={(e) => setBenefitsDescription(e.target.value)}
                  placeholder="Mô tả quyền lợi ưu tiên hiển thị, bảo chứng đền bù khi có khiếu nại..."
                  className={cn(
                    'w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveTier"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActiveTier" className="text-xs font-semibold cursor-pointer">
                  Kích hoạt bậc xếp hạng này
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setEditingConfig(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA CHÍNH SÁCH THÂM NIÊN */}
      {editingSeniority && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HiOutlineClock className="h-6 w-6 text-blue-500" />
              Chỉnh Sửa Chính Sách Thâm Niên
            </h3>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điều chỉnh mốc thâm niên (tháng), tỷ lệ giảm trừ hoa hồng và mô tả chính sách.
            </p>

            <form onSubmit={handleSaveSeniority} className="mt-5 space-y-4">
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
