import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineX,
  HiOutlineLockClosed,
  HiOutlineTrash,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import sellerService from '../../services/seller'
import statisticsService from '../../services/statistics'
import walletService from '../../services/wallet'
import SellerProductCard from './components/SellerProductCard'
import OrderStatusSummary from './components/OrderStatusSummary'
import ProductFormModal from './components/ProductFormModal'
import ProductDetailModal from './components/ProductDetailModal'

export default function BusinessDashboard() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalNetIncome: 0,
    estimatedRevenue: 0,
    orderCountByStatus: {},
  })
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [error, setError] = useState(null)
  const [wallet, setWallet] = useState(null)

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
          variants: product.variants || [],
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
    const fetchDashboardData = async () => {
      await fetchProducts(statusFilter || null)
      try {
        const [statistics, walletData] = await Promise.all([
          statisticsService.getSellerStatistics(),
          walletService.getMyWallet(),
        ])

        setStats(prev => ({
          ...prev,
          totalRevenue: statistics.totalRevenue || 0,
          estimatedRevenue: statistics.estimatedRevenue || 0,
          totalOrders: statistics.totalOrders || 0,
          totalCommission: statistics.totalCommission || 0,
          totalNetIncome: statistics.totalNetIncome || 0,
          orderCountByStatus: statistics.orderCountByStatus || {},
        }));
        setWallet(walletData)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    }
    fetchDashboardData();
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

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
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
      title: 'Doanh thu thực nhận',
      value: formatCurrency(stats.totalNetIncome),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Phí hoa hồng',
      value: formatCurrency(stats.totalCommission),
      icon: HiOutlineChartBar,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'Doanh thu ước tính',
      value: formatCurrency(stats.estimatedRevenue),
      icon: HiOutlineCurrencyDollar,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div>
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
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      isDark ? 'text-slate-400' : 'text-stone-600',
                    )}
                    title={stat.title}
                  >
                    {stat.title}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-xl font-bold sm:text-2xl',
                      isDark ? 'text-white' : 'text-stone-900',
                    )}
                    title={stat.value}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
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

      {/* Wallet Balance Card */}
      {wallet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'mb-6 rounded-xl border p-6',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Ví của tôi
            </h2>
            <span className={cn('text-xs px-2 py-1 rounded-full', isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700')}>
              {wallet.currency || 'VND'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={cn('rounded-xl p-4', isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-100')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <HiOutlineCurrencyDollar className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Số dư khả dụng</p>
                  <p className={cn('text-xl font-bold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    {formatCurrency(wallet.availableBalance || 0)}
                  </p>
                </div>
              </div>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                Tiền đã nhận từ các đơn hàng hoàn thành
              </p>
            </div>
            <div className={cn('rounded-xl p-4', isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <HiOutlineLockClosed className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>Đang tạm giữ</p>
                  <p className={cn('text-xl font-bold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                    {formatCurrency(wallet.lockedBalance || 0)}
                  </p>
                </div>
              </div>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                Tiền từ đơn đang chờ buyer xác nhận nhận hàng
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <OrderStatusSummary
        isDark={isDark}
        orderCountByStatus={stats.orderCountByStatus}
        totalOrders={stats.totalOrders}
      />

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
                      onView={() => handleViewProduct(product)}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(prod) => {
            setSelectedProduct(null)
            setEditingProduct(prod)
            setShowProductForm(true)
          }}
        />
      )}
    </div>
  )
}

