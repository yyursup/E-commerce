import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlinePencilAlt,
  HiOutlineRefresh,
  HiStar,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineSparkles,
  HiOutlineCash,
  HiOutlineArrowNarrowRight,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import trustConfigService from '../../../../services/trustConfig'

export default function TrustLevelConfigTab() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('admin_trust_level_view') || 'cards'
  })

  // Edit Modal State
  const [editingConfig, setEditingConfig] = useState(null)
  const [tierName, setTierName] = useState('')
  const [minDeposit, setMinDeposit] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [commissionDiscount, setCommissionDiscount] = useState('')
  const [benefitsDescription, setBenefitsDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleToggleView = (mode) => {
    setViewMode(mode)
    localStorage.setItem('admin_trust_level_view', mode)
  }

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

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  const formatVND = (val) => {
    if (val === null || val === undefined || val === '') return 'Không giới hạn'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const formatRange = (min, max) => {
    if ((min === 0 || min === '0') && (max === null || max === undefined || max === '')) {
      return 'Mọi hạn mức'
    }
    if (max === null || max === undefined || max === '') {
      return `Từ ${formatVND(min)} trở lên`
    }
    return `${formatVND(min)} → ${formatVND(max)}`
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

  const handleResetDefaults = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục lại cấu hình 5 bậc sao ký quỹ về mức chuẩn của sàn không?')) {
      return
    }
    try {
      setLoading(true)
      const res = await trustConfigService.resetDefaultTrustLevels()
      setConfigs(Array.isArray(res) ? res : [])
      toast.success('Đã khôi phục cấu hình bậc sao ký quỹ chuẩn thành công!')
    } catch (err) {
      console.error('Lỗi khôi phục cấu hình chuẩn:', err)
      toast.error(err?.message || 'Khôi phục cấu hình chuẩn thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (level, sizeClass = 'h-4 w-4') => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <HiStar
          key={i}
          className={cn(
            sizeClass,
            i <= level ? 'text-amber-400' : isDark ? 'text-slate-700' : 'text-stone-300'
          )}
        />
      )
    }
    return stars
  }

  const getTierTheme = (starLevel) => {
    switch (starLevel) {
      case 1:
        return {
          border: isDark ? 'border-slate-800 hover:border-slate-700' : 'border-stone-200 hover:border-stone-300',
        }
      case 2:
        return {
          border: isDark ? 'border-teal-900/40 hover:border-teal-700/60' : 'border-teal-200 hover:border-teal-300',
        }
      case 3:
        return {
          border: isDark ? 'border-blue-900/40 hover:border-blue-700/60' : 'border-blue-200 hover:border-blue-300',
        }
      case 4:
        return {
          border: isDark ? 'border-amber-900/40 hover:border-amber-600/60' : 'border-amber-200 hover:border-amber-400',
        }
      case 5:
      default:
        return {
          border: isDark ? 'border-purple-900/50 hover:border-purple-600/70' : 'border-purple-200 hover:border-purple-400',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0" />
            Cấu Hình 5 Bậc Sao & Ngưỡng Ký Quỹ (Trust Level Configurations)
          </h2>
          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Thiết lập hạn mức ký quỹ từ 1★ đến 5★, mức giảm hoa hồng và cam kết bảo chứng độ uy tín.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Toggle */}
          <div
            className={cn(
              'flex items-center p-1 rounded-xl border',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-stone-100'
            )}
          >
            <button
              onClick={() => handleToggleView('cards')}
              title="Chuyển sang dạng Thẻ trực quan (Bento Grid)"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                viewMode === 'cards'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              <HiOutlineViewGrid className="h-4 w-4" />
              <span>Dạng Thẻ</span>
            </button>
            <button
              onClick={() => handleToggleView('table')}
              title="Chuyển sang dạng Bảng so sánh tinh gọn"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                viewMode === 'table'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              <HiOutlineViewList className="h-4 w-4" />
              <span>Dạng Bảng</span>
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition',
              isDark
                ? 'border-slate-800 bg-slate-900 text-rose-400 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-rose-600 hover:bg-rose-50'
            )}
            title="Khôi phục 5 bậc sao về mức chuẩn mặc định"
          >
            Khôi phục mặc định
          </button>
          <button
            onClick={loadConfigs}
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row items-start justify-between gap-4',
          isDark ? 'border-blue-500/20 bg-blue-500/5 text-slate-300' : 'border-blue-200 bg-blue-50/60 text-slate-800'
        )}
      >
        <div className="flex items-start gap-3.5">
          <HiOutlineInformationCircle className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-blue-500 text-sm">Nguyên tắc định lượng độ uy tín & xếp hạng:</p>
            <p>
              - <strong>1 Sao (0đ cọc):</strong> Áp dụng cho gian hàng mới hoặc không đóng quỹ ký quỹ. Vẫn được bán hàng nhưng độ tín nhiệm thấp nhất.
            </p>
            <p>
              - <strong>2 đến 5 Sao:</strong> Hệ thống tự động so khớp số dư Quỹ ký quỹ thực tế của Shop để gắn huy hiệu sao tương ứng. Khi có sự cố bị trích cọc mà không nạp bù trong 72h, hệ thống sẽ tự động giáng cấp.
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              - <strong>Liên kết động với Biểu Phí Hoa Hồng:</strong> % Giảm hoa hồng cài đặt tại đây là nguồn dữ liệu duy nhất (Single Source of Truth) kết nối trực tiếp vào công thức tính phí hoa hồng toàn sàn.
            </p>
          </div>
        </div>

        <Link
          to="/commissions?tab=policies"
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition shadow-sm border',
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
          )}
        >
          <HiOutlineCash className="h-4 w-4 text-amber-500" />
          <span>Mô Phỏng Phí & Ưu Đãi</span>
          <HiOutlineArrowNarrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <HiOutlineRefresh className="h-8 w-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-medium">Đang tải cấu hình 5 bậc sao...</p>
        </div>
      )}

      {/* VIEW 1: DẠNG THẺ (CARD BENTO GRID - MẶC ĐỊNH) */}
      {!loading && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {configs.map((cfg) => {
            const theme = getTierTheme(cfg.starLevel)
            return (
              <div
                key={cfg.starLevel}
                className={cn(
                  'rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative group',
                  theme.border,
                  isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-stone-900'
                )}
              >
                <div>
                  {/* Top Bar: Stars + Star Level + Edit Button */}
                  <div
                    className={cn(
                      'flex items-center justify-between gap-2 pb-3 border-b',
                      isDark ? 'border-slate-800' : 'border-stone-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {renderStars(cfg.starLevel, 'h-4 w-4')}
                      </div>
                      <span className="font-extrabold text-amber-500 text-sm">
                        {cfg.starLevel}★
                      </span>
                    </div>

                    {/* Quick Edit Action Button - ALWAYS 100% VISIBLE */}
                    <button
                      onClick={() => handleOpenEdit(cfg)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm',
                        'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                      )}
                      title={`Chỉnh sửa cấu hình bậc ${cfg.starLevel} sao`}
                    >
                      <HiOutlinePencilAlt className="h-3.5 w-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                  </div>

                  {/* Tier Title & Status */}
                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold tracking-tight text-amber-500">
                      {cfg.tierName}
                    </h3>
                    {cfg.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Kích hoạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <HiOutlineXCircle className="h-3.5 w-3.5" /> Tạm dừng
                      </span>
                    )}
                  </div>

                  {/* Escrow Deposit Range Box */}
                  <div
                    className={cn(
                      'mt-4 rounded-xl p-3 border',
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-stone-50 border-stone-200'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={cn('flex items-center gap-1 font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        <HiOutlineCash className="h-4 w-4 text-amber-500" />
                        Hạn Mức Ký Quỹ:
                      </span>
                      <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                        {cfg.maxDeposit ? 'Khoảng cọc' : 'Mức tối thiểu'}
                      </span>
                    </div>
                    <div className={cn('text-sm font-extrabold tracking-wide', isDark ? 'text-white' : 'text-stone-900')}>
                      {formatRange(cfg.minDeposit, cfg.maxDeposit)}
                    </div>
                  </div>

                  {/* Commission Discount Tag */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      Chiết khấu hoa hồng:
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border',
                        cfg.commissionDiscount > 0
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      )}
                    >
                      <HiOutlineSparkles className="h-3 w-3" />
                      {cfg.commissionDiscount ? `-${Number(cfg.commissionDiscount)}%` : '0%'}
                    </span>
                  </div>

                  {/* Benefits Description */}
                  <div className="mt-3.5">
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wider mb-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      Quyền lợi & Cam kết:
                    </p>
                    <p
                      className={cn(
                        'text-xs leading-relaxed line-clamp-4',
                        isDark ? 'text-slate-300' : 'text-stone-600'
                      )}
                    >
                      {cfg.benefitsDescription || 'Chưa thiết lập đặc quyền cụ thể cho bậc này.'}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  className={cn(
                    'mt-5 pt-3 border-t flex items-center justify-between',
                    isDark ? 'border-slate-800' : 'border-stone-100'
                  )}
                >
                  <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                    Bậc xếp hạng {cfg.starLevel}/5
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cfg)}
                    className={cn(
                      'text-xs font-semibold flex items-center gap-1 transition',
                      isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
                    )}
                  >
                    Cập nhật tham số →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 2: DẠNG BẢNG TINH GỌN (COMPACT STREAMLINED TABLE) */}
      {!loading && viewMode === 'table' && (
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
                <th className="px-4 py-3.5 w-44">Bậc Sao & Hạng</th>
                <th className="px-4 py-3.5 w-52">Hạn Mức Ký Quỹ</th>
                <th className="px-4 py-3.5 w-28 text-center">Giảm Phí</th>
                <th className="px-4 py-3.5 min-w-[200px]">Quyền Lợi & Đặc Quyền</th>
                <th className="px-4 py-3.5 w-44 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
              {configs.map((cfg) => (
                <tr
                  key={cfg.starLevel}
                  onClick={() => handleOpenEdit(cfg)}
                  className={cn(
                    'group transition cursor-pointer',
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-stone-50'
                  )}
                  title="Nhấn vào hàng để chỉnh sửa"
                >
                  {/* Col 1: Stars + Tier Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex items-center gap-0.5">
                        {renderStars(cfg.starLevel, 'h-3.5 w-3.5')}
                      </div>
                      <span className="font-extrabold text-amber-500 text-xs">
                        ({cfg.starLevel}★)
                      </span>
                    </div>
                    <div className="font-bold text-xs text-amber-500">
                      {cfg.tierName}
                    </div>
                  </td>

                  {/* Col 2: Combined Deposit Range */}
                  <td className="px-4 py-3.5">
                    <div className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                      {formatRange(cfg.minDeposit, cfg.maxDeposit)}
                    </div>
                    <div className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                      Tối thiểu: {formatVND(cfg.minDeposit)}
                    </div>
                  </td>

                  {/* Col 3: Commission Discount */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold',
                        cfg.commissionDiscount > 0
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-stone-400'
                      )}
                    >
                      {cfg.commissionDiscount ? `-${Number(cfg.commissionDiscount)}%` : '0%'}
                    </span>
                  </td>

                  {/* Col 4: Benefits Description */}
                  <td className="px-4 py-3.5">
                    <p
                      className={cn(
                        'text-xs leading-relaxed line-clamp-2',
                        isDark ? 'text-slate-300' : 'text-stone-600'
                      )}
                    >
                      {cfg.benefitsDescription || '-'}
                    </p>
                  </td>

                  {/* Col 5: Status & Prominent Edit Button */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2.5">
                      {cfg.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Kích hoạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                          <HiOutlineXCircle className="h-3.5 w-3.5" /> Tạm dừng
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenEdit(cfg)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm',
                          'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                        )}
                        title="Chỉnh sửa cấu hình bậc sao này"
                      >
                        <HiOutlinePencilAlt className="h-3.5 w-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CHỈNH SỬA CẤU HÌNH BẬC SAO */}
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
                  <div className="text-[11px] text-amber-500 font-medium mt-1">
                    {minDeposit !== '' ? `→ ${formatVND(minDeposit)}` : '0 ₫'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Ngưỡng tối đa (VNĐ) <span className={cn('font-normal', isDark ? 'text-slate-400' : 'text-stone-400')}>(Trống = vô hạn)</span>
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
                  <div className={cn('text-[11px] font-medium mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {maxDeposit !== '' ? `→ ${formatVND(maxDeposit)}` : '→ Không giới hạn'}
                  </div>
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
                <div className="text-[11px] text-emerald-500 font-medium mt-1">
                  {`→ Giảm ${Number(commissionDiscount || 0)}% hoa hồng sàn`}
                </div>
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
                  className="h-4 w-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="isActiveTier" className="text-xs font-semibold cursor-pointer">
                  Kích hoạt bậc xếp hạng này
                </label>
              </div>

              <div
                className={cn(
                  'mt-6 flex justify-end gap-3 pt-3 border-t',
                  isDark ? 'border-slate-800' : 'border-stone-200'
                )}
              >
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setEditingConfig(null)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-semibold transition',
                    isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                  )}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 shadow-sm transition"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
