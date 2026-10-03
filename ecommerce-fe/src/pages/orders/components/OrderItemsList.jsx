import { Link } from 'react-router-dom'
import { HiOutlineStar } from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import { getConditionBadge, getWarrantyBadge } from '../../../lib/techBadges'

export default function OrderItemsList({
  items = [],
  orderStatus,
  isDark,
  formatCurrency,
  onOpenReview,
}) {
  if (!items || items.length === 0) return null

  return (
    <div className="border-b p-6">
      <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
        Sản phẩm ({items.length})
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <img
              src={item.productImageUrl || '/product-placeholder.svg'}
              alt={item.productName || 'Sản phẩm'}
              className="h-20 w-20 rounded-lg object-cover bg-stone-100 dark:bg-slate-800"
              onError={(e) => {
                e.target.src = '/product-placeholder.svg'
              }}
            />
            <div className="flex-1 min-w-0">
              <Link
                to={`/products/${item.productId}`}
                className={cn('font-medium hover:underline line-clamp-2', isDark ? 'text-white' : 'text-stone-900')}
              >
                {item.productName}
              </Link>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {item.conditionGrade && (
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", getConditionBadge(item.conditionGrade)?.cls)}>
                    {getConditionBadge(item.conditionGrade)?.label}
                  </span>
                )}
                {item.warrantyType && (
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.cls)}>
                    {getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.label}
                  </span>
                )}
                {(item.variantColor || item.variantSize) && (
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Phân loại: {[item.variantColor, item.variantSize].filter(Boolean).join(' - ')}
                  </span>
                )}
              </div>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Số lượng: {item.quantity}
              </p>
              <p className={cn('mt-1 text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                {formatCurrency(item.totalPrice)}
              </p>
              {orderStatus === 'COMPLETED' && onOpenReview && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenReview({
                      productId: item.productId,
                      productName: item.productName,
                    })
                  }
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 transition hover:bg-amber-500/20"
                >
                  <HiOutlineStar className="h-4 w-4" />
                  Viết đánh giá
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
