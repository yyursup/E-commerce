import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlinePencilAlt,
  HiOutlineRefresh,
  HiStar,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import trustConfigService from '../../services/trustConfig'

export default function AdminTrustConfig() {
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit Modal State
  const [editingConfig, setEditingConfig] = useState(null)
  const [tierName, setTierName] = useState('')
  const [minDeposit, setMinDeposit] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [benefitsDescription, setBenefitsDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
    if (val === null || val === undefined) return 'Không giới hạn'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const handleOpenEdit = (config) => {
    setEditingConfig(config)
    setTierName(config.tierName || '')
    setMinDeposit(config.minDeposit !== null && config.minDeposit !== undefined ? String(config.minDeposit) : '0')
    setMaxDeposit(config.maxDeposit !== null && config.maxDeposit !== undefined ? String(config.maxDeposit) : '')
    setBenefitsDescription(config.benefitsDescription || '')
    setIsActive(config.isActive !== false)
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!editingConfig) return

    const minNum = Number(minDeposit)
    const maxNum = maxDeposit !== '' ? Number(maxDeposit) : null

    if (minNum < 0) {
      toast.error('Ngưỡng tiền tối thiểu không được âm')
      return
    }

    if (maxNum !== null && maxNum <= minNum) {
      toast.error('Ngưỡng tối đa phải lớn hơn ngưỡng tối thiểu')
      return
    }

    try {
      setSubmitting(true)
      await trustConfigService.updateTrustLevel(editingConfig.starLevel, {
        tierName: tierName.trim(),
        minDeposit: minNum,
        maxDeposit: maxNum,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <HiOutlineShieldCheck className="h-8 w-8 text-amber-500" />
            Cấu Hình Ngưỡng Tiền Ký Quỹ & Độ Uy Tín (Trust Level)
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Admin thiết lập linh hoạt các khoảng tiền ký quỹ (Deposit Range) tương ứng từ 1 sao đến 5 sao (Không hardcode).
          </p>
        </div>
        <button
          onClick={loadConfigs}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition',
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
          isDark ? 'border-blue-500/20 bg-blue-500/5 text-slate-300' : 'border-blue-200 bg-blue-50/60 text-slate-800'
        )}
      >
        <HiOutlineInformationCircle className="h-6 w-6 flex-shrink-0 text-blue-500 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-blue-500 text-sm">Nguyên tắc định lượng độ uy tín:</p>
          <p>
            - <strong>1 Sao (Cơ bản):</strong> Áp dụng cho Seller không ký quỹ hoặc ký quỹ dưới ngưỡng 1 triệu. Cho phép bán nhưng độ uy tín thấp nhất.
          </p>
          <p>
            - <strong>2 đến 5 Sao:</strong> Hệ thống tự động so khớp số dư Quỹ ký quỹ thực tế của Shop để gắn huy hiệu sao tương ứng. Khi có sự cố bị trích cọc mà không nạp bù, hệ thống sẽ tự động giáng cấp theo các ngưỡng này.
          </p>
        </div>
      </div>

      {/* Danh sách 5 bậc cấu hình */}
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
                <th className="px-6 py-4">Quyền Lợi & Đặc Quyền</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
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
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition border border-amber-500/20"
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

      {/* MODAL CHỈNH SỬA CẤU HÌNH BẬC SAO */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HiOutlineShieldCheck className="h-6 w-6 text-amber-500" />
              Chỉnh Sửa Bậc Uy Tín {editingConfig.starLevel} Sao
            </h2>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điều chỉnh tên gọi, mức tiền ký quỹ và các đặc quyền tương ứng.
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
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
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
