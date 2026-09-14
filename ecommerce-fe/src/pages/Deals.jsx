import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineFire,
  HiOutlineTicket,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineShoppingBag,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTag,
  HiOutlineSearch,
  HiOutlineViewGrid,
  HiOutlineX,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import voucherService from '../services/voucher'
import productService from '../services/product'
import categoryService from '../services/category'
import ProductCard from '../components/ProductCard'
import Modal from '../components/Modal'
import ProductQuickView from '../components/ProductQuickView'
import { cn } from '../lib/cn'
import Footer from '../components/Footer'

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
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 text-white py-10 sm:py-14 shadow-inner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
                <HiOutlineFire className="h-4 w-4 text-amber-300 animate-bounce" />
                Săn Deal Hot & Kho Mã Giảm Giá
              </span>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Trung Tâm Khuyến Mãi E-commerce
              </h1>
              <p className="mt-2.5 text-xs sm:text-base text-white/90 leading-relaxed">
                Thu thập voucher giảm giá toàn sàn, mã miễn phí vận chuyển GHN và săn deal giảm giá trực tiếp từ các sản phẩm chính hãng.
              </p>
            </div>

            {/* Quick Live Stats Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20">
              <div className="text-center px-2">
                <span className="block text-lg sm:text-2xl font-black text-amber-300">
                  {vouchers.length}
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium">Voucher Sàn</span>
              </div>
              <div className="text-center px-2 border-x border-white/20">
                <span className="block text-lg sm:text-2xl font-black text-amber-300">
                  {products.length}
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium">Sản Phẩm</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-lg sm:text-2xl font-black text-amber-300">
                  {activeCategoryCount}
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium">Ngành Hàng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VOUCHER HUB SECTION (Real Platform Vouchers) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
              <HiOutlineTicket className="h-5 w-5" />
            </span>
            <div>
              <h2 className={cn('text-lg sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Kho Voucher Nổi Bật
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                Lưu mã để tự động áp dụng khi đặt hàng thanh toán
              </p>
            </div>
          </div>

          {/* Voucher filter pills */}
          {vouchers.length > 0 && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 dark:bg-slate-900 p-1 rounded-xl border border-stone-200/80 dark:border-slate-800">
              <button
                onClick={() => setVoucherFilter('ALL')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                )}
              >
                Tất cả ({vouchers.length})
              </button>
              <button
                onClick={() => setVoucherFilter('SHIPPING')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'SHIPPING'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                )}
              >
                Freeship
              </button>
              <button
                onClick={() => setVoucherFilter('DISCOUNT')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'DISCOUNT'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                )}
              >
                Giảm giá
              </button>
            </div>
          )}
        </div>

        {/* Voucher Cards Grid */}
        {loadingVouchers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-36 rounded-2xl border p-5 animate-pulse flex flex-col justify-between',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
              >
                <div className="h-4 w-24 bg-stone-200 dark:bg-slate-800 rounded mb-2"></div>
                <div className="h-5 w-40 bg-stone-200 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-full bg-stone-200 dark:bg-slate-800 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className={cn('text-center py-8 rounded-2xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
            <HiOutlineTicket className="h-10 w-10 mx-auto text-stone-400 mb-2" />
            <p className={cn('text-xs sm:text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Hiện chưa có voucher toàn sàn nào thuộc nhóm này. Bạn có thể xem thêm voucher tại trang từng Shop!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVouchers.map((voucher) => {
              const isCollected = collectedVouchers.has(voucher.code)
              return (
                <div
                  key={voucher.id || voucher.code}
                  className={cn(
                    'relative rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-500/40',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={cn('rounded-lg px-2.5 py-0.5 text-xs font-bold border', voucher.color)}>
                        {voucher.badge}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                        {voucher.expiry}
                      </span>
                    </div>

                    <h3 className={cn('text-sm sm:text-base font-bold line-clamp-1', isDark ? 'text-white' : 'text-stone-900')}>
                      {voucher.title}
                    </h3>

                    <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {voucher.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                      {voucher.code}
                    </span>
                    <button
                      onClick={() => handleCollectVoucher(voucher)}
                      disabled={isCollected}
                      className={cn(
                        'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5',
                        isCollected
                          ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/20'
                          : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-amber-500/20'
                      )}
                    >
                      {isCollected ? (
                        <>
                          <HiOutlineCheck className="h-4 w-4 stroke-[2.5]" />
                          Đã lưu
                        </>
                      ) : (
                        'Lưu mã'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. CATEGORY NAVIGATION & DEALS SECTION (SCALABLE & RESPONSIVE) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Sticky Category Bar Container */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 mb-8 backdrop-blur-md bg-stone-50/90 dark:bg-slate-950/90 border-b border-stone-200/80 dark:border-slate-800/80 transition-all">
          <div className="flex flex-col gap-3">
            {/* Top Toolbar: Heading & Quick Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <HiOutlineTag className="h-4 w-4" />
                </span>
                <h2 className={cn('text-base sm:text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                  Ưu Đãi Theo Ngành Hàng
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Search / Filter toggle button */}
                <div className="relative hidden md:block">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Tìm nhanh ngành hàng..."
                    className={cn(
                      'pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-44 lg:w-56',
                      isDark
                        ? 'border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-500'
                        : 'border-stone-200 bg-white text-stone-800 placeholder-stone-400'
                    )}
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <HiOutlineX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* View All Categories in Modal / Grid */}
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                  )}
                  title="Xem toàn bộ danh mục dạng lưới"
                >
                  <HiOutlineViewGrid className="h-4 w-4 text-amber-500" />
                  <span className="hidden sm:inline">Tất cả ngành hàng</span>
                  <span className="sm:hidden">Tất cả</span>
                  <span className="text-[10px] rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-500 font-bold">
                    {categories.length}
                  </span>
                </button>

                {/* Left/Right scroll buttons for desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => handleCategoryScroll('left')}
                    className={cn(
                      'p-1.5 rounded-lg border transition-colors hover:border-amber-500 text-stone-500 hover:text-amber-500',
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                    )}
                    title="Cuộn sang trái"
                  >
                    <HiOutlineChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCategoryScroll('right')}
                    className={cn(
                      'p-1.5 rounded-lg border transition-colors hover:border-amber-500 text-stone-500 hover:text-amber-500',
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                    )}
                    title="Cuộn sang phải"
                  >
                    <HiOutlineChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Category Pills Bar */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Button "Tất cả" */}
              <button
                onClick={() => setSelectedCategoryId('ALL')}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm',
                  selectedCategoryId === 'ALL'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                    : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                )}
              >
                <span>Tất cả ngành</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                  selectedCategoryId === 'ALL' ? 'bg-white/25 text-white' : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                )}>
                  {products.length}
                </span>
              </button>

              {/* Individual Category Pills */}
              {displayCategories.map((cat) => {
                const count = categoryProductCounts[cat.id] || 0
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm',
                      isSelected
                        ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                        : isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    )}
                  >
                    <span>{cat.name}</span>
                    {count > 0 ? (
                      <span className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                        isSelected ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      )}>
                        {count}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-normal">
                        (0)
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Category Header (When single category is selected) */}
        {selectedCategoryId !== 'ALL' && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Đang xem ngành hàng:
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    ({processedProductsForCategory.length} sản phẩm)
                  </span>
                </div>
                <h3 className={cn('text-lg sm:text-xl font-extrabold', isDark ? 'text-white' : 'text-stone-900')}>
                  {selectedCategoryObj?.name || 'Ngành hàng'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(
                  'text-xs rounded-xl px-3 py-1.5 border font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                  isDark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-stone-200 bg-white text-stone-800'
                )}
              >
                <option value="DEFAULT">Sắp xếp: Mặc định</option>
                <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
                <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
              </select>

              {/* Reset to ALL button */}
              <button
                onClick={() => setSelectedCategoryId('ALL')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
              >
                Về tất cả ngành
              </button>
            </div>
          </div>
        )}

        {/* Product Grid Content */}
        {loadingProducts ? (
          <div className="py-20 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-r-transparent mb-4" />
            <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Đang tải danh sách sản phẩm khuyến mãi...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* Empty Database State */
          <div className={cn('text-center py-16 rounded-3xl border p-8', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
            <HiOutlineShoppingBag className="h-14 w-14 mx-auto text-amber-500/80 mb-3" />
            <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Chưa có sản phẩm nào được đăng bán
            </h3>
            <p className={cn('text-xs sm:text-sm mt-1 max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hệ thống hiện đang cập nhật thêm các sản phẩm và chương trình ưu đãi mới từ các nhà bán hàng.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition-all"
            >
              Khám phá toàn bộ sản phẩm
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : selectedCategoryId !== 'ALL' && processedProductsForCategory.length === 0 ? (
          /* Empty Selected Category State */
          <div className={cn('text-center py-14 rounded-3xl border p-8', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
            <HiOutlineShoppingBag className="h-12 w-12 mx-auto text-stone-400 mb-3" />
            <h3 className={cn('text-base sm:text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Chưa có sản phẩm ưu đãi trong ngành &quot;{selectedCategoryObj?.name}&quot;
            </h3>
            <p className={cn('text-xs sm:text-sm mt-1 max-w-md mx-auto text-stone-500 dark:text-slate-400')}>
              Bạn có thể khám phá các ngành hàng khác đang có nhiều ưu đãi hot bên dưới:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {categories
                .filter((c) => (categoryProductCounts[c.id] || 0) > 0)
                .slice(0, 5)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-bold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
                  >
                    {c.name} ({categoryProductCounts[c.id]})
                  </button>
                ))}
            </div>
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-stone-800 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-stone-900 transition-all"
            >
              Xem tất cả ngành hàng
            </button>
          </div>
        ) : (
          /* Products Grouped By Category */
          <div className="space-y-10 sm:space-y-12">
            {groupedCategories.map((group) => {
              const cat = group.category
              const items = group.items || []

              if (items.length === 0) return null

              const isExpanded = expandedCategories.has(cat.id)
              const visibleItems = selectedCategoryId === 'ALL' && !isExpanded ? items.slice(0, 5) : items

              return (
                <div
                  key={cat.id}
                  className={cn(
                    'rounded-3xl border overflow-hidden p-5 sm:p-7 shadow-sm transition-colors',
                    isDark ? 'border-slate-800 bg-slate-900/80' : 'border-stone-200 bg-white'
                  )}
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                          Ưu đãi ngành
                        </span>
                        <span className="text-xs text-stone-400 font-semibold">{items.length} sản phẩm</span>
                      </div>
                      <h3 className={cn('text-lg sm:text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {cat.id !== 'ALL' && (
                      <Link
                        to={`/products?categoryId=${cat.id}`}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-500 hover:text-amber-600 transition-colors shrink-0"
                      >
                        Xem tất cả trong ngành
                        <HiOutlineArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  {/* Real Product Cards Grid (Links directly to /products/:id) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {visibleItems.map((prod) => (
                      <ProductCard key={prod.id} product={prod} onQuickView={setQuickViewProduct} />
                    ))}
                  </div>

                  {/* Expand / Collapse Toggle if in 'ALL' view and has > 5 products */}
                  {selectedCategoryId === 'ALL' && items.length > 5 && cat.id !== 'ALL' && (
                    <div className="mt-5 text-center pt-2 border-t border-stone-100 dark:border-slate-800/60">
                      <button
                        onClick={() => toggleExpandCategory(cat.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors py-1 px-3 rounded-lg hover:bg-amber-500/10"
                      >
                        {isExpanded ? (
                          <>Thu gọn danh sách</>
                        ) : (
                          <>
                            Xem thêm {items.length - 5} sản phẩm khác của ngành {cat.name}
                            <HiOutlineArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 4. MODAL / DRAWER: VIEW ALL CATEGORIES (Solves huge number of categories cleanly) */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                'relative w-full max-w-2xl max-h-[85vh] rounded-3xl border p-6 shadow-2xl z-10 flex flex-col',
                isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <HiOutlineViewGrid className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-bold">Tất Cả Ngành Hàng ({categories.length})</h3>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Filter inside Modal */}
              <div className="py-4 space-y-3">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Tìm tên ngành hàng..."
                    className={cn(
                      'w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                      isDark ? 'border-slate-800 bg-slate-800 text-slate-200 placeholder-slate-500' : 'border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400'
                    )}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-slate-400 font-medium">
                    <input
                      type="checkbox"
                      checked={onlyAvailableCategories}
                      onChange={(e) => setOnlyAvailableCategories(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Chỉ hiện ngành hàng có sản phẩm ({activeCategoryCount})</span>
                  </label>
                  <span className="text-stone-400">
                    Hiển thị {displayCategories.length} ngành
                  </span>
                </div>
              </div>

              {/* Grid of Categories */}
              <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    setSelectedCategoryId('ALL')
                    setIsCategoryModalOpen(false)
                  }}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between',
                    selectedCategoryId === 'ALL'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : isDark
                        ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                  )}
                >
                  <span className="text-xs font-bold">Tất Cả Ngành Hàng</span>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 mt-1">
                    {products.length} sản phẩm
                  </span>
                </button>

                {displayCategories.map((cat) => {
                  const count = categoryProductCounts[cat.id] || 0
                  const isSelected = selectedCategoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id)
                        setIsCategoryModalOpen(false)
                      }}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : isDark
                            ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                      )}
                    >
                      <span className="text-xs font-bold line-clamp-1">{cat.name}</span>
                      <span className={cn(
                        'text-[11px] mt-1 font-medium',
                        count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-slate-500'
                      )}>
                        {count > 0 ? `${count} sản phẩm` : 'Chưa có deal'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

