import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineSparkles, HiOutlineRefresh, HiOutlineChevronRight } from 'react-icons/hi'
import Hero from '../components/Hero'
import CategoryGrid from '../components/CategoryGrid'
import FlashSaleSection from '../components/FlashSaleSection'
import OfficialMallSection from '../components/OfficialMallSection'
import ProductCard from '../components/ProductCard'
import Modal, { PromoModalContent } from '../components/Modal'
import ProductQuickView from '../components/ProductQuickView'
import Footer from '../components/Footer'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { cn } from '../lib/cn'
import productService from '../services/product'
import cartService from '../services/cart'
import { Link } from 'react-router-dom'

export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [recLoading, setRecLoading] = useState(true)

  const { isAuthenticated } = useAuthStore()
  const { updateCartCount } = useCartStore()
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  // Fetch all products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await productService.getProducts({
          page: 0,
          size: 24,
          sortBy: 'createdAt',
          sortDir: 'desc',
        })

        const mappedProducts =
          response.content?.map((product) => {
            const thumbnailImage = product.images?.find((img) => img.isThumbnail) || product.images?.[0]
            const imageUrl = thumbnailImage?.imageUrl || '/product-placeholder.svg'
            const price = product.basePrice ? Number(product.basePrice) : 0

            return {
              id: product.id,
              name: product.name,
              price: price,
              image: imageUrl,
              badge: product.status === 'PUBLISHED' ? 'Bestseller' : null,
              rating: 4.8,
              description: product.description,
              basePrice: product.basePrice,
              shopName: product.shopName,
              categoryName: product.categoryName,
              originalProduct: product,
            }
          }) || []

        setProducts(mappedProducts)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message || 'Không thể tải danh sách sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Gợi ý cho bạn (AI vector embedding recommendations)
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecLoading(true)
        const list = await productService.getRecommendations(8)
        const mapped = (list || []).map((product) => {
          const thumbnailImage = product.images?.find((img) => img.isThumbnail) || product.images?.[0]
          const imageUrl = thumbnailImage?.imageUrl || '/product-placeholder.svg'
          const price = product.basePrice ? Number(product.basePrice) : 0
          return {
            id: product.id,
            name: product.name,
            price,
            image: imageUrl,
            badge: 'AI Gợi Ý',
            rating: 4.9,
            description: product.description,
            basePrice: product.basePrice,
            shopName: product.shopName,
            categoryName: product.categoryName,
            originalProduct: product,
          }
        })
        setRecommendations(mapped)
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setRecommendations([])
      } finally {
        setRecLoading(false)
      }
    }
    fetchRecommendations()
  }, [])

  // Show welcome popup once per session
  useEffect(() => {
    const shown = sessionStorage.getItem('welcomeModalShown')
    if (!shown) {
      const t = setTimeout(() => {
        setWelcomeModalOpen(true)
        sessionStorage.setItem('welcomeModalShown', '1')
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const handleQuickView = (product) => setQuickViewProduct(product)

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      return
    }

    if (!product || !product.id) {
      toast.error('Thông tin sản phẩm không hợp lệ')
      return
    }

    try {
      const cartResponse = await cartService.addToCart(product.id, 1)
      updateCartCount(cartResponse)
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
      setQuickViewProduct(null)
    } catch (error) {
      console.error('Error adding to cart:', error)
      const errorMessage =
        error?.message || error?.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      toast.error(errorMessage)
    }
  }

  return (
    <div className={cn(isDark ? 'bg-slate-950' : 'bg-stone-50/50')}>
      {/* 1. Mega Banner Slider & Quick Services */}
      <Hero />

      {/* 2. Categories Grid (8 Main Categories) */}
      <CategoryGrid />

      {/* 3. Flash Sale Countdown Section */}
      <FlashSaleSection products={products} />

      {/* 4. Official Mall (eKYC Verified Shops) */}
      <OfficialMallSection />

      {/* 5. AI Recommendations Strip ("Gợi ý riêng cho bạn") */}
      {recommendations.length > 0 && (
        <section id="recommendations" className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25">
                  <HiOutlineSparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    className={cn(
                      'text-xl sm:text-2xl font-bold tracking-tight',
                      isDark ? 'text-white' : 'text-stone-900'
                    )}
                  >
                    Gợi Ý Riêng Cho Bạn (AI Powered)
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                    Phân tích thói quen tìm kiếm và gợi ý bằng Vector Embedding
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Daily Discover Feed ("Gợi Ý Hôm Nay" - All Marketplace Products) */}
      <section id="daily-discover" className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
            <div>
              <h2
                className={cn(
                  'text-xl sm:text-2xl font-black uppercase tracking-tight text-amber-500'
                )}
              >
                GỢI Ý HÔM NAY
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
                Tất cả sản phẩm thịnh hành từ các gian hàng trên toàn sàn E-commerce
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              Xem tất cả sản phẩm
              <HiOutlineChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
                <p className={cn('mt-4 text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Đang tải danh sách sản phẩm...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <p className="text-sm text-rose-500">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">
              Chưa có sản phẩm nào được hiển thị
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          )}

          {/* Explore More CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-8 py-3.5 text-sm font-bold text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95"
            >
              Xem Thêm Hàng Ngàn Sản Phẩm Khác
              <HiOutlineChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Welcome Modal */}
      <Modal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        title="Chào mừng bạn đến E-commerce 🎉"
        size="md"
      >
        <PromoModalContent
          image="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=300&fit=crop"
          title="Tặng Voucher Giảm 15% Đơn Đầu Tiên"
          description="Đăng ký hoặc đăng nhập tài khoản E-commerce và nhập mã ECOM15 khi thanh toán để được giảm 15% (tối đa 100.000đ) cùng Freeship GHN."
          ctaText="Lưu mã ngay"
          onCta={() => {
            setWelcomeModalOpen(false)
            toast.success('Đã lưu mã ECOM15 vào ví voucher của bạn!')
          }}
        />
      </Modal>

      {/* Product Quick View Modal */}
      <Modal
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Chi tiết sản phẩm'}
        size="md"
      >
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
            onAddToCart={handleAddToCart}
          />
        )}
      </Modal>
    </div>
  )
}
