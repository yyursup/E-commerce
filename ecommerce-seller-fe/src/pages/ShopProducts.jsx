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
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import sellerService from '../services/seller'
import ProductFormModal from './business/components/ProductFormModal'

export default function ShopProducts() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'PUBLISHED' | 'DRAFT' | 'INACTIVE' | 'ARCHIVED'
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (productId, productName) => {
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
          <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Tổng số: <span className="font-extrabold text-amber-500">{products.length}</span> sản phẩm trong gian hàng
          </p>
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

        {/* Status Filter Tabs (Dark theme đồng bộ, không bị trắng lạc quẻ) */}
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

      {/* Product List Table (High Contrast - Dễ nhìn tuyệt đối) */}
      <div className={cn(
        'rounded-3xl border overflow-hidden shadow-sm transition-colors',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className={cn('mt-3 text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang tải danh sách sản phẩm từ máy chủ...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs">
            <HiOutlineCube className={cn('mx-auto h-12 w-12 mb-2', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('font-semibold', isDark ? 'text-slate-300' : 'text-stone-600')}>
              {search ? 'Không tìm thấy sản phẩm phù hợp với từ khóa' : 'Gian hàng chưa có sản phẩm nào thuộc nhóm này'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={cn(
                'border-b text-[11px] font-extrabold uppercase tracking-wider',
                isDark ? 'border-slate-800 bg-slate-800/80 text-slate-200' : 'border-stone-200 bg-stone-100 text-stone-700'
              )}>
                <tr>
                  <th className="py-3.5 px-4 min-w-[260px]">Sản phẩm</th>
                  <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">Mã SKU</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Danh mục</th>
                  <th className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">Giá bán</th>
                  <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">Tồn kho</th>
                  <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-4 min-w-[130px] text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className={cn(
                'divide-y',
                isDark ? 'divide-slate-800/80' : 'divide-stone-100'
              )}>
                {filtered.map((prod) => {
                  const thumb = prod.images?.find((img) => img.isThumbnail) || prod.images?.[0]
                  const imgUrl = thumb?.imageUrl || prod.image || '/product-placeholder.svg'
                  const price = prod.basePrice ? Number(prod.basePrice) : (prod.price ? Number(prod.price) : 0)
                  const stock = prod.stockQuantity ?? prod.quantity ?? prod.stock ?? 0
                  const statusBadge = getStatusBadge(prod.status)
                  const isDeleting = deletingId === prod.id

                  return (
                    <tr
                      key={prod.id}
                      className={cn(
                        'transition-colors',
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-amber-500/5'
                      )}
                    >
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4 flex items-center gap-3.5">
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                          className={cn(
                            'h-12 w-12 rounded-xl object-cover border shrink-0',
                            isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-100'
                          )}
                        />
                        <div className="overflow-hidden">
                          <p className={cn(
                            'font-bold text-sm line-clamp-1',
                            isDark ? 'text-white' : 'text-stone-900'
                          )}>
                            {prod.name}
                          </p>
                        </div>
                      </td>

                      {/* SKU (Always single line, no wrapping) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-block whitespace-nowrap font-mono font-bold text-xs px-2.5 py-1 rounded-lg border tracking-wider',
                          isDark
                            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                            : 'border-amber-500/30 bg-amber-50 text-amber-700'
                        )}>
                          {prod.sku || '---'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          'font-semibold text-xs line-clamp-1',
                          isDark ? 'text-slate-200' : 'text-stone-700'
                        )}>
                          {prod.categoryName || 'Mặc định'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          'font-black text-sm',
                          isDark ? 'text-amber-400' : 'text-amber-600'
                        )}>
                          {formatVND(price)}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          'font-bold text-xs',
                          stock === 0
                            ? 'text-rose-500'
                            : isDark ? 'text-slate-200' : 'text-stone-800'
                        )}>
                          {stock} cái {stock === 0 && <span className="text-rose-500 text-[10px] block">(Hết hàng)</span>}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide',
                          statusBadge.color
                        )}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`http://localhost:3000/products/${prod.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'p-2 rounded-xl border transition-all active:scale-95',
                              isDark
                                ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                                : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-amber-600 hover:border-amber-500/40'
                            )}
                            title="Xem trên sàn mua sắm"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                          </a>

                          <button
                            onClick={() => handleEditProduct(prod)}
                            className={cn(
                              'p-2 rounded-xl border transition-all active:scale-95',
                              isDark
                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                            )}
                            title="Chỉnh sửa thông tin"
                          >
                            <HiOutlinePencilAlt className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            disabled={isDeleting}
                            className={cn(
                              'p-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50',
                              isDark
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300'
                                : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                            )}
                            title="Xóa sản phẩm"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
