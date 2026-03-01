import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlineFlag } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import reportService from '../services/report'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ReportCreate() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [targetId, setTargetId] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const prefillTargetId = searchParams.get('targetId')
    if (prefillTargetId) {
      setTargetId(prefillTargetId)
      return
    }
    toast.error('Target not found. Please report from a specific item.')
  }, [searchParams])

  const closeForm = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/products', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedTargetId = targetId.trim()

    if (!trimmedTargetId) {
      toast.error('Sản phẩm không tồn tại vui lòng thử lại sau')
      return
    }

    if (!UUID_REGEX.test(trimmedTargetId)) {
      toast.error('Sản phẩm không tồn tại vui lòng thử lại sau')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        targetId: trimmedTargetId,
        description: description.trim() || null,
        evidenceUrl: evidenceUrl.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
      }

      await reportService.createReport(payload)
      toast.success('Gửi báo cáo thành công.')
      closeForm()
    } catch (err) {
      console.error('Tạo report lỗi:', err)
      toast.error(err?.message || 'Failed to submit report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-3xl">
        <Link
          to="/products"
          className={cn(
            'mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
            isDark
              ? 'text-slate-300 hover:bg-slate-800'
              : 'text-stone-700 hover:bg-stone-100',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700',
              )}
            >
              <HiOutlineFlag className="h-5 w-5" />
            </div>
            <div>
              <h1 className={cn('text-2xl font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                Gửi báo cáo
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="description"
                className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}
              >
                Mô tả
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue..."
                className={cn(
                  'mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
                    : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="evidenceUrl"
                  className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}
                >
                  Evidence URL
                </label>
                <input
                  id="evidenceUrl"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    'mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
                      : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="coverImageUrl"
                  className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}
                >
                  Cover Image URL
                </label>
                <input
                  id="coverImageUrl"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn(
                    'mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
                      : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !targetId}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition',
                  'bg-amber-500 text-white hover:bg-amber-600',
                  (isSubmitting || !targetId) && 'cursor-not-allowed opacity-60',
                )}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                Bạn phải đăng nhập trước
              </p>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  )
}
