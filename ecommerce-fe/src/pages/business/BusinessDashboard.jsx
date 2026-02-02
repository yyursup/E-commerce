import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineX,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import sellerService from '../../services/seller'
import categoryService from '../../services/category'
import SellerProductCard from './components/SellerProductCard'
import ImageUpload from './components/ImageUpload'

export default function BusinessDashboard() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState(null)

  const fetchProducts = async (status = null) => {
    try {
      setLoading(true)
      setError(null)
      const productsData = await sellerService.getProductsByShop(status)
      
      // Transform API response to match UI format
      const transformedProducts = productsData.map((product) => {
        const thumbnailImage = product.images?.find(img => img.isThumbnail) || product.images?.[0]
        const imageUrl = thumbnailImage?.imageUrl || thumbnailImage || null
        
        return {
          id: product.id,
          name: product.name,
          price: product.basePrice ? Number(product.basePrice) : 0,
          stock: product.quantity || 0,
          status: product.status?.toUpperCase() || 'PUBLISHED',
          sku: product.sku,
          description: product.description,
          categoryId: product.categoryId,
          images: product.images || [],
          image: imageUrl,
        }
      })
      
      setProducts(transformedProducts)
      setStats((prev) => ({
        ...prev,
        totalProducts: productsData.length,
      }))
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách sản phẩm')
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(statusFilter || null)
  }, [statusFilter])

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return
    }

    try {
      await sellerService.deleteProduct(productId)
      toast.success('Đã xóa sản phẩm thành công')
      fetchProducts(statusFilter || null)
    } catch (err) {
      console.error('Error deleting product:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa sản phẩm'
      toast.error(errorMessage)
    }
  }

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleFormClose = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchProducts(statusFilter || null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.totalProducts,
      icon: HiOutlineCube,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders,
      icon: HiOutlineShoppingBag,
      color: 'bg-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Khách hàng',
      value: stats.totalCustomers,
      icon: HiOutlineUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div
      className={cn(
        'min-h-screen px-4 py-8 sm:px-6 lg:px-8',
        isDark ? 'bg-slate-950' : 'bg-stone-50',
      )}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={cn(
              'text-3xl font-bold',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Dashboard Doanh Nghiệp
          </h1>
          <p
            className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}
          >
            Chào mừng trở lại, {user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'rounded-xl border p-6',
                  isDark
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-stone-200 bg-white',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isDark ? 'text-slate-400' : 'text-stone-600',
                      )}
                    >
                      {stat.title}
                    </p>
                    <p
                      className={cn(
                        'mt-2 text-2xl font-bold',
                        isDark ? 'text-white' : 'text-stone-900',
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      stat.bgColor,
                    )}
                  >
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Products Section */}
        <div
          className={cn(
            'rounded-xl border',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className={cn(
                'text-xl font-semibold',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              Sản phẩm của tôi
            </h2>
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PUBLISHED">Đang bán</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
              <button
                onClick={handleCreateProduct}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  'bg-amber-500 text-white hover:bg-amber-600',
                )}
              >
                <HiOutlinePlusCircle className="h-5 w-5" />
                Thêm sản phẩm
              </button>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p
                className={cn(
                  'mt-4 text-sm',
                  isDark ? 'text-slate-400' : 'text-stone-600',
                )}
              >
                Đang tải danh sách sản phẩm...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-12 text-center">
              <p
                className={cn(
                  'text-sm text-red-500',
                  isDark ? 'text-red-400' : 'text-red-600',
                )}
              >
                {error}
              </p>
              <button
                onClick={() => fetchProducts(statusFilter || null)}
                className={cn(
                  'mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  'bg-amber-500 text-white hover:bg-amber-600',
                )}
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="p-6">
              {products.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SellerProductCard
                        product={product}
                        onView={() => handleViewProduct(product.id)}
                        onEdit={() => handleEditProduct(product)}
                        onDelete={() => handleDeleteProduct(product.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <HiOutlineCube
                    className={cn(
                      'mx-auto h-12 w-12',
                      isDark ? 'text-slate-600' : 'text-stone-400',
                    )}
                  />
                  <p
                    className={cn(
                      'mt-4 text-sm',
                      isDark ? 'text-slate-400' : 'text-stone-600',
                    )}
                  >
                    Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên của bạn!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Form Modal */}
        {showProductForm && (
          <ProductFormModal
            product={editingProduct}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  )
}

// Product Form Modal Component
function ProductFormModal({ product, onClose, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    basePrice: product?.price || '',
    stockQuantity: product?.stock || 0,
    categoryId: product?.categoryId || '',
    images: product?.images || [],
    status: product?.status || 'PUBLISHED',
  })
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [imageUrls, setImageUrls] = useState(
    product?.images?.map((img) => img.imageUrl || img) || []
  )

  // Update imageUrls when product changes
  useEffect(() => {
    if (product?.images) {
      setImageUrls(product.images.map((img) => img.imageUrl || img))
    }
  }, [product])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const categoriesData = await categoryService.getAllCategories()
        setCategories(categoriesData)
      } catch (err) {
        console.error('Error fetching categories:', err)
        toast.error('Không thể tải danh sách danh mục')
        // Fallback to empty array
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.sku || !formData.basePrice || !formData.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setSubmitting(true)
      
      const productData = {
        name: formData.name,
        description: formData.description || '',
        sku: formData.sku,
        basePrice: parseFloat(formData.basePrice),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        categoryId: formData.categoryId,
        images: imageUrls.map((url, index) => ({
          imageUrl: url,
          isThumbnail: index === 0,
          displayOrder: index,
        })),
      }

      if (product) {
        // Update product
        productData.status = formData.status
        await sellerService.updateProduct(product.id, productData)
        toast.success('Cập nhật sản phẩm thành công')
      } else {
        // Create product
        await sellerService.createProduct(productData)
        toast.success('Tạo sản phẩm thành công')
      }

      onSuccess()
    } catch (err) {
      console.error('Error saving product:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu sản phẩm'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = (newUrls) => {
    setImageUrls([...imageUrls, ...newUrls])
  }

  const handleImageRemove = (removedUrl) => {
    setImageUrls(imageUrls.filter((url) => url !== removedUrl))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border p-6',
          isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            className={cn(
              'text-2xl font-bold',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
            )}
          >
            <HiOutlineX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={cn(
                'mb-2 block text-sm font-medium',
                isDark ? 'text-slate-300' : 'text-stone-700',
              )}
            >
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={cn(
                'w-full rounded-lg border px-3 py-2',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-stone-300 bg-white text-stone-900',
              )}
            />
          </div>

          <div>
            <label
              className={cn(
                'mb-2 block text-sm font-medium',
                isDark ? 'text-slate-300' : 'text-stone-700',
              )}
            >
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={cn(
                'w-full rounded-lg border px-3 py-2',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-stone-300 bg-white text-stone-900',
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  'mb-2 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className={cn(
                  'w-full rounded-lg border px-3 py-2',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'mb-2 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Giá (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
                min="0"
                step="1000"
                className={cn(
                  'w-full rounded-lg border px-3 py-2',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  'mb-2 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Số lượng tồn kho
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                min="0"
                className={cn(
                  'w-full rounded-lg border px-3 py-2',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'mb-2 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                disabled={loadingCategories}
                className={cn(
                  'w-full rounded-lg border px-3 py-2',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                  loadingCategories && 'opacity-50 cursor-not-allowed',
                )}
              >
                <option value="">
                  {loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {product && (
            <div>
              <label
                className={cn(
                  'mb-2 block text-sm font-medium',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-3 py-2',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              >
                <option value="PUBLISHED">Đang bán</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
            </div>
          )}

          <div>
            <label
              className={cn(
                'mb-2 block text-sm font-medium',
                isDark ? 'text-slate-300' : 'text-stone-700',
              )}
            >
              Hình ảnh
            </label>
            <ImageUpload
              onUpload={handleImageUpload}
              existingImages={imageUrls}
              onRemove={handleImageRemove}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
              )}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                'bg-amber-500 hover:bg-amber-600 disabled:opacity-50',
              )}
            >
              {submitting ? 'Đang lưu...' : product ? 'Cập nhật' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
