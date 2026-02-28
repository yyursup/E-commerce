import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import OrderStatusBadge from './components/order/OrderStatusBadge'
import SellerOrderActions from './components/order/SellerOrderActions'
import OrderAddressSection from './components/order/OrderAddressSection'
import OrderItemsSection from './components/order/OrderItemsSection'
import OrderSummarySection from './components/order/OrderSummarySection'
import { formatDate } from './components/order/orderHelpers'

export default function ShopOrderDetail() {
  const { orderId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [ghnOrderCodeInput, setGhnOrderCodeInput] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !orderId) return
    fetchOrder()
  }, [isAuthenticated, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await orderService.getShopOrderById(orderId)
      setOrder(orderData)
      setGhnOrderCodeInput(orderData?.ghnOrderCode || '')
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin đơn hàng')
      toast.error('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const runSellerAction = async (action, successMessage) => {
    try {
      setActionLoading(true)
      await action()
      toast.success(successMessage)
      await fetchOrder()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    await runSellerAction(
      () => orderService.updateOrderStatus(order.id, status),
      'Đã cập nhật trạng thái đơn hàng'
    )
  }

  const handleRetryCreateGhn = async () => {
    await runSellerAction(
      () => orderService.retryCreateGhnOrder(order.id),
      'Đã thử tạo đơn GHN lại'
    )
  }

  const handleSetManualGhnCode = async () => {
    const code = ghnOrderCodeInput.trim()
    if (!code) {
      toast.error('Vui lòng nhập mã GHN')
      return
    }
    await runSellerAction(
      () => orderService.setGhnOrderCode(order.id, code),
      'Đã lưu mã GHN'
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Vui lòng đăng nhập để xem đơn hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={cn('min-h-screen px-4 py-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="mx-auto max-w-4xl">
          <Link
            to="/business/orders"
            className={cn(
              'mb-4 inline-flex items-center gap-2 text-sm font-medium',
              isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Quay lại danh sách đơn hàng
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
              {error || 'Không tìm thấy đơn hàng'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-4xl">
        <Link
          to="/business/orders"
          className={cn(
            'mb-6 inline-flex items-center gap-2 text-sm font-medium',
            isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Quay lại danh sách đơn hàng
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl border', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
        >
          <div className="border-b p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Đơn hàng {order.orderNumber}
                </h1>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Đặt ngày {formatDate(order.createdAt)}
                </p>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Khách hàng: {order.userName || '-'}
                </p>
              </div>
              <OrderStatusBadge status={order.status} className="px-3 py-1.5 text-sm" />
            </div>
          </div>

          <SellerOrderActions
            order={order}
            isDark={isDark}
            actionLoading={actionLoading}
            ghnOrderCodeInput={ghnOrderCodeInput}
            onGhnOrderCodeChange={setGhnOrderCodeInput}
            onUpdateStatus={handleUpdateStatus}
            onRetryCreateGhn={handleRetryCreateGhn}
            onSetManualGhnCode={handleSetManualGhnCode}
          />

          <OrderAddressSection order={order} isDark={isDark} />
          <OrderItemsSection items={order.items} isDark={isDark} />
          <OrderSummarySection order={order} isDark={isDark} />
        </motion.div>
      </div>
    </div>
  )
}
