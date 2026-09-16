import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineUser, HiOutlineDocumentText } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function OrderAddressSection({ order, isDark }) {
  const fullAddress = [
    order.shippingAddress,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingCity,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="border-b border-stone-200 dark:border-slate-800 p-6 space-y-4">
      <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
        Thông Tin Giao Hàng & Khách Hàng
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipient & Address */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-3',
            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-200 bg-stone-50/70'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <HiOutlineUser className="h-4 w-4" />
            </span>
            <div>
              <p className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Người nhận hàng
              </p>
              <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                {order.shippingName || order.userName || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <HiOutlinePhone className="h-4 w-4" />
            </span>
            <div>
              <p className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Số điện thoại
              </p>
              <a
                href={`tel:${order.shippingPhone}`}
                className={cn('text-sm font-mono font-bold hover:underline', isDark ? 'text-blue-400' : 'text-blue-600')}
              >
                {order.shippingPhone || 'Chưa có SĐT'}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 border-t border-dashed border-stone-200 dark:border-slate-700">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
              <HiOutlineLocationMarker className="h-4 w-4" />
            </span>
            <div>
              <p className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Địa chỉ giao hàng (GHN Express)
              </p>
              <p className={cn('text-xs sm:text-sm leading-relaxed mt-0.5', isDark ? 'text-slate-200' : 'text-stone-800')}>
                {fullAddress || 'Chưa cập nhật địa chỉ đầy đủ'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Notes */}
        <div
          className={cn(
            'p-4 rounded-2xl border space-y-2 flex flex-col justify-between',
            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-200 bg-stone-50/70'
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <HiOutlineDocumentText className="h-4 w-4" />
              </span>
              <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Ghi chú của người mua
              </p>
            </div>
            <p
              className={cn(
                'text-xs sm:text-sm italic leading-relaxed p-3 rounded-xl border',
                order.notes
                  ? isDark
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                  : isDark
                  ? 'border-slate-700 bg-slate-800/50 text-slate-500'
                  : 'border-stone-200 bg-stone-100 text-stone-400'
              )}
            >
              {order.notes ? `"${order.notes}"` : 'Người mua không để lại ghi chú nào.'}
            </p>
          </div>

          <div className="pt-2 text-[11px] text-stone-400">
            Tài khoản mua hàng: <span className="font-semibold text-stone-600 dark:text-slate-300">{order.userName || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
