import { Link } from 'react-router-dom'
import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'

export default function OrderItemsSection({ items, isDark }) {
  return (
    <div className="border-b border-stone-200 dark:border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
          Danh Sách Sản Phẩm Trong Đơn ({items?.length || 0})
        </h3>
        <span className="text-xs text-stone-400">
          Tổng số lượng: {items?.reduce((a, b) => a + (b.quantity || 1), 0)} món
        </span>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-slate-800 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {items?.map((item, idx) => (
          <div
            key={item.id || idx}
            className={cn(
              'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors',
              isDark ? 'bg-slate-900/60 hover:bg-slate-800/50' : 'bg-white hover:bg-stone-50'
            )}
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <img
                src={item.productImageUrl || '/product-placeholder.svg'}
                alt={item.productName}
                className="h-16 w-16 rounded-xl object-cover border border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-800 shrink-0"
                onError={(e) => {
                  e.target.src = '/product-placeholder.svg'
                }}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  to={`/products`}
                  className={cn(
                    'text-sm font-bold hover:underline block truncate',
                    isDark ? 'text-white' : 'text-stone-900'
                  )}
                  title={item.productName}
                >
                  {item.productName}
                </Link>

                {item.sku && (
                  <p className="font-mono text-xs text-stone-400">
                    SKU: {item.sku}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <span>Đơn giá: {formatCurrency(item.price || 0)}</span>
                  <span>•</span>
                  <span>Số lượng: <strong className="text-stone-900 dark:text-white font-bold">{item.quantity}</strong></span>
                </div>
              </div>
            </div>

            <div className="text-right sm:pl-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-stone-200 dark:border-slate-800">
              <span className="text-xs text-stone-400 block sm:hidden">Thành tiền</span>
              <p className={cn('text-sm sm:text-base font-black', isDark ? 'text-amber-400' : 'text-amber-600')}>
                {formatCurrency(item.totalPrice || (item.price * item.quantity))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
