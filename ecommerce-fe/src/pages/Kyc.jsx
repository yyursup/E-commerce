import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineCloudUpload,
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
  const [docFile, setDocFile] = useState(null)
  const [faceFile, setFaceFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [isStarting, setIsStarting] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [isUploadingFace, setIsUploadingFace] = useState(false)
  const [docUploaded, setDocUploaded] = useState(false)
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
      setDocFile(null)
      setFaceFile(null)
      setUploads([])
      setDocUploaded(false)
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

  const requireFile = (file) => {
    if (!file) {
      toast.error('Vui lòng chọn file ảnh.')
      return false
    }
    return true
  }

  const handleDocUpload = async () => {
    if (!requireSession() || !requireFile(docFile)) return
    setIsUploadingDoc(true)

    try {
      const autoTitle = docFile?.name || `kyc-doc-${Date.now()}`
      const res = await kycService.fullFlowUpload({
        sessionId,
        file: docFile,
        title: autoTitle,
        description: 'Up ảnh',
      })

      const hash = res?.fileHash || res?.file_hash || ''
      setUploads((prev) => [
        {
          fileName: docFile?.name,
          fileHash: hash,
          mode: 'document',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setDocFile(null)
      setFaceFile(null)
      setDocUploaded(true)
      toast.success('Upload ảnh giấy tờ thành công!')
    } catch (error) {
      console.error('Upload KYC error:', error)
      toast.error(error?.message || 'Upload ảnh giấy tờ thất bại.')
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleFaceUpload = async () => {
    if (!requireSession() || !requireFile(faceFile)) return
    if (!docUploaded) {
      toast.error('Vui lòng upload ảnh giấy tờ trước.')
      return
    }
    setIsUploadingFace(true)

    try {
      const autoTitle = faceFile?.name || `kyc-face-${Date.now()}`
      const res = await kycService.fullFlowUpload({
        sessionId,
        file: faceFile,
        title: autoTitle,
        description: 'Up ảnh',
      })

      const hash = res?.fileHash || res?.file_hash || ''
      setUploads((prev) => [
        {
          fileName: faceFile?.name,
          fileHash: hash,
          mode: 'face',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.success('Upload ảnh khuôn mặt thành công!')

      setIsComparing(true)
      await kycService.compare(sessionId)
      toast.success('So sánh thành công!')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Upload/Compare KYC error:', error)
      toast.error(error?.message || 'Thao tác thất bại.')
    } finally {
      setIsUploadingFace(false)
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
          {!docUploaded ? (
            <div key="step-1">
              <h2
                className={cn(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Bước 1: Upload ảnh giấy tờ
              </h2>

              <div className="mt-6">
                <label
                  htmlFor="docFile"
                  className={cn(
                    'mb-1.5 block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Chọn file ảnh giấy tờ
                </label>
                <input
                  id="docFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900',
                  )}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDocUpload}
                  disabled={isUploadingDoc}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
                    isUploadingDoc
                      ? 'cursor-not-allowed bg-amber-500/60'
                      : 'bg-amber-500 hover:bg-amber-600',
                  )}
                >
                  <HiOutlineCloudUpload className="h-5 w-5" />
                  {isUploadingDoc ? 'Đang upload...' : 'Upload giấy tờ'}
                </button>
              </div>
            </div>
          ) : (
            <div key="step-2">
              <h3
                className={cn(
                  'text-base font-semibold',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Bước 2: Upload ảnh khuôn mặt
              </h3>

              <div className="mt-4">
                <label
                  htmlFor="faceFile"
                  className={cn(
                    'mb-1.5 block text-sm font-medium',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Chọn file ảnh khuôn mặt
                </label>
                <input
                  id="faceFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600',
                    isDark
                      ? 'border-slate-600 bg-slate-800/50 text-white'
                      : 'border-stone-300 bg-stone-50/80 text-stone-900',
                  )}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleFaceUpload}
                  disabled={isUploadingFace}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition',
                    isUploadingFace
                      ? 'cursor-not-allowed bg-amber-500/60'
                      : 'bg-amber-500 hover:bg-amber-600',
                  )}
                >
                  <HiOutlineCloudUpload className="h-5 w-5" />
                  {isUploadingFace ? 'Đang upload...' : 'Upload khuôn mặt'}
                </button>
              </div>
            </div>
          )}

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
          {isComparing && (
            <p className={cn('mt-6 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang so sánh khuôn mặt, vui lòng chờ...
            </p>
          )}

        </div>
      </motion.div>
    </div>
  )
}
