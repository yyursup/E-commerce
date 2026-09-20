import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'
import shopService from '../../services/shop'

export default function ShopViolations() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState([])
  const [showAppealModal, setShowAppealModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Real-time shop health & violation state from DB
  const [shopHealth, setShopHealth] = useState({
    violationCount: user?.violationCount ?? 0,
    shopStatus: user?.shopStatus || 'ACTIVE',
    disciplineLevel: user?.disciplineLevel || 'NONE',
    bannedUntil: user?.bannedUntil || null,
    lastViolationAt: null,
  })

  // Form state
  const [targetType, setTargetType] = useState('SHOP')
  const [targetId, setTargetId] = useState(user?.shopId || '')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const violationCount = shopHealth.violationCount
  const shopStatus = shopHealth.shopStatus

  const loadData = async () => {
    try {
      setLoading(true)

      // 1. Fetch live shop health metrics from backend
      try {
        const myShop = await shopService.getMyShop()
        if (myShop) {
          const vCount = myShop.violationCount ?? 0
          const sStatus = myShop.status || 'ACTIVE'
          const dLevel = myShop.disciplineLevel || 'NONE'
          const bUntil = myShop.bannedUntil || null
          const lastV = myShop.lastViolationAt || null

          setShopHealth({
            violationCount: vCount,
            shopStatus: sStatus,
            disciplineLevel: dLevel,
            bannedUntil: bUntil,
            lastViolationAt: lastV,
          })

          // Sync into Auth store for app-wide awareness
          useAuthStore.getState().updateUser({
            violationCount: vCount,
            shopStatus: sStatus,
            disciplineLevel: dLevel,
            bannedUntil: bUntil,
            shopId: myShop.id || user?.shopId,
          })

          if (myShop.id && !targetId) {
            setTargetId(myShop.id)
          }
        }
      } catch (shopErr) {
        console.warn('Không thể lấy chi tiết sức khỏe shop:', shopErr)
      }

      // 2. Fetch appeal requests
      const res = await requestService.getRequests({ page: 0, size: 50 })
      const list = res?.content || (Array.isArray(res) ? res : [])
      const appealList = list.filter((r) => r.type === 'APPEAL')
      setAppeals(appealList)
    } catch (err) {
      console.error('Load data error:', err)
      toast.error('Không thể tải lịch sử kháng cáo.')
      setAppeals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitAppeal = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Vui lòng nhập nội dung giải trình kháng cáo!')
      return
    }

    const tId = targetType === 'SHOP' ? (user?.shopId || targetId?.trim()) : targetId?.trim()
    if (!tId) {
      toast.error('Vui lòng chỉ định Target ID hợp lệ!')
      return
    }

    try {
      setSubmitting(true)
      await requestService.createAppeal({
        targetId: tId,
        targetType,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || null,
      })
      toast.success('Đã gửi đơn kháng cáo thành công! Vui lòng chờ Admin thẩm định.')
      setShowAppealModal(false)
      setDescription('')
      setEvidenceUrl('')
      loadData()
    } catch (err) {
      console.error('Submit appeal error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi gửi đơn kháng cáo')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Chấp thuận',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: HiOutlineCheckCircle,
        }
      case 'REJECTED':
        return {
          label: 'Bị bác đơn',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: HiOutlineXCircle,
        }
      case 'PENDING':
      default:
        return {
          label: 'Đang thẩm định',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: HiOutlineClock,
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Sức Khỏe Shop & Quản Lý Vi Phạm
              </h1>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Giám sát kỷ luật gian hàng, theo dõi chu kỳ giảm trừ 30 ngày và nộp đơn kháng cáo gỡ lỗi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className={cn(
              'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
              isDark
                ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
            title="Tải lại"
          >
            <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>

          <button
            onClick={() => {
              setTargetType('SHOP')
              setTargetId(user?.shopId || '')
              setShowAppealModal(true)
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all"
          >
            <HiOutlinePlus className="h-4 w-4 stroke-[2.5]" />
            Gửi đơn kháng cáo mới
          </button>
        </div>
      </div>

      {/* Cảnh báo kỷ luật cấp độ 2: Tạm ngưng 14 ngày & Giữ Escrow */}
      {(shopStatus === 'SUSPENDED' || violationCount >= 5) && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                <HiOutlineExclamation className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-500 text-white tracking-wider">
                    Kỷ luật cấp độ 2 ({violationCount}/7 vi phạm)
                  </span>
                  <h3 className="text-base font-bold text-rose-500 dark:text-rose-400">
                    Gian hàng đang bị tạm ngưng hoạt động 14 ngày
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Do tích lũy <strong>{violationCount} lần vi phạm</strong>, toàn bộ sản phẩm của gian hàng đã được tạm ẩn khỏi sàn và gian hàng bị đình chỉ kinh doanh tạm thời. Khoản tiền ký quỹ Escrow đang được tạm giữ để bảo vệ quyền lợi người mua.
                </p>
                <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                  • Các đơn hàng đã phát sinh trước đó vẫn được tiếp tục vận chuyển bình thường đến tay khách hàng.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTargetType('SHOP')
                setTargetId(user?.shopId || '')
                setShowAppealModal(true)
              }}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/30 transition-all"
            >
              <HiOutlineDocumentText className="h-4 w-4" />
              Nộp đơn kháng cáo ngay
            </button>
          </div>
        </div>
      )}

      {/* Cảnh báo kỷ luật cấp độ 1: Cảnh báo gian hàng */}
      {shopStatus === 'WARNED' && violationCount < 5 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                <HiOutlineExclamation className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-500 text-white tracking-wider">
                    Kỷ luật cấp độ 1 ({violationCount}/7 vi phạm)
                  </span>
                  <h3 className="text-base font-bold text-amber-500 dark:text-amber-400">
                    Gian hàng đang trong tình trạng cảnh báo
                  </h3>
                </div>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Gian hàng đã chạm mốc <strong>{violationCount} lần vi phạm</strong>. Vui lòng rà soát chất lượng sản phẩm và dịch vụ để tránh đạt ngưỡng 5 lần vi phạm (sẽ bị tạm ngưng 14 ngày).
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTargetType('SHOP')
                setTargetId(user?.shopId || '')
                setShowAppealModal(true)
              }}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 shadow-md shadow-amber-600/30 transition-all"
            >
              <HiOutlineDocumentText className="h-4 w-4" />
              Kháng cáo gỡ cảnh báo
            </button>
          </div>
        </div>
      )}

      {/* Grid: Health Metric & Decay Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Card */}
        <div
          className={cn(
            'rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Chỉ số kỷ luật</span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border',
                  shopStatus === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : shopStatus === 'WARNED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                )}
              >
                {shopStatus === 'ACTIVE' ? 'Hoạt động tốt' : shopStatus === 'WARNED' ? 'Đang cảnh báo' : 'Bị tạm ngưng'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-amber-500">{violationCount}</span>
              <span className="text-sm font-semibold text-stone-400">/ 7 lần vi phạm tối đa</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  violationCount < 3
                    ? 'bg-emerald-500'
                    : violationCount < 5
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(100, (violationCount / 7) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 text-[11px] text-stone-400 space-y-1">
            <p>• <strong>3 lần</strong>: Cảnh báo gian hàng (WARNED)</p>
            <p>• <strong>5 lần</strong>: Tạm ngưng 14 ngày & Giữ Escrow (SUSPENDED)</p>
            <p>• <strong>7 lần</strong>: Khóa vĩnh viễn & Hoàn tiền Escrow cho khách (BANNED)</p>
          </div>
        </div>

        {/* 30-Day Monthly Decay Explanation */}
        <div
          className={cn(
            'lg:col-span-2 rounded-3xl border p-6 shadow-sm transition-colors flex flex-col justify-between',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3 text-amber-500">
              <HiOutlineExclamation className="h-6 w-6 shrink-0" />
              <h2 className="font-bold text-base">Thuật Toán Hoàn Lương (Chính Sách Giảm Trừ 30 Ngày)</h2>
            </div>
            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-600')}>
              Hệ thống áp dụng chính sách <strong>30 ngày giảm trừ 1 điểm vi phạm</strong>: Nếu trong vòng 30 ngày liên tục, gian hàng hoạt động chuẩn mực và không phát sinh bất kỳ báo cáo vi phạm nào được xác nhận, số lần vi phạm của gian hàng sẽ được tự động trừ đi <code>-1 lần</code> cho đến khi trở về <code>0</code>.
            </p>
            <div className={cn(
              'mt-4 p-4 rounded-2xl border text-xs space-y-2',
              isDark ? 'border-amber-500/20 bg-amber-500/5 text-slate-300' : 'border-amber-200 bg-amber-50/50 text-stone-700'
            )}>
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>🛡️ Quyền lợi khi chấp hành tốt:</span>
              </div>
              <p>• Giúp các gian hàng có cơ hội khắc phục sai sót, không bị cộng dồn lỗi vĩnh viễn xuyên suốt nhiều năm.</p>
              <p>• Khi bị cảnh báo, các đơn hàng đang giao vẫn được giao nốt bình thường để phục vụ người mua.</p>
              <p>• Có thể chủ động nộp hồ sơ hóa đơn chứng từ gỡ oan ngay tại bảng kháng cáo bên dưới.</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-400">
            <span>Trạng thái ký quỹ Escrow:</span>
            <span className="font-bold text-emerald-500">Bảo vệ 2 chiều (Sàn trung gian)</span>
          </div>
        </div>
      </div>

      {/* Appeal History Section */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm transition-colors space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Lịch Sử Đơn Kháng Cáo Đã Gửi
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Danh sách các hồ sơ giải trình đang được Quản trị viên sàn thẩm định
            </p>
          </div>
          <span className="text-xs font-bold text-amber-500">{appeals.length} hồ sơ</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className="mt-2 text-xs text-stone-400">Đang tải lịch sử kháng cáo...</p>
          </div>
        ) : appeals.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-slate-800">
            <HiOutlineDocumentText className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-sm text-stone-600 dark:text-slate-400">
              Gian hàng chưa nộp đơn kháng cáo nào
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Nếu nhận thấy phán quyết kỷ luật hoặc khóa sản phẩm có sự nhầm lẫn, hãy bấm nút "Gửi đơn kháng cáo mới".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-slate-800">
            {appeals.map((item) => {
              const badge = getStatusBadge(item.status)
              const BadgeIcon = badge.icon
              return (
                <div key={item.requestId || item.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border', badge.color)}>
                        <BadgeIcon className="h-3.5 w-3.5" />
                        {badge.label}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        Mã yêu cầu: #{String(item.requestId || item.id).substring(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>

                  <p className={cn('text-xs font-medium leading-relaxed', isDark ? 'text-slate-200' : 'text-stone-800')}>
                    {item.description || 'Không có mô tả chi tiết'}
                  </p>

                  {item.response && (
                    <div className={cn(
                      'p-3 rounded-xl border text-xs space-y-1',
                      isDark ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-700'
                    )}>
                      <span className="font-bold text-amber-500">Phản hồi từ Quản trị viên:</span>
                      <p>{item.response}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nộp Đơn Kháng Cáo */}
      <AnimatePresence>
        {showAppealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <h2 className="text-lg font-bold mb-1">Gửi Đơn Kháng Cáo Kỷ Luật</h2>
              <p className={cn('text-xs mb-4', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Vui lòng cung cấp đầy đủ lý do giải trình và bằng chứng gỡ tội (hóa đơn VAT, giấy phép phân phối)
              </p>

              <form onSubmit={handleSubmitAppeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Đối tượng kháng cáo</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      const val = e.target.value
                      setTargetType(val)
                      if (val === 'SHOP') {
                        setTargetId(user?.shopId || '')
                      } else {
                        setTargetId('')
                      }
                    }}
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  >
                    <option value="SHOP">Toàn bộ Gian hàng (SHOP)</option>
                    <option value="PRODUCT">Sản phẩm bị tạm ẩn/khóa (PRODUCT)</option>
                  </select>
                </div>

                {targetType === 'SHOP' && (
                  <div>
                    <label className="block text-xs font-bold mb-1">Mã Gian hàng kháng cáo (Shop ID)</label>
                    <input
                      type="text"
                      value={user?.shopId || targetId || ''}
                      readOnly
                      placeholder="Mã gian hàng của bạn"
                      className={cn(
                        'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none font-mono opacity-80 cursor-not-allowed',
                        isDark ? 'border-slate-800 bg-slate-800 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-600'
                      )}
                    />
                  </div>
                )}

                {targetType === 'PRODUCT' && (
                  <div>
                    <label className="block text-xs font-bold mb-1">Mã ID Sản phẩm (Product UUID)</label>
                    <input
                      type="text"
                      placeholder="Dán ID sản phẩm bị khóa vào đây..."
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className={cn(
                        'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none font-mono',
                        isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                      )}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">Nội dung giải trình *</label>
                  <textarea
                    rows={4}
                    placeholder="Trình bày chi tiết lý do bạn cho rằng phán quyết là nhầm lẫn..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Link tài liệu / Hóa đơn chứng từ (Evidence URL)</label>
                  <input
                    type="url"
                    placeholder="https://... (Link ảnh hóa đơn VAT, chứng nhận đại lý)"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className={cn(
                      'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all',
                      isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Đang gửi...' : 'Nộp đơn kháng cáo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
