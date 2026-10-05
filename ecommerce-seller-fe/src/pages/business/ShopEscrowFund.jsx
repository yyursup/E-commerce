import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlineArrowSmUp,
  HiOutlineArrowSmDown,
  HiOutlineInformationCircle,
  HiStar,
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlineClock
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import escrowFundService from '../../services/escrowFund'

export default function ShopEscrowFund() {
  const [searchParams] = useSearchParams()
  const isDark = useThemeStore((state) => state.theme) === 'dark'
  const updateUser = useAuthStore((state) => state.updateUser)

  const [fund, setFund] = useState(null)
  const [trustLevels, setTrustLevels] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Modals
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpNote, setTopUpNote] = useState('')
  const [topUpSubmitting, setTopUpSubmitting] = useState(false)

  const [showCloseShopModal, setShowCloseShopModal] = useState(false)
  const [closeShopSubmitting, setCloseShopSubmitting] = useState(false)

  const loadFundData = useCallback(async () => {
    try {
      setLoading(true)
      const [fundData, levelsData] = await Promise.all([
        escrowFundService.getMyFund(),
        escrowFundService.getTrustLevels()
      ])
      setFund(fundData)
      setTrustLevels(Array.isArray(levelsData) ? levelsData : [])
    } catch (err) {
      console.error('Lỗi tải quỹ ký quỹ:', err)
      toast.error(err?.message || 'Không thể tải thông tin Quỹ ký quỹ.')
    } finally {
      setLoading(false)
    }
  }, [])

  const quickTopUpSuggestions = useMemo(() => {
    if (Array.isArray(trustLevels) && trustLevels.length > 0) {
      const amounts = trustLevels
        .filter((l) => l.isActive !== false && Number(l.minDeposit) > 0)
        .map((l) => Number(l.minDeposit))
        .sort((a, b) => a - b)
      if (amounts.length > 0) {
        return amounts
      }
    }
    return [5000000, 10000000, 30000000, 50000000]
  }, [trustLevels])

  const loadTransactions = useCallback(async () => {
    try {
      setTxLoading(true)
      const data = await escrowFundService.getMyTransactions({ page, size: 10 })
      setTransactions(Array.isArray(data?.content) ? data.content : [])
      setTotalPages(data?.totalPages || 0)
      setTotalElements(data?.totalElements || 0)
    } catch (err) {
      console.error('Lỗi tải lịch sử biến động quỹ:', err)
    } finally {
      setTxLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadFundData()
  }, [loadFundData])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Lắng nghe kết quả điều hướng thanh toán trở về từ cổng VNPay
  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode')
    const vnpAmount = searchParams.get('vnp_Amount')

    if (vnpResponseCode) {
      if (vnpResponseCode === '00') {
        const paidAmount = vnpAmount ? Number(vnpAmount) / 100 : null
        toast.success(
          paidAmount
            ? `Nạp tiền Quỹ ký quỹ qua VNPay thành công: ${paidAmount.toLocaleString('vi-VN')} ₫!`
            : 'Thanh toán nạp tiền Quỹ ký quỹ qua VNPay thành công!',
          { duration: 6000 }
        )
        if (updateUser) {
          updateUser({ shopStatus: 'ACTIVE' })
        }
        loadFundData()
        loadTransactions()
      } else if (vnpResponseCode === '24') {
        toast.error('Giao dịch thanh toán nạp Quỹ ký quỹ đã bị hủy bởi người dùng.')
      } else {
        toast.error(`Giao dịch thanh toán qua VNPay không thành công (Mã phản hồi: ${vnpResponseCode}).`)
      }

      // Dọn dẹp tham số query trên URL tránh kích hoạt lặp lại
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [searchParams, loadFundData, loadTransactions, updateUser])

  const formatVND = (val) => {
    if (val === null || val === undefined) return '0 ₫'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const handleTopUpSubmit = async (e) => {
    e.preventDefault()
    const num = Number(topUpAmount)
    if (!num || num < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫')
      return
    }

    try {
      setTopUpSubmitting(true)
      const res = await escrowFundService.createVnpayPayment({
        amount: num,
        note: topUpNote || 'Nạp tiền Quỹ ký quỹ bảo chứng trách nhiệm'
      })
      if (res?.paymentUrl) {
        toast.loading('Đang chuyển hướng sang cổng thanh toán VNPay...', { duration: 2500 })
        window.location.href = res.paymentUrl
      } else {
        toast.error('Không thể tạo liên kết thanh toán VNPay.')
      }
    } catch (err) {
      console.error('Lỗi nạp quỹ qua VNPay:', err)
      toast.error(err?.message || 'Khởi tạo thanh toán VNPay thất bại.')
    } finally {
      setTopUpSubmitting(false)
    }
  }

  const handleRequestRefundCloseShop = async () => {
    try {
      setCloseShopSubmitting(true)
      await escrowFundService.requestCloseShopRefund()
      toast.success('Đã gửi yêu cầu rút tiền Quỹ ký quỹ và đóng gian hàng!')
      setShowCloseShopModal(false)
      loadFundData()
    } catch (err) {
      console.error('Lỗi yêu cầu hoàn quỹ đóng shop:', err)
      toast.error(err?.message || 'Không thể gửi yêu cầu hoàn quỹ.')
    } finally {
      setCloseShopSubmitting(false)
    }
  }

  const renderStars = (level) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <HiStar
          key={i}
          className={cn(
            'h-5 w-5',
            i <= level ? 'text-amber-400' : isDark ? 'text-slate-700' : 'text-stone-300'
          )}
        />
      )
    }
    return stars
  }

  const getTxTypeBadge = (type) => {
    switch (type) {
      case 'INITIAL_DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500 border border-blue-500/20">
            <HiOutlineArrowSmUp className="h-3.5 w-3.5" /> Nạp ban đầu
          </span>
        )
      case 'TOPUP_DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            <HiOutlineArrowSmUp className="h-3.5 w-3.5" /> Nạp bù / Thêm
          </span>
        )
      case 'COMPENSATION_DEDUCTION':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 border border-rose-500/20">
            <HiOutlineArrowSmDown className="h-3.5 w-3.5" /> Trích đền bù
          </span>
        )
      case 'WITHDRAWAL_ON_CLOSE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-500 border border-purple-500/20">
            <HiOutlineLockClosed className="h-3.5 w-3.5" /> Hoàn quỹ đóng shop
          </span>
        )
      default:
        return <span className="text-xs">{type}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <HiOutlineRefresh className="h-6 w-6 animate-spin text-amber-500" />
          Đang tải thông tin Quỹ ký quỹ...
        </div>
      </div>
    )
  }

  const isPendingActivation = fund?.status === 'PENDING_DEPOSIT'
  const isRefundPending = fund?.status === 'REFUND_PENDING'
  const isClosed = fund?.status === 'REFUNDED'
  const remainingToActivate = Math.max(0, Number(fund?.committedAmount || 0) - Number(fund?.balance || 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <HiOutlineShieldCheck className="h-8 w-8 text-amber-500" />
            Quỹ Ký Quỹ & Độ Uy Tín Gian Hàng
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Vốn điều lệ cam kết trách nhiệm pháp lý bảo chứng giao dịch an toàn (Escrow Capital Deposit).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadFundData()
              loadTransactions()
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className="h-4 w-4" />
            Làm mới
          </button>
          {!isRefundPending && !isClosed && (
            <button
              onClick={() => {
                if (isPendingActivation && remainingToActivate > 0) {
                  setTopUpAmount(String(remainingToActivate))
                }
                setShowTopUpModal(true)
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg transition',
                isPendingActivation
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 ring-2 ring-amber-500/50'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
              )}
            >
              <HiOutlineCash className="h-4 w-4" />
              {isPendingActivation ? 'Nạp tiền kích hoạt gian hàng' : 'Nạp thêm / Nạp bù quỹ'}
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO CHỜ DUYỆT ĐÓNG GIAN HÀNG & HOÀN TRẢ QUỸ */}
      {isRefundPending && (
        <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-transparent p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <HiOutlineClock className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 mb-1 border border-purple-500/30">
                  <HiOutlineClock className="h-3.5 w-3.5" /> Đang chờ Admin đối soát đóng shop
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Yêu cầu đóng gian hàng & hoàn trả Quỹ ký quỹ đang được xử lý
                </h3>
                <p className={cn('text-sm mt-1', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Gian hàng của bạn hiện đã chuyển sang trạng thái <strong>Tạm ngừng nhận đơn hàng mới (INACTIVE)</strong>.
                  Ban Quản Trị sàn đang đối soát các điều kiện: không còn đơn đang vận chuyển, mọi đơn hoàn thành đã qua 7 ngày cooling period, không còn khiếu nại tranh chấp hay thâm hụt quỹ.
                </p>
                <div className="mt-2 text-xs font-semibold text-purple-400">
                  Số dư Quỹ ký quỹ sẽ hoàn trả: <span className="text-amber-500 font-bold">{formatVND(fund?.balance)}</span> về Ví Của Gian Hàng sau khi Admin phê duyệt.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THÔNG BÁO GIAN HÀNG ĐÃ ĐÓNG VĨNH VIỄN & HOÀN TẤT HOÀN QUỸ */}
      {isClosed && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
              <HiOutlineCheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 mb-1 border border-slate-700">
                Gian hàng đã đóng (CLOSED)
              </div>
              <h3 className="text-base font-bold text-white">
                Gian hàng đã chính thức đóng cửa và hoàn tất hoàn trả Quỹ ký quỹ
              </h3>
              <p className="text-sm mt-1 text-slate-400">
                Toàn bộ tiền ký quỹ bảo chứng đã được hoàn trả về Ví Gian Hàng của bạn. Gian hàng đã ngừng toàn bộ hoạt động kinh doanh trên nền tảng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CẢNH BÁO CHỜ NẠP KÝ QUỸ ĐỂ KÍCH HOẠT GIAN HÀNG */}
      {isPendingActivation && (
        <div className="rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <HiOutlineShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 mb-1 border border-amber-500/30">
                  <HiOutlineClock className="h-3.5 w-3.5" /> Chờ nạp tiền ký quỹ để kích hoạt
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Gian hàng đang chờ nạp ký quỹ để kích hoạt
                </h3>
                <p className={cn('text-sm mt-1', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Hồ sơ mở shop của bạn đã được Admin phê duyệt. Để kích hoạt gian hàng đạt cấp độ <strong>{fund?.currentTrustLevel} Sao Uy Tín</strong> và mở khóa tính năng đăng bán sản phẩm, bạn cần nạp đủ số tiền ký quỹ đã cam kết:{' '}
                  <strong className="text-amber-500">{formatVND(fund?.committedAmount)}</strong>.
                </p>
                <div className="mt-2 text-xs font-semibold text-stone-600 dark:text-slate-400">
                  Đã nạp: <span className="text-emerald-500">{formatVND(fund?.balance)}</span> • Cần nạp thêm để kích hoạt:{' '}
                  <span className="text-rose-500 font-bold">{formatVND(remainingToActivate)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setTopUpAmount(String(remainingToActivate || fund?.committedAmount || 1000000))
                setShowTopUpModal(true)
              }}
              className="flex-shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition"
            >
              Nạp tiền kích hoạt ngay &rarr;
            </button>
          </div>
        </div>
      )}

      {/* CẢNH BÁO HỤT QUỸ (DEFICIT ALERT) */}
      {fund?.isDeficit && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500">
                <HiOutlineExclamation className="h-7 w-7 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-500">
                  CẢNH BÁO HỤT QUỸ KÝ QUỸ DO TRÍCH BỒI THƯỜNG
                </h3>
                <p className={cn('text-sm mt-1', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Số dư Quỹ ký quỹ của bạn vừa bị trích tiền bồi thường tranh chấp và đang thiếu hụt{' '}
                  <span className="font-bold text-rose-500">{formatVND(fund?.deficitAmount)}</span>{' '}
                  so với ngưỡng tối thiểu của bậc {fund?.currentTrustLevel} sao.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-500">
                  <HiOutlineClock className="h-4 w-4" />
                  Hạn chót nạp bù để giữ nguyên {fund?.currentTrustLevel} sao: {formatDateTime(fund?.deficitDeadline)} (Hệ thống sẽ tự động giáng cấp sau thời hạn này).
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setTopUpAmount(String(fund?.deficitAmount || 1000000))
                setShowTopUpModal(true)
              }}
              className="flex-shrink-0 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition"
            >
              Nạp bù quỹ ngay
            </button>
          </div>
        </div>
      )}

      {/* Grid thẻ thông tin chính */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Số dư Quỹ ký quỹ */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm relative overflow-hidden',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Số Dư Quỹ Ký Quỹ (Ví 2)
            </span>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
              <HiOutlineCreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-amber-500">
              {formatVND(fund?.balance)}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <HiOutlineLockClosed className="h-3.5 w-3.5 text-amber-500" />
              <span>Tiền cọc cam kết cố định (Không được rút lưu động)</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/40 flex items-center justify-between text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Mức cam kết:</span>
            <span className="font-semibold">{formatVND(fund?.committedAmount)}</span>
          </div>
        </div>

        {/* Card 2: Cấp độ uy tín (Trust Level) */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm relative overflow-hidden',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Cấp Độ Uy Tín Gian Hàng
            </span>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}>
              <HiOutlineShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars(fund?.currentTrustLevel || 1)}
            </div>
            <span className="text-sm font-bold text-amber-500">
              {fund?.currentTrustLevel} / 5 ★
            </span>
          </div>
          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/30">
              {fund?.tierName || `Cấp độ ${fund?.currentTrustLevel} sao`}
            </div>
          </div>
          <p className={cn('mt-3 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Được đánh giá tự động dựa trên mức tiền ký quỹ duy trì tại nền tảng.
          </p>
        </div>

        {/* Card 3: Trạng thái quỹ & Chính sách */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm flex flex-col justify-between',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Trạng Thái Quỹ
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold',
                  fund?.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : fund?.status === 'DEFICIT'
                    ? 'bg-rose-500/15 text-rose-500 animate-pulse'
                    : fund?.status === 'PENDING_DEPOSIT'
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : fund?.status === 'REFUND_PENDING'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
                    : fund?.status === 'REFUNDED'
                    ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    : 'bg-amber-500/15 text-amber-500'
                )}
              >
                {fund?.status === 'ACTIVE'
                  ? 'BẢO CHỨNG TỐT'
                  : fund?.status === 'DEFICIT'
                  ? 'ĐANG HỤT QUỸ'
                  : fund?.status === 'PENDING_DEPOSIT'
                  ? 'CHỜ NẠP KÍCH HOẠT'
                  : fund?.status === 'REFUND_PENDING'
                  ? 'CHỜ DUYỆT ĐÓNG SHOP'
                  : fund?.status === 'REFUNDED'
                  ? 'ĐÃ ĐÓNG GIAN HÀNG'
                  : fund?.status || 'HOẠT ĐỘNG'}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {fund?.status === 'PENDING_DEPOSIT' ? (
                <>
                  <div className="flex items-center gap-2 text-amber-500 font-medium">
                    <HiOutlineClock className="h-4 w-4 shrink-0" />
                    <span>Cần nạp đủ tiền ký quỹ cam kết để kích hoạt gian hàng</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineInformationCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Mở khóa đăng bán sản phẩm ngay sau khi kích hoạt</span>
                  </div>
                </>
              ) : isRefundPending ? (
                <>
                  <div className="flex items-center gap-2 text-purple-400 font-medium">
                    <HiOutlineClock className="h-4 w-4 shrink-0" />
                    <span>Yêu cầu đóng shop đang chờ Admin đối soát điều kiện</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineInformationCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Tạm ngừng nhận đơn mới trong thời gian chờ duyệt</span>
                  </div>
                </>
              ) : isClosed ? (
                <>
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <HiOutlineCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Gian hàng đã chính thức đóng cửa vĩnh viễn</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineInformationCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Đã hoàn tất thanh quyết toán toàn bộ số dư ký quỹ</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-emerald-500 font-medium">
                    <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
                    <span>Bảo vệ quyền lợi người mua & thương hiệu Shop</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineInformationCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Tách biệt hoàn toàn khỏi Ví Doanh Thu bán hàng</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/40">
            {isRefundPending ? (
              <div className="text-xs text-purple-400 font-medium flex items-center gap-1.5">
                <HiOutlineClock className="h-4 w-4 shrink-0 animate-pulse" />
                <span>Đang chờ Admin phê duyệt hoàn quỹ đóng shop</span>
              </div>
            ) : isClosed ? (
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Đã hoàn tất thủ tục đóng gian hàng</span>
              </div>
            ) : (
              <button
                onClick={() => setShowCloseShopModal(true)}
                className="text-xs text-slate-400 hover:text-rose-500 transition underline underline-offset-4"
              >
                Quy trình đóng gian hàng & rút tiền ký quỹ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bảng bậc xếp hạng uy tín tham chiếu */}
      <div
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <h2 className="text-base font-bold flex items-center gap-2 mb-4">
          <HiOutlineInformationCircle className="h-5 w-5 text-blue-400" />
          Bảng Quy Chuẩn Ngưỡng Ký Quỹ & Đặc Quyền Sao (Admin Configured)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {trustLevels.map((lvl) => {
            const isCurrent = fund?.currentTrustLevel === lvl.starLevel
            return (
              <div
                key={lvl.id || lvl.starLevel}
                className={cn(
                  'rounded-xl border p-4 transition relative',
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500'
                    : isDark
                    ? 'border-slate-800 bg-slate-950/60'
                    : 'border-stone-200 bg-stone-50'
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    Hạng Hiện Tại
                  </span>
                )}
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(lvl.starLevel)}
                </div>
                <h3 className="text-sm font-bold text-amber-500">{lvl.tierName}</h3>
                <p className="mt-1 text-xs font-semibold">
                  {lvl.maxDeposit
                    ? `${formatVND(lvl.minDeposit)} - ${formatVND(lvl.maxDeposit)}`
                    : `Từ ${formatVND(lvl.minDeposit)} trở lên`}
                </p>
                <p className={cn('mt-2 text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  {lvl.benefitsDescription || 'Cam kết bảo chứng chuẩn theo quy định sàn.'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* SỔ CÁI LỊCH SỬ BIẾN ĐỘNG QUỸ (ESCROW LEDGER) */}
      <div
        className={cn(
          'rounded-2xl border shadow-sm overflow-hidden',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="p-6 border-b border-slate-700/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Lịch Sử Biến Động Số Dư Quỹ Ký Quỹ</h2>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Sổ cái minh bạch ghi lại mọi giao dịch nạp đầu, nạp bù, trích đền bù tranh chấp.
            </p>
          </div>
          <span className="text-xs text-slate-400">Tổng cộng: {totalElements} giao dịch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn('text-xs uppercase', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
              <tr>
                <th className="px-6 py-3.5">Thời gian</th>
                <th className="px-6 py-3.5">Loại biến động</th>
                <th className="px-6 py-3.5">Số tiền</th>
                <th className="px-6 py-3.5">Số dư trước</th>
                <th className="px-6 py-3.5">Số dư sau</th>
                <th className="px-6 py-3.5">Mã tham chiếu / Đơn hàng</th>
                <th className="px-6 py-3.5">Ghi chú & Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {txLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                    Đang tải lịch sử sổ cái...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    Chưa có giao dịch biến động quỹ nào.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive = Number(tx.amount) > 0
                  return (
                    <tr key={tx.id} className={cn('hover:bg-slate-800/20 transition')}>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTxTypeBadge(tx.transactionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">
                        <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                          {isPositive ? '+' : ''}
                          {formatVND(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {formatVND(tx.balanceBefore)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                        {formatVND(tx.balanceAfter)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className="font-mono">{tx.referenceCode || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate" title={tx.note}>
                        {tx.note || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/40 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg px-3 py-1.5 border border-slate-700 disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-3 py-1.5 border border-slate-700 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL NẠP TIỀN QUỸ KÝ QUỸ */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <HiOutlineCash className="h-6 w-6 text-amber-500" />
                  {isPendingActivation ? 'Nạp Tiền Kích Hoạt Gian Hàng' : 'Nạp Thêm / Nạp Bù Quỹ Ký Quỹ'}
                </h2>
                <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Thanh toán trực tuyến an toàn qua cổng VNPay (QR Pay, Thẻ ATM & Thẻ Quốc tế).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Số tiền muốn nạp (VNĐ)</label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  required
                  placeholder="Ví dụ: 5000000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
                {/* Gợi ý chọn nhanh */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {(isPendingActivation && remainingToActivate > 0
                    ? [remainingToActivate, ...quickTopUpSuggestions.filter((a) => a !== remainingToActivate)]
                    : quickTopUpSuggestions
                  ).map((amt, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setTopUpAmount(String(amt))}
                      className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/20"
                    >
                      +{formatVND(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ghi chú giao dịch</label>
                <input
                  type="text"
                  placeholder={isPendingActivation ? 'Nạp ký quỹ kích hoạt gian hàng' : 'Nạp bù duy trì cấp sao uy tín'}
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-stone-300 bg-stone-50 text-stone-800'
                  )}
                />
              </div>

              {/* Phương thức thanh toán VNPay */}
              <div className={cn(
                'rounded-xl border p-3.5',
                isDark ? 'border-blue-900/40 bg-blue-950/20' : 'border-blue-100 bg-blue-50/50'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs tracking-wider">
                      VNPAY
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-slate-100">
                        Cổng thanh toán VNPay
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">
                        Ứng dụng ngân hàng VNPAY-QR, Thẻ ATM/Tài khoản, Thẻ quốc tế
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Trực tuyến
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-400">
                <span className="font-bold">Lưu ý:</span> Bạn sẽ được chuyển hướng sang cổng thanh toán VNPay để hoàn tất giao dịch. Sau khi thanh toán thành công, hệ thống tự động ghi nhận số dư và cập nhật Cấp sao uy tín cho gian hàng của bạn.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={topUpSubmitting}
                  onClick={() => setShowTopUpModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={topUpSubmitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center gap-2 transition"
                >
                  <HiOutlineCreditCard className="h-4 w-4" />
                  {topUpSubmitting ? 'Đang tạo giao dịch...' : 'Thanh toán qua VNPay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUY TRÌNH ĐÓNG SHOP VÀ HOÀN TRẢ QUỸ */}
      {showCloseShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95',
              isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <h2 className="text-xl font-bold text-rose-500 flex items-center gap-2">
              <HiOutlineLockClosed className="h-6 w-6" />
              Đóng Gian Hàng & Hoàn Quỹ
            </h2>
            <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Tiền Quỹ ký quỹ (<span className="font-bold text-amber-500">{formatVND(fund?.balance)}</span>) chỉ được hoàn trả về tài khoản ngân hàng của bạn khi:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Gian hàng không còn đơn hàng nào đang trong quá trình vận chuyển hoặc xử lý.</li>
                <li>Đã giải quyết 100% các khiếu nại, khiếu kiện bồi thường của người mua.</li>
                <li>Hết thời hạn khiếu nại bảo hành đối với các đơn hàng gần nhất.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={closeShopSubmitting}
                onClick={() => setShowCloseShopModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={closeShopSubmitting}
                onClick={handleRequestRefundCloseShop}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {closeShopSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hoàn quỹ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
