import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineLogout,
  HiOutlineArrowLeft,
  HiOutlineHome,
  HiOutlineSun,
  HiOutlineMoon,
  HiStar,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import authService from '../services/auth'
import requestService from '../services/request'
import kycService from '../services/kyc'
import escrowFundService from '../services/escrowFund'
import CameraCapture from '../components/CameraCapture'
import BusinessLicenseUpload from '../components/BusinessLicenseUpload'
import ShopCoverImageUpload from '../components/ShopCoverImageUpload'
import GhnAddressSelector from '../components/GhnAddressSelector'
import BankSelector from '../components/BankSelector'

const KYC_STORAGE_KEY = 'seller_kyc_session_progress'
const FORM_DRAFT_KEY = 'seller_registration_form_draft'

const saveKycProgress = (data) => {
  try {
    const existing = JSON.parse(localStorage.getItem(KYC_STORAGE_KEY) || '{}')
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify({ ...existing, ...data, updatedAt: Date.now() }))
  } catch (e) {
    console.warn('Cannot save KYC progress:', e)
  }
}

const loadKycProgress = () => {
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // 4 hours TTL
    if (Date.now() - (parsed.updatedAt || 0) > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(KYC_STORAGE_KEY)
      return null
    }
    return parsed
  } catch (e) {
    return null
  }
}

const clearKycProgress = () => {
  try {
    localStorage.removeItem(KYC_STORAGE_KEY)
  } catch (e) {}
}

export default function SellerRegister() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  const { isAuthenticated, accountVerified, updateAccountVerified, user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    clearKycProgress()
    toast.success('Đã đăng xuất tài khoản!')
    navigate('/login')
  }

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
  const [sellerType, setSellerType] = useState('INDIVIDUAL') // 'INDIVIDUAL' or 'BUSINESS'
  const [sameAsPickup, setSameAsPickup] = useState(false)
  const [sameAsBusiness, setSameAsBusiness] = useState(false)

  // Resilience & Recovery States
  const [kycError, setKycError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftRestoredTime, setDraftRestoredTime] = useState('')
  const [restoredKycSession, setRestoredKycSession] = useState(false)

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Đã kết nối lại Internet!', { id: 'network-status' })
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Mất kết nối mạng! Dữ liệu của bạn đang được lưu tạm trên thiết bị.', { id: 'network-status', duration: 5000 })
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Quỹ Ký Quỹ Bảo Chứng (Escrow Capital Deposit)
  const [isEscrowChecked, setIsEscrowChecked] = useState(false)
  const [selectedDepositAmount, setSelectedDepositAmount] = useState('5000000')
  const [trustLevels, setTrustLevels] = useState([])

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await escrowFundService.getTrustLevels()
        if (Array.isArray(res) && res.length > 0) {
          setTrustLevels(res)
        }
      } catch (err) {
        console.warn('Lỗi tải cấu hình bậc sao ký quỹ:', err)
      }
    }
    fetchLevels()
  }, [])

  const depositPackages = useMemo(() => {
    if (Array.isArray(trustLevels) && trustLevels.length > 0) {
      const activeTiers = trustLevels
        .filter((lvl) => lvl.isActive !== false && lvl.starLevel >= 2)
        .sort((a, b) => a.starLevel - b.starLevel)
      if (activeTiers.length > 0) {
        return activeTiers.map((lvl) => ({
          star: lvl.starLevel,
          amount: String(lvl.minDeposit),
          label: `${Number(lvl.minDeposit).toLocaleString('vi-VN')} ₫`,
          tier: lvl.tierName,
        }))
      }
    }
    return [
      { star: 2, amount: '5000000', label: '5.000.000 ₫', tier: 'Tiềm Năng' },
      { star: 3, amount: '10000000', label: '10.000.000 ₫', tier: 'Uy Tín' },
      { star: 4, amount: '30000000', label: '30.000.000 ₫', tier: 'Vàng' },
      { star: 5, amount: '50000000', label: '50.000.000 ₫', tier: 'Kim Cương' },
    ]
  }, [trustLevels])

  const calculatePreviewStar = useCallback((amount) => {
    const num = Number(amount || 0)
    if (!num || num <= 0) return 1
    if (Array.isArray(trustLevels) && trustLevels.length > 0) {
      let star = 1
      const sorted = [...trustLevels].sort((a, b) => a.starLevel - b.starLevel)
      for (const tier of sorted) {
        if (tier.minDeposit !== null && tier.minDeposit !== undefined && num >= Number(tier.minDeposit)) {
          star = tier.starLevel
        }
      }
      return star
    }
    if (num >= 50000000) return 5
    if (num >= 30000000) return 4
    if (num >= 10000000) return 3
    if (num >= 5000000) return 2
    return 1
  }, [trustLevels])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      shopPhone: user?.phoneNumber || '',
      shopEmail: user?.email || '',
    },
  })

  // Tự động đồng bộ số điện thoại và email từ tài khoản đăng ký
  useEffect(() => {
    const syncAccountContact = async () => {
      let phone = user?.phoneNumber
      let email = user?.email

      if (!phone || !email) {
        try {
          const profile = await authService.getUserProfile()
          if (profile) {
            phone = profile.phoneNumber || phone
            email = profile.email || email
            if (updateUser) {
              updateUser({
                phoneNumber: profile.phoneNumber,
                email: profile.email,
                fullName: profile.fullName,
              })
            }
          }
        } catch (err) {
          console.warn('Could not auto-fetch user profile for shop contact:', err)
        }
      }

      if (phone) {
        setValue('shopPhone', phone, { shouldValidate: true })
      }
      if (email) {
        setValue('shopEmail', email, { shouldValidate: true })
      }
    }

    if (isAuthenticated) {
      syncAccountContact()
    }
  }, [isAuthenticated, user?.phoneNumber, user?.email, setValue, updateUser])

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng ký hoặc đăng nhập tài khoản Người Bán.', { id: 'seller-register-auth-required' })
      navigate('/register')
      return
    }

    const syncStatusAndInit = async () => {
      try {
        const profile = await authService.getMe()
        if (profile?.role === 'BUSINESS' || profile?.hasShop) {
          navigate('/dashboard', { replace: true })
          return
        }
        if (profile?.sellerStatus === 'PENDING' || profile?.sellerStatus === 'REJECTED') {
          navigate('/pending', { replace: true })
          return
        }
        if (profile?.accountVerified === true) {
          updateAccountVerified(true)
          setShowSellerForm(true)
          clearKycProgress()
          return
        }
      } catch (err) {
        console.warn('Sync profile on seller-register error:', err)
      }

      // Check if verified in auth store
      if (accountVerified) {
        setShowSellerForm(true)
        clearKycProgress()
        return
      }

      // Check existing KYC session in progress from localStorage
      const savedKyc = loadKycProgress()
      if (savedKyc && savedKyc.sessionId) {
        setSessionId(savedKyc.sessionId)
        setSessionStatus('IN_PROGRESS')
        if (savedKyc.currentStep) setCurrentStep(savedKyc.currentStep)
        if (savedKyc.frontUploaded) setFrontUploaded(true)
        if (savedKyc.backUploaded) setBackUploaded(true)
        if (savedKyc.selfieUploaded) setSelfieUploaded(true)
        setRestoredKycSession(true)
        toast('Đã khôi phục phiên KYC đang dở dang của bạn.', { id: 'kyc-restored' })
      } else {
        // Auto-create KYC session if no active session found
        handleAutoStartKYC()
      }
    }

    syncStatusAndInit()
  }, [isAuthenticated, accountVerified, navigate, updateAccountVerified])

  const handleAutoStartKYC = async (isRetry = false) => {
    setIsStarting(true)
    setKycError(null)
    try {
      const res = await kycService.startSession()
      const sid = res?.sessionId || ''
      setSessionId(sid)
      setSessionStatus(res?.status || '')
      setCurrentStep(1)
      setFrontUploaded(false)
      setBackUploaded(false)
      setSelfieUploaded(false)
      setFrontFile(null)
      setBackFile(null)
      setSelfieFile(null)
      setFrontPreview(null)
      setBackPreview(null)
      setSelfiePreview(null)
      setRestoredKycSession(false)
      saveKycProgress({
        sessionId: sid,
        currentStep: 1,
        frontUploaded: false,
        backUploaded: false,
        selfieUploaded: false,
      })
      toast.success(isRetry ? 'Đã khởi tạo lại phiên KYC mới thành công.' : 'Phiên KYC đã được tạo tự động. Vui lòng hoàn tất xác minh danh tính.', { id: 'kyc-session-started' })
    } catch (error) {
      console.error('Start KYC error:', error)
      const msg = error?.message || 'Không thể tạo phiên KYC do lỗi kết nối mạng. Vui lòng thử lại.'
      setKycError(msg)
      toast.error(msg, { id: 'kyc-session-start-failed' })
    } finally {
      setIsStarting(false)
    }
  }

  const handleResetKycSession = () => {
    clearKycProgress()
    handleAutoStartKYC(true)
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
        toast.error('Vui lòng chụp ảnh khuôn mặt.')
        return
      }
      file = selfieFile
      docType = 'SELFIE'
    }

    setIsUploading(true)
    setKycError(null)
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
        saveKycProgress({ sessionId, currentStep: 2, frontUploaded: true })
        toast.success('Upload ảnh mặt trước CCCD thành công!')
      } else if (type === 'back') {
        setBackUploaded(true)
        setCurrentStep(3)
        saveKycProgress({ sessionId, currentStep: 3, backUploaded: true })
        toast.success('Upload ảnh mặt sau CCCD thành công!')
      } else if (type === 'selfie') {
        setSelfieUploaded(true)
        setCurrentStep(4)
        saveKycProgress({ sessionId, currentStep: 4, selfieUploaded: true })
        toast.success('Upload ảnh khuôn mặt thành công!')
      }
    } catch (error) {
      console.error(`Upload ${type} error:`, error)
      const msg = error?.message || `Upload ảnh ${type} thất bại do lỗi mạng. Vui lòng thử lại.`
      setKycError(msg)
      toast.error(msg)
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
    setKycError(null)
    try {
      const compareResult = await kycService.compare(sessionId)

      if (compareResult?.status === 'VERIFIED') {
        toast.success('Xác minh danh tính thành công! Bạn có thể tiếp tục đăng ký bán hàng.')
        updateAccountVerified(true)
        setShowSellerForm(true)
        clearKycProgress()
      } else {
        const failMsg = 'Xác minh thất bại: Khuôn mặt và giấy tờ không khớp hoặc ảnh bị mờ. Vui lòng chụp lại ảnh khuôn mặt.'
        setKycError(failMsg)
        toast.error(failMsg)
      }
    } catch (error) {
      console.error('Compare KYC error:', error)
      const failMsg = error?.message || 'Không thể xác minh danh tính do lỗi kết nối mạng. Vui lòng thử lại.'
      setKycError(failMsg)
      toast.error(failMsg)
    } finally {
      setIsComparing(false)
    }
  }

  const handleSellerTypeChange = (newType) => {
    if (newType === sellerType) return
    setSellerType(newType)

    if (newType === 'INDIVIDUAL') {
      // 1. Reset trạng thái đồng bộ địa chỉ trụ sở
      setSameAsBusiness(false)

      // 2. Xóa sạch dữ liệu đặc thù của Hộ kinh doanh / Doanh nghiệp
      setValue('businessType', '')
      setValue('businessName', '')
      setValue('businessAddress', '')
      setValue('businessLicenseUrl', '')

      // 3. Nếu địa chỉ lấy hàng trước đó copy từ địa chỉ trụ sở thì reset lại
      if (sameAsBusiness) {
        setValue('pickupAddress', '')
        if (sameAsPickup) {
          setValue('returnAddress', '')
        }
      }
    } else if (newType === 'BUSINESS') {
      setSameAsBusiness(false)
    }
  }

  // Khôi phục bản nháp form khi mở form đăng ký
  useEffect(() => {
    if (showSellerForm) {
      try {
        const raw = localStorage.getItem(FORM_DRAFT_KEY)
        if (raw) {
          const draft = JSON.parse(raw)
          if (draft.sellerType) setSellerType(draft.sellerType)
          if (draft.sameAsBusiness !== undefined) setSameAsBusiness(draft.sameAsBusiness)
          if (draft.sameAsPickup !== undefined) setSameAsPickup(draft.sameAsPickup)
          if (draft.isEscrowChecked !== undefined) setIsEscrowChecked(draft.isEscrowChecked)
          if (draft.selectedDepositAmount) setSelectedDepositAmount(draft.selectedDepositAmount)

          // Nạp lại các trường vào form
          reset(draft)
          setDraftRestored(true)
          setDraftRestoredTime(draft.savedAt || 'trước đó')
        }
      } catch (err) {
        console.warn('Restore draft error:', err)
      }
    }
  }, [showSellerForm, reset])

  // Tự động lưu bản nháp form (Debounce 600ms)
  const watchedValues = watch()
  useEffect(() => {
    if (!showSellerForm) return
    const timer = setTimeout(() => {
      try {
        const draft = {
          ...watchedValues,
          sellerType,
          sameAsBusiness,
          sameAsPickup,
          isEscrowChecked,
          selectedDepositAmount,
          savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }
        localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft))
      } catch (err) {
        console.warn('Auto-save draft error:', err)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [watchedValues, sellerType, sameAsBusiness, sameAsPickup, isEscrowChecked, selectedDepositAmount, showSellerForm])

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(FORM_DRAFT_KEY)
      setDraftRestored(false)
      reset({
        shopPhone: user?.phoneNumber || '',
        shopEmail: user?.email || '',
        shopName: '',
        description: '',
        coverImageUrl: '',
        pickupAddress: '',
        returnAddress: '',
        businessType: '',
        businessName: '',
        businessAddress: '',
        businessLicenseUrl: '',
        taxCode: '',
        invoiceEmail: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
      })
      toast.success('Đã xóa dữ liệu bản nháp.')
    } catch (e) {}
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

    const payload = {
      sellerType,
      shopName: data.shopName?.trim(),
      shopPhone: (data.shopPhone || user?.phoneNumber)?.trim(),
      shopEmail: (data.shopEmail || user?.email)?.trim() || null,
      description: data.description?.trim() || null,
      coverImageUrl: data.coverImageUrl?.trim() || null,
      pickupAddress: data.pickupAddress?.trim(),
      returnAddress: data.returnAddress?.trim(),
      address: null,
      taxCode: data.taxCode?.trim() || null,
      invoiceEmail: data.invoiceEmail?.trim() || null,
      businessType: sellerType === 'BUSINESS' && data.businessType ? data.businessType : null,
      businessName: sellerType === 'BUSINESS' ? (data.businessName?.trim() || null) : null,
      businessAddress: sellerType === 'BUSINESS' ? (data.businessAddress?.trim() || null) : null,
      businessLicenseUrl: sellerType === 'BUSINESS' ? (data.businessLicenseUrl?.trim() || null) : null,
      bankName: data.bankName?.trim(),
      bankAccountName: data.bankAccountName?.trim()?.toUpperCase(),
      bankAccountNumber: data.bankAccountNumber?.trim(),
      isEscrowParticipated: Boolean(isEscrowChecked),
      initialDepositAmount: isEscrowChecked ? Number(selectedDepositAmount || 0) : 0,
    }

    try {
      setSubmitError(null)
      await requestService.registerSeller(payload)
      toast.success('Gửi yêu cầu đăng ký bán hàng thành công!')
      if (updateUser) {
        updateUser({ sellerStatus: 'PENDING' })
      }
      localStorage.removeItem(FORM_DRAFT_KEY)
      clearKycProgress()
      reset()
      navigate('/pending')
    } catch (error) {
      console.error('Register seller error:', error)
      const message =
        error?.message || 'Đăng ký bán hàng thất bại. Vui lòng kiểm tra lại kết nối mạng và thử lại.'
      setSubmitError(message)
      toast.error(message)
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col font-sans transition-colors',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900',
      )}
    >
      {/* Top Navbar with Account info & Logout */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white/90',
        )}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <HiOutlineShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                Kênh Người Bán
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-stone-400 dark:text-slate-400">
                Đăng ký mở gian hàng
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="http://localhost:3000"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 px-2 py-1.5 transition-colors"
          >
            <HiOutlineHome className="h-4 w-4" />
            Về sàn mua sắm
          </a>

          <button
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-xl border transition-colors',
              isDark
                ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200',
            )}
            title="Đổi giao diện"
          >
            {isDark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
          </button>

          {isAuthenticated && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-stone-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-stone-900 dark:text-white truncate max-w-[150px]">
                  {user?.fullName || user?.username || user?.email}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-400">
                  {user?.role === 'BUSINESS' ? 'Chủ shop' : 'Tài khoản người dùng'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm',
                  isDark
                    ? 'border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-200'
                    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700',
                )}
                title="Đăng xuất tài khoản"
              >
                <HiOutlineLogout className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
        {/* Offline Network Warning */}
        {!isOnline && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-500 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span>Mất kết nối mạng! Dữ liệu của bạn đang được lưu tạm trên thiết bị.</span>
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] bg-red-500/20 px-2 py-0.5 rounded">Mất mạng</span>
          </div>
        )}

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

              {/* KYC Session Restored Banner */}
              {restoredKycSession && (
                <div className={cn(
                  'mb-6 rounded-2xl p-4 border text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors',
                  isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                )}>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="h-4 w-4 text-amber-500" />
                      Đang khôi phục phiên KYC đang dở dang (Bước {currentStep}/4)
                    </p>
                    <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                      Hệ thống tự động ghi nhớ các ảnh bạn đã tải lên trước đó để bạn không cần làm lại từ đầu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetKycSession}
                    className={cn(
                      'text-xs font-semibold underline hover:opacity-80 transition whitespace-nowrap',
                      isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Làm lại phiên mới
                  </button>
                </div>
              )}

              {/* KYC Error & Retry Banner */}
              {kycError && (
                <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <HiOutlineExclamationCircle className="h-4 w-4 text-rose-500" />
                      Sự cố trong quá trình xác minh
                    </p>
                    <p className="text-rose-400">{kycError}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep === 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          setKycError(null)
                          setCurrentStep(3)
                        }}
                        className="whitespace-nowrap rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Chụp lại selfie (Bước 3)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setKycError(null)
                        if (!sessionId) {
                          handleAutoStartKYC(true)
                        } else if (currentStep === 4) {
                          handleReviewAndCompare()
                        }
                      }}
                      className="whitespace-nowrap rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Thử lại kết nối
                    </button>
                  </div>
                </div>
              )}

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
                        Chụp ảnh selfie trực tiếp để xác minh khuôn mặt
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
                      <button
                        onClick={() => setShowCamera(true)}
                        className={cn(
                          'flex w-full flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl transition',
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

              {/* KYC Footer Actions: Return & Logout */}
              <div className="mt-8 pt-4 border-t border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-slate-400">
                <Link
                  to="/"
                  className="hover:text-amber-500 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <HiOutlineArrowLeft className="h-4 w-4" /> Về trang giới thiệu
                </Link>
                <div className="flex items-center gap-2">
                  <span>Chưa muốn xác minh lúc này?</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <HiOutlineLogout className="h-4 w-4" /> Đăng xuất tài khoản
                  </button>
                </div>
              </div>
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
              <div className="mb-6 text-center">
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

              {/* Account Registration Notice Banner */}
              <div className={cn(
                'mb-6 rounded-2xl p-4 border text-left transition-colors',
                isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
              )}>
                <div className="text-xs space-y-1">
                  <p className="font-bold">
                    Tài khoản đăng ký: <span className="underline">{user?.username || user?.email || 'Khách hàng'}</span>
                  </p>
                  <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                    Vui lòng điền chính xác thông tin gian hàng, tài khoản ngân hàng và kho lấy hàng bên dưới. Đối với Hộ kinh doanh/Doanh nghiệp, cần đính kèm Giấy phép kinh doanh để Ban quản trị xét duyệt.
                  </p>
                </div>
              </div>

              {/* Draft Restored Banner */}
              {draftRestored && (
                <div className={cn(
                  'mb-6 rounded-2xl p-4 border text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors',
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                )}>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                      Đã khôi phục dữ liệu bản nháp (lưu lúc {draftRestoredTime})
                    </p>
                    <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                      Dữ liệu biểu mẫu bạn đang điền trước khi bị gián đoạn đã được nạp lại tự động.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className={cn(
                      'text-xs font-semibold underline hover:opacity-80 transition whitespace-nowrap',
                      isDark ? 'text-slate-400 hover:text-white' : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Xóa nháp và điền lại
                  </button>
                </div>
              )}

              <div className={cn(
                'mb-6 flex p-1.5 space-x-1.5 rounded-2xl border transition-colors',
                isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-stone-100 border-stone-200'
              )}>
                <button
                  type="button"
                  onClick={() => handleSellerTypeChange('INDIVIDUAL')}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2',
                    sellerType === 'INDIVIDUAL'
                      ? isDark
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-white text-amber-600 shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                  )}
                >
                  Cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => handleSellerTypeChange('BUSINESS')}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2',
                    sellerType === 'BUSINESS'
                      ? isDark
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-white text-amber-600 shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                  )}
                >
                  Hộ kinh doanh / Doanh nghiệp
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* 1. HỒ SƠ SHOP */}
                <div className="space-y-5">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>1. Hồ sơ shop</h3>

                  {/* Ảnh bìa gian hàng */}
                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                      Ảnh bìa gian hàng (Cover Banner)
                    </label>
                    <ShopCoverImageUpload
                      value={watch('coverImageUrl')}
                      onChange={(url) => setValue('coverImageUrl', url || '', { shouldValidate: true })}
                      error={errors.coverImageUrl?.message}
                    />
                    <input
                      type="hidden"
                      {...register('coverImageUrl', { maxLength: { value: 255, message: 'Tối đa 255 ký tự' } })}
                    />
                  </div>

                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                      Tên shop <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineUser className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                      <input
                        type="text"
                        placeholder="VD: TechZone Official"
                        className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.shopName && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                        {...register('shopName', {
                          required: 'Vui lòng nhập tên shop',
                          minLength: { value: 3, message: 'Tên shop tối thiểu 3 ký tự' },
                          maxLength: { value: 100, message: 'Tối đa 100 ký tự' },
                          pattern: { value: /^[^<>{}\\]+$/, message: 'Tên shop không được chứa ký tự đặc biệt nguy hiểm' },
                        })}
                      />
                    </div>
                    {errors.shopName && <p className="mt-1.5 text-sm text-red-500">{errors.shopName.message}</p>}
                  </div>

                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Mô tả shop</label>
                    <div className="relative">
                      <HiOutlineDocumentText className={cn('absolute left-3 top-3 h-5 w-5', isDark ? 'text-slate-500' : 'text-stone-400')} />
                      <textarea
                        rows={3}
                        placeholder="Giới thiệu ngắn về shop..."
                        className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.description && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                        {...register('description', { maxLength: { value: 5000, message: 'Tối đa 5000 ký tự' } })}
                      />
                    </div>
                    {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description.message}</p>}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Số điện thoại shop <span className="text-red-500">*</span>
                        </label>
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500/90 dark:text-amber-400">
                          <HiOutlineLockClosed className="h-3.5 w-3.5" />
                          Cố định theo tài khoản
                        </span>
                      </div>
                      <div className="relative">
                        <HiOutlinePhone className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="tel"
                          readOnly
                          placeholder="0912345678"
                          title="Số điện thoại được lấy cố định từ tài khoản đăng ký và không thể chỉnh sửa"
                          className={cn(
                            'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition cursor-not-allowed select-none font-medium',
                            isDark
                              ? 'border-slate-700 bg-slate-800/80 text-slate-300 placeholder:text-slate-500'
                              : 'border-stone-200 bg-stone-100/90 text-stone-700 placeholder:text-stone-400',
                            errors.shopPhone && 'border-red-500/70'
                          )}
                          {...register('shopPhone', {
                            required: 'Số điện thoại không được để trống',
                          })}
                        />
                      </div>
                      {errors.shopPhone && <p className="mt-1.5 text-sm text-red-500">{errors.shopPhone.message}</p>}
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className={cn('block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Email shop
                        </label>
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500/90 dark:text-amber-400">
                          <HiOutlineLockClosed className="h-3.5 w-3.5" />
                          Cố định theo tài khoản
                        </span>
                      </div>
                      <div className="relative">
                        <HiOutlineMail className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="email"
                          readOnly
                          placeholder="shop@example.com"
                          title="Email được lấy cố định từ tài khoản đăng ký và không thể chỉnh sửa"
                          className={cn(
                            'w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition cursor-not-allowed select-none font-medium',
                            isDark
                              ? 'border-slate-700 bg-slate-800/80 text-slate-300 placeholder:text-slate-500'
                              : 'border-stone-200 bg-stone-100/90 text-stone-700 placeholder:text-stone-400',
                            errors.shopEmail && 'border-red-500/70'
                          )}
                          {...register('shopEmail')}
                        />
                      </div>
                      {errors.shopEmail && <p className="mt-1.5 text-sm text-red-500">{errors.shopEmail.message}</p>}
                    </div>
                  </div>
                </div>

                {/* 2. THÔNG TIN DOANH NGHIỆP */}
                {sellerType === 'BUSINESS' && (
                  <div className="space-y-5">
                    <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>2. Thông tin doanh nghiệp</h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Loại hình kinh doanh <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <select
                            className={cn('w-full appearance-none rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white focus:border-amber-500/60' : 'border-stone-300 bg-stone-50/80 text-stone-900 focus:border-amber-500', errors.businessType && 'border-red-500/70')}
                            {...register('businessType', { required: 'Vui lòng chọn loại hình kinh doanh' })}
                          >
                            <option value="">-- Chọn loại hình --</option>
                            <option value="HOUSEHOLD">Hộ kinh doanh</option>
                            <option value="ENTERPRISE">Doanh nghiệp</option>
                          </select>
                        </div>
                        {errors.businessType && <p className="mt-1.5 text-sm text-red-500">{errors.businessType.message}</p>}
                      </div>

                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Tên công ty / Hộ kinh doanh <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="text"
                            placeholder="Nhập tên đăng ký kinh doanh"
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.businessName && 'border-red-500/70')}
                            {...register('businessName', {
                              required: 'Vui lòng nhập tên công ty/HKD',
                              minLength: { value: 3, message: 'Tên công ty tối thiểu 3 ký tự' },
                              maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
                            })}
                          />
                        </div>
                        {errors.businessName && <p className="mt-1.5 text-sm text-red-500">{errors.businessName.message}</p>}
                      </div>
                    </div>

                    <div>
                      <GhnAddressSelector
                        label="Địa chỉ trụ sở"
                        required
                        hint="Theo Giấy phép kinh doanh"
                        value={watch('businessAddress')}
                        onChange={(fullAddr) => {
                          setValue('businessAddress', fullAddr, { shouldValidate: true })
                          if (sameAsBusiness) {
                            setValue('pickupAddress', fullAddr, { shouldValidate: true })
                            if (sameAsPickup) {
                              setValue('returnAddress', fullAddr, { shouldValidate: true })
                            }
                          }
                        }}
                        error={errors.businessAddress?.message}
                        isDark={isDark}
                      />
                      <input
                        type="hidden"
                        {...register('businessAddress', {
                          required: sellerType === 'BUSINESS' ? 'Vui lòng chọn địa chỉ trụ sở chuẩn GHN' : false,
                        })}
                      />
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        Mã số thuế doanh nghiệp <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="VD: 0101234567 hoặc 0101234567-001"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.taxCode && 'border-red-500/70')}
                          {...register('taxCode', {
                            required: sellerType === 'BUSINESS' ? 'Vui lòng nhập mã số thuế doanh nghiệp' : false,
                            pattern: {
                              value: /^[0-9]{10}(-[0-9]{3})?$|^[0-9]{13}$/,
                              message: 'Mã số thuế không hợp lệ (gồm 10 hoặc 13 chữ số)',
                            },
                          })}
                        />
                      </div>
                      {errors.taxCode && <p className="mt-1.5 text-sm text-red-500">{errors.taxCode.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        Ảnh Giấy phép kinh doanh (GPKD) <span className="text-red-500">*</span>
                      </label>
                      <BusinessLicenseUpload
                        value={watch('businessLicenseUrl')}
                        onChange={(url) => setValue('businessLicenseUrl', url || '', { shouldValidate: true })}
                        error={errors.businessLicenseUrl?.message}
                      />
                      <input
                        type="hidden"
                        {...register('businessLicenseUrl', {
                          required: sellerType === 'BUSINESS' ? 'Vui lòng tải lên ảnh Giấy phép kinh doanh' : false,
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* 3. LẤY/TRẢ HÀNG & PHÁP LÝ */}
                <div className="space-y-6">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>
                    {sellerType === 'BUSINESS' ? '3. Lấy/trả hàng & Hóa đơn' : '2. Lấy/trả hàng & Pháp lý'}
                  </h3>

                  {/* Địa chỉ lấy hàng */}
                  <div className="rounded-2xl border p-4 sm:p-5 space-y-3 bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/80 dark:border-slate-800">
                    {sellerType === 'BUSINESS' && (
                      <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-amber-600 dark:text-amber-400">
                        <input
                          type="checkbox"
                          checked={sameAsBusiness}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSameAsBusiness(checked)
                            if (checked) {
                              const bAddr = watch('businessAddress') || ''
                              setValue('pickupAddress', bAddr, { shouldValidate: true })
                              if (sameAsPickup) {
                                setValue('returnAddress', bAddr, { shouldValidate: true })
                              }
                            }
                          }}
                          className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                        />
                        <span>Địa chỉ lấy hàng giống Địa chỉ trụ sở</span>
                      </label>
                    )}

                    <GhnAddressSelector
                      label="Địa chỉ lấy hàng (Kho hàng cho GHN đến lấy)"
                      required
                      disabled={sameAsBusiness}
                      hint="Chọn Tỉnh, Huyện, Xã theo chuẩn GHN"
                      value={watch('pickupAddress')}
                      onChange={(fullAddr) => {
                        setValue('pickupAddress', fullAddr, { shouldValidate: true })
                        if (sameAsPickup) {
                          setValue('returnAddress', fullAddr, { shouldValidate: true })
                        }
                      }}
                      error={errors.pickupAddress?.message}
                      isDark={isDark}
                    />
                    <input
                      type="hidden"
                      {...register('pickupAddress', { required: 'Vui lòng chọn địa chỉ lấy hàng chuẩn GHN' })}
                    />
                  </div>

                  {/* Địa chỉ trả hàng */}
                  <div className="rounded-2xl border p-4 sm:p-5 space-y-3 bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/80 dark:border-slate-800">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-amber-600 dark:text-amber-400">
                      <input
                        type="checkbox"
                        checked={sameAsPickup}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setSameAsPickup(checked)
                          if (checked) {
                            setValue('returnAddress', watch('pickupAddress') || '', { shouldValidate: true })
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                      <span>Địa chỉ trả hàng giống Địa chỉ lấy hàng</span>
                    </label>

                    <GhnAddressSelector
                      label="Địa chỉ trả hàng (Nhận hàng hoàn trả từ GHN)"
                      required
                      disabled={sameAsPickup}
                      hint="Nơi nhận hàng khi khách hoàn hàng"
                      value={watch('returnAddress')}
                      onChange={(fullAddr) => {
                        setValue('returnAddress', fullAddr, { shouldValidate: true })
                      }}
                      error={errors.returnAddress?.message}
                      isDark={isDark}
                    />
                    <input
                      type="hidden"
                      {...register('returnAddress', { required: 'Vui lòng chọn địa chỉ trả hàng chuẩn GHN' })}
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {sellerType === 'INDIVIDUAL' && (
                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Mã số thuế cá nhân <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="text"
                            maxLength={12}
                            placeholder="VD: 0123456789 hoặc CCCD 12 số"
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.taxCode && 'border-red-500/70')}
                            {...register('taxCode', {
                              required: sellerType === 'INDIVIDUAL' ? 'Vui lòng nhập mã số thuế cá nhân' : false,
                              pattern: {
                                value: /^[0-9]{10,12}$/,
                                message: 'Mã số thuế cá nhân không hợp lệ (gồm 10 đến 12 chữ số)',
                              },
                            })}
                          />
                        </div>
                        {errors.taxCode && <p className="mt-1.5 text-sm text-red-500">{errors.taxCode.message}</p>}
                      </div>
                    )}

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Email nhận hóa đơn</label>
                      <div className="relative">
                        <HiOutlineMail className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="email"
                          placeholder="email.hoadon@example.com"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.invoiceEmail && 'border-red-500/70')}
                          {...register('invoiceEmail', {
                            maxLength: { value: 120, message: 'Tối đa 120 ký tự' },
                            validate: (val) => !val || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val) || 'Email nhận hóa đơn không hợp lệ',
                          })}
                        />
                      </div>
                      {errors.invoiceEmail && <p className="mt-1.5 text-sm text-red-500">{errors.invoiceEmail.message}</p>}
                    </div>
                  </div>
                </div>

                {/* 4. THÔNG TIN NGÂN HÀNG */}
                <div className="space-y-5">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>
                    {sellerType === 'BUSINESS' ? '4. Thông tin ngân hàng' : '3. Thông tin ngân hàng'}
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        Tên ngân hàng <span className="text-red-500">*</span>
                      </label>
                      <BankSelector
                        value={watch('bankName') || ''}
                        onChange={(selectedBankName) => {
                          setValue('bankName', selectedBankName, { shouldValidate: true, shouldDirty: true })
                        }}
                        error={errors.bankName?.message}
                        isDark={isDark}
                        placeholder="Tìm kiếm hoặc chọn ngân hàng (VD: VCB, MB, BIDV)..."
                      />
                      <input
                        type="hidden"
                        {...register('bankName', {
                          required: 'Vui lòng chọn ngân hàng',
                          minLength: { value: 2, message: 'Tên ngân hàng tối thiểu 2 ký tự' },
                          maxLength: { value: 150, message: 'Tối đa 150 ký tự' },
                        })}
                      />
                      {errors.bankName && <p className="mt-1.5 text-sm text-red-500">{errors.bankName.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                        Tên chủ tài khoản (in hoa không dấu) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiOutlineUser className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="VD: NGUYEN VAN A"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition uppercase', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.bankAccountName && 'border-red-500/70')}
                          {...register('bankAccountName', {
                            required: 'Vui lòng nhập tên chủ tài khoản',
                            minLength: { value: 3, message: 'Tên chủ tài khoản tối thiểu 3 ký tự' },
                            maxLength: { value: 150, message: 'Tối đa 150 ký tự' },
                            pattern: { value: /^[a-zA-Z\s]+$/i, message: 'Tên chủ tài khoản viết không dấu, không chứa số' },
                          })}
                          onChange={(e) => setValue('bankAccountName', e.target.value.toUpperCase())}
                        />
                      </div>
                      {errors.bankAccountName && <p className="mt-1.5 text-sm text-red-500">{errors.bankAccountName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                      Số tài khoản <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                      <input
                        type="text"
                        placeholder="Nhập số tài khoản ngân hàng (chỉ gồm số)"
                        className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.bankAccountNumber && 'border-red-500/70')}
                        {...register('bankAccountNumber', {
                          required: 'Vui lòng nhập số tài khoản ngân hàng',
                          pattern: { value: /^[0-9]{6,20}$/, message: 'Số tài khoản ngân hàng chỉ gồm 6-20 chữ số' },
                        })}
                      />
                    </div>
                    {errors.bankAccountNumber && <p className="mt-1.5 text-sm text-red-500">{errors.bankAccountNumber.message}</p>}
                  </div>
                </div>

                {/* 6. KÝ QUỸ BẢO CHỨNG & CẤP ĐỘ UY TÍN */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-stone-900")}>
                      6. Ký quỹ bảo chứng & Cấp độ uy tín
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400">
                      Không bắt buộc
                    </span>
                  </div>

                  {/* Thông tin giải thích đồng bộ phong cách với banner đầu form */}
                  <div className={cn(
                    'rounded-2xl p-4 border text-left transition-colors',
                    isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  )}>
                    <div className="text-xs space-y-1">
                      <p className="font-bold">
                        Bảo chứng giao dịch an toàn (Escrow Capital Deposit)
                      </p>
                      <p className={isDark ? 'text-slate-300' : 'text-stone-600'}>
                        Tiền ký quỹ có bản chất tương tự &quot;Vốn điều lệ&quot; cam kết trách nhiệm và uy tín của gian hàng trên sàn. Bạn có thể chọn <strong>bán hàng thông thường (1★)</strong> hoặc <strong>ký quỹ bảo chứng để nâng cao độ uy tín (2★ - 5★)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Lựa chọn gói 2 thẻ trực quan, đồng bộ hệ thống design */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Lựa chọn A: Không ký quỹ */}
                    <div
                      onClick={() => setIsEscrowChecked(false)}
                      className={cn(
                        'relative cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between',
                        !isEscrowChecked
                          ? isDark
                            ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                            : 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                          : isDark
                          ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 dark:text-white">Bán hàng Tiêu chuẩn</span>
                            <span className="rounded-md bg-stone-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 dark:text-slate-300">
                              1★ Cơ bản
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                            Không yêu cầu nạp tiền ký quỹ ban đầu. Gian hàng được kích hoạt ngay sau khi Ban quản trị duyệt hồ sơ.
                          </p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                          !isEscrowChecked
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-stone-300 dark:border-slate-600'
                        )}>
                          {!isEscrowChecked && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-slate-700/60 text-[11px] text-stone-500 dark:text-slate-400">
                        Tiền cọc cam kết: <strong className="text-stone-800 dark:text-slate-200">0 ₫</strong>
                      </div>
                    </div>

                    {/* Lựa chọn B: Đăng ký Ký quỹ bảo chứng */}
                    <div
                      onClick={() => setIsEscrowChecked(true)}
                      className={cn(
                        'relative cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between',
                        isEscrowChecked
                          ? isDark
                            ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                            : 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                          : isDark
                          ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 dark:text-white">Ký Quỹ Bảo Chứng</span>
                            <span className="rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-semibold border border-amber-500/20">
                              2★ - 5★ Uy Tín
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                            Cam kết ký quỹ để nhận Huy hiệu Uy tín và ưu tiên hiển thị. Kích hoạt gian hàng sau khi nạp đủ số tiền cọc đã cam kết.
                          </p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                          isEscrowChecked
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-stone-300 dark:border-slate-600'
                        )}>
                          {isEscrowChecked && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-slate-700/60 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Cấp Huy hiệu Bảo chứng sàn & Kích hoạt theo cọc
                      </div>
                    </div>
                  </div>

                  {/* Khi chọn ký quỹ: Hiển thị các gói và input nhập với style sạch sẽ */}
                  {isEscrowChecked && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className={cn('block text-xs font-semibold mb-2', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Chọn mức tiền ký quỹ cam kết ban đầu:
                        </label>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                          {depositPackages.map((pkg) => {
                            const isSelected = selectedDepositAmount === pkg.amount
                            return (
                              <button
                                type="button"
                                key={pkg.amount}
                                onClick={() => setSelectedDepositAmount(pkg.amount)}
                                className={cn(
                                  'rounded-xl border p-3 text-left transition-all',
                                  isSelected
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500 shadow-xs'
                                    : isDark
                                    ? 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                                    : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100'
                                )}
                              >
                                <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                                  {Array.from({ length: pkg.star }).map((_, i) => (
                                    <HiStar key={i} className="h-3.5 w-3.5" />
                                  ))}
                                </div>
                                <div className="text-sm font-bold text-stone-900 dark:text-white">
                                  {pkg.label}
                                </div>
                                <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                                  {pkg.tier}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className={cn('block text-xs font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          Hoặc nhập số tiền ký quỹ tùy ý (VNĐ):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1000000"
                            step="1000000"
                            value={selectedDepositAmount}
                            onChange={(e) => setSelectedDepositAmount(e.target.value)}
                            placeholder="VD: 10000000"
                            className={cn(
                              'w-full rounded-xl border py-2.5 pl-4 pr-16 text-sm font-semibold outline-none transition',
                              isDark
                                ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                            )}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 dark:text-slate-500 pointer-events-none">
                            VNĐ
                          </span>
                        </div>
                      </div>

                      {/* Bảng tóm tắt thông tin cam kết */}
                      <div className={cn(
                        'rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
                        isDark
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-stone-200 bg-stone-50/80'
                      )}>
                        <div>
                          <div className="text-xs text-stone-500 dark:text-slate-400">Độ uy tín dự kiến đạt được:</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <HiStar
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i < calculatePreviewStar(selectedDepositAmount)
                                      ? 'text-amber-400'
                                      : isDark ? 'text-slate-700' : 'text-stone-300'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              {calculatePreviewStar(selectedDepositAmount)} Sao Uy Tín
                            </span>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-xs text-stone-500 dark:text-slate-400">Tiền cọc cam kết kích hoạt:</div>
                          <div className="text-base font-extrabold text-stone-900 dark:text-white mt-0.5">
                            {Number(selectedDepositAmount || 0).toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                        Sau khi Admin phê duyệt hồ sơ, gian hàng sẽ ở trạng thái <strong>Chờ nạp ký quỹ</strong>. Bạn nạp đủ {Number(selectedDepositAmount || 0).toLocaleString('vi-VN')} ₫ tiền ký quỹ đã cam kết để kích hoạt gian hàng và mở khóa tính năng đăng bán sản phẩm.
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Submit Error Banner */}
                {submitError && (
                  <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <HiOutlineExclamationCircle className="h-4 w-4 text-rose-500" />
                        Không thể gửi hồ sơ đăng ký
                      </p>
                      <p className="text-rose-400">{submitError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="whitespace-nowrap rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Thử gửi lại
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t dark:border-slate-700 mt-6">
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
                </div>
              </form>

              <p
                className={cn(
                  'mt-6 text-center text-sm',
                  isDark ? 'text-slate-400' : 'text-stone-500',
                )}
              >
                Yêu cầu sẽ được xét duyệt trong thời gian sớm nhất.
              </p>

              {/* Form Footer Actions: Return & Logout */}
              <div className="mt-6 pt-4 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-center gap-4 text-xs text-stone-500 dark:text-slate-400">
                <Link to="/" className="hover:text-amber-500 flex items-center gap-1.5 transition-colors font-medium">
                  <HiOutlineArrowLeft className="h-4 w-4" /> Về trang giới thiệu
                </Link>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <HiOutlineLogout className="h-4 w-4" /> Đăng xuất tài khoản
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  </div>
)
}
