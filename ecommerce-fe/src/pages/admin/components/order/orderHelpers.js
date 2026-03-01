import {
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
} from 'react-icons/hi'

export const ADMIN_ORDER_STATUSES = [
  { value: '', label: 'Tat ca' },
  { value: 'PENDING', label: 'Cho xu ly' },
  { value: 'CONFIRMED', label: 'Da xac nhan' },
  { value: 'PROCESSING', label: 'Dang xu ly' },
  { value: 'SHIPPING', label: 'Dang giao hang' },
  { value: 'SHIPPED', label: 'Da giao hang' },
  { value: 'DELIVERED', label: 'Da nhan hang' },
  { value: 'COMPLETED', label: 'Hoan thanh' },
  { value: 'CANCELLED', label: 'Da huy' },
  { value: 'REFUNDED', label: 'Da hoan tien' },
]

export const getAdminOrderStatusBadge = (status) => {
  const statusMap = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: HiOutlineClock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: HiOutlineCheckCircle },
    PROCESSING: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: HiOutlineShoppingBag },
    SHIPPING: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: HiOutlineTruck },
    SHIPPED: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: HiOutlineTruck },
    DELIVERED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineCheckCircle },
    COMPLETED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineCheckCircle },
    CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: HiOutlineXCircle },
    REFUNDED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: HiOutlineXCircle },
  }

  return statusMap[status] || {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    icon: HiOutlineClock,
  }
}

export const getAdminOrderStatusLabel = (status) => {
  const statusMap = {
    PENDING: 'Cho xu ly',
    CONFIRMED: 'Da xac nhan',
    PROCESSING: 'Dang xu ly',
    SHIPPING: 'Dang giao hang',
    SHIPPED: 'Da giao hang',
    DELIVERED: 'Da nhan hang',
    COMPLETED: 'Hoan thanh',
    CANCELLED: 'Da huy',
    REFUNDED: 'Da hoan tien',
    PENDING_PAYMENT: 'Cho thanh toan',
  }

  return statusMap[status] || status
}

export const formatAdminOrderCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export const formatAdminOrderDate = (dateString) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
