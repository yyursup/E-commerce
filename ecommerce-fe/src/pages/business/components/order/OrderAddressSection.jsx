import { HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function OrderAddressSection({ order, isDark }) {
  return (
    <div className="border-b p-6">
      <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
        Địa chỉ giao hàng
      </h2>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <HiOutlineLocationMarker
            className={cn('mt-0.5 h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')}
          />
          <div>
            <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>
              {order.shippingName}
            </p>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {order.shippingAddress}
            </p>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {order.shippingWard}, {order.shippingDistrict}, {order.shippingCity}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HiOutlinePhone className={cn('h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            {order.shippingPhone}
          </p>
        </div>
      </div>
    </div>
  )
}
