import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineShoppingBag,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'

// ==========================================
// 1. ORDER STATUS (Trạng thái Đơn hàng)
// ==========================================
export const ORDER_STATUS_LABEL_MAP = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao hàng',
  SHIPPED: 'Đã giao hàng',
  DELIVERED: 'Đã giao thành công',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

export const ORDER_STATUS_BADGE_MAP = {
  PENDING_PAYMENT: {
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
    icon: HiOutlineClock,
  },
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700',
    icon: HiOutlineClock,
  },
  CONFIRMED: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
    icon: HiOutlineCheckCircle,
  },
  PROCESSING: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
    icon: HiOutlineShoppingBag,
  },
  SHIPPING: {
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700',
    icon: HiOutlineTruck,
  },
  SHIPPED: {
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700',
    icon: HiOutlineTruck,
  },
  DELIVERED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    icon: HiOutlineCheckCircle,
  },
  COMPLETED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    icon: HiOutlineCheckCircle,
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
    icon: HiOutlineXCircle,
  },
  REFUNDED: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700',
    icon: HiOutlineXCircle,
  },
}

export const ORDER_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING_PAYMENT', label: ORDER_STATUS_LABEL_MAP.PENDING_PAYMENT },
  { value: 'PENDING', label: ORDER_STATUS_LABEL_MAP.PENDING },
  { value: 'CONFIRMED', label: ORDER_STATUS_LABEL_MAP.CONFIRMED },
  { value: 'PROCESSING', label: ORDER_STATUS_LABEL_MAP.PROCESSING },
  { value: 'SHIPPING', label: ORDER_STATUS_LABEL_MAP.SHIPPING },
  { value: 'SHIPPED', label: ORDER_STATUS_LABEL_MAP.SHIPPED },
  { value: 'DELIVERED', label: ORDER_STATUS_LABEL_MAP.DELIVERED },
  { value: 'COMPLETED', label: ORDER_STATUS_LABEL_MAP.COMPLETED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABEL_MAP.CANCELLED },
  { value: 'REFUNDED', label: ORDER_STATUS_LABEL_MAP.REFUNDED },
]

export const ADMIN_ORDER_STATUSES = ORDER_STATUSES.filter((status) => status.value !== 'PENDING_PAYMENT')

export const getOrderStatusBadge = (target) => {
  if (target && typeof target === 'object') {
    return getOrderEffectiveStatus(target)
  }
  return (
    ORDER_STATUS_BADGE_MAP[target] || {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
      icon: HiOutlineClock,
    }
  )
}

export const getOrderStatusLabel = (target) => {
  if (target && typeof target === 'object') {
    return getOrderEffectiveStatus(target).label
  }
  return ORDER_STATUS_LABEL_MAP[target] || target
}

// ==========================================
// 2. RETURN STATUS (Trạng thái Đổi trả / Hoàn tiền)
// ==========================================
export const RETURN_STATUS_LABEL_MAP = {
  WAITING_FOR_SHIPMENT: 'Chờ khách gửi hàng',
  SHIPPED: 'Đang giao hàng hoàn',
  RETURNED: 'Đã giao hàng hoàn (Shop kiểm 72h)',
  DISPUTED: 'Shop khiếu nại đơn hoàn',
  COMPLETED: 'Đã hoàn tất đổi trả & Hoàn tiền',
  CANCELLED: 'Đã hủy đổi trả',
}

export const RETURN_STATUS_BADGE_MAP = {
  WAITING_FOR_SHIPMENT: {
    label: 'Chờ khách gửi hàng',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
    icon: HiOutlineClock,
  },
  SHIPPED: {
    label: 'Đang giao hàng hoàn',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
    icon: HiOutlineTruck,
  },
  RETURNED: {
    label: 'Đã giao hàng hoàn',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
    icon: HiOutlineCheckCircle,
  },
  DISPUTED: {
    label: 'Shop khiếu nại đơn hoàn',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-300 dark:border-rose-700',
    icon: HiOutlineExclamationCircle,
  },
  COMPLETED: {
    label: 'Đã hoàn tất đổi trả',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
    icon: HiOutlineCheckCircle,
  },
  CANCELLED: {
    label: 'Đã hủy đổi trả',
    color: 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-300 dark:border-slate-700',
    icon: HiOutlineXCircle,
  },
}

export const getReturnStatusBadge = (returnStatus) =>
  RETURN_STATUS_BADGE_MAP[returnStatus] || {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
    icon: HiOutlineClock,
  }

export const getReturnStatusLabel = (returnStatus) => RETURN_STATUS_LABEL_MAP[returnStatus] || returnStatus

export const getReturnStatusDisplay = (returnStatus) => {
  if (!returnStatus) return null
  return RETURN_STATUS_BADGE_MAP[returnStatus] || null
}

// ==========================================
// 3. EFFECTIVE STATUS (Tổng hợp trạng thái hiển thị an toàn)
// ==========================================
export const getOrderEffectiveStatus = (order, returnInfo = null) => {
  const activeReturn = returnInfo || order?.returnInfo
  if (activeReturn && activeReturn.status && activeReturn.status !== 'CANCELLED') {
    const returnDisplay = getReturnStatusDisplay(activeReturn.status)
    if (returnDisplay) {
      return {
        label: returnDisplay.label,
        color: returnDisplay.color,
        icon: returnDisplay.icon,
        isReturn: true,
      }
    }
  }

  const orderBadge = ORDER_STATUS_BADGE_MAP[order?.status] || {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
    icon: HiOutlineClock,
  }
  return {
    label: ORDER_STATUS_LABEL_MAP[order?.status] || order?.status || 'Không xác định',
    color: orderBadge.color,
    icon: orderBadge.icon,
    isReturn: false,
  }
}

// ==========================================
// 4. FORMATTERS
// ==========================================
export const formatOrderCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount) || 0)

export const formatOrderDate = (dateString) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
