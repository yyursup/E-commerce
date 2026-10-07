import { useState, useEffect, useRef } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'
import shopService from '../../services/shop'
import fileService from '../../services/fileService'

import ShopHealthOverview from './components/violations/ShopHealthOverview'
import ViolationsTable from './components/violations/ViolationsTable'
import AppealsHistoryTable from './components/violations/AppealsHistoryTable'
import AppealModal from './components/violations/AppealModal'
import ViolationDetailModal from './components/violations/ViolationDetailModal'

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
        console.warn('Không thể lấy chi tiết điểm uy tín shop:', shopErr)
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

    const MAX_IMAGES = 4
    const remainingSlots = MAX_IMAGES - evidenceUrls.length

    if (remainingSlots <= 0) {
      toast.error('Chỉ được tải lên tối đa 4 hình ảnh!')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

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

    let filesToUpload = validFiles
    if (validFiles.length > remainingSlots) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh. Hệ thống sẽ xử lý ${remainingSlots} ảnh hợp lệ đầu tiên.`)
      filesToUpload = validFiles.slice(0, remainingSlots)
    }

    try {
      setUploadingImage(true)
      const uploaded = []
      for (const file of filesToUpload) {
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
                Điểm Uy Tín Shop
              </h1>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Theo dõi điểm uy tín gian hàng, chu kỳ phục hồi điểm và quản lý các hồ sơ kháng cáo giải trình
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

      {/* 1. Tổng quan Điểm Uy Tín Shop & Banners Kỷ Luật */}
      <ShopHealthOverview
        isDark={isDark}
        shopHealth={shopHealth}
        violationCount={violationCount}
        shopStatus={shopStatus}
        hasAppealableViolations={hasAppealableViolations}
        onOpenAppealModal={handleOpenAppealModal}
      />

      {/* 2. Bảng Danh Sách Hồ Sơ Vi Phạm */}
      <ViolationsTable
        isDark={isDark}
        loading={loading}
        violations={violations}
        onDetail={(v) => setDetailViolation(v)}
        onAppeal={(v) => handleOpenAppealModal(v)}
        parseImages={parseImages}
      />

      {/* 3. Bảng Lịch Sử Đơn Kháng Cáo Đã Gửi */}
      <AppealsHistoryTable
        isDark={isDark}
        loading={loading}
        appeals={appeals}
        getStatusBadge={getStatusBadge}
        parseImages={parseImages}
      />

      {/* 4. Modal Nộp Đơn Kháng Cáo */}
      <AppealModal
        showAppealModal={showAppealModal}
        setShowAppealModal={setShowAppealModal}
        isDark={isDark}
        handleSubmitAppeal={handleSubmitAppeal}
        appealableViolations={appealableViolations}
        selectedViolation={selectedViolation}
        setSelectedViolation={setSelectedViolation}
        description={description}
        setDescription={setDescription}
        evidenceUrls={evidenceUrls}
        setEvidenceUrls={setEvidenceUrls}
        uploadingImage={uploadingImage}
        fileInputRef={fileInputRef}
        handleImageUpload={handleImageUpload}
        submitting={submitting}
      />

      {/* 5. Modal Xem Chi Tiết Báo Cáo Vi Phạm */}
      <ViolationDetailModal
        detailViolation={detailViolation}
        setDetailViolation={setDetailViolation}
        isDark={isDark}
        parseImages={parseImages}
        handleOpenAppealModal={handleOpenAppealModal}
      />
    </div>
  )
}
