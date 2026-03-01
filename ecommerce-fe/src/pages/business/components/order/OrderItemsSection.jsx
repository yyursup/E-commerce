import { Link } from 'react-router-dom'
import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'

export default function OrderItemsSection({ items, isDark }) {
  return (
    <div className="border-b p-6">
      <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
        Sản phẩm
      </h2>
      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.id} className="flex gap-4">
            <img
              src={item.productImageUrl || '/product-placeholder.svg'}
              alt={item.productName}
              className="h-20 w-20 rounded-lg object-cover bg-stone-100 dark:bg-slate-800"
              onError={(e) => {
                e.target.src = '/product-placeholder.svg'
              }}
            />
            <div className="flex-1">
              <Link
                to={`/products/${item.productId}`}
                className={cn('font-medium hover:underline', isDark ? 'text-white' : 'text-stone-900')}
              >
                {item.productName}
              </Link>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Số lượng: {item.quantity}
              </p>
              <p className={cn('mt-1 text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                {formatCurrency(item.totalPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
