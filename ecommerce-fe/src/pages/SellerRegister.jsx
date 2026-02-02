import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineCloudUpload,
  HiOutlineIdentification,
  HiOutlineCamera,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import requestService from '../services/request'
import kycService from '../services/kyc'
import CameraCapture from '../components/CameraCapture'

export default function SellerRegister() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated, accountVerified, updateAccountVerified } = useAuthStore()
  const navigate = useNavigate()

  const [sessionId, setSessionId] = useState('')
  const [sessionStatus, setSessionStatus] = useState('')
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [frontUploaded, setFrontUploaded] = useState(false)
  const [backUploaded, setBackUploaded] = useState(false)
  const [selfieUploaded, setSelfieUploaded] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Front, 2: Back, 3: Selfie, 4: Review
  const [showCamera, setShowCamera] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [showSellerForm, setShowSellerForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng ký bán hàng.')
      navigate('/login')
      return
    }

    // Check if account is verified
    if (accountVerified) {
      setShowSellerForm(true)
    } else {
      // Auto-create KYC session if not verified
      handleAutoStartKYC()
    }
  }, [isAuthenticated, accountVerified, navigate])

  const handleAutoStartKYC = async () => {
    setIsStarting(true)
    try {
      const res = await kycService.startSession()
      setSessionId(res?.sessionId || '')
      setSessionStatus(res?.status || '')
      setCurrentStep(1)
      toast.success('Phiên KYC đã được tạo tự động. Vui lòng hoàn tất xác minh danh tính.')
    } catch (error) {
      console.error('Start KYC error:', error)
      toast.error(error?.message || 'Không thể tạo phiên KYC.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleFileSelect = (file, type) => {
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'front') {
        setFrontFile(file)
        setFrontPreview(reader.result)
      } else if (type === 'back') {
        setBackFile(file)
        setBackPreview(reader.result)
      } else if (type === 'selfie') {
        setSelfieFile(file)
        setSelfiePreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = (file) => {
    handleFileSelect(file, 'selfie')
    setShowCamera(false)
  }

  const handleUpload = async (type) => {
    if (!sessionId) {
      toast.error('Bạn cần tạo phiên KYC trước.')
      return
    }

    let file, docType
    if (type === 'front') {
      if (!frontFile) {
        toast.error('Vui lòng chọn ảnh mặt trước CCCD.')
        return
      }
      file = frontFile
      docType = 'FRONT'
    } else if (type === 'back') {
      if (!backFile) {
        toast.error('Vui lòng chọn ảnh mặt sau CCCD.')
        return
      }
      file = backFile
      docType = 'BACK'
    } else if (type === 'selfie') {
      if (!selfieFile) {
        toast.error('Vui lòng chọn hoặc chụp ảnh khuôn mặt.')
        return
      }
      file = selfieFile
      docType = 'SELFIE'
    }

    setIsUploading(true)
    try {
      const autoTitle = file?.name || `kyc-${type}-${Date.now()}`
      await kycService.uploadWithType({
        sessionId,
        type: docType,
        file,
        title: autoTitle,
        description: `Upload ${type}`,
      })

      if (type === 'front') {
        setFrontUploaded(true)
        setCurrentStep(2)
        toast.success('Upload ảnh mặt trước CCCD thành công!')
      } else if (type === 'back') {
        setBackUploaded(true)
        setCurrentStep(3)
        toast.success('Upload ảnh mặt sau CCCD thành công!')
      } else if (type === 'selfie') {
        setSelfieUploaded(true)
        setCurrentStep(4)
        toast.success('Upload ảnh khuôn mặt thành công!')
      }
    } catch (error) {
      console.error(`Upload ${type} error:`, error)
      toast.error(error?.message || `Upload ảnh ${type} thất bại.`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReviewAndCompare = async () => {
    if (!frontUploaded || !selfieUploaded) {
      toast.error('Vui lòng hoàn tất tất cả các bước trước khi xác minh.')
      return
    }

    setIsComparing(true)
    try {
      const compareResult = await kycService.compare(sessionId)
      
      if (compareResult?.status === 'VERIFIED') {
        toast.success('Xác minh danh tính thành công! Bạn có thể tiếp tục đăng ký bán hàng.')
        updateAccountVerified(true)
        setShowSellerForm(true)
      } else {
        toast.error('Xác minh thất bại. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Compare KYC error:', error)
      toast.error(error?.message || 'Xác minh thất bại.')
    } finally {
      setIsComparing(false)
    }
  }

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục.')
      navigate('/login')
      return
    }

    if (!accountVerified) {
      toast.error('Vui lòng hoàn tất xác minh danh tính trước.')
      return
    }

    try {
      await requestService.registerSeller(data)
      toast.success('Gửi yêu cầu đăng ký bán hàng thành công!')
      reset()
      navigate('/')
    } catch (error) {
      console.error('Register seller error:', error)
      const message =
        error?.message || 'Đăng ký bán hàng thất bại. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  return (
    <div
      className={cn(
        'min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <AnimatePresence mode="wait">
          {!showSellerForm ? (
            // KYC Step
            <motion.div
              key="kyc"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'rounded-2xl border p-8 shadow-xl',
                isDark
                  ? 'border-slate-700/50 bg-slate-900/80'
                  : 'border-stone-200/80 bg-white',
              )}
            >
              <div className="mb-6">
                <h1
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    isDark ? 'text-white' : 'text-stone-900',
                  )}
                >
                  Xác minh danh tính (KYC)
                </h1>
                <p
                  className={cn(
                    'mt-2 text-sm',
                    isDark ? 'text-slate-400' : 'text-stone-500',
                  )}
                >
                  Vui lòng hoàn tất xác minh danh tính trước khi đăng ký bán hàng.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition',
                            currentStep >= step
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : isDark
                                ? 'border-slate-600 text-slate-400'
                                : 'border-stone-300 text-stone-400',
                          )}
                        >
                          {currentStep > step ? (
                            <HiOutlineCheckCircle className="h-6 w-6" />
                          ) : (
                            step
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-2 text-xs text-center',
                            currentStep >= step
                              ? 'text-amber-500 font-medium'
                              : isDark
                                ? 'text-slate-400'
                                : 'text-stone-500',
                          )}
                        >
                          {step === 1
                            ? 'Mặt trước'
                            : step === 2
                              ? 'Mặt sau'
                              : step === 3
                                ? 'Khuôn mặt'
                                : 'Xem lại'}
                        </p>
                      </div>
                      {step < 4 && (
                        <div
                          className={cn(
                            'h-0.5 flex-1 mx-2',
                            currentStep > step ? 'bg-amber-500' : isDark ? 'bg-slate-700' : 'bg-stone-200',
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2
                        className={cn(
                          'text-lg font-semibold mb-2',
                          isDark ? 'text-white' : 'text-stone-900',
                        )}
                      >
                        Bước 1: Upload ảnh mặt trước CCCD
                      </h2>
                      <p
                        className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}
                      >
                        Vui lòng chụp hoặc upload ảnh mặt trước của CMND/CCCD
                      </p>
                    </div>

                    {frontPreview ? (
                      <div className="relative">
                        <img
                          src={frontPreview}
                          alt="Front preview"
                          className="w-full rounded-xl border-2 border-amber-500"
                        />
                        <button
                          onClick={() => {
                            setFrontFile(null)
                            setFrontPreview(null)
                          }}
                          className={cn(
                            'absolute top-2 right-2 p-2 rounded-full',
                            isDark ? 'bg-slate-800 text-white' : 'bg-white text-stone-900',
                          )}
                        >
                          <HiOutlineX className="h-5 w-5" />
                        </button>
                        {frontUploaded && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            Đã upload
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="frontFile"
                        className={cn(
                          'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 hover:border-amber-500/60'
                            : 'border-stone-300 bg-stone-50 hover:border-amber-500',
                        )}
                      >
                        <HiOutlineCloudUpload className={cn('h-12 w-12 mb-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
                        <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Click để chọn ảnh hoặc kéo thả vào đây
                        </p>
                        <input
                          id="frontFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e.target.files?.[0], 'front')}
                          className="hidden"
                        />
                      </label>
                    )}

                    {frontFile && !frontUploaded && (
                      <button
                        onClick={() => handleUpload('front')}
                        disabled={isUploading}
                        className={cn(
                          'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                          isUploading
                            ? 'cursor-not-allowed bg-amber-500/60'
                            : 'bg-amber-500 hover:bg-amber-600',
                        )}
                      >
                        <HiOutlineCloudUpload className="h-5 w-5" />
                        {isUploading ? 'Đang upload...' : 'Upload ảnh mặt trước'}
                      </button>
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2
                        className={cn(
                          'text-lg font-semibold mb-2',
                          isDark ? 'text-white' : 'text-stone-900',
                        )}
                      >
                        Bước 2: Upload ảnh mặt sau CCCD (Tùy chọn)
                      </h2>
                      <p
                        className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}
                      >
                        Vui lòng chụp hoặc upload ảnh mặt sau của CMND/CCCD (có thể bỏ qua)
                      </p>
                    </div>

                    {backPreview ? (
                      <div className="relative">
                        <img
                          src={backPreview}
                          alt="Back preview"
                          className="w-full rounded-xl border-2 border-amber-500"
                        />
                        <button
                          onClick={() => {
                            setBackFile(null)
                            setBackPreview(null)
                          }}
                          className={cn(
                            'absolute top-2 right-2 p-2 rounded-full',
                            isDark ? 'bg-slate-800 text-white' : 'bg-white text-stone-900',
                          )}
                        >
                          <HiOutlineX className="h-5 w-5" />
                        </button>
                        {backUploaded && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            Đã upload
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="backFile"
                        className={cn(
                          'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 hover:border-amber-500/60'
                            : 'border-stone-300 bg-stone-50 hover:border-amber-500',
                        )}
                      >
                        <HiOutlineCloudUpload className={cn('h-12 w-12 mb-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
                        <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Click để chọn ảnh hoặc kéo thả vào đây
                        </p>
                        <input
                          id="backFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e.target.files?.[0], 'back')}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div className="flex gap-3">
                      {backFile && !backUploaded && (
                        <button
                          onClick={() => handleUpload('back')}
                          disabled={isUploading}
                          className={cn(
                            'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                            isUploading
                              ? 'cursor-not-allowed bg-amber-500/60'
                              : 'bg-amber-500 hover:bg-amber-600',
                          )}
                        >
                          <HiOutlineCloudUpload className="h-5 w-5" />
                          {isUploading ? 'Đang upload...' : 'Upload ảnh mặt sau'}
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentStep(3)}
                        className={cn(
                          'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                          isDark
                            ? 'border border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'border border-stone-300 text-stone-700 hover:bg-stone-100',
                        )}
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2
                        className={cn(
                          'text-lg font-semibold mb-2',
                          isDark ? 'text-white' : 'text-stone-900',
                        )}
                      >
                        Bước 3: Chụp ảnh khuôn mặt
                      </h2>
                      <p
                        className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}
                      >
                        Chụp ảnh selfie hoặc upload ảnh từ thư viện
                      </p>
                    </div>

                    {selfiePreview ? (
                      <div className="relative">
                        <img
                          src={selfiePreview}
                          alt="Selfie preview"
                          className="w-full rounded-xl border-2 border-amber-500"
                        />
                        <button
                          onClick={() => {
                            setSelfieFile(null)
                            setSelfiePreview(null)
                          }}
                          className={cn(
                            'absolute top-2 right-2 p-2 rounded-full',
                            isDark ? 'bg-slate-800 text-white' : 'bg-white text-stone-900',
                          )}
                        >
                          <HiOutlineX className="h-5 w-5" />
                        </button>
                        {selfieUploaded && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            Đã upload
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setShowCamera(true)}
                          className={cn(
                            'flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl transition',
                            isDark
                              ? 'border-slate-600 bg-slate-800/50 hover:border-amber-500/60'
                              : 'border-stone-300 bg-stone-50 hover:border-amber-500',
                          )}
                        >
                          <HiOutlineCamera className={cn('h-12 w-12 mb-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
                          <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Chụp ảnh
                          </p>
                        </button>
                        <label
                          htmlFor="selfieFile"
                          className={cn(
                            'flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition',
                            isDark
                              ? 'border-slate-600 bg-slate-800/50 hover:border-amber-500/60'
                              : 'border-stone-300 bg-stone-50 hover:border-amber-500',
                          )}
                        >
                          <HiOutlineCloudUpload className={cn('h-12 w-12 mb-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
                          <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Từ thư viện
                          </p>
                          <input
                            id="selfieFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0], 'selfie')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {selfieFile && !selfieUploaded && (
                      <button
                        onClick={() => handleUpload('selfie')}
                        disabled={isUploading}
                        className={cn(
                          'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                          isUploading
                            ? 'cursor-not-allowed bg-amber-500/60'
                            : 'bg-amber-500 hover:bg-amber-600',
                        )}
                      >
                        <HiOutlineCloudUpload className="h-5 w-5" />
                        {isUploading ? 'Đang upload...' : 'Upload ảnh khuôn mặt'}
                      </button>
                    )}
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2
                        className={cn(
                          'text-lg font-semibold mb-2',
                          isDark ? 'text-white' : 'text-stone-900',
                        )}
                      >
                        Bước 4: Xem lại và xác minh
                      </h2>
                      <p
                        className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}
                      >
                        Kiểm tra lại các ảnh đã upload trước khi xác minh
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {frontPreview && (
                        <div className="relative">
                          <p className={cn('text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Ảnh mặt trước CCCD
                          </p>
                          <img
                            src={frontPreview}
                            alt="Front review"
                            className="w-full rounded-xl border-2 border-amber-500"
                          />
                          {frontUploaded && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                              <HiOutlineCheckCircle className="h-4 w-4" />
                              Đã upload
                            </div>
                          )}
                        </div>
                      )}

                      {backPreview && (
                        <div className="relative">
                          <p className={cn('text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Ảnh mặt sau CCCD
                          </p>
                          <img
                            src={backPreview}
                            alt="Back review"
                            className="w-full rounded-xl border-2 border-amber-500"
                          />
                          {backUploaded && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                              <HiOutlineCheckCircle className="h-4 w-4" />
                              Đã upload
                            </div>
                          )}
                        </div>
                      )}

                      {selfiePreview && (
                        <div className="relative">
                          <p className={cn('text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Ảnh khuôn mặt
                          </p>
                          <img
                            src={selfiePreview}
                            alt="Selfie review"
                            className="w-full rounded-xl border-2 border-amber-500"
                          />
                          {selfieUploaded && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium">
                              <HiOutlineCheckCircle className="h-4 w-4" />
                              Đã upload
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className={cn(
                          'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                          isDark
                            ? 'border border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'border border-stone-300 text-stone-700 hover:bg-stone-100',
                        )}
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={handleReviewAndCompare}
                        disabled={isComparing || !frontUploaded || !selfieUploaded}
                        className={cn(
                          'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition',
                          isComparing || !frontUploaded || !selfieUploaded
                            ? 'cursor-not-allowed bg-amber-500/60'
                            : 'bg-amber-500 hover:bg-amber-600',
                        )}
                      >
                        {isComparing ? 'Đang xác minh...' : 'Xác minh danh tính'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}

          {showCamera && (
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
              isDark={isDark}
            />
          )}

          {showSellerForm && (
            // Seller Registration Form
            <motion.div
              key="seller-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'rounded-2xl border p-8 shadow-xl',
                isDark
                  ? 'border-slate-700/50 bg-slate-900/80'
                  : 'border-stone-200/80 bg-white',
              )}
            >
              <div className="mb-8 text-center">
                <h1
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    isDark ? 'text-white' : 'text-stone-900',
                  )}
                >
                  Đăng ký bán hàng
                </h1>
                <p
                  className={cn(
                    'mt-2 text-sm',
                    isDark ? 'text-slate-400' : 'text-stone-500',
                  )}
                >
                  Gửi thông tin shop để xét duyệt mở bán.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label
                    htmlFor="shopName"
                    className={cn(
                      'mb-1.5 block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Tên shop
                  </label>
                  <div className="relative">
                    <HiOutlineUser
                      className={cn(
                        'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                        isDark ? 'text-slate-500' : 'text-stone-400',
                      )}
                    />
                    <input
                      id="shopName"
                      type="text"
                      placeholder="AirPod Store"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        errors.shopName &&
                          'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...register('shopName', {
                        required: 'Vui lòng nhập tên shop',
                        maxLength: { value: 150, message: 'Tối đa 150 ký tự' },
                      })}
                    />
                  </div>
                  {errors.shopName && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.shopName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className={cn(
                      'mb-1.5 block text-sm font-medium',
                      isDark ? 'text-slate-300' : 'text-stone-700',
                    )}
                  >
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <HiOutlineLocationMarker
                      className={cn(
                        'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                        isDark ? 'text-slate-500' : 'text-stone-400',
                      )}
                    />
                    <input
                      id="address"
                      type="text"
                      placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        errors.address &&
                          'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...register('address', {
                        required: 'Vui lòng nhập địa chỉ',
                        maxLength: { value: 2000, message: 'Tối đa 2000 ký tự' },
                      })}
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="shopPhone"
                      className={cn(
                        'mb-1.5 block text-sm font-medium',
                        isDark ? 'text-slate-300' : 'text-stone-700',
                      )}
                    >
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <HiOutlinePhone
                        className={cn(
                          'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                          isDark ? 'text-slate-500' : 'text-stone-400',
                        )}
                      />
                      <input
                        id="shopPhone"
                        type="tel"
                        placeholder="0912345678"
                        className={cn(
                          'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                            : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                          errors.shopPhone &&
                            'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                        )}
                        {...register('shopPhone', {
                          maxLength: { value: 20, message: 'Tối đa 20 ký tự' },
                        })}
                      />
                    </div>
                    {errors.shopPhone && (
                      <p className="mt-1.5 text-sm text-red-500">
                        {errors.shopPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="shopEmail"
                      className={cn(
                        'mb-1.5 block text-sm font-medium',
                        isDark ? 'text-slate-300' : 'text-stone-700',
                      )}
                    >
                      Email shop
                    </label>
                    <div className="relative">
                      <HiOutlineMail
                        className={cn(
                          'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                          isDark ? 'text-slate-500' : 'text-stone-400',
                        )}
                      />
                      <input
                        id="shopEmail"
                        type="email"
                        placeholder="shop@example.com"
                        className={cn(
                          'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                            : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                          errors.shopEmail &&
                            'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                        )}
                        {...register('shopEmail', {
                          maxLength: { value: 120, message: 'Tối đa 120 ký tự' },
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email không hợp lệ',
                          },
                        })}
                      />
                    </div>
                    {errors.shopEmail && (
                      <p className="mt-1.5 text-sm text-red-500">
                        {errors.shopEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="taxCode"
                      className={cn(
                        'mb-1.5 block text-sm font-medium',
                        isDark ? 'text-slate-300' : 'text-stone-700',
                      )}
                    >
                      Mã số thuế
                    </label>
                    <div className="relative">
                      <HiOutlineDocumentText
                        className={cn(
                          'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                          isDark ? 'text-slate-500' : 'text-stone-400',
                        )}
                      />
                      <input
                        id="taxCode"
                        type="text"
                        placeholder="0101234567"
                        className={cn(
                          'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                            : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                          errors.taxCode &&
                            'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                        )}
                        {...register('taxCode', {
                          maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
                        })}
                      />
                    </div>
                    {errors.taxCode && (
                      <p className="mt-1.5 text-sm text-red-500">
                        {errors.taxCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="coverImageUrl"
                      className={cn(
                        'mb-1.5 block text-sm font-medium',
                        isDark ? 'text-slate-300' : 'text-stone-700',
                      )}
                    >
                      Ảnh bìa (URL)
                    </label>
                    <div className="relative">
                      <HiOutlinePhotograph
                        className={cn(
                          'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                          isDark ? 'text-slate-500' : 'text-stone-400',
                        )}
                      />
                      <input
                        id="coverImageUrl"
                        type="url"
                        placeholder="https://..."
                        className={cn(
                          'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                          isDark
                            ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                            : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                          errors.coverImageUrl &&
                            'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                        )}
                        {...register('coverImageUrl', {
                          maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
                        })}
                      />
                    </div>
                    {errors.coverImageUrl && (
                      <p className="mt-1.5 text-sm text-red-500">
                        {errors.coverImageUrl.message}
                      </p>
                    )}
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
                    Mô tả shop
                  </label>
                  <div className="relative">
                    <HiOutlineDocumentText
                      className={cn(
                        'absolute left-3 top-3 h-5 w-5',
                        isDark ? 'text-slate-500' : 'text-stone-400',
                      )}
                    />
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Giới thiệu ngắn về shop..."
                      className={cn(
                        'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60',
                        isDark
                          ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
                          : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
                        errors.description &&
                          'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      {...register('description', {
                        maxLength: { value: 5000, message: 'Tối đa 5000 ký tự' },
                      })}
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition',
                    isSubmitting
                      ? 'cursor-not-allowed bg-amber-500/60'
                      : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99]',
                  )}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                </button>
              </form>

              <p
                className={cn(
                  'mt-6 text-center text-sm',
                  isDark ? 'text-slate-400' : 'text-stone-500',
                )}
              >
                Yêu cầu sẽ được xét duyệt trong thời gian sớm nhất.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
