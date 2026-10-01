import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineShoppingBag,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'

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
  DISPUTED: 'Đang tranh chấp',
  RETURNED: 'Đã trả hàng',
}

export const ORDER_STATUS_BADGE_MAP = {
  PENDING_PAYMENT: {
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: HiOutlineClock,
  },
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: HiOutlineClock,
  },
  CONFIRMED: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: HiOutlineCheckCircle,
  },
  PROCESSING: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: HiOutlineShoppingBag,
  },
  SHIPPING: {
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: HiOutlineTruck,
  },
  SHIPPED: {
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: HiOutlineTruck,
  },
  DELIVERED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: HiOutlineCheckCircle,
  },
  COMPLETED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: HiOutlineCheckCircle,
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: HiOutlineXCircle,
  },
  REFUNDED: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    icon: HiOutlineXCircle,
  },
  DISPUTED: {
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    icon: HiOutlineExclamationCircle,
  },
  RETURNED: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: HiOutlineCheckCircle,
  },
}

export const RETURN_STATUS_LABEL_MAP = {
  WAITING_FOR_SHIPMENT: 'Chờ người mua gửi hàng',
  SHIPPED: 'Đang giao hàng hoàn',
  RETURNED: 'Đã giao hàng hoàn',
  DISPUTED: 'Tranh chấp hàng hoàn',
  COMPLETED: 'Đã hoàn tất đổi trả',
  CANCELLED: 'Đã hủy đổi trả',
}

export const RETURN_STATUS_BADGE_MAP = {
  WAITING_FOR_SHIPMENT: {
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: HiOutlineClock,
  },
  SHIPPED: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: HiOutlineTruck,
  },
  DELIVERED: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: HiOutlineCheckCircle,
  },
  RETURNED: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    icon: HiOutlineCheckCircle,
  },
  DISPUTED: {
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    icon: HiOutlineExclamationCircle,
  },
  COMPLETED: {
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    icon: HiOutlineCheckCircle,
  },
  CANCELLED: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
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
  { value: 'DISPUTED', label: ORDER_STATUS_LABEL_MAP.DISPUTED },
  { value: 'RETURNED', label: ORDER_STATUS_LABEL_MAP.RETURNED },
]

export const ADMIN_ORDER_STATUSES = ORDER_STATUSES.filter((status) => status.value !== 'PENDING_PAYMENT')

export const getOrderStatusBadge = (target) => {
  if (target && typeof target === 'object') {
    const activeReturn = target.returnInfo
    if (activeReturn && activeReturn.status && activeReturn.status !== 'CANCELLED') {
      return RETURN_STATUS_BADGE_MAP[activeReturn.status] || {
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        icon: HiOutlineClock,
      }
    }
    const status = target.status
    return ORDER_STATUS_BADGE_MAP[status] || {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      icon: HiOutlineClock,
    }
  }

  const status = target
  return (
    RETURN_STATUS_BADGE_MAP[status] ||
    ORDER_STATUS_BADGE_MAP[status] || {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      icon: HiOutlineClock,
    }
  )
}

export const getOrderStatusLabel = (target) => {
  if (target && typeof target === 'object') {
    const activeReturn = target.returnInfo
    if (activeReturn && activeReturn.status && activeReturn.status !== 'CANCELLED') {
      return RETURN_STATUS_LABEL_MAP[activeReturn.status] || activeReturn.status
    }
    return ORDER_STATUS_LABEL_MAP[target.status] || target.status
  }
  return RETURN_STATUS_LABEL_MAP[target] || ORDER_STATUS_LABEL_MAP[target] || target
}

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
