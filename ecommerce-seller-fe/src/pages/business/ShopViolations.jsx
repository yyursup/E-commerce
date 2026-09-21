import { useState, useEffect, useRef } from 'react'
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
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineEye,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'
import shopService from '../../services/shop'
import fileService from '../../services/fileService'

// Helper tách và gom tất cả link ảnh từ các nguồn (hỗ trợ nhiều ảnh phân cách bằng dấu phẩy)
export const parseImages = (...sources) => {
  const urls = []
  sources.forEach((src) => {
    if (typeof src === 'string' && src.trim()) {
      src.split(',').forEach((url) => {
        const trimmed = url.trim()
        if (trimmed && !urls.includes(trimmed)) {
          urls.push(trimmed)
        }
      })
    }
  })
  return urls
}

export default function ShopViolations() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState([])
  const [violations, setViolations] = useState([])
  const [showAppealModal, setShowAppealModal] = useState(false)
  const [detailViolation, setDetailViolation] = useState(null) // Modal xem chi tiết vi phạm
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  // Real-time shop health & violation state from DB
  const [shopHealth, setShopHealth] = useState({
    violationCount: user?.violationCount ?? 0,
    shopStatus: user?.shopStatus || 'ACTIVE',
    disciplineLevel: user?.disciplineLevel || 'NONE',
    bannedUntil: user?.bannedUntil || null,
    lastViolationAt: null,
  })

  // Selected violation to appeal
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [description, setDescription] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState([])

  const violationCount = shopHealth.violationCount
  const shopStatus = shopHealth.shopStatus

  // Các vi phạm chưa kháng cáo
  const appealableViolations = violations.filter((v) => v.appealStatus === 'NONE')
  const hasAppealableViolations = appealableViolations.length > 0

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

          useAuthStore.getState().updateUser({
            violationCount: vCount,
            shopStatus: sStatus,
            disciplineLevel: dLevel,
            bannedUntil: bUntil,
            shopId: myShop.id || user?.shopId,
          })
        }
      } catch (shopErr) {
        console.warn('Không thể lấy chi tiết sức khỏe shop:', shopErr)
      }

      // 2. Fetch danh sách vi phạm của Shop
      try {
        const vList = await shopService.getMyViolations()
        setViolations(vList || [])
      } catch (vErr) {
        console.warn('Không thể lấy danh sách vi phạm:', vErr)
        setViolations([])
      }

      // 3. Fetch appeal requests lịch sử
      try {
        const res = await requestService.getRequests({ page: 0, size: 50 })
        const list = res?.content || (Array.isArray(res) ? res : [])
        const appealList = list.filter((r) => r.type === 'APPEAL')
        setAppeals(appealList)
      } catch (aErr) {
        console.warn('Không thể lấy lịch sử kháng cáo:', aErr)
        setAppeals([])
      }
    } catch (err) {
      console.error('Load data error:', err)
      toast.error('Không thể tải dữ liệu vi phạm.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAppealModal = (violation = null) => {
    if (violation) {
      setSelectedViolation(violation)
    } else if (hasAppealableViolations) {
      setSelectedViolation(appealableViolations[0])
    } else {
      setSelectedViolation(null)
    }
    setDescription('')
    setEvidenceUrls([])
    setShowAppealModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB!`)
      } else {
        validFiles.push(file)
      }
    }

    if (!validFiles.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      setUploadingImage(true)
      const uploaded = []
      for (const file of validFiles) {
        const res = await fileService.uploadFile(file, 'appeals')
        const uploadedUrl = res?.url || res?.data?.url
        if (uploadedUrl) {
          uploaded.push(uploadedUrl)
        }
      }

      if (uploaded.length > 0) {
        setEvidenceUrls((prev) => [...prev, ...uploaded])
        toast.success(`Đã tải lên ${uploaded.length} ảnh chứng từ thành công!`)
      } else {
        toast.error('Không nhận được link ảnh từ máy chủ.')
      }
    } catch (err) {
      console.error('Upload image error:', err)
      toast.error(err?.message || 'Tải ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmitAppeal = async (e) => {
    e.preventDefault()
    if (!selectedViolation) {
      toast.error('Vui lòng chọn vi phạm cần kháng cáo!')
      return
    }

    if (!description.trim()) {
      toast.error('Vui lòng nhập nội dung giải trình kháng cáo!')
      return
    }

    try {
      setSubmitting(true)
      await requestService.createAppeal({
        targetId: selectedViolation.targetId,
        targetType: selectedViolation.targetType,
        reportId: selectedViolation.reportId,
        description: description.trim(),
        evidenceUrl: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
      })
      toast.success('Đã gửi đơn kháng cáo thành công! Vui lòng chờ Admin thẩm định.')
      setShowAppealModal(false)
      setSelectedViolation(null)
      setDescription('')
      setEvidenceUrls([])
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
                Giám sát kỷ luật gian hàng, theo dõi chu kỳ giảm trừ 30 ngày và kháng cáo từng vi phạm cụ thể
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

          {/* Nút gửi đơn kháng cáo chỉ hiển thị khi có vi phạm và còn được phép kháng cáo */}
          {hasAppealableViolations ? (
            <button
              onClick={() => handleOpenAppealModal()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all"
            >
              <HiOutlinePlus className="h-4 w-4 stroke-[2.5]" />
              Gửi đơn kháng cáo ({appealableViolations.length} vi phạm)
            </button>
          ) : (
            <div className={cn(
              'px-4 py-2.5 rounded-2xl text-xs font-semibold border flex items-center gap-2',
              isDark ? 'border-slate-800 bg-slate-800/50 text-slate-400' : 'border-stone-200 bg-stone-100 text-stone-500'
            )}>
              <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
              Không có vi phạm cần kháng cáo
            </div>
          )}
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

            {hasAppealableViolations && (
              <button
                onClick={() => handleOpenAppealModal()}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/30 transition-all"
              >
                <HiOutlineDocumentText className="h-4 w-4" />
                Nộp đơn kháng cáo ngay
              </button>
            )}
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

            {hasAppealableViolations && (
              <button
                onClick={() => handleOpenAppealModal()}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 shadow-md shadow-amber-600/30 transition-all"
              >
                <HiOutlineDocumentText className="h-4 w-4" />
                Kháng cáo gỡ cảnh báo
              </button>
            )}
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
              <p>• Mỗi đơn kháng cáo chỉ áp dụng cho 1 sự vụ vi phạm cụ thể, khi được duyệt sẽ trừ đúng 1 vi phạm.</p>
              <p>• Quyết định từ chối của Ban Quản Trị là quyết định cuối cùng cho vi phạm đó để tránh việc khiếu nại tràn lan.</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-400">
            <span>Trạng thái ký quỹ Escrow:</span>
            <span className="font-bold text-emerald-500">Bảo vệ 2 chiều (Sàn trung gian)</span>
          </div>
        </div>
      </div>

      {/* SECTION: DANH SÁCH CÁC VI PHẠM CỦA GIAN HÀNG */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm transition-colors space-y-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Danh Sách Hồ Sơ Vi Phạm Của Gian Hàng
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Lựa chọn đúng sự vụ vi phạm để nộp đơn giải trình kèm tài liệu hóa đơn chứng minh
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-500">
              {violations.filter((v) => v.appealStatus !== 'APPROVED').length} vi phạm đang ghi nhận
            </span>
            {violations.some((v) => v.appealStatus === 'APPROVED') && (
              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {violations.filter((v) => v.appealStatus === 'APPROVED').length} đã gỡ bỏ thành công
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className="mt-2 text-xs text-stone-400">Đang tải danh sách vi phạm...</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5">
            <HiOutlineCheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              Gian hàng hiện không có vi phạm nào!
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Bạn đang tuân thủ rất tốt các tiêu chuẩn cộng đồng và quy định bán hàng của sàn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead>
                <tr className={cn('border-b text-stone-400', isDark ? 'border-slate-800' : 'border-stone-100')}>
                  <th className="py-3 px-4 font-bold w-56 min-w-[200px]">Đối tượng vi phạm</th>
                  <th className="py-3 px-4 font-bold min-w-[240px]">Lý do báo cáo</th>
                  <th className="py-3 px-4 font-bold min-w-[180px]">Phán quyết Ban Quản Trị</th>
                  <th className="py-3 px-4 font-bold min-w-[100px]">Thời gian</th>
                  <th className="py-3 px-4 font-bold min-w-[130px]">Trạng thái kháng cáo</th>
                  <th className="py-3 px-4 font-bold min-w-[160px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {violations.map((v) => {
                  const isCleared = v.appealStatus === 'APPROVED'
                  return (
                    <tr
                      key={v.reportId || v.targetId}
                      className={cn(
                        'transition-colors',
                        isCleared
                          ? 'opacity-75 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]'
                          : 'hover:bg-amber-500/5'
                      )}
                    >
                      <td className="py-4 px-4 align-top w-56 min-w-[200px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              'inline-block w-max px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                              v.targetType === 'SHOP'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            )}>
                              {v.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}
                            </span>
                            {isCleared && (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Đã hủy phạt
                              </span>
                            )}
                          </div>
                          <span className={cn('font-bold leading-tight break-words text-xs', isDark ? 'text-white' : 'text-stone-900', isCleared && 'line-through opacity-70')}>
                            {v.targetName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top min-w-[240px] max-w-xs">
                        <p className={cn('line-clamp-2 leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          {v.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng'}
                        </p>
                        {(() => {
                          const evImgs = parseImages(v.evidenceUrl)
                          const covImgs = parseImages(v.coverImageUrl)
                          if (!evImgs.length && !covImgs.length) return null
                          return (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {evImgs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setDetailViolation(v)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] font-medium transition"
                                  title="Xem hình ảnh bằng chứng vi phạm"
                                >
                                  <HiOutlinePhotograph className="h-3.5 w-3.5 text-red-500" />
                                  Bằng chứng ({evImgs.length})
                                </button>
                              )}
                              {covImgs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setDetailViolation(v)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-medium transition"
                                  title="Xem hình ảnh minh họa của gian hàng"
                                >
                                  <HiOutlinePhotograph className="h-3.5 w-3.5 text-blue-400" />
                                  Minh họa ({covImgs.length})
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </td>

                      <td className="py-4 px-4 align-top min-w-[180px] max-w-xs">
                        <span className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
                          {v.adminNote || 'Đã được Ban Quản Trị xác minh và áp dụng chế tài'}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap text-stone-400 min-w-[100px]">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </td>

                      <td className="py-4 px-4 align-top whitespace-nowrap min-w-[130px]">
                        {v.appealStatus === 'NONE' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-500/10 text-stone-400 border border-stone-500/20">
                            Chưa nộp đơn
                          </span>
                        )}
                        {v.appealStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <HiOutlineClock className="h-3.5 w-3.5" />
                            Đang thẩm định
                          </span>
                        )}
                        {v.appealStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                            Đã gỡ vi phạm
                          </span>
                        )}
                        {v.appealStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <HiOutlineXCircle className="h-3.5 w-3.5" />
                            Bị bác đơn
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-right whitespace-nowrap min-w-[160px]">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailViolation(v)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
                              isDark
                                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-amber-400'
                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-amber-600'
                            )}
                            title="Xem chi tiết hồ sơ vi phạm"
                          >
                            <HiOutlineEye className="h-3.5 w-3.5" />
                            Chi tiết
                          </button>

                          {v.appealStatus === 'NONE' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAppealModal(v)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-sm shadow-amber-500/20 transition-all"
                            >
                              <HiOutlineDocumentText className="h-3.5 w-3.5" />
                              Kháng cáo
                            </button>
                          )}
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
              Khi phát sinh vi phạm cần giải trình, hãy chọn "Kháng cáo vi phạm này" ở bảng vi phạm phía trên.
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
                        Mã đơn: #{String(item.requestId || item.id).substring(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>

                  <p className={cn('text-xs font-medium leading-relaxed', isDark ? 'text-slate-200' : 'text-stone-800')}>
                    {item.description || 'Không có mô tả chi tiết'}
                  </p>

                  {item.coverImageUrl && (() => {
                    const appealImgs = parseImages(item.coverImageUrl)
                    if (!appealImgs.length) return null
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {appealImgs.map((imgUrl, aIdx) => (
                          <a
                            key={aIdx}
                            href={imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 text-xs font-semibold transition"
                          >
                            <HiOutlinePhotograph className="h-4 w-4" />
                            {appealImgs.length === 1 ? 'Hình ảnh' : `Hình ảnh #${aIdx + 1}`}
                            <HiOutlineExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )
                  })()}

                  {item.response && (
                    <div className={cn(
                      'p-3 rounded-xl border text-xs space-y-1 mt-2',
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
                'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <h2 className="text-lg font-bold mb-1">Gửi Đơn Kháng Cáo Vi Phạm</h2>
              <p className={cn('text-xs mb-4', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Vui lòng cung cấp đầy đủ lý do giải trình và tải lên hình ảnh bằng chứng (hóa đơn VAT, chứng từ phân phối)
              </p>

              <form onSubmit={handleSubmitAppeal} className="space-y-4">
                {/* Chọn vi phạm cần kháng cáo */}
                <div>
                  <label className="block text-xs font-bold mb-1">Chọn vi phạm cần kháng cáo *</label>
                  {appealableViolations.length > 0 ? (
                    <select
                      value={selectedViolation?.reportId || ''}
                      onChange={(e) => {
                        const found = appealableViolations.find((v) => String(v.reportId) === e.target.value)
                        setSelectedViolation(found || null)
                      }}
                      className={cn(
                        'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none font-medium',
                        isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                      )}
                    >
                      {appealableViolations.map((v) => (
                        <option key={v.reportId} value={v.reportId}>
                          [{v.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}] {v.targetName} - {v.reason || 'Báo cáo'} ({v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-rose-500">
                      Không có vi phạm nào đủ điều kiện kháng cáo vào lúc này.
                    </p>
                  )}
                </div>

                {/* Thông tin đối tượng được hiển thị trực quan (KHÔNG HIỆN MÃ SHOP ID UUID) */}
                {selectedViolation && (
                  <div className={cn(
                    'p-3.5 rounded-2xl border text-xs space-y-1.5',
                    isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-amber-200 bg-amber-50/60 text-stone-800'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600 dark:text-amber-400">Đối tượng:</span>
                      <span className="font-bold">{selectedViolation.targetName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Nội dung ghi nhận vi phạm: </span>
                      <span>{selectedViolation.reason || 'Vi phạm tiêu chuẩn cộng đồng'}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">Nội dung giải trình *</label>
                  <textarea
                    rows={4}
                    placeholder="Trình bày chi tiết lý do bạn cho rằng phán quyết là nhầm lẫn hoặc nguyên nhân khách quan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className={cn(
                      'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none',
                      isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900'
                    )}
                  />
                </div>

                {/* Upload hình ảnh tài liệu chứng từ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold">
                      Hình ảnh tài liệu / Hóa đơn chứng từ ({evidenceUrls.length})
                    </label>
                    <span className="text-[11px] text-stone-400">Tối đa 10MB / ảnh</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {evidenceUrls.map((url, idx) => (
                        <div key={idx} className="relative rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-32 bg-stone-900/10">
                          <img
                            src={url}
                            alt={`Hình ảnh ${idx + 1}`}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                              title="Xem ảnh gốc"
                            >
                              <HiOutlineExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow"
                              title="Gỡ ảnh"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors',
                      uploadingImage ? 'opacity-50 pointer-events-none' : '',
                      isDark
                        ? 'border-slate-700 hover:border-amber-500 bg-slate-800/50'
                        : 'border-stone-300 hover:border-amber-500 bg-stone-50'
                    )}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-1">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
                        <span className="text-xs font-semibold text-amber-500">Đang tải ảnh lên máy chủ...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                        <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                          <HiOutlineUpload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold">
                          {evidenceUrls.length > 0 ? '+ Thêm ảnh chứng từ khác' : 'Bấm để tải ảnh chứng từ lên'}
                        </span>
                        <span className="text-[11px] text-stone-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB / ảnh)</span>
                      </div>
                    )}
                  </div>
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
                    disabled={submitting || uploadingImage || !selectedViolation || appealableViolations.length === 0}
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

      {/* Modal Xem Chi Tiết Báo Cáo Vi Phạm (Bảo mật: Ẩn danh người tố cáo) */}
      <AnimatePresence>
        {detailViolation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-2xl rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                      detailViolation.targetType === 'SHOP'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    )}>
                      {detailViolation.targetType === 'SHOP' ? 'Gian hàng' : 'Sản phẩm'}
                    </span>
                    <h2 className="text-base font-bold">Hồ Sơ Vi Phạm #{String(detailViolation.reportId || detailViolation.targetId).substring(0, 8)}</h2>
                  </div>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Thời gian ghi nhận: {detailViolation.createdAt ? new Date(detailViolation.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailViolation(null)}
                  className={cn(
                    'p-2 rounded-xl text-stone-400 hover:text-stone-600 transition',
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-100'
                  )}
                >
                  <HiOutlineXCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Đối tượng vi phạm */}
              <div className={cn(
                'p-3.5 rounded-2xl border text-xs space-y-1',
                isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50'
              )}>
                <span className="text-stone-400 font-medium">Đối tượng liên quan:</span>
                <p className="font-bold text-sm text-amber-500">{detailViolation.targetName}</p>
              </div>

              {/* Lý do / Nội dung vi phạm */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Nội dung vi phạm được ghi nhận:
                </label>
                <div className={cn(
                  'p-3.5 rounded-2xl border text-xs leading-relaxed',
                  isDark ? 'border-slate-800 bg-slate-800/60 text-slate-200' : 'border-stone-200 bg-stone-50 text-stone-800'
                )}>
                  {detailViolation.reason || 'Báo cáo vi phạm tiêu chuẩn cộng đồng và quy định bán hàng.'}
                </div>
              </div>

              {/* Phán quyết BQT */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Kết luận & Phán quyết của Ban Quản Trị:
                </label>
                <div className={cn(
                  'p-3.5 rounded-2xl border text-xs leading-relaxed',
                  isDark ? 'border-amber-500/20 bg-amber-500/5 text-amber-300' : 'border-amber-200 bg-amber-50/50 text-amber-800'
                )}>
                  {detailViolation.adminNote || 'Hồ sơ đã được Ban Quản Trị kiểm duyệt, xác minh bằng chứng và áp dụng chế tài tương ứng.'}
                </div>
              </div>

              {/* Tách bạch 2 mục hình ảnh: Bằng chứng vs Minh họa của Shop */}
              {(() => {
                const evImgs = parseImages(detailViolation.evidenceUrl)
                const covImgs = parseImages(detailViolation.coverImageUrl)

                if (!evImgs.length && !covImgs.length) {
                  return (
                    <div className={cn(
                      'p-4 rounded-2xl border text-center text-xs text-stone-400',
                      isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50'
                    )}>
                      Không có tệp hình ảnh đính kèm trong hồ sơ này.
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    {/* Mục 1: Hình ảnh bằng chứng vi phạm */}
                    {evImgs.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                            Hình ảnh bằng chứng vi phạm ({evImgs.length} ảnh):
                          </label>
                          <span className="text-[11px] text-stone-400">Do người báo cáo cung cấp</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {evImgs.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group overflow-hidden rounded-2xl border border-red-500/25 bg-stone-900/10 h-32 flex items-center justify-center"
                            >
                              <img
                                src={imgUrl}
                                alt={`Bằng chứng ${idx + 1}`}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <a
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                                >
                                  <HiOutlineExternalLink className="h-4 w-4" />
                                  Xem ảnh gốc
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mục 2: Hình ảnh minh họa của shop */}
                    {covImgs.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                            Hình ảnh minh họa của gian hàng / sản phẩm ({covImgs.length} ảnh):
                          </label>
                          <span className="text-[11px] text-stone-400">Hình ảnh gian hàng / sản phẩm bị tố cáo</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {covImgs.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group overflow-hidden rounded-2xl border border-blue-500/25 bg-stone-900/10 h-32 flex items-center justify-center"
                            >
                              <img
                                src={imgUrl}
                                alt={`Minh họa shop ${idx + 1}`}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <a
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
                                >
                                  <HiOutlineExternalLink className="h-4 w-4" />
                                  Xem ảnh gốc
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Trạng thái và nút thao tác */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDetailViolation(null)}
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all',
                    isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  Đóng
                </button>

                {detailViolation.appealStatus === 'NONE' && (
                  <button
                    type="button"
                    onClick={() => {
                      const v = detailViolation
                      setDetailViolation(null)
                      handleOpenAppealModal(v)
                    }}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5"
                  >
                    <HiOutlineDocumentText className="h-4 w-4" />
                    Kháng cáo vi phạm này
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
