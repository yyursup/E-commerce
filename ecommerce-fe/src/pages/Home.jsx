import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import Modal, { PromoModalContent } from '../components/Modal'
import ProductQuickView from '../components/ProductQuickView'
import Footer from '../components/Footer'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import productService from '../services/product'

const promoBannerImages = [
  'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1624258919367-5dc28f5dc293?w=600&h=300&fit=crop',
]

// Loading Skeleton
const ProductSkeleton = () => {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  return (
    <div className={cn("rounded-2xl border p-4", isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white")}>
      <div className={cn("aspect-square rounded-xl", isDark ? "bg-slate-800" : "bg-stone-200")} />
      <div className={cn("mt-4 h-4 w-3/4 rounded-lg", isDark ? "bg-slate-800" : "bg-stone-200")} />
      <div className={cn("mt-2 h-4 w-1/2 rounded-lg", isDark ? "bg-slate-800" : "bg-stone-200")} />
    </div>
  )
}

export default function Home() {
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  // Products State
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const res = await productService.getAllProducts({ page: 0, size: 10 })
        // Backend returns Page<ProductResponse>, content is in res.content
        setProducts(res.content || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
        toast.error('Không thể tải danh sách sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Show welcome/promo popup once per session
  useEffect(() => {
    const shown = sessionStorage.getItem('welcomeModalShown')
    if (!shown) {
      const t = setTimeout(() => {
        setWelcomeModalOpen(true)
        sessionStorage.setItem('welcomeModalShown', '1')
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const [dealsIndex, setDealsIndex] = useState(0)

  const handleQuickView = (product) => setQuickViewProduct(product)
  const handleAddToCart = (product) => {
    // This handler handles the QuickView addToCart logic if needed
    // The ProductCard handles its own addToCart via stick
    setQuickViewProduct(null)
  }

  // Deals carousel autoplay
  useEffect(() => {
    const t = setInterval(() => {
      setDealsIndex((i) => (i + 1) % promoBannerImages.length)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={cn(isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <Hero />

      {/* Deals carousel - AOS */}
      <section
        id="deals"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div data-aos="fade-up" className="mb-8">
          <h2
            className={cn(
              'text-2xl font-bold sm:text-3xl',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Ưu đãi AirPods & Tai nghe
          </h2>
          <p
            className={cn(
              'mt-2',
              isDark ? 'text-slate-400' : 'text-stone-600',
            )}
          >
            Giảm giá AirPods Pro, AirPods Max. Số lượng có hạn.
          </p>
        </div>
        <div data-aos="fade-up" className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            {promoBannerImages.map((img, i) =>
              i === dealsIndex ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border',
                    isDark
                      ? 'border-slate-700/50 bg-slate-800/50'
                      : 'border-stone-200 bg-white',
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-48 w-full object-cover sm:h-56"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-xl font-bold text-white">
                      {i === 0 ? 'AirPods Pro: Giảm đến 40%' : 'Miễn phí giao hàng đơn từ $50'}
                    </h3>
                    <p className="mt-1 text-sm text-white/90">
                      {i === 0 ? 'Flash sale AirPods Pro (2nd gen). Số lượng có hạn. Chỉ trong tháng này.' : 'Áp dụng cho AirPods & tai nghe Apple. Không cần mã. Giao nhanh toàn quốc.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPromoModalOpen(true)}
                      className="mt-4 w-fit rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      {i === 0 ? 'Mua ngay' : 'Xem sản phẩm'}
                    </button>
                  </div>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>
          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {promoBannerImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDealsIndex(i)}
                aria-label={`Chuyển tới slide ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === dealsIndex
                    ? 'w-6 bg-amber-500'
                    : 'w-2 bg-white/50 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </div>
        <div data-aos="fade-up" className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setPromoModalOpen(true)}
            className={cn(
              'text-sm font-medium underline underline-offset-2',
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
            )}
          >
            Xem tất cả ưu đãi
          </button>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div data-aos="fade-up" className="mb-10">
          <h2
            className={cn(
              'text-2xl font-bold sm:text-3xl',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            AirPods & Tai nghe Apple
          </h2>
          <p
            className={cn(
              'mt-2',
              isDark ? 'text-slate-400' : 'text-stone-600',
            )}
          >
            AirPods, AirPods Pro, AirPods Max chính hãng. Bán chạy nhất.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product} // Pass full product data (including id, name, price, images)
                onQuickView={handleQuickView}
                dataAos="fade-up"
                dataAosDelay={i % 3 === 0 ? 0 : (i % 3) * 100}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={cn("mb-4 rounded-full p-4", isDark ? "bg-slate-800" : "bg-stone-100")}>
              <svg className={cn("h-8 w-8", isDark ? "text-slate-400" : "text-stone-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-stone-900")}>Chưa có sản phẩm nào</h3>
            <p className={cn("mt-1 max-w-sm text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
              Hiện tại cửa hàng chưa có sản phẩm nào. Vui lòng quay lại sau.
            </p>
          </div>
        )}
      </section>

      <Footer />

      {/* Custom Popup: Welcome / Promo (shown once per session) */}
      <Modal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        title="Chào mừng đến AirPod Store 🎉"
        size="md"
      >
        <PromoModalContent
          image="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=300&fit=crop"
          title="Giảm 15% đơn hàng đầu tiên"
          description="Đăng ký hoặc đăng nhập và dùng mã WELCOME15 khi thanh toán. Áp dụng khách hàng mới."
          ctaText="Nhận ưu đãi"
          onCta={() => {
            setWelcomeModalOpen(false)
            toast.success('Dùng mã WELCOME15 khi thanh toán!')
          }}
        />
      </Modal>

      {/* Promo / Offers modal */}
      <Modal
        open={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Ưu đãi AirPods & Tai nghe"
        size="lg"
      >
        <div className="space-y-6">
          {promoBannerImages.map((img, i) => (
            <PromoModalContent
              key={i}
              image={img}
              title={i === 0 ? 'AirPods Pro: Giảm đến 40%' : 'Miễn phí giao hàng đơn từ $50'}
              description={i === 0 ? 'Flash sale AirPods Pro (2nd gen). Số lượng có hạn. Chỉ trong tháng này.' : 'Áp dụng cho AirPods & tai nghe Apple. Không cần mã. Giao nhanh toàn quốc.'}
              ctaText={i === 0 ? 'Mua ngay' : 'Xem sản phẩm'}
              onCta={() => {
                setPromoModalOpen(false)
                toast.success('Đang chuyển đến ưu đãi...')
              }}
            />
          ))}
        </div>
      </Modal>

      {/* Product Quick View modal */}
      <Modal
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Sản phẩm'}
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
