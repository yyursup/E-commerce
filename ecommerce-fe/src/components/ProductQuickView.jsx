import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineShoppingCart, HiStar, HiCheck } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { cn } from '../lib/cn'
import cartService from '../services/cart'

export default function ProductQuickView({ product, onAddToCart }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const { updateCartCount } = useCartStore()
  const navigate = useNavigate()
  const [addingToCart, setAddingToCart] = useState(false)
  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const { name, price, oldPrice, image, rating, id } = product

  const handleAddToCartClick = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      navigate('/login')
      return
    }

    if (!product || !product.id) {
      toast.error('Thông tin sản phẩm không hợp lệ')
      return
    }

    try {
      setAddingToCart(true)
      const cartResponse = await cartService.addToCart(product.id, 1)
      
      // Update cart count in store
      updateCartCount(cartResponse)
      
      // Show success animation
      setShowAddAnimation(true)
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
      
      // Hide animation after 1.5s
      setTimeout(() => {
        setShowAddAnimation(false)
      }, 1500)
      
      // Call parent callback if provided
      onAddToCart?.(product)
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      toast.error(errorMessage)
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex-shrink-0 overflow-hidden rounded-xl sm:w-48">
        <img
          src={image}
          alt={name}
          className="h-48 w-full object-cover sm:h-56 sm:w-48"
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <HiStar
              key={i}
              className={cn(
                'h-4 w-4',
                i < Math.floor(rating) ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600',
              )}
            />
          ))}
          <span className="ml-1 text-sm text-stone-500 dark:text-slate-400">
            {rating} đánh giá
          </span>
        </div>
        <Link to={`/products/${id}`}>
          <h3
            className={cn(
              'text-lg font-semibold transition hover:text-amber-600 dark:hover:text-amber-400',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            {name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
          </span>
          {oldPrice && (
            <span className="text-sm text-stone-400 line-through dark:text-slate-500">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(oldPrice)}
            </span>
          )}
        </div>
        <p
          className={cn(
            'mt-3 text-sm',
            isDark ? 'text-slate-400' : 'text-stone-600',
          )}
        >
          Thêm vào giỏ để thanh toán. Miễn phí giao hàng đơn từ 1.000.000đ. AirPods & tai nghe Apple chính hãng.
        </p>
        <button
          type="button"
          onClick={handleAddToCartClick}
          disabled={addingToCart}
          className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {showAddAnimation ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <HiCheck className="h-5 w-5" />
                <span>Đã thêm</span>
              </motion.div>
            ) : (
              <motion.div
                key="cart"
                initial={{ scale: 1 }}
                animate={{ scale: addingToCart ? 0.95 : 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <HiOutlineShoppingCart className="h-5 w-5" />
                {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )
}
