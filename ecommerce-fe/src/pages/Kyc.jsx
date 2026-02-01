import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineIdentification,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import kycService from '../services/kyc'

export default function Kyc() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  const [sessionId, setSessionId] = useState('')
  const [sessionStatus, setSessionStatus] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isComparing, setIsComparing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện KYC.')
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleStartSession = async () => {
    setIsStarting(true)
    try {
      const res = await kycService.startSession()
      setSessionId(res?.sessionId || '')
      setSessionStatus(res?.status || '')
      toast.success('Tạo phiên KYC thành công!')
    } catch (error) {
      console.error('Start KYC error:', error)
      toast.error(error?.message || 'Không thể tạo phiên KYC.')
    } finally {
      setIsStarting(false)
    }
  }

  const requireSession = () => {
    if (!sessionId) {
      toast.error('Bạn cần tạo phiên KYC trước.')
      return false
    }
    return true
  }

  const requireFile = () => {
    if (!file) {
      toast.error('Vui lòng chọn file ảnh.')
      return false
    }
    return true
  }

  const handleFullFlowUpload = async () => {
    if (!requireSession() || !requireFile()) return
    setIsUploading(true)

    try {
      const res = await kycService.fullFlowUpload({
        sessionId,
        file,
        title: title || undefined,
        description: description || undefined,
      })

      setLastResult(res)
      const hash = res?.fileHash || res?.file_hash || ''
      setUploads((prev) => [
        {
          fileName: file?.name,
          fileHash: hash,
          mode: 'full',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.success('Upload thành công!')
    } catch (error) {
      console.error('Upload KYC error:', error)
      toast.error(error?.message || 'Upload thất bại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCompare = async () => {
    if (!requireSession()) return
    setIsComparing(true)

    try {
      const res = await kycService.compare(sessionId)
      setLastResult(res)
      toast.success('So sánh thành công!')
    } catch (error) {
      console.error('KYC compare error:', error)
      toast.error(error?.message || 'So sánh thất bại.')
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <div
      className={cn(
        'min-h-[calc(100vh-4rem)] px-4 py-12',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-4xl space-y-8"
      >
        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl',
            isDark
              ? 'border-slate-700/50 bg-slate-900/80'
              : 'border-stone-200/80 bg-white',
          )}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Xác minh danh tính (KYC)
              </h1>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tạo phiên và tải ảnh để xác minh thông tin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartSession}
              disabled={isStarting}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
                isStarting
                  ? 'cursor-not-allowed bg-amber-500/60'
                  : 'bg-amber-500 hover:bg-amber-600',
              )}
            >
              <HiOutlineIdentification className="h-5 w-5" />
              {isStarting ? 'Đang tạo phiên...' : 'Tạo phiên KYC'}
            </button>
          </div>

          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-sm',
              isDark ? 'border-slate-700 bg-slate-800/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600',
            )}
          >
            <div className="flex flex-wrap gap-4">
              <span>
                <strong>Session:</strong> {sessionId || 'Chưa tạo'}
              </span>
              <span>
                <strong>Status:</strong> {sessionStatus || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl',
            isDark
              ? 'border-slate-700/50 bg-slate-900/80'
              : 'border-stone-200/80 bg-white',
          )}
        >
          <h2
            className={cn(
              'text-lg font-semibold',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Tải ảnh KYC
          </h2>

          <div className="mt-6">
            <label
              htmlFor="file"
              className={cn(
                'mb-1.5 block text-sm font-medium',
                isDark ? 'text-slate-300' : 'text-stone-700',
              )}
            >
              Chọn file ảnh
            </label>
            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className={cn(
                'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600',
                isDark
                  ? 'border-slate-600 bg-slate-800/50 text-white'
                  : 'border-stone-300 bg-stone-50/80 text-stone-900',
              )}
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Tiêu đề (tuỳ chọn)
              </label>
              <div className="relative">
                <HiOutlineDocumentText
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isDark ? 'text-slate-500' : 'text-stone-400',
                  )}
                />
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: CCCD mặt trước"
                  className={cn(
                    'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                  )}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className={cn(
                  'mb-1.5 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Mô tả (tuỳ chọn)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm nếu cần"
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:opacity-60',
                  isDark
                    ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                    : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                )}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFullFlowUpload}
              disabled={isUploading}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
                isUploading
                  ? 'cursor-not-allowed bg-amber-500/60'
                  : 'bg-amber-500 hover:bg-amber-600',
              )}
            >
              <HiOutlineCloudUpload className="h-5 w-5" />
              Upload
            </button>
          </div>

          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Lịch sử upload
              </p>
              <div className="space-y-2">
                {uploads.map((item, idx) => (
                  <div
                    key={`${item.fileHash}-${idx}`}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-sm',
                      isDark
                        ? 'border-slate-700 bg-slate-800/60 text-slate-300'
                        : 'border-stone-200 bg-stone-50 text-stone-600',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{item.fileName}</span>
                      <span className="text-xs uppercase tracking-wide">
                        {item.mode}
                      </span>
                    </div>
                    <div className="mt-1 text-xs break-all">
                      {item.fileHash || 'Chưa có hash'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl',
            isDark
              ? 'border-slate-700/50 bg-slate-900/80'
              : 'border-stone-200/80 bg-white',
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className={cn(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Thao tác KYC
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Sử dụng file hash để chạy classify/OCR/liveness hoặc lấy trạng thái phiên.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompare}
              disabled={isComparing}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
                isComparing
                  ? 'cursor-not-allowed bg-amber-500/60'
                  : 'bg-amber-500 hover:bg-amber-600',
              )}
            >
              <HiOutlineDocumentText className="h-5 w-5" />
              So sánh (Compare)
            </button>
          </div>

          {lastResult && (
            <div className="mt-6">
              <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Kết quả gần nhất
              </p>
              <pre
                className={cn(
                  'mt-2 max-h-72 overflow-auto rounded-xl border p-4 text-xs',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-200'
                    : 'border-stone-200 bg-stone-50 text-stone-700',
                )}
              >
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
