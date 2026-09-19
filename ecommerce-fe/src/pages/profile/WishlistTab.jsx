import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineTrash,
  HiOutlineShoppingCart,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import wishlistService from '../../services/wishlist'
import cartService from '../../services/cart'
import { useWishlistStore } from '../../store/useWishlistStore'
import { useCartStore } from '../../store/useCartStore'
import Modal from '../../components/Modal'
import ProductQuickView from '../../components/ProductQuickView'

export default function WishlistTab({ isDark }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const { toggleWishlist } = useWishlistStore()
  const { updateCartCount } = useCartStore()

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const res = await wishlistService.getMyWishlist({ page: 0, size: 50 })
      setProducts(res?.content || [])
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Không thể tải danh sách sản phẩm yêu thích')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleRemove = async (productId, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    try {
      setActionLoading((prev) => ({ ...prev, [productId]: true }))
      await toggleWishlist(productId)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success('Đã xóa khỏi danh sách yêu thích', { id: 'wishlist-toast' })
    } catch (err) {
      toast.error('Lỗi khi xóa khỏi yêu thích', { id: 'wishlist-toast' })
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const handleAddToCart = async (product, e) => {
    e?.preventDefault()
    e?.stopPropagation()

    // Nếu sản phẩm có phân loại hàng -> mở modal chọn phân loại
    if (product?.variants && product.variants.length > 0) {
      setQuickViewProduct(product)
      return
    }

    try {
      setActionLoading((prev) => ({ ...prev, [`cart_${product.id}`]: true }))
      const cartRes = await cartService.addToCart(product.id, 1)
      updateCartCount(cartRes)
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
    } catch (err) {
      // Nếu backend báo lỗi cần chọn phân loại hàng -> mở modal quick view
      if (err?.message?.includes('phân loại') || err?.response?.data?.message?.includes('phân loại')) {
        setQuickViewProduct(product)
      } else {
        toast.error(err?.message || 'Không thể thêm vào giỏ hàng')
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [`cart_${product.id}`]: false }))
    }
  }

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        <p className={cn('mt-3 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang tải danh sách yêu thích...
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mb-4">
          <HiOutlineHeart className="h-8 w-8" />
        </div>
        <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-800')}>
          Chưa có sản phẩm yêu thích nào
        </h3>
        <p className={cn('mt-1 text-sm max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Hãy khám phá các sản phẩm nổi bật và nhấn biểu tượng trái tim để lưu lại những món đồ bạn quan tâm nhé!
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
        >
          Khám phá sản phẩm ngay
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b pb-4 mb-6 dark:border-slate-800 border-stone-200">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Sản phẩm yêu thích ({products.length})
          </h2>
          <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Danh sách các sản phẩm bạn đã lưu để xem lại hoặc mua sau
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => {
          const thumb =
            p.images?.find((img) => img.isThumbnail)?.imageUrl ||
            p.images?.[0]?.imageUrl ||
            (typeof p.images?.[0] === 'string' ? p.images[0] : null) ||
            '/product-placeholder.svg'

          const variants = p.variants || []
          const prices = variants.map((v) => Number(v.price) || 0).filter((price) => price > 0)
          const minPrice = prices.length > 0 ? Math.min(...prices) : (Number(p.basePrice || p.price) || 0)
          const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice
          const hasRange = variants.length > 0 && minPrice !== maxPrice

          return (
            <motion.div
              layout
              key={p.id}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition-all',
                isDark
                  ? 'border-slate-800 bg-slate-900/80 hover:border-amber-500/40'
                  : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-md'
              )}
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-slate-800">
                  <img
                    src={thumb}
                    alt={p.name}
                    onError={(e) => {
                      e.target.src = '/product-placeholder.svg'
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => handleRemove(p.id, e)}
                    disabled={actionLoading[p.id]}
                    title="Bỏ yêu thích"
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-rose-500 shadow-md backdrop-blur hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <HiHeart className="h-4 w-4 fill-current" />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {p.shopName || 'Shop'}
                    </span>
                    {variants.length > 0 && (
                      <span className="text-[10px] font-medium text-stone-400 dark:text-slate-500 bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {variants.length} phân loại
                      </span>
                    )}
                  </div>
                  <Link to={`/products/${p.id}`}>
                    <h4
                      className={cn(
                        'mt-1 line-clamp-2 text-sm font-semibold hover:text-amber-500 transition-colors',
                        isDark ? 'text-white' : 'text-stone-900'
                      )}
                      title={p.name}
                    >
                      {p.name}
                    </h4>
                  </Link>
                  <div className="mt-2 text-base font-bold text-amber-600 dark:text-amber-400">
                    {hasRange ? `${formatVND(minPrice)} - ${formatVND(maxPrice)}` : formatVND(minPrice)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t pt-3 dark:border-slate-800 border-stone-100">
                <button
                  onClick={(e) => handleAddToCart(p, e)}
                  disabled={actionLoading[`cart_${p.id}`]}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <HiOutlineShoppingCart className="h-4 w-4" />
                  {actionLoading[`cart_${p.id}`]
                    ? 'Đang thêm...'
                    : variants.length > 0
                    ? 'Chọn phân loại'
                    : 'Thêm vào giỏ'}
                </button>
                <Link
                  to={`/products/${p.id}`}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl border text-stone-600 hover:text-amber-500 dark:text-slate-400 dark:border-slate-700 transition-colors',
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-50'
                  )}
                  title="Xem chi tiết"
                >
                  <HiOutlineExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick View / Chọn phân loại Modal */}
      <Modal
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Chọn phân loại hàng'}
        size="lg"
      >
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
            onAddToCart={() => setQuickViewProduct(null)}
          />
        )}
      </Modal>
    </div>
  )
}
