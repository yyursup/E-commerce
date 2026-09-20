import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiOutlineEye,
  HiStar,
  HiOutlineStar,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import sellerService from '../services/seller'
import ProductFormModal from './business/components/ProductFormModal'
import ProductDetailModal from './business/components/ProductDetailModal'

export default function ShopProducts() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'PUBLISHED' | 'DRAFT' | 'INACTIVE' | 'ARCHIVED'
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null) // Product for detail modal
  const [deletingId, setDeletingId] = useState(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const filterParam = statusFilter === 'ALL' ? null : statusFilter
      const data = await sellerService.getProductsByShop(filterParam)
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load shop products error:', err)
      toast.error(err?.message || 'Không thể tải danh sách sản phẩm từ máy chủ.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [statusFilter])

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleEditProduct = (product, e) => {
    e?.stopPropagation()
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (productId, productName, e) => {
    e?.stopPropagation()
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName || 'này'}" khỏi gian hàng?`)) {
      return
    }

    try {
      setDeletingId(productId)
      await sellerService.deleteProduct(productId)
      toast.success('Đã xóa sản phẩm thành công!')
      loadProducts()
    } catch (err) {
      console.error('Delete product error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa sản phẩm')
    } finally {
      setDeletingId(null)
    }
  }

  const handleModalSuccess = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    loadProducts()
  }

  const handleToggleFeatured = async (product, e) => {
    e?.stopPropagation()
    try {
      setTogglingFeaturedId(product.id)
      const updated = await sellerService.toggleFeatured(product.id)
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, featured: updated.featured } : p))
      if (updated.featured) {
        toast.success(`⭐ Đã đẩy nổi bật "${product.name}"`)
      } else {
        toast('Đã bỏ đẩy nổi bật sản phẩm này', { icon: '🔕' })
      }
    } catch (err) {
      const msg = err?.message || err?.error || 'Không thể thay đổi trạng thái nổi bật'
      toast.error(msg)
    } finally {
      setTogglingFeaturedId(null)
    }
  }

  const featuredCount = products.filter((p) => p.featured).length

  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const nameMatch = p.name?.toLowerCase().includes(q)
    const skuMatch = p.sku?.toLowerCase().includes(q)
    const catMatch = p.categoryName?.toLowerCase().includes(q)
    return nameMatch || skuMatch || catMatch
  })

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  // Khớp 100% với ProductStatus enum Backend: PUBLISHED, DRAFT, INACTIVE, ARCHIVED, DELETED
  const getStatusBadge = (status) => {
    const st = status?.toUpperCase() || 'PUBLISHED'
    if (st === 'PUBLISHED') {
      return {
        label: 'Đang bán',
        color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      }
    }
    if (st === 'DRAFT') {
      return {
        label: 'Bản nháp',
        color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      }
    }
    if (st === 'INACTIVE') {
      return {
        label: 'Tạm ngưng',
        color: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
      }
    }
    if (st === 'DELETED') {
      return {
        label: 'Bị sàn khóa / Vi phạm',
        color: 'bg-rose-500/15 text-rose-500 border border-rose-500/30 font-bold',
      }
    }
    return {
      label: 'Đã lưu trữ',
      color: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className={cn(
        'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản Lý Sản Phẩm
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tổng số: <span className="font-extrabold text-amber-500">{products.length}</span> sản phẩm trong gian hàng
            </p>
            {featuredCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                <HiStar className="h-3.5 w-3.5" />
                Đang đẩy: {featuredCount}/5 sản phẩm
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadProducts}
            disabled={loading}
            className={cn(
              'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
              isDark
                ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
            title="Tải lại danh sách"
          >
            <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>

          <button
            onClick={handleCreateProduct}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/25 transition-all"
          >
            <HiOutlinePlus className="h-4 w-4 stroke-[2.5]" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU hoặc danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs border outline-none transition-all focus:ring-2 focus:ring-amber-500/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
            )}
          />
          <HiOutlineSearch className={cn('absolute left-3.5 top-3 h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
        </div>

        {/* Status Filter Tabs */}
        <div className={cn(
          'flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border transition-all self-start lg:self-auto',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-100/90'
        )}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PUBLISHED', label: 'Đang bán' },
            { key: 'DRAFT', label: 'Bản nháp' },
            { key: 'INACTIVE', label: 'Tạm ngưng' },
            { key: 'ARCHIVED', label: 'Đã lưu trữ' },
            { key: 'VIOLATION', label: 'Vi phạm' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all',
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Product List (Responsive Cards - Bấm vào hàng để xem chi tiết) */}
      <div className="space-y-3.5">
        {loading ? (
          <div className={cn(
            'rounded-3xl border py-20 text-center shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className={cn('mt-3 text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang tải danh sách sản phẩm từ máy chủ...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn(
            'rounded-3xl border py-16 text-center shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}>
            <HiOutlineCube className={cn('mx-auto h-12 w-12 mb-2', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('font-semibold text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
              {search ? 'Không tìm thấy sản phẩm phù hợp với từ khóa' : 'Gian hàng chưa có sản phẩm nào thuộc nhóm này'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-xs font-bold text-amber-500 hover:underline"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          filtered.map((prod) => {
            const thumb = prod.images?.find((img) => img.isThumbnail) || prod.images?.[0]
            const imgUrl = thumb?.imageUrl || prod.image || '/product-placeholder.svg'
            const price = prod.basePrice ? Number(prod.basePrice) : (prod.price ? Number(prod.price) : 0)
            const variantPrices = prod.variants?.length
              ? prod.variants.map((v) => Number(v.price) || 0).filter((p) => p > 0)
              : []
            const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : price
            const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : price
            const hasMultiplePrices = variantPrices.length > 1 && minPrice !== maxPrice
            const stock = prod.stockQuantity ?? prod.quantity ?? prod.stock ?? 0
            const statusBadge = getStatusBadge(prod.status)
            const isDeleting = deletingId === prod.id
            const isTogglingFeatured = togglingFeaturedId === prod.id
            const isFeatured = !!prod.featured

            return (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedProduct(prod)}
                className={cn(
                  'group rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 relative',
                  isFeatured
                    ? isDark
                      ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                      : 'border-amber-400/60 bg-amber-50/40 hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10'
                    : isDark
                      ? 'border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-amber-500/5'
                      : 'border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-md'
                )}
                title="Nhấp để xem chi tiết sản phẩm"
              >
                {/* Left: Image & Product Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                    className={cn(
                      'h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-100'
                    )}
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shrink-0',
                        statusBadge.color
                      )}>
                        {statusBadge.label}
                      </span>

                      {prod.sku && (
                        <span className={cn(
                          'font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg border tracking-wider shrink-0',
                          isDark
                            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                            : 'border-amber-500/30 bg-amber-50 text-amber-700'
                        )}>
                          SKU: {prod.sku}
                        </span>
                      )}

                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-lg border shrink-0',
                        isDark ? 'border-slate-800 bg-slate-800/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600'
                      )}>
                        {prod.categoryName || 'Mặc định'}
                      </span>
                      {prod.sold >= 50 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-500 border border-rose-500/20 shrink-0">
                          🔥 Bán chạy
                        </span>
                      )}
                      {prod.flagged && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/30 shrink-0">
                          ⚠️ Bị cảnh báo ({prod.reportCount || 0} tố cáo)
                        </span>
                      )}
                      {isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/25 shrink-0">
                          <HiStar className="h-3 w-3" /> Đang đẩy
                        </span>
                      )}
                    </div>

                    <h3 className={cn(
                      'font-bold text-sm sm:text-base leading-snug break-words group-hover:text-amber-500 transition-colors',
                      isDark ? 'text-white' : 'text-stone-900'
                    )}>
                      {prod.name}
                    </h3>

                    {/* Stock & Quick Stats */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className={cn(
                        'font-semibold',
                        stock === 0 ? 'text-rose-500 font-bold' : isDark ? 'text-slate-400' : 'text-stone-500'
                      )}>
                        Kho: <strong className={isDark ? 'text-slate-200' : 'text-stone-800'}>{stock}</strong> cái
                        {stock === 0 && <span className="ml-1 font-bold text-rose-500">(Hết hàng)</span>}
                      </span>
                      <span className={cn(
                        'font-semibold border-l pl-3',
                        isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500'
                      )}>
                        Đã bán: <strong className={isDark ? 'text-slate-200' : 'text-stone-800'}>{prod.sold || 0}</strong> cái
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Action Buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-slate-800 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-stone-400 block md:hidden">Giá bán:</span>
                    <span className={cn(
                      'font-black text-base sm:text-lg tracking-tight',
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    )}>
                      {hasMultiplePrices
                        ? `${formatVND(minPrice)} - ${formatVND(maxPrice)}`
                        : formatVND(minPrice || price)}
                    </span>
                    {prod.variants?.length > 0 && (
                      <span className="block text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 mt-0.5 md:ml-auto w-fit">
                        {prod.variants.length} phân loại
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {prod.status === 'DELETED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold text-xs tracking-wide">
                        🚫 Bị sàn cấm (Chỉ xem)
                      </span>
                    ) : (
                      <>
                        {/* Featured Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeatured(prod, e)}
                          disabled={isTogglingFeatured}
                          title={isFeatured ? 'Bỏ đẩy nổi bật' : 'Đẩy sản phẩm này lên nổi bật'}
                          className={cn(
                            'p-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50',
                            isFeatured
                              ? 'border-amber-500/50 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                              : isDark
                                ? 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                                : 'border-stone-200 bg-stone-50 text-stone-400 hover:text-amber-500 hover:border-amber-400'
                          )}
                        >
                          {isTogglingFeatured
                            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                            : isFeatured
                              ? <HiStar className="h-4 w-4" />
                              : <HiOutlineStar className="h-4 w-4" />
                          }
                        </button>

                        <a
                          href={`http://localhost:3000/products/${prod.id}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'p-2 rounded-xl border transition-all active:scale-95',
                            isDark
                              ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                              : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-amber-600 hover:border-amber-500/40'
                          )}
                          title="Xem sản phẩm trên sàn"
                        >
                          <HiOutlineExternalLink className="h-4 w-4" />
                        </a>

                        <button
                          type="button"
                          onClick={(e) => handleEditProduct(prod, e)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95',
                            isDark
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          )}
                          title="Chỉnh sửa sản phẩm"
                        >
                          <HiOutlinePencilAlt className="h-4 w-4" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(prod.id, prod.name, e)}
                          disabled={isDeleting}
                          className={cn(
                            'p-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50',
                            isDark
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          )}
                          title="Xóa sản phẩm"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(prod) => {
            setSelectedProduct(null)
            setEditingProduct(prod)
            setShowProductModal(true)
          }}
        />
      )}

      {/* Product Form Modal (Create / Edit) */}
      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
