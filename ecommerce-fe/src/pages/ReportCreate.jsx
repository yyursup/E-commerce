import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlineFlag } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import reportService from '../services/report'
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
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        evidenceUrl: evidenceUrl.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="evidenceUrl"
                  className={cn('block text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
                >
                  Link bằng chứng
                </label>
                <input
                  id="evidenceUrl"
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:border-red-500/60'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-red-400',
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="coverImageUrl"
                  className={cn('block text-sm font-medium', isDark ? 'text-slate-200' : 'text-stone-800')}
                >
                  Link ảnh minh họa
                </label>
                <input
                  id="coverImageUrl"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:border-red-500/60'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-red-400',
                  )}
                />
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
                  disabled={isSubmitting || !targetId}
                  className={cn(
                    'rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition',
                    'bg-red-600 hover:bg-red-700',
                    (isSubmitting || !targetId) && 'cursor-not-allowed opacity-60',
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
