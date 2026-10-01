import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineX,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink,
  HiOutlineCash,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineExclamationCircle,
  HiOutlinePhotograph,
  HiOutlineEye,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

const RETURN_STATUS_CONFIG = {
  WAITING_FOR_SHIPMENT: {
    label: 'Chờ người mua gửi hàng hoàn',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  },
  SHIPPED: {
    label: 'Đang giao cho vận chuyển',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  RETURNED: {
    label: 'Đã giao hàng hoàn trả',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  DISPUTED: {
    label: 'Shop khiếu nại đơn hoàn',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  COMPLETED: {
    label: 'Đã hoàn tiền',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  CANCELLED: {
    label: 'Đã hủy đơn hoàn',
    badge: 'bg-stone-500/10 text-stone-400 border-stone-500/30',
  },
}

const ORDER_STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  PENDING: {
    label: 'Chờ xử lý',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  PROCESSING: {
    label: 'Đang xử lý',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  SHIPPED: {
    label: 'Đã giao vận chuyển',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  DELIVERED: {
    label: 'Đã giao hàng thành công',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badge: 'bg-stone-500/10 text-stone-400 border-stone-500/30',
  },
  DISPUTED: {
    label: 'Đang tranh chấp',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  RETURNED: {
    label: 'Đã trả hàng',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
}

export default function AdminEscrowDetailModal({
  escrowDetailModal,
  setEscrowDetailModal,
  isDark,
  formatVND,
  copyToClipboard,
  setActionModal,
}) {
  const [previewImage, setPreviewImage] = useState(null)

  const { isOpen, loading, item, order, returnDetails } = escrowDetailModal
  if (!isOpen) return null

  const parseMedia = (urls) => {
    if (!urls) return []
    if (Array.isArray(urls)) return urls.filter(Boolean)
    return String(urls)
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith('http') || u.startsWith('/')))
  }

  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  const sellerEvidenceImgs = parseMedia(returnDetails?.sellerEvidenceUrls)
  const buyerEvidenceImgs = parseMedia(returnDetails?.buyerEvidenceUrls)

  const returnStatus = returnDetails?.status || item?.orderReturn?.status || item?.returnStatus
  const isReturnDisputed = returnStatus === 'DISPUTED'
  // Admin CHỈ ĐƯỢC QUYỀN can thiệp xử lý ký quỹ khi đơn có khiếu nại kiện hàng hoàn ở trạng thái DISPUTED
  const canAdminSettle = (item?.status === 'HELD' || item?.status === 'DISPUTED') && isReturnDisputed

  let settleBlockedReason = ''
  if (!canAdminSettle && (item?.status === 'HELD' || item?.status === 'DISPUTED')) {
    if (!returnStatus) {
      if (item?.status === 'DISPUTED') {
        settleBlockedReason = 'Đơn hàng đang trong quy trình Báo cáo / Kháng cáo. Vui lòng xử lý phán quyết tại tab Báo cáo hoặc Kháng cáo để hệ thống tự động xử lý tiền ký quỹ theo đúng quy trình.'
      } else {
        settleBlockedReason = 'Đơn hàng đang trong quy trình ký quỹ thông thường (tự động giải ngân sau 3 ngày giao hàng thành công). Admin chỉ can thiệp khi có tranh chấp kiện hoàn (DISPUTED).'
      }
    } else if (returnStatus === 'RETURNED') {
      settleBlockedReason = 'Kiện hàng hoàn đã giao tới Người bán (đang trong 72h kiểm hàng). Admin chỉ can thiệp khi Shop khiếu nại (DISPUTED).'
    } else if (returnStatus === 'WAITING_FOR_SHIPMENT' || returnStatus === 'SHIPPED') {
      settleBlockedReason = 'Kiện hàng hoàn đang xử lý vận chuyển. Admin chỉ can thiệp khi Shop khiếu nại (DISPUTED).'
    } else if (returnStatus === 'COMPLETED' || returnStatus === 'CANCELLED') {
      settleBlockedReason = 'Yêu cầu trả hàng đã kết thúc.'
    }
  }

  const totalAmount = Number(item?.amount || order?.total || 0)
  const commission = item?.platformCommission != null
    ? Number(item.platformCommission)
    : (order?.platformCommission != null ? Number(order.platformCommission) : totalAmount * 0.1)
  const netSeller = Math.max(0, totalAmount - commission)

  const commissionPct = totalAmount > 0 ? Math.round((commission / totalAmount) * 100) : 5
  const sellerRatePct = Math.max(0, 100 - commissionPct)

  const settlement = item?.settlement || returnDetails?.settlement || order?.returnInfo?.settlement
  const hasSettlement = settlement && settlement.settlementType

  // Khi đã settlement: dùng dữ liệu thực tế từ Transaction records
  // Khi chưa settlement: hiển thị projected (dự kiến)
  const effectiveCommission = hasSettlement
    ? Number(settlement.commissionAmount || 0)
    : commission
  const effectiveBuyerRefund = hasSettlement ? Number(settlement.buyerRefundAmount || 0) : 0
  const effectiveSellerRelease = hasSettlement ? Number(settlement.sellerReleaseAmount || 0) : netSeller
  const effectiveBuyerPct = hasSettlement ? (settlement.buyerPercentage || 0) : 0
  const effectiveSellerPct = hasSettlement ? (settlement.sellerPercentage || 0) : sellerRatePct

  // Thông tin người mua
  const buyerName = order?.shippingName || order?.userName || order?.user?.fullName || 'Người mua'
  const buyerPhone = order?.shippingPhone || order?.userPhone || order?.user?.phoneNumber || 'N/A'
  const buyerEmail = order?.userEmail || order?.user?.email || order?.user?.account?.email || 'N/A'
  const buyerAddress = [
    order?.shippingAddress,
    order?.shippingWard,
    order?.shippingDistrict,
    order?.shippingCity,
  ].filter(Boolean).join(', ') || order?.shippingAddress || 'N/A'

  // Thông tin gian hàng
  const shopName = order?.shopName || order?.shop?.name || 'Gian hàng đối tác'
  const shopOwner = order?.shopOwnerName || order?.shop?.user?.fullName || 'N/A'
  const shopPhone = order?.shopPhone || order?.shopOwnerPhone || order?.shop?.phoneNumber || order?.shop?.user?.phoneNumber || 'N/A'
  const shopAddress = order?.shopAddress || order?.shop?.address || order?.shop?.pickupAddress || 'N/A'

  const activeReturn = returnDetails || order?.returnInfo
  const effectiveOrderStatus = (activeReturn && activeReturn.status && activeReturn.status !== 'CANCELLED')
    ? (RETURN_STATUS_CONFIG[activeReturn.status] || {
      label: activeReturn.status,
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    })
    : (order?.status ? (ORDER_STATUS_CONFIG[order.status] || {
      label: order.status,
      badge: 'bg-stone-500/10 text-stone-400 border-stone-500/30',
    }) : null)

  const getConditionLabel = (condition) => {
    switch (condition) {
      case 'INTACT':
        return 'Nguyên vẹn (Đủ điều kiện hoàn tiền)'
      case 'DAMAGED':
        return 'Hàng bị hư hỏng / Bể vỡ'
      case 'MISSING_ITEMS':
        return 'Thiếu phụ kiện / Thiếu sản phẩm'
      case 'WRONG_ITEM':
        return 'Khách gửi sai sản phẩm / Tráo hàng'
      case 'USED_COUNTERFEIT':
        return 'Hàng đã qua sử dụng / Hàng giả nhái'
      default:
        return 'Chưa ghi nhận (Đang trong thời hạn kiểm hàng 72h)'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={cn(
            'w-full max-w-3xl rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] sm:max-h-[90vh] flex flex-col',
            isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 sm:pb-4 border-b dark:border-slate-800 border-stone-200 shrink-0 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Trạng thái Ký Quỹ Escrow */}
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    item?.status === 'RELEASED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : item?.status === 'REFUNDED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : item?.status === 'DISPUTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  )}
                >
                  {settlement?.settlementType === 'PARTIAL_SPLIT'
                    ? `Phân Xử Chia Tiền: Khách ${effectiveBuyerPct}% — Shop ${effectiveSellerPct}%`
                    : item?.status === 'RELEASED'
                      ? 'Đã Giải Ngân Cho Shop'
                      : item?.status === 'REFUNDED'
                        ? 'Đã Hoàn Tiền Cho Khách'
                        : item?.status === 'DISPUTED'
                          ? 'Đang Tranh Chấp (Disputed)'
                          : 'Đang Ký Quỹ Tạm Giữ (Held)'}
                </span>

                <span className="text-xs font-mono text-stone-400">
                  Mã Escrow: #{String(item?.escrowId || item?.id || '').substring(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item?.escrowId || item?.id)}
                  title="Sao chép toàn bộ ID"
                  className="text-stone-400 hover:text-amber-500 transition-colors p-1"
                >
                  <HiOutlineClipboardCopy className="h-4 w-4" />
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold mt-1.5 flex items-center gap-2 break-all sm:break-normal">
                Chi tiết Ký Quỹ & Đơn hàng #{order?.orderNumber || item?.orderNumber || item?.orderId}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">
                Khởi tạo lúc:{' '}
                {item?.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'N/A'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEscrowDetailModal({ isOpen: false, loading: false, item: null, order: null, returnDetails: null })}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-sm">
            {loading ? (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
                <p className="mt-2 text-xs text-stone-400">Đang tải thông tin chi tiết ký quỹ và đơn hàng...</p>
              </div>
            ) : (
              <>
                {/* 1. Dòng tiền ký quỹ */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <HiOutlineCash className="h-4 w-4" />
                    Dòng Tiền Ký Quỹ Escrow
                    {hasSettlement && (
                      <span className="ml-1 text-[10px] font-normal text-stone-400">(Đã phân xử)</span>
                    )}
                  </h3>
                  <div className={cn(
                    'grid grid-cols-1 gap-2 sm:gap-2.5',
                    hasSettlement && settlement.settlementType === 'PARTIAL_SPLIT'
                      ? 'sm:grid-cols-2'
                      : 'sm:grid-cols-3',
                  )}>
                    {/* Card 1: Tổng tiền ký quỹ (luôn hiển thị) */}
                    <div
                      className={cn(
                        'p-3 sm:p-3.5 rounded-2xl border',
                        isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-stone-50 border-stone-200',
                      )}
                    >
                      <p className="text-[11px] font-medium text-stone-400">Tổng tiền ký quỹ (100%)</p>
                      <p className="text-sm sm:text-base font-mono font-bold text-amber-500 mt-1 truncate">
                        {formatVND(totalAmount)}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Tiền đơn hàng được giữ tại Escrow</p>
                    </div>

                    {/* Card 2: Phí hoa hồng sàn (luôn hiển thị) */}
                    <div
                      className={cn(
                        'p-3 sm:p-3.5 rounded-2xl border',
                        isDark ? 'bg-indigo-500/10 border-indigo-500/25' : 'bg-indigo-50 border-indigo-200',
                      )}
                    >
                      <p className="text-[11px] font-medium text-indigo-400">
                        Phí hoa hồng sàn ({totalAmount > 0 ? Math.round((effectiveCommission / totalAmount) * 100) : 0}%)
                      </p>
                      <p className="text-sm sm:text-base font-mono font-bold text-indigo-500 dark:text-indigo-400 mt-1 truncate">
                        {formatVND(effectiveCommission)}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Thu về ví doanh thu sàn</p>
                    </div>

                    {/* Card 3: Thực nhận Seller */}
                    {(hasSettlement ? effectiveSellerRelease > 0 : true) && (
                      <div
                        className={cn(
                          'p-3 sm:p-3.5 rounded-2xl border',
                          isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
                        )}
                      >
                        <p className="text-[11px] font-medium text-emerald-400">
                          Thực nhận Người bán ({effectiveSellerPct}% sau hoa hồng)
                        </p>
                        <p className="text-sm sm:text-base font-mono font-bold text-emerald-500 dark:text-emerald-400 mt-1 truncate">
                          {formatVND(effectiveSellerRelease)}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {hasSettlement ? 'Đã cộng vào ví Shop' : 'Cộng vào ví Shop khi giải ngân'}
                        </p>
                      </div>
                    )}

                    {/* Card 4: Hoàn tiền Buyer (chỉ hiển thị khi thực sự có refund) */}
                    {hasSettlement && effectiveBuyerRefund > 0 && (
                      <div
                        className={cn(
                          'p-3 sm:p-3.5 rounded-2xl border',
                          isDark ? 'bg-blue-500/10 border-blue-500/25' : 'bg-blue-50 border-blue-200',
                        )}
                      >
                        <p className="text-[11px] font-medium text-blue-400">
                          Hoàn tiền Người mua ({effectiveBuyerPct}% sau hoa hồng)
                        </p>
                        <p className="text-sm sm:text-base font-mono font-bold text-blue-500 dark:text-blue-400 mt-1 truncate">
                          {formatVND(effectiveBuyerRefund)}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Đã cộng vào ví Người mua</p>
                      </div>
                    )}
                  </div>

                  {/* Settlement note */}
                  {hasSettlement && settlement.settlementNote && (
                    <div className={cn(
                      'p-2.5 rounded-xl border text-xs italic',
                      isDark ? 'bg-slate-800/30 border-slate-700/50 text-slate-400' : 'bg-stone-50 border-stone-200 text-stone-500',
                    )}>
                      &ldquo;{settlement.settlementNote}&rdquo;
                    </div>
                  )}
                </div>

                {/* 2. Thông tin đơn hàng & Các bên liên quan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Người mua */}
                  <div
                    className={cn(
                      'p-3 sm:p-3.5 rounded-2xl border space-y-1.5',
                      isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-stone-50 border-stone-200',
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400">
                      <HiOutlineUser className="h-4 w-4 shrink-0" />
                      Thông tin Người mua (Buyer)
                    </div>
                    <p className="font-semibold text-xs text-stone-900 dark:text-white break-words">
                      {buyerName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-words">
                      SĐT: <span className="text-stone-800 dark:text-slate-200 font-medium">{buyerPhone}</span>
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-all">
                      Email: <span className="text-stone-800 dark:text-slate-200 font-medium">{buyerEmail}</span>
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-words">
                      Địa chỉ nhận: <span className="text-stone-800 dark:text-slate-200 font-medium">{buyerAddress}</span>
                    </p>
                  </div>

                  {/* Gian hàng */}
                  <div
                    className={cn(
                      'p-3 sm:p-3.5 rounded-2xl border space-y-1.5',
                      isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-stone-50 border-stone-200',
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400">
                      <HiOutlineShoppingBag className="h-4 w-4 shrink-0" />
                      Thông tin Gian hàng (Shop)
                    </div>
                    <p className="font-semibold text-xs text-stone-900 dark:text-white break-words">
                      {shopName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-words">
                      Chủ shop: <span className="text-stone-800 dark:text-slate-200 font-medium">{shopOwner}</span>
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-words">
                      SĐT shop: <span className="text-stone-800 dark:text-slate-200 font-medium">{shopPhone}</span>
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 break-words">
                      Địa chỉ kho: <span className="text-stone-800 dark:text-slate-200 font-medium">{shopAddress}</span>
                    </p>
                  </div>
                </div>

                {/* 3. Sản phẩm trong đơn */}
                {order?.items && order.items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                      Sản Phẩm Trong Đơn ({order.items.length})
                    </h3>
                    <div className="divide-y divide-stone-100 dark:divide-slate-800 border rounded-2xl overflow-hidden dark:border-slate-800 border-stone-200">
                      {order.items.map((prod, idx) => {
                        const itemPrice = prod.totalPrice != null
                          ? Number(prod.totalPrice)
                          : (prod.unitPrice != null
                            ? Number(prod.unitPrice) * (prod.quantity || 1)
                            : (prod.price != null ? Number(prod.price) * (prod.quantity || 1) : 0))
                        const variantText = [prod.variantColor, prod.variantSize].filter(Boolean).join(' - ') || prod.variantName
                        const itemImage = prod.productImageUrl || prod.productThumbnail || prod.product?.thumbnailUrl

                        return (
                          <div key={prod.id || idx} className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={prod.productName || prod.product?.name || 'Sản phẩm'}
                                  className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-lg border dark:border-slate-700 shrink-0 bg-stone-100 dark:bg-slate-800"
                                  onError={(e) => {
                                    e.target.src = '/product-placeholder.svg'
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-stone-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <HiOutlinePhotograph className="h-5 w-5 text-stone-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate text-stone-900 dark:text-white">
                                  {prod.productName || prod.product?.name}
                                </p>
                                {variantText && (
                                  <p className="text-[11px] text-stone-400 truncate">Phân loại: {variantText}</p>
                                )}
                                <p className="text-[11px] text-stone-400">
                                  Số lượng: x{prod.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono font-semibold text-amber-500 whitespace-nowrap pl-2">
                              {formatVND(itemPrice)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Thông tin hoàn hàng & Khiếu nại từ Shop (nếu có) */}
                {returnDetails ? (
                  <div
                    className={cn(
                      'p-3.5 sm:p-4 rounded-2xl border space-y-3',
                      returnDetails.status === 'DISPUTED'
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : isDark
                          ? 'border-slate-800 bg-slate-800/30'
                          : 'border-stone-200 bg-stone-50',
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HiOutlineExclamationCircle
                          className={cn(
                            'h-5 w-5 shrink-0',
                            returnDetails.status === 'DISPUTED' ? 'text-rose-500' : 'text-amber-500',
                          )}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Thông Tin Kiện Trả Hàng & Tranh Chấp
                        </span>
                      </div>
                      <span
                        className={cn(
                          'self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          RETURN_STATUS_CONFIG[returnDetails.status]?.badge || 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                        )}
                      >
                        {RETURN_STATUS_CONFIG[returnDetails.status]?.label || returnDetails.status}
                      </span>
                    </div>

                    {/* Vận đơn hoàn */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-stone-400">Đơn vị vận chuyển: </span>
                        <span className="font-semibold">{returnDetails.carrierName || 'Giao Hàng Nhanh (GHN)'}</span>
                      </div>
                    </div>

                    {/* Tình trạng nghiệm thu của Shop */}
                    <div
                      className={cn(
                        'p-3 rounded-xl border space-y-1.5',
                        isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-stone-200',
                      )}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">
                          Đánh giá kiện hàng khi mở hộp từ Shop:
                        </p>
                        {returnDetails.sellerInspectionDeadline && (
                          <span className="text-[11px] text-amber-500 dark:text-amber-400 font-mono">
                            Hạn kiểm hàng: {new Date(returnDetails.sellerInspectionDeadline).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-lg text-xs font-bold border',
                            returnDetails.conditionStatus === 'INTACT'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ['DAMAGED', 'WRONG_ITEM', 'MISSING_ITEMS', 'USED_COUNTERFEIT'].includes(returnDetails.conditionStatus)
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-stone-500/10 text-stone-400 border-stone-500/30',
                          )}
                        >
                          {getConditionLabel(returnDetails.conditionStatus)}
                        </span>
                        {returnDetails.status === 'RETURNED' && !returnDetails.conditionStatus && (
                          <span className="text-[11px] text-stone-400 italic">
                            (Shop có 72 giờ kiểm tra sản phẩm trước khi hệ thống tự động hoàn tiền)
                          </span>
                        )}
                      </div>
                      {returnDetails.conditionNote && (
                        <p className="text-xs text-stone-300 mt-1 italic">
                          &ldquo;{returnDetails.conditionNote}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Ảnh & Video bằng chứng mở hộp từ Shop (Tối đa 4 tệp, grid-cols-2 sm:grid-cols-4) */}
                    {sellerEvidenceImgs.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-rose-400 flex items-center justify-between">
                          <span>Hình ảnh & Video mở hộp kiện hoàn từ Shop ({sellerEvidenceImgs.length}/4 tệp):</span>
                          <span className="text-[11px] font-normal text-stone-400">Nhấp để phóng to / xem video</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {sellerEvidenceImgs.map((mediaUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(mediaUrl)}
                              className="group relative h-24 sm:h-28 overflow-hidden rounded-xl border border-rose-500/30 bg-black/20 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                            >
                              {isVideoUrl(mediaUrl) ? (
                                <video
                                  src={mediaUrl}
                                  className="h-full w-full object-cover rounded-xl"
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`Bằng chứng shop ${idx + 1}`}
                                  className="h-full w-full object-cover rounded-xl"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                {isVideoUrl(mediaUrl) ? (
                                  <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-rose-600/90 shadow">
                                    Xem Video
                                  </span>
                                ) : (
                                  <HiOutlineEye className="h-6 w-6 drop-shadow" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ảnh bằng chứng từ Khách khi gửi hoàn (nếu có) */}
                    {buyerEvidenceImgs.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-blue-400 flex items-center justify-between">
                          <span>Hình ảnh đóng gói gửi hàng từ Người mua ({buyerEvidenceImgs.length} ảnh):</span>
                          <span className="text-[11px] font-normal text-stone-400">Nhấp vào để phóng to</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {buyerEvidenceImgs.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(imgUrl)}
                              className="group relative h-24 sm:h-28 overflow-hidden rounded-xl border border-blue-500/30 bg-black/20 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                            >
                              <img
                                src={imgUrl}
                                alt={`Bằng chứng buyer ${idx + 1}`}
                                className="h-full w-full object-cover rounded-xl"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <HiOutlineEye className="h-6 w-6 drop-shadow" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border text-center text-xs text-stone-400',
                      isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-stone-50 border-stone-200',
                    )}
                  >
                    Đơn hàng không phát sinh yêu cầu trả hàng kiện hoàn.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cảnh báo khi Admin chưa có thẩm quyền can thiệp ký quỹ thủ công */}
          {!canAdminSettle && (item?.status === 'HELD' || item?.status === 'DISPUTED') && (
            <div className={cn(
              'p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs shrink-0',
              item?.status === 'DISPUTED' && !returnStatus
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                : returnStatus === 'RETURNED'
                  ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                  : 'border-slate-500/40 bg-slate-500/10 text-slate-400 dark:text-slate-300'
            )}>
              <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {item?.status === 'DISPUTED' && !returnStatus
                    ? 'Đơn hàng đang trong quy trình Báo cáo / Kháng cáo vi phạm!'
                    : returnStatus === 'RETURNED'
                      ? 'Kiện hàng hoàn đã giao tới tay Người bán (đang trong thời hạn kiểm hàng 72 giờ)!'
                      : (returnStatus === 'WAITING_FOR_SHIPMENT' || returnStatus === 'SHIPPED')
                        ? 'Kiện hàng hoàn đang trên đường vận chuyển tới Người bán!'
                        : 'Đơn hàng đang trong quy trình ký quỹ thông thường!'}
                </p>
              </div>
            </div>
          )}

          {/* Action Footer (Responsive tối ưu cho Mobile & Desktop) */}
          <div className="pt-3 border-t dark:border-slate-800 border-stone-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setEscrowDetailModal({ isOpen: false, loading: false, item: null, order: null, returnDetails: null })}
              className={cn(
                'w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all border text-center justify-center',
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-stone-300 text-stone-600 hover:bg-stone-100',
              )}
            >
              Đóng
            </button>

            {(item?.status === 'HELD' || item?.status === 'DISPUTED') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {/* Nút Phân Chia Hoàn Tiền (%) */}
                <button
                  type="button"
                  disabled={!canAdminSettle}
                  onClick={() => {
                    if (!canAdminSettle) return
                    setEscrowDetailModal((prev) => ({ ...prev, isOpen: false }))
                    setActionModal({
                      isOpen: true,
                      type: 'ESCROW_SPLIT',
                      item,
                      buyerPercentage: 50,
                      note: '',
                    })
                  }}
                  title={!canAdminSettle ? settleBlockedReason : 'Phân chia hoàn tiền theo tỷ lệ %'}
                  className={cn(
                    'w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md text-center justify-center',
                    !canAdminSettle
                      ? 'bg-slate-500/50 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20',
                  )}
                >
                  Phân chia hoàn tiền (%)
                </button>

                {/* Nút Giải Ngân Cho Shop */}
                <button
                  type="button"
                  disabled={!canAdminSettle}
                  onClick={() => {
                    if (!canAdminSettle) return
                    setEscrowDetailModal((prev) => ({ ...prev, isOpen: false }))
                    setActionModal({ isOpen: true, type: 'ESCROW_RELEASE', item, note: '' })
                  }}
                  title={!canAdminSettle ? settleBlockedReason : 'Giải ngân 100% cho Shop'}
                  className={cn(
                    'w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md text-center justify-center',
                    !canAdminSettle
                      ? 'bg-slate-500/50 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20',
                  )}
                >
                  Giải ngân cho Shop
                </button>

                {/* Nút Hoàn Tiền Cho Người Mua */}
                <button
                  type="button"
                  disabled={!canAdminSettle}
                  onClick={() => {
                    if (!canAdminSettle) return
                    setEscrowDetailModal((prev) => ({ ...prev, isOpen: false }))
                    setActionModal({ isOpen: true, type: 'ESCROW_REFUND', item, note: '' })
                  }}
                  title={!canAdminSettle ? settleBlockedReason : 'Hoàn tiền 100% cho Khách'}
                  className={cn(
                    'w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md text-center justify-center',
                    !canAdminSettle
                      ? 'bg-slate-500/50 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/20',
                  )}
                >
                  Hoàn tiền cho Người mua
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal Phóng To Ảnh / Video */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              {isVideoUrl(previewImage) ? (
                <video
                  src={previewImage}
                  controls
                  autoPlay
                  className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Phóng to bằng chứng"
                  className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title="Mở tab mới"
                >
                  <HiOutlineExternalLink className="h-5 w-5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}
