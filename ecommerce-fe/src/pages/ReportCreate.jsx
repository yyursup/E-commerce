import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlineFlag, HiOutlineUpload, HiOutlineTrash, HiOutlineExternalLink } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import reportService from '../services/report'
import fileService from '../services/fileService'
import {
  formatReportDescription,
  getReportTargetMeta,
  normalizeReportTargetType,
  resolveReportBackPath,
} from '../lib/reportTargets'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ReportCreate() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const targetId = searchParams.get('targetId')?.trim() || ''
  const targetType = normalizeReportTargetType(searchParams.get('targetType'))
  const reportMeta = getReportTargetMeta(targetType)
  const targetName = searchParams.get('targetName')?.trim() || reportMeta.defaultName
  const backTo = resolveReportBackPath(searchParams.get('backTo'))

  const [description, setDescription] = useState('')
  const [selectedReason, setSelectedReason] = useState(reportMeta.reasons[0]?.value || 'OTHER')
  const [evidenceUrls, setEvidenceUrls] = useState([])
  const [coverImageUrls, setCoverImageUrls] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const evidenceFileRef = useRef(null)
  const coverFileRef = useRef(null)

  const handleUploadFiles = async (e, type) => {
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
      if (type === 'evidence' && evidenceFileRef.current) evidenceFileRef.current.value = ''
      if (type === 'cover' && coverFileRef.current) coverFileRef.current.value = ''
      return
    }

    try {
      if (type === 'evidence') {
        setUploadingEvidence(true)
      } else {
        setUploadingCover(true)
      }

      const uploaded = []
      for (const file of validFiles) {
        const res = await fileService.uploadFile(file, 'reports')
        const uploadedUrl = res?.url || res?.data?.url
        if (uploadedUrl) {
          uploaded.push(uploadedUrl)
        }
      }

      if (uploaded.length > 0) {
        if (type === 'evidence') {
          setEvidenceUrls((prev) => [...prev, ...uploaded])
        } else {
          setCoverImageUrls((prev) => [...prev, ...uploaded])
        }
        toast.success(`Đã tải lên ${uploaded.length} ảnh thành công!`)
      } else {
        toast.error('Không nhận được đường dẫn ảnh từ máy chủ.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err?.message || 'Lỗi khi tải ảnh lên.')
    } finally {
      if (type === 'evidence') {
        setUploadingEvidence(false)
        if (evidenceFileRef.current) evidenceFileRef.current.value = ''
      } else {
        setUploadingCover(false)
        if (coverFileRef.current) coverFileRef.current.value = ''
      }
    }
  }

  useEffect(() => {
    if (!targetId) {
      toast.error('Không tìm thấy đối tượng cần báo cáo.')
    }
  }, [targetId])

  useEffect(() => {
    setSelectedReason(reportMeta.reasons[0]?.value || 'OTHER')
  }, [reportMeta])

  const closeForm = () => {
    if (backTo) {
      navigate(backTo, { replace: true })
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/products', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedTargetId = targetId.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTargetId) {
      toast.error('Không tìm thấy đối tượng cần báo cáo.')
      return
    }

    if (!UUID_REGEX.test(trimmedTargetId)) {
      toast.error('Đối tượng báo cáo không hợp lệ.')
      return
    }

    if (!trimmedDescription) {
      toast.error('Vui lòng mô tả chi tiết lý do báo cáo.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        targetId: trimmedTargetId,
        description: formatReportDescription({
          targetType,
          reason: selectedReason,
          description: trimmedDescription,
        }),
        evidenceUrl: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
        coverImageUrl: coverImageUrls.length > 0 ? coverImageUrls.join(',') : null,
      }

      await reportService.createReport(payload)
      toast.success('Gửi báo cáo thành công.')
      closeForm()
    } catch (err) {
      console.error('Tạo report lỗi:', err)
      toast.error(err?.message || 'Không thể gửi báo cáo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={closeForm}
          className={cn(
            'mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-700 hover:bg-stone-100',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'overflow-hidden rounded-3xl border shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className={cn('border-b px-6 py-6 sm:px-8', isDark ? 'border-slate-800' : 'border-stone-200')}>
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-600',
                )}
              >
                <HiOutlineFlag className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-[0.24em]',
                    isDark ? 'text-red-300/80' : 'text-red-500',
                  )}
                >
                  Trung tâm báo cáo
                </p>
                <h1 className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                  {reportMeta.pageTitle}
                </h1>
                <p className={cn('max-w-2xl text-sm leading-6', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  {reportMeta.pageDescription}
                </p>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'grid gap-3 border-b px-6 py-5 sm:grid-cols-2 sm:px-8',
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-stone-50/80',
            )}
          >
            <div
              className={cn(
                'rounded-2xl border px-4 py-3',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
              )}
            >
              <p
                className={cn(
                  'text-xs font-medium uppercase tracking-[0.18em]',
                  isDark ? 'text-slate-500' : 'text-stone-400',
                )}
              >
                Loại báo cáo
              </p>
              <p className={cn('mt-2 text-sm font-semibold', isDark ? 'text-slate-100' : 'text-stone-900')}>
                {reportMeta.label}
              </p>
            </div>
            <div
              className={cn(
                'rounded-2xl border px-4 py-3',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
              )}
            >
              <p
                className={cn(
                  'text-xs font-medium uppercase tracking-[0.18em]',
                  isDark ? 'text-slate-500' : 'text-stone-400',
                )}
              >
                Đối tượng
              </p>
              <p
                className={cn(
                  'mt-2 line-clamp-2 text-sm font-semibold',
                  isDark ? 'text-slate-100' : 'text-stone-900',
                )}
              >
                {targetName}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="report-reason"
                  className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
                >
                  Lý do báo cáo
                </label>
                <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                  Chọn nhóm phù hợp nhất
                </span>
              </div>

              <div id="report-reason" className="grid gap-2 sm:grid-cols-2">
                {reportMeta.reasons.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setSelectedReason(reason.value)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition',
                      selectedReason === reason.value
                        ? isDark
                          ? 'border-red-500/60 bg-red-500/10 text-red-200'
                          : 'border-red-200 bg-red-50 text-red-700'
                        : isDark
                          ? 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                    )}
                  >
                    <span>{reason.label}</span>
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        selectedReason === reason.value
                          ? 'bg-current'
                          : isDark
                            ? 'bg-slate-700'
                            : 'bg-stone-300',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className={cn('block text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
              >
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={5000}
                placeholder={reportMeta.descriptionPlaceholder}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition',
                  isDark
                    ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:border-red-500/60'
                    : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-red-400',
                )}
              />
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                Cung cấp càng cụ thể thì đội ngũ kiểm duyệt xử lý càng nhanh.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Ảnh Bằng Chứng */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className={cn('block text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
                  >
                    Hình ảnh bằng chứng ({evidenceUrls.length})
                  </label>
                  <span className="text-[11px] text-stone-400">Tối đa 10MB / ảnh</span>
                </div>
                <input
                  type="file"
                  ref={evidenceFileRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleUploadFiles(e, 'evidence')}
                  className="hidden"
                />

                {evidenceUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {evidenceUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-28 bg-stone-900/10">
                        <img
                          src={url}
                          alt={`Bằng chứng ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                            title="Xem ảnh gốc"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow"
                            title="Xóa ảnh"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => evidenceFileRef.current?.click()}
                  className={cn(
                    'w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition',
                    uploadingEvidence ? 'opacity-50 pointer-events-none' : '',
                    isDark
                      ? 'border-slate-700 hover:border-red-500 bg-slate-950/60'
                      : 'border-stone-300 hover:border-red-500 bg-white'
                  )}
                >
                  {uploadingEvidence ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                      <span className="text-xs font-medium text-red-500">Đang tải ảnh lên...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <HiOutlineUpload className="h-5 w-5 text-red-500" />
                      <span className="text-xs font-semibold">
                        {evidenceUrls.length > 0 ? '+ Thêm ảnh bằng chứng' : 'Tải ảnh bằng chứng lên'}
                      </span>
                      <span className="text-[11px] text-stone-400">Chọn 1 hoặc nhiều ảnh (JPG, PNG, WEBP)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ảnh Minh Họa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className={cn('block text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
                  >
                    Hình ảnh minh họa ({coverImageUrls.length})
                  </label>
                  <span className="text-[11px] text-stone-400">Tối đa 10MB / ảnh</span>
                </div>
                <input
                  type="file"
                  ref={coverFileRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleUploadFiles(e, 'cover')}
                  className="hidden"
                />

                {coverImageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {coverImageUrls.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-28 bg-stone-900/10">
                        <img
                          src={url}
                          alt={`Minh họa ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                            title="Xem ảnh gốc"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setCoverImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow"
                            title="Xóa ảnh"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => coverFileRef.current?.click()}
                  className={cn(
                    'w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition',
                    uploadingCover ? 'opacity-50 pointer-events-none' : '',
                    isDark
                      ? 'border-slate-700 hover:border-red-500 bg-slate-950/60'
                      : 'border-stone-300 hover:border-red-500 bg-white'
                  )}
                >
                  {uploadingCover ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                      <span className="text-xs font-medium text-red-500">Đang tải ảnh lên...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <HiOutlineUpload className="h-5 w-5 text-red-500" />
                      <span className="text-xs font-semibold">
                        {coverImageUrls.length > 0 ? '+ Thêm ảnh minh họa' : 'Tải ảnh minh họa lên'}
                      </span>
                      <span className="text-[11px] text-stone-400">Chọn 1 hoặc nhiều ảnh (JPG, PNG, WEBP)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn('text-xs leading-5', isDark ? 'text-slate-500' : 'text-stone-500')}>
                Báo cáo sẽ được đội ngũ kiểm duyệt xem xét thủ công trước khi xử lý.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                  )}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetId || uploadingEvidence || uploadingCover}
                  className={cn(
                    'rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition',
                    'bg-red-600 hover:bg-red-700',
                    (isSubmitting || !targetId || uploadingEvidence || uploadingCover) && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
