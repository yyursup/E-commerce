import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import kycService from '../../services/kyc'
import KycSessionCard from './components/KycSessionCard'
import KycUploadStep from './components/KycUploadStep'
import KycUploadHistory from './components/KycUploadHistory'

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
        <KycSessionCard
          isDark={isDark}
          sessionId={sessionId}
          sessionStatus={sessionStatus}
          isStarting={isStarting}
          onStartSession={handleStartSession}
        />

        <div
          className={cn(
            'rounded-2xl border p-8 shadow-xl',
            isDark
              ? 'border-slate-700/50 bg-slate-900/80'
              : 'border-stone-200/80 bg-white',
          )}
        >
          {!docUploaded ? (
            <KycUploadStep
              isDark={isDark}
              title="Bước 1: Upload ảnh giấy tờ"
              inputId="docFile"
              inputLabel="Chọn file ảnh giấy tờ"
              onFileChange={setDocFile}
              onUpload={handleDocUpload}
              isUploading={isUploadingDoc}
              uploadButtonLabel="Upload giấy tờ"
            />
          ) : (
            <KycUploadStep
              isDark={isDark}
              title="Bước 2: Upload ảnh khuôn mặt"
              inputId="faceFile"
              inputLabel="Chọn file ảnh khuôn mặt"
              onFileChange={setFaceFile}
              onUpload={handleFaceUpload}
              isUploading={isUploadingFace}
              uploadButtonLabel="Upload khuôn mặt"
            />
          )}

          <KycUploadHistory
            isDark={isDark}
            uploads={uploads}
            isComparing={isComparing}
          />
        </div>
      </motion.div>
    </div>
  )
}
