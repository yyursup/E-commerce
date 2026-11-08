import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { HiOutlineArrowRight } from 'react-icons/hi'
import CategoryGrid from '../components/CategoryGrid'
import OfficialMallSection from '../components/OfficialMallSection'
import ProductCard from '../components/ProductCard'
import Modal, { PromoModalContent } from '../components/Modal'
import ProductQuickView from '../components/ProductQuickView'
import Footer from '../components/Footer'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import productService from '../services/product'
import recommendationService from '../services/recommendation'
import voucherService from '../services/voucher'
import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const [welcomeVoucher, setWelcomeVoucher] = useState(null)
  const [isClaimingVoucher, setIsClaimingVoucher] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [recLoading, setRecLoading] = useState(true)

  const { isAuthenticated } = useAuthStore()
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
              rating: product.rating != null ? Number(product.rating) : null,
              reviewCount: product.reviewCount != null ? Number(product.reviewCount) : 0,
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

  // Gợi ý cá nhân hóa đa tầng (Shopee-inspired Hybrid RecSys)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) {
        setRecommendations([])
        setRecLoading(false)
        return
      }
      try {
        setRecLoading(true)
        const list = await recommendationService.getPersonalized(8)
        const mapped = (list || []).map((product) => {
          const thumbnailImage = product.images?.find((img) => img.isThumbnail) || product.images?.[0]
          const imageUrl = thumbnailImage?.imageUrl || '/product-placeholder.svg'
          const price = product.basePrice ? Number(product.basePrice) : 0
          return {
            id: product.id,
            name: product.name,
            price,
            image: imageUrl,
            badge: 'Dành cho bạn',
            rating: product.rating != null ? Number(product.rating) : 5.0,
            reviewCount: product.reviewCount != null ? Number(product.reviewCount) : 0,
            description: product.description,
            basePrice: product.basePrice,
            shopName: product.shopName,
            categoryName: product.categoryName,
            conditionGrade: product.conditionGrade,
            warrantyType: product.warrantyType,
            warrantyMonths: product.warrantyMonths,
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

  // Fetch Welcome Platform Voucher (e.g. ECOMNEW15)
  useEffect(() => {
    const fetchWelcomeVoucher = async () => {
      try {
        const res = await voucherService.listVouchers({ scope: 'PLATFORM' })
        const list = res?.content || (Array.isArray(res) ? res : [])
        if (list.length > 0) {
          const match =
            list.find((v) => v.code === 'ECOMNEW15') ||
            list.find((v) => v.isFirstOrderOnly) ||
            list[0]
          if (match) {
            setWelcomeVoucher(match)
          }
        }
      } catch (err) {
        console.warn('Could not fetch welcome voucher:', err)
      }
    }
    fetchWelcomeVoucher()
  }, [isAuthenticated])

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

  const handleClaimWelcomeVoucher = async () => {
    // 1. Nếu chưa đăng nhập: nhắc đăng nhập và chuyển hướng sang /login
    if (!isAuthenticated) {
      const voucherCode = welcomeVoucher?.code || 'ECOMNEW15'
      try {
        sessionStorage.setItem('pendingClaimVoucherCode', voucherCode)
      } catch (e) {
        // ignore storage error
      }
      toast('Vui lòng đăng nhập để lưu mã voucher vào ví!', {
        id: 'voucher-login-required',
      })
      setWelcomeModalOpen(false)
      navigate('/login', { state: { from: '/', autoClaimCode: voucherCode } })
      return
    }

    // 2. Nếu đã đăng nhập và voucher đã có trong ví
    if (welcomeVoucher?.isClaimed) {
      toast.success('Mã đã có sẵn trong ví voucher của bạn!', { id: 'voucher-already-claimed' })
      setWelcomeModalOpen(false)
      return
    }

    // 3. Đã đăng nhập: tìm voucher và claim vào ví
    try {
      setIsClaimingVoucher(true)
      let targetVoucher = welcomeVoucher

      // Fallback nếu welcomeVoucher chưa kịp load vào state
      if (!targetVoucher || !targetVoucher.id) {
        const res = await voucherService.listVouchers({ scope: 'PLATFORM' })
        const list = res?.content || (Array.isArray(res) ? res : [])
        targetVoucher =
          list?.find((v) => v.code === 'ECOMNEW15') ||
          list?.find((v) => v.isFirstOrderOnly) ||
          list?.[0]
      }

      if (!targetVoucher || !targetVoucher.id) {
        toast.error('Không tìm thấy thông tin mã voucher chào mừng', { id: 'voucher-not-found' })
        setWelcomeModalOpen(false)
        return
      }

      if (targetVoucher.isClaimed) {
        toast.success('Mã đã có sẵn trong ví voucher của bạn!', { id: 'voucher-already-claimed' })
        setWelcomeVoucher(targetVoucher)
        setWelcomeModalOpen(false)
        return
      }

      await voucherService.claimVoucher(targetVoucher.id)
      setWelcomeVoucher({ ...targetVoucher, isClaimed: true })
      toast.success(`Đã lưu mã ${targetVoucher.code} vào ví voucher của bạn!`, {
        id: 'voucher-claimed-success',
      })
      setWelcomeModalOpen(false)
    } catch (error) {
      console.error('Error claiming welcome voucher:', error)
      const msg = error?.message || error?.response?.data?.message || 'Không thể lưu mã voucher'
      toast.error(msg, { id: 'voucher-claim-error' })
    } finally {
      setIsClaimingVoucher(false)
    }
  }

  const handleQuickView = (product) => setQuickViewProduct(product)
  const handleQuickViewClose = () => setQuickViewProduct(null)

  const formatVND = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + '₫'
  const oldPriceOf = (p) => Number(p.originalProduct?.originalPrice) || 0
  const lead = products[0]
  const discounted = products.filter((p) => oldPriceOf(p) > p.price)
  const flashDeals = (discounted.length >= 4 ? discounted : products).slice(0, 4)
  const bestSellers = [...products]
    .sort((a, b) => (b.originalProduct?.sold || 0) - (a.originalProduct?.sold || 0))
    .slice(0, 5)
  const topSeller = bestSellers[0]

  const ink = isDark ? 'text-white' : 'text-stone-950'
  const muted = isDark ? 'text-slate-400' : 'text-stone-600'
  const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
  const stage = isDark ? 'bg-slate-800' : 'bg-stone-100'
  const shell = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

  return (
    <div className={cn('flex flex-col gap-16 pt-7', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      {/* 1. Editorial hero + lead product stage */}
      <section className={cn(shell, 'grid items-stretch gap-6 lg:grid-cols-[1fr_1.35fr]')}>
        <div className="flex flex-col justify-center gap-5 py-4">
          <span className={cn('font-mono text-xs uppercase tracking-[0.08em]', muted)}>
            Sàn đồ công nghệ · Ký quỹ Escrow
          </span>
          <h1 className={cn('text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl', ink)}>
            Đồ công nghệ chính hãng. Tiền chỉ đến tay shop khi bạn đã nhận máy.
          </h1>
          <p className={cn('max-w-md text-base leading-relaxed sm:text-lg', muted)}>
            Điện thoại, laptop, âm thanh và máy cũ đã kiểm định từ các gian hàng xác minh eKYC. Thanh toán VNPay hoặc ví, giao bởi GHN.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/products"
              className={cn('rounded-md px-5 py-3.5 text-[15px] font-semibold', isDark ? 'bg-white text-stone-950' : 'bg-stone-950 text-white')}
            >
              Xem sản phẩm
            </Link>
            <Link
              to="/escrow-policy"
              className={cn('rounded-md border px-5 py-3.5 text-[15px] font-semibold', isDark ? 'border-white text-white' : 'border-stone-950 text-stone-950')}
            >
              Ký quỹ hoạt động thế nào
            </Link>
          </div>
        </div>

        <div className={cn('relative flex min-h-[420px] flex-col overflow-hidden rounded-lg p-6 sm:p-8', stage)}>
          <div className="flex justify-between gap-4 font-mono">
            <span className="flex flex-col">
              <span className={cn('text-[11px]', muted)}>GIAN HÀNG</span>
              <strong className={cn('text-base', ink)}>{lead?.shopName || '—'}</strong>
            </span>
            <span className="flex flex-col text-right">
              <span className={cn('text-[11px]', muted)}>ĐÁNH GIÁ</span>
              <strong className={cn('text-base', ink)}>{lead?.rating ? `★ ${Number(lead.rating).toFixed(1)}` : 'Mới'}</strong>
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center py-4">
            <img
              src={lead?.image || '/product-placeholder.svg'}
              alt={lead?.name || ''}
              className={cn('max-h-[300px] w-auto object-contain', !isDark && 'mix-blend-multiply')}
            />
          </div>
          <div className={cn('flex flex-wrap items-end justify-between gap-3 border-t pt-4', isDark ? 'border-slate-700' : 'border-stone-300')}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('line-clamp-1 text-sm', muted)}>{loading ? 'Đang tải…' : lead?.name || 'Chưa có sản phẩm'}</span>
              {lead && <strong className={cn('font-mono text-2xl', ink)}>{formatVND(lead.price)}</strong>}
            </span>
            {lead && (
              <Link to={`/products/${lead.id}`} className={cn('border-b-2 border-amber-500 pb-0.5 text-sm font-bold', ink)}>
                Xem chi tiết
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Categories */}
      <CategoryGrid />

      {/* 3. Flash sale */}
      {flashDeals.length > 0 && (
        <section aria-labelledby="flash-sale" className={shell}>
          <div className="flex flex-col gap-5 rounded-lg bg-stone-950 p-5 text-white sm:p-7 dark:border dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 id="flash-sale" className="text-3xl font-extrabold">Giá tốt hôm nay</h2>
                <FlashClock />
              </div>
              <Link to="/deals" className="text-sm font-semibold text-white hover:underline">
                Xem tất cả ưu đãi →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {flashDeals.map((p) => {
                const was = oldPriceOf(p)
                const off = was > p.price ? Math.round((1 - p.price / was) * 100) : 0
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="flex flex-col gap-2.5 rounded-md bg-white p-3 text-stone-950 dark:bg-slate-800 dark:text-white">
                    <span className="relative block aspect-[4/3] overflow-hidden rounded bg-stone-100 dark:bg-slate-700">
                      <img src={p.image} alt="" className="h-full w-full object-contain p-3 mix-blend-multiply dark:mix-blend-normal" loading="lazy" />
                      {off > 0 && (
                        <span className="absolute left-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 font-mono text-xs font-semibold text-stone-950">−{off}%</span>
                      )}
                    </span>
                    <span className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-snug">{p.name}</span>
                    <span className="flex items-baseline gap-2">
                      <strong className="font-mono text-lg">{formatVND(p.price)}</strong>
                      {off > 0 && <s className="font-mono text-xs text-stone-500 dark:text-slate-400">{formatVND(was)}</s>}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. Shop by need */}
      <section aria-labelledby="by-need" className={shell}>
        <h2 id="by-need" className={cn('text-2xl font-bold sm:text-3xl', ink)}>Chọn theo việc bạn làm</h2>
        <p className={cn('mt-1.5 text-[15px]', muted)}>Không rành cấu hình cũng chọn đúng: mỗi nhóm đã ghi sẵn mức tối thiểu nên có.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NEEDS.map((n) => (
            <Link
              key={n.title}
              to={`/products?search=${encodeURIComponent(n.search)}`}
              className={cn('flex min-h-[220px] flex-col gap-3.5 rounded-lg border p-5 transition-colors', panel, isDark ? 'hover:border-slate-400' : 'hover:border-stone-950')}
            >
              <strong className={cn('font-display text-xl font-bold', ink)}>{n.title}</strong>
              <dl className="flex flex-col gap-2 text-[13px]">
                {n.specs.map(([k, v]) => (
                  <div key={k} className={cn('flex justify-between gap-3 border-b pb-1.5 last:border-0', isDark ? 'border-slate-800' : 'border-stone-100')}>
                    <dt className={muted}>{k}</dt>
                    <dd className={cn('font-mono', ink)}>{v}</dd>
                  </div>
                ))}
              </dl>
              <span className={cn('mt-auto text-sm font-bold', ink)}>{n.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Best sellers: ranked list + feature */}
      {bestSellers.length > 0 && (
        <section aria-labelledby="best-sellers" className={cn(shell, 'grid gap-6 lg:grid-cols-2')}>
          <div className="flex flex-col gap-1.5">
            <h2 id="best-sellers" className={cn('mb-3 text-2xl font-bold sm:text-3xl', ink)}>Bán chạy</h2>
            {bestSellers.map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className={cn('grid grid-cols-[36px_64px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-md border px-3.5 py-2.5', panel)}
              >
                <span className="font-display text-2xl font-extrabold text-stone-400">{i + 1}</span>
                <span className={cn('block h-12 overflow-hidden rounded', stage)}>
                  <img src={p.image} alt="" className={cn('h-full w-full object-contain p-1', !isDark && 'mix-blend-multiply')} loading="lazy" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <strong className={cn('truncate text-[15px] font-semibold', ink)}>{p.name}</strong>
                  <span className={cn('text-xs', muted)}>
                    {p.rating ? `★ ${Number(p.rating).toFixed(1)} · ` : ''}Đã bán {p.originalProduct?.sold || 0}
                  </span>
                </span>
                <strong className={cn('font-mono text-[15px]', ink)}>{formatVND(p.price)}</strong>
              </Link>
            ))}
          </div>
          {topSeller && (
            <Link to={`/products/${topSeller.id}`} className={cn('flex min-h-[400px] flex-col justify-between gap-4 rounded-lg p-7', stage)}>
              <span className={cn('font-mono text-xs uppercase tracking-[0.06em]', muted)}>#1 bán chạy · {topSeller.categoryName || 'Công nghệ'}</span>
              <img src={topSeller.image} alt="" className={cn('mx-auto max-h-[240px] w-auto object-contain', !isDark && 'mix-blend-multiply')} loading="lazy" />
              <span className="flex flex-wrap items-end justify-between gap-3">
                <strong className={cn('font-display text-2xl font-bold', ink)}>{topSeller.name}</strong>
                <strong className={cn('font-mono text-xl', ink)}>{formatVND(topSeller.price)}</strong>
              </span>
            </Link>
          )}
        </section>
      )}

      {/* 6. Verified shops */}
      <OfficialMallSection />

      {/* 7. Brand row */}
      <nav
        aria-label="Thương hiệu"
        className={cn(shell, 'flex w-full flex-wrap justify-between gap-x-8 gap-y-3 border-y py-6 font-display text-2xl font-bold', isDark ? 'border-slate-800' : 'border-stone-200')}
      >
        {BRANDS.map((b) => (
          <Link key={b} to={`/products?search=${encodeURIComponent(b)}`} className="text-stone-400 transition-colors hover:text-stone-950 dark:hover:text-white">
            {b}
          </Link>
        ))}
      </nav>

      {/* 8. Personal recommendations */}
      {recommendations.length > 0 && (
        <section id="recommendations" aria-labelledby="for-you" className={shell}>
          <h2 id="for-you" className={cn('text-2xl font-bold sm:text-3xl', ink)}>Gợi ý cho bạn</h2>
          <p className={cn('mt-1 text-sm', muted)}>Dựa trên danh mục và mức giá bạn hay xem</p>
          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Newest products feed */}
      <section id="daily-discover" aria-labelledby="newest" className={shell}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="newest" className={cn('text-2xl font-bold sm:text-3xl', ink)}>Mới lên kệ</h2>
          <Link to="/products" className={cn('inline-flex items-center gap-1 text-sm font-semibold hover:underline', ink)}>
            Xem tất cả <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn('h-[340px] animate-pulse rounded-lg border', panel)} />
            ))}
          </div>
        ) : error ? (
          <div className={cn('mt-5 flex flex-col items-center gap-3 rounded-lg border py-14 text-center', panel)}>
            <p className={cn('text-sm', muted)}>Không tải được sản phẩm: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className={cn('rounded-md px-5 py-2.5 text-sm font-bold', isDark ? 'bg-white text-stone-950' : 'bg-stone-950 text-white')}
            >
              Thử lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className={cn('mt-5 rounded-lg border py-14 text-center text-sm', panel, muted)}>Chưa có sản phẩm nào được đăng bán.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
            ))}
          </div>
        )}
      </section>

      <Footer />

      {/* Welcome Modal */}
      <Modal open={welcomeModalOpen} onClose={() => setWelcomeModalOpen(false)} title="Chào mừng bạn đến E-Commerce" size="md">
        <PromoModalContent
          image="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=300&fit=crop"
          title={welcomeVoucher?.title || 'Tặng Voucher Giảm 15% Đơn Đầu Tiên'}
          description={
            welcomeVoucher?.description ||
            'Đăng ký hoặc đăng nhập tài khoản E-Commerce và lưu mã ECOMNEW15 khi thanh toán để được giảm 15% (tối đa 100.000đ).'
          }
          code={welcomeVoucher?.code || 'ECOMNEW15'}
          isClaimed={welcomeVoucher?.isClaimed}
          loading={isClaimingVoucher}
          ctaText={isClaimingVoucher ? 'Đang lưu mã...' : welcomeVoucher?.isClaimed ? '✓ Đã có trong ví - Mua sắm ngay' : 'Lưu mã ngay'}
          onCta={handleClaimWelcomeVoucher}
        />
      </Modal>

      {/* Product Quick View Modal */}
      <Modal open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} title={quickViewProduct?.name ?? 'Chi tiết sản phẩm'} size="lg">
        {quickViewProduct && <ProductQuickView product={quickViewProduct} onAddToCart={handleQuickViewClose} />}
      </Modal>
    </div>
  )
}

const NEEDS = [
  { title: 'Học tập', search: 'Laptop', specs: [['CPU', 'Core i5 / Ryzen 5'], ['RAM', '≥ 16 GB'], ['Màn hình', '14″ IPS']], cta: 'Laptop cho sinh viên' },
  { title: 'Đồ họa & dựng phim', search: 'MacBook', specs: [['CPU', 'Core i7 / M3'], ['RAM', '≥ 32 GB'], ['Màn hình', '100% sRGB']], cta: 'Máy cho creator' },
  { title: 'Gaming', search: 'Gaming', specs: [['GPU', 'RTX 4060 trở lên'], ['RAM', '≥ 16 GB'], ['Màn hình', '144 Hz']], cta: 'Laptop gaming' },
  { title: 'Văn phòng', search: 'Văn phòng', specs: [['CPU', 'Core i3 / Ryzen 3'], ['RAM', '≥ 8 GB'], ['Màn hình', 'Full HD']], cta: 'Gọn nhẹ, pin lâu' },
]

const BRANDS = ['Apple', 'Samsung', 'Sony', 'ASUS', 'Dell', 'Logitech', 'Lenovo', 'Xiaomi']

// Countdown to midnight: the daily deals reset each day.
function FlashClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const left = Math.max(0, Math.floor((end.getTime() - now) / 1000))
  const parts = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) => String(n).padStart(2, '0'))
  return (
    <span role="timer" aria-label={`Kết thúc sau ${parts[0]} giờ ${parts[1]} phút`} className="flex items-center gap-1.5 font-mono text-lg font-semibold">
      {parts.map((v, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && ':'}
          <span className="rounded bg-white px-2 py-0.5 text-stone-950">{v}</span>
        </span>
      ))}
    </span>
  )
}
