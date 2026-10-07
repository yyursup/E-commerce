import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineClipboardCopy,
  HiOutlinePhotograph,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import {
  getOrderStatusBadge,
  getOrderStatusLabel,
} from '../../../../lib/orderStatus'

export default function AdminEscrowOrderSection({
  order,
  isDark,
  formatVND,
  copyToClipboard,
}) {
  if (!order) return null

  const orderBadge = getOrderStatusBadge(order.status)
  const OrderIcon = orderBadge.icon

  // Thông tin người mua
  const buyerName = order?.shippingName || order?.userName || order?.user?.fullName || 'Người mua'
  const buyerPhone = order?.shippingPhone || order?.userPhone || order?.user?.phoneNumber || 'N/A'
  const buyerEmail = order?.userEmail || order?.user?.email || order?.user?.account?.email || 'N/A'
  const buyerAddress =
    [order?.shippingAddress, order?.shippingWard, order?.shippingDistrict, order?.shippingCity]
      .filter(Boolean)
      .join(', ') || 'N/A'

  // Thông tin Shop
  const shopName = order?.shopName || order?.shop?.shopName || 'Cửa hàng'
  const shopOwner = order?.shop?.user?.fullName || order?.shopOwner || 'Chủ gian hàng'
  const shopPhone = order?.shopPhone || order?.shop?.phone || order?.shop?.user?.phoneNumber || 'N/A'
  const shopAddress =
    order?.shopAddress || order?.shop?.warehouseAddress || order?.shop?.address || 'N/A'

  return (
    <div className="space-y-3">
      {/* 1. Thông tin đơn hàng gốc */}
      <div
        className={cn(
          'rounded-2xl border p-4 space-y-3',
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50/50',
        )}
      >
        <div className="flex items-center justify-between border-b pb-2.5 dark:border-slate-800 border-stone-200">
          <div className="flex items-center gap-2">
            <HiOutlineShoppingBag className="h-4 w-4 text-amber-500" />
            <h4 className="font-bold text-xs uppercase tracking-wider">Thông Tin Đơn Hàng Gốc</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold">#{order.orderNumber}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(order.orderNumber, 'Mã đơn')}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
            >
              <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Cửa hàng:
            </span>
            <span className="font-semibold text-stone-900 dark:text-white">{shopName}</span>
          </div>
          <div>
            <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Người mua:
            </span>
            <span className="font-semibold text-stone-900 dark:text-white">{buyerName}</span>
          </div>
          <div>
            <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Phương thức:
            </span>
            <span className="font-semibold text-stone-900 dark:text-white">
              {order.paymentMethod === 'VNPAY'
                ? 'VNPay'
                : order.paymentMethod === 'WALLET'
                  ? 'Ví sàn'
                  : 'COD'}
            </span>
            {(order.status === 'REFUNDED' || escrow.status === 'REFUNDED') && (
              <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                ↳ Hoàn về Ví
              </span>
            )}
          </div>
          <div>
            <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Trạng thái đơn:
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border mt-0.5',
                orderBadge.color,
              )}
            >
              <OrderIcon className="h-3 w-3" />
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Chi tiết các bên liên quan: Người mua & Gian hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Khách hàng */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border space-y-2',
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200',
          )}
        >
          <div className="flex items-center gap-1.5 font-bold text-blue-500 dark:text-blue-400 text-xs">
            <HiOutlineUser className="h-4 w-4 shrink-0" />
            Thông tin Khách hàng (Người mua)
          </div>
          <p className="font-semibold text-stone-900 dark:text-white text-xs">{buyerName}</p>
          <div className="space-y-1 text-stone-600 dark:text-slate-400 text-[11px]">
            <p className="flex items-center gap-1.5">
              <HiOutlinePhone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="font-mono">{buyerPhone}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <HiOutlineMail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{buyerEmail}</span>
            </p>
            <p className="flex items-start gap-1.5 pt-0.5">
              <HiOutlineLocationMarker className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-stone-800 dark:text-slate-200">{buyerAddress}</span>
            </p>
          </div>
        </div>

        {/* Gian hàng Shop */}
        <div
          className={cn(
            'p-3.5 rounded-2xl border space-y-2',
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200',
          )}
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-500 dark:text-emerald-400 text-xs">
            <HiOutlineShoppingBag className="h-4 w-4 shrink-0" />
            Thông tin Gian hàng (Shop)
          </div>
          <p className="font-semibold text-stone-900 dark:text-white text-xs">{shopName}</p>
          <div className="space-y-1 text-stone-600 dark:text-slate-400 text-[11px]">
            <p className="flex items-center gap-1.5">
              <HiOutlineUser className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>Chủ shop: <strong className="text-stone-800 dark:text-slate-200">{shopOwner}</strong></span>
            </p>
            <p className="flex items-center gap-1.5">
              <HiOutlinePhone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="font-mono">{shopPhone}</span>
            </p>
            <p className="flex items-start gap-1.5 pt-0.5">
              <HiOutlineLocationMarker className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-stone-800 dark:text-slate-200">{shopAddress}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Danh sách sản phẩm trong đơn */}
      {order.items?.length > 0 && (
        <div
          className={cn(
            'rounded-2xl border p-4 space-y-2.5',
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white',
          )}
        >
          <span className={cn('text-xs font-bold uppercase tracking-wider block', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Sản phẩm trong đơn ({order.items.length}):
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {order.items.map((item) => {
              const variantText = [item.variantColor, item.variantSize].filter(Boolean).join(' - ')
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs p-2 rounded-xl dark:bg-slate-800/50 bg-stone-50 border dark:border-slate-800 border-stone-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.productImageUrl || '/product-placeholder.svg'}
                      alt={item.productName}
                      className="h-9 w-9 rounded-lg object-cover shrink-0 bg-stone-100 dark:bg-slate-700"
                      onError={(e) => {
                        e.target.src = '/product-placeholder.svg'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-stone-900 dark:text-white">
                        {item.productName}
                      </p>
                      {variantText && (
                        <p className="text-[11px] text-stone-400">Phân loại: {variantText}</p>
                      )}
                      <p className="text-[10px] text-stone-400">Số lượng: x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-500 shrink-0 ml-2">
                    {formatVND(item.totalPrice)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
