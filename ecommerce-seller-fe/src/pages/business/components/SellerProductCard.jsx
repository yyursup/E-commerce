import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiStar } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'

export default function SellerProductCard({ product, onView, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  
  const { id, name, price, image, status, stock, sku } = product
  
  // Get thumbnail image
  const thumbnailImage = image || product.images?.[0]?.imageUrl || product.images?.[0] || 
    'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop'
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getStatusBadge = () => {
    const statusUpper = status?.toUpperCase() || 'PUBLISHED'
    if (statusUpper === 'PUBLISHED') {
      return { text: 'Đang bán', color: 'bg-green-500' }
    } else if (statusUpper === 'DRAFT') {
      return { text: 'Bản nháp', color: 'bg-yellow-500' }
    } else {
      return { text: 'Đã lưu trữ', color: 'bg-gray-500' }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <motion.article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300',
        isDark
          ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20'
          : 'border-stone-200/80 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10',
      )}
    >
      {/* Status Badge */}
      <span
        className={cn(
          'absolute left-3 top-3 z-10 rounded-lg px-2.5 py-1 text-xs font-semibold text-white',
          statusBadge.color,
        )}
      >
        {statusBadge.text}
      </span>

      {/* Stock Badge */}
      {stock !== undefined && stock !== null && (
        <span
          className={cn(
            'absolute right-3 top-3 z-10 rounded-lg px-2.5 py-1 text-xs font-semibold',
            stock > 10
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          )}
        >
          {stock} sản phẩm
        </span>
      )}

      {/* Image */}
      <Link to={`/products/${id}`} className="relative block aspect-square overflow-hidden">
        <motion.img
          src={thumbnailImage}
          alt={name}
          className="h-full w-full object-cover transition duration-500"
          animate={{ scale: hover ? 1.05 : 1 }}
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300',
            hover && 'opacity-100',
          )}
        />

        {/* Action buttons on hover */}
        <motion.div
          initial={false}
          animate={{
            opacity: hover ? 1 : 0,
            y: hover ? 0 : 8,
          }}
          className="absolute bottom-3 left-3 right-3 z-10 flex gap-2"
          onClick={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onView?.(product)
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-sm font-medium text-stone-800 shadow-lg backdrop-blur hover:bg-white"
          >
            <HiOutlineEye className="h-4 w-4" />
            Xem
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit?.(product)
            }}
            className="rounded-xl bg-white/95 p-2.5 text-amber-600 shadow-lg backdrop-blur hover:bg-white hover:text-amber-700"
            title="Chỉnh sửa"
          >
            <HiOutlinePencil className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete?.(product)
            }}
            className="rounded-xl bg-white/95 p-2.5 text-red-600 shadow-lg backdrop-blur hover:bg-white hover:text-red-700"
            title="Xóa"
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        </motion.div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <HiStar
              key={i}
              className={cn(
                'h-4 w-4',
                i < 4 ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600',
              )}
            />
          ))}
          <span className="ml-1 text-xs text-stone-500 dark:text-slate-400">4.5</span>
        </div>
        <Link to={`/products/${id}`}>
          <h3
            className={cn(
              'font-semibold line-clamp-2 transition hover:text-amber-600 dark:hover:text-amber-400',
              isDark ? 'text-slate-100' : 'text-stone-800',
            )}
          >
            {name}
          </h3>
        </Link>
        {sku && (
          <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
            SKU: {sku}
          </p>
        )}
        <div className="mt-2">
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(price)}
          </span>
        </div>
      </div>
    </motion.article>
  )
}
