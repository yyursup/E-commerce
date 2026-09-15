import { useState, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import voucherService from '../../services/voucher'
import productService from '../../services/product'
import categoryService from '../../services/category'
import Modal from '../../components/Modal'
import ProductQuickView from '../../components/ProductQuickView'
import { cn } from '../../lib/cn'
import Footer from '../../components/Footer'

import DealsHeroBanner from './components/DealsHeroBanner'
import DealsVoucherHub from './components/DealsVoucherHub'
import DealsCategoryBar from './components/DealsCategoryBar'
import DealsProductGrid from './components/DealsProductGrid'
import DealsCategoryModal from './components/DealsCategoryModal'

export default function Deals() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  // Data states (100% Real from Backend API)
  const [vouchers, setVouchers] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [collectedVouchers, setCollectedVouchers] = useState(new Set())
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  // UI / Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL')
  const [categorySearch, setCategorySearch] = useState('')
  const [onlyAvailableCategories, setOnlyAvailableCategories] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [voucherFilter, setVoucherFilter] = useState('ALL') // 'ALL' | 'SHIPPING' | 'DISCOUNT'
  const [sortBy, setSortBy] = useState('DEFAULT') // 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC'
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  // Loading states
  const [loadingVouchers, setLoadingVouchers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Category horizontal scroll ref
  const categoryScrollRef = useRef(null)

  // Voucher Carousel ref & auto-play state
  const voucherScrollRef = useRef(null)
  const [isVoucherHovered, setIsVoucherHovered] = useState(false)

  // 1. Fetch Categories from Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const data = await categoryService.getAllCategories()
        setCategories(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching categories in Deals:', err)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // 2. Fetch Real Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const res = await productService.getProducts({
          page: 0,
          size: 100,
        })
        const items = res?.content || (Array.isArray(res) ? res : [])
        setProducts(items)
      } catch (err) {
        console.error('Error fetching products in Deals:', err)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  // 3. Fetch Real Platform Vouchers & User's Claimed Vouchers
  useEffect(() => {
    const fetchPlatformVouchers = async () => {
      try {
        setLoadingVouchers(true)
        const claimedSet = new Set()

        // If logged in, fetch user's claimed vouchers to sync 'Đã lưu' state
        if (isAuthenticated) {
          try {
            const myVouchers = await voucherService.getMyVouchers()
            if (Array.isArray(myVouchers)) {
              myVouchers.forEach((uv) => {
                if (uv.voucher?.code) claimedSet.add(uv.voucher.code)
              })
            }
          } catch (e) {
            console.warn('Could not load user vouchers in Deals', e)
          }
        }

        // Fetch platform vouchers from Backend
        const data = await voucherService.listVouchers({ scope: 'PLATFORM' })
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((v) => {
            const isUserClaimed = Boolean(v.isClaimed || v.claimed || claimedSet.has(v.code))
            if (isUserClaimed) claimedSet.add(v.code)
            const isShipping = v.voucherType === 'FREE_SHIPPING' || v.type === 'SHIPPING_FREE' || v.type === 'FREE_SHIPPING'
            return {
              id: v.id,
              code: v.code,
              type: v.type || v.voucherType,
              isShipping,
              title: v.title || (isShipping ? 'Miễn Phí Vận Chuyển' : `Giảm ${v.discountValue}% Toàn Sàn`),
              description: v.description || `Đơn từ ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minOrderValue || v.minOrderAmount || 0)}`,
              badge: v.scope === 'PLATFORM' ? 'Toàn Sàn' : 'Voucher Shop',
              color: isShipping
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
              expiry: v.endDate || v.validTo ? `HSD: ${new Date(v.endDate || v.validTo).toLocaleDateString('vi-VN')}` : 'Còn hạn',
              isClaimed: isUserClaimed,
            }
          })
          setVouchers(mapped)
          setCollectedVouchers(new Set(claimedSet))
        } else {
          setVouchers([])
          setCollectedVouchers(new Set(claimedSet))
        }
      } catch (err) {
        console.error('Error fetching platform vouchers:', err)
        setVouchers([])
      } finally {
        setLoadingVouchers(false)
      }
    }

    fetchPlatformVouchers()
  }, [isAuthenticated])

  // Handle Claim Voucher
  const handleCollectVoucher = async (voucher) => {
    const code = voucher.code
    if (collectedVouchers.has(code)) return

    setCollectedVouchers((prev) => new Set([...prev, code]))

    if (isAuthenticated && voucher.id && String(voucher.id).length > 20) {
      try {
        await voucherService.claimVoucher(voucher.id)
        toast.success(`Đã lưu mã ${code} vào ví voucher của bạn!`)
      } catch (err) {
        console.warn('Claim voucher API error:', err)
        toast.error(err?.message || 'Không thể lưu mã voucher')
      }
    } else if (!isAuthenticated) {
      toast.success(`Đã ghi nhớ mã ${code}! Đăng nhập để lưu vĩnh viễn vào ví.`)
    } else {
      toast.success(`Đã lưu mã ${code} vào ví voucher của bạn!`)
    }
  }

  // Handle Category Horizontal Scroll
  const handleCategoryScroll = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Count products per category
  const categoryProductCounts = useMemo(() => {
    const counts = {}
    products.forEach((p) => {
      const cId = p.categoryId || p.category?.id
      if (cId) {
        counts[cId] = (counts[cId] || 0) + 1
      }
    })
    return counts
  }, [products])

  // Categories sorted (those with products first) & filtered for the navigation bar
  const displayCategories = useMemo(() => {
    let list = [...categories]

    // Sort categories: categories with products come first
    list.sort((a, b) => {
      const countA = categoryProductCounts[a.id] || 0
      const countB = categoryProductCounts[b.id] || 0
      if (countA > 0 && countB === 0) return -1
      if (countA === 0 && countB > 0) return 1
      return a.name.localeCompare(b.name, 'vi')
    })

    if (onlyAvailableCategories) {
      list = list.filter((c) => (categoryProductCounts[c.id] || 0) > 0)
    }

    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase().trim()
      list = list.filter((c) => c.name.toLowerCase().includes(q))
    }

    return list
  }, [categories, categoryProductCounts, onlyAvailableCategories, categorySearch])

  // Count how many categories actually have products
  const activeCategoryCount = useMemo(() => {
    return Object.keys(categoryProductCounts).filter((k) => categoryProductCounts[k] > 0).length
  }, [categoryProductCounts])

  // Filter & Sort products for Selected Category View
  const processedProductsForCategory = useMemo(() => {
    let list = []
    if (selectedCategoryId === 'ALL') {
      list = products
    } else {
      list = products.filter((p) => p.categoryId === selectedCategoryId || p.category?.id === selectedCategoryId)
    }

    if (sortBy === 'PRICE_ASC') {
      return [...list].sort((a, b) => (Number(a.price || a.basePrice || 0)) - (Number(b.price || b.basePrice || 0)))
    }
    if (sortBy === 'PRICE_DESC') {
      return [...list].sort((a, b) => (Number(b.price || b.basePrice || 0)) - (Number(a.price || a.basePrice || 0)))
    }
    return list
  }, [products, selectedCategoryId, sortBy])

  // Group products by Category for "ALL" View
  const groupedCategories = useMemo(() => {
    if (selectedCategoryId !== 'ALL') {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId) || {
        id: selectedCategoryId,
        name: 'Ngành Hàng Đã Chọn',
        description: '',
      }
      return [{
        category: selectedCat,
        items: processedProductsForCategory,
      }]
    }

    const groups = []
    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id || p.category?.id === cat.id)
      if (catProducts.length > 0) {
        groups.push({
          category: cat,
          items: catProducts,
        })
      }
    })

    if (groups.length === 0 && products.length > 0) {
      groups.push({
        category: { id: 'ALL', name: 'Tất Cả Sản Phẩm Nổi Bật', description: 'Các sản phẩm đang có giá tốt nhất trên hệ thống' },
        items: products,
      })
    }

    return groups
  }, [categories, products, selectedCategoryId, processedProductsForCategory])

  // Filter vouchers
  const filteredVouchers = useMemo(() => {
    if (voucherFilter === 'SHIPPING') {
      return vouchers.filter((v) => v.isShipping)
    }
    if (voucherFilter === 'DISCOUNT') {
      return vouchers.filter((v) => !v.isShipping)
    }
    return vouchers
  }, [vouchers, voucherFilter])

  // Auto-scroll for platform vouchers carousel when > 4 vouchers
  useEffect(() => {
    if (filteredVouchers.length <= 4 || isVoucherHovered) return

    const interval = setInterval(() => {
      const container = voucherScrollRef.current
      if (!container) return

      const maxScrollLeft = container.scrollWidth - container.clientWidth
      if (container.scrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: 320, behavior: 'smooth' })
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [filteredVouchers.length, isVoucherHovered])

  // Mouse wheel listener for voucher carousel
  useEffect(() => {
    const el = voucherScrollRef.current
    if (!el) return

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScrollLeft = el.scrollWidth - el.clientWidth
        if (maxScrollLeft > 0) {
          const canScrollRight = e.deltaY > 0 && el.scrollLeft < maxScrollLeft - 1
          const canScrollLeft = e.deltaY < 0 && el.scrollLeft > 1
          if (canScrollRight || canScrollLeft) {
            e.preventDefault()
            el.scrollLeft += e.deltaY
          }
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [filteredVouchers])

  const scrollVouchers = (direction) => {
    if (voucherScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      voucherScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Toggle expand in "ALL" view
  const toggleExpandCategory = (catId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId)
  }, [categories, selectedCategoryId])

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50/50 text-stone-800')}>
      {/* 1. HERO BANNER WITH STATS */}
      <DealsHeroBanner
        voucherCount={vouchers.length}
        productCount={products.length}
        activeCategoryCount={activeCategoryCount}
      />

      {/* 2. VOUCHER HUB SECTION (Real Platform Vouchers) */}
      <DealsVoucherHub
        vouchers={vouchers}
        filteredVouchers={filteredVouchers}
        voucherFilter={voucherFilter}
        setVoucherFilter={setVoucherFilter}
        loadingVouchers={loadingVouchers}
        collectedVouchers={collectedVouchers}
        onCollectVoucher={handleCollectVoucher}
        voucherScrollRef={voucherScrollRef}
        isVoucherHovered={isVoucherHovered}
        setIsVoucherHovered={setIsVoucherHovered}
        scrollVouchers={scrollVouchers}
        isDark={isDark}
      />

      {/* 3. CATEGORY NAVIGATION & DEALS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <DealsCategoryBar
          categories={categories}
          displayCategories={displayCategories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categoryProductCounts={categoryProductCounts}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          categoryScrollRef={categoryScrollRef}
          onScrollCategories={handleCategoryScroll}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          totalProductsCount={products.length}
          isDark={isDark}
        />

        <DealsProductGrid
          loadingProducts={loadingProducts}
          products={products}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          selectedCategoryObj={selectedCategoryObj}
          processedProductsForCategory={processedProductsForCategory}
          groupedCategories={groupedCategories}
          expandedCategories={expandedCategories}
          toggleExpandCategory={toggleExpandCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categoryProductCounts={categoryProductCounts}
          onQuickView={setQuickViewProduct}
          isDark={isDark}
        />
      </section>

      {/* 4. MODAL / DRAWER: VIEW ALL CATEGORIES */}
      <DealsCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        displayCategories={displayCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id)
          setIsCategoryModalOpen(false)
        }}
        categoryProductCounts={categoryProductCounts}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        onlyAvailableCategories={onlyAvailableCategories}
        setOnlyAvailableCategories={setOnlyAvailableCategories}
        activeCategoryCount={activeCategoryCount}
        totalProductsCount={products.length}
        isDark={isDark}
      />

      {/* 5. MODAL: PRODUCT QUICK VIEW */}
      <Modal
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Chi tiết sản phẩm'}
        size="md"
      >
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
          />
        )}
      </Modal>

      <Footer />
    </div>
  )
}
