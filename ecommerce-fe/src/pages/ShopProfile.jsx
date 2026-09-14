import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineUserAdd,
  HiOutlineCheck,
  HiOutlineChat,
  HiOutlineLocationMarker,
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineTicket,
  HiOutlineInformationCircle,
  HiOutlineShare,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import ProductCard from '../components/ProductCard'
import ReportActionButton from '../components/ReportActionButton'
import Footer from '../components/Footer'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import shopService from '../services/shop'
import productService from '../services/product'

export default function ShopProfile() {
  const { shopId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [shop, setShop] = useState(null)
  const [loadingShop, setLoadingShop] = useState(true)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Interactive States
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('ALL_PRODUCTS') // 'HOME' | 'ALL_PRODUCTS' | 'ABOUT'
  const [sortBy, setSortBy] = useState('popular') // 'popular' | 'newest' | 'bestseller' | 'price_asc' | 'price_desc'
  const [searchInShop, setSearchInShop] = useState('')
  const [savedVouchers, setSavedVouchers] = useState({})

  // Fetch shop details
  useEffect(() => {
    const loadShopData = async () => {
      try {
        setLoadingShop(true)
        const data = await shopService.getShopById(shopId)
        setShop(data)
      } catch (err) {
        console.error('Error loading shop:', err)
      } finally {
        setLoadingShop(false)
      }
    }
    loadShopData()
  }, [shopId])

  // Fetch shop products
  useEffect(() => {
    const loadShopProducts = async () => {
      try {
        setLoadingProducts(true)
        // Try fetching products by shopId
        const res = await productService.getProducts({
          shopId: shopId?.length > 20 ? shopId : undefined,
          page: 0,
          size: 40,
        })
        const items = res?.content || []
        let rawList = items
        if (rawList.length === 0) {
          // If no products returned by this shopId, load all published products as fallback demo
          const allRes = await productService.getProducts({ page: 0, size: 40 })
          rawList = allRes?.content || []
        }

        const mapped = rawList.map((p) => {
          const thumb = p.images?.find((img) => img.isThumbnail) || p.images?.[0]
          const imageUrl = thumb?.imageUrl || (typeof thumb === 'string' ? thumb : '/product-placeholder.svg')
          const parsedPrice =
            p.basePrice !== undefined && p.basePrice !== null
              ? Number(p.basePrice)
              : p.price !== undefined && p.price !== null
              ? Number(p.price)
              : 0

          return {
            ...p,
            id: p.id,
            name: p.name,
            image: imageUrl,
            price: parsedPrice,
            basePrice: p.basePrice,
            badge: p.status === 'PUBLISHED' ? 'Chính hãng' : null,
            rating: p.rating || 4.8,
            shopName: p.shopName || shop?.name || 'Shop',
            shopId: p.shopId || shopId,
            originalProduct: p,
          }
        })
        setProducts(mapped)
      } catch (err) {
        console.warn('Error loading products for shop:', err)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    loadShopProducts()
  }, [shopId, shop?.name])

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (searchInShop.trim()) {
      const q = searchInShop.toLowerCase()
      list = list.filter((p) => p.name?.toLowerCase().includes(q))
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price ?? a.basePrice) || 0) - (Number(b.price ?? b.basePrice) || 0))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price ?? b.basePrice) || 0) - (Number(a.price ?? a.basePrice) || 0))
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }

    return list
  }, [products, searchInShop, sortBy])

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev
      if (next) {
        toast.success(`Đã theo dõi ${shop?.name || 'Shop'}`)
      } else {
        toast('Đã hủy theo dõi', { icon: '👋' })
      }
      return next
    })
  }

  const handleSaveVoucher = (code) => {
    setSavedVouchers((prev) => ({ ...prev, [code]: true }))
    toast.success(`Đã lưu mã giảm giá ${code} vào ví của bạn!`)
  }

  const handleShareShop = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết cửa hàng!')
    }
  }

  if (loadingShop) {
    return (
      <div className={cn('min-h-screen py-24 flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className={cn('mt-4 text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Đang tải thông tin gian hàng...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-100')}>
      {/* 1. SHOP HEADER SECTION (Shopee Profile Banner) */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        {/* Blurred Cover Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={shop?.cover}
            alt={shop?.name}
            className="h-full w-full object-cover blur-md scale-105 opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Card: Avatar + Name + Actions (Shopee Style Box) */}
            <div className="lg:col-span-5 bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white">
                  <img src={shop?.logo} alt={shop?.name} className="h-full w-full object-cover" />
                </div>
                {shop?.mallBadge && (
                  <span className="absolute -bottom-2 -right-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow">
                    E-Mall
                  </span>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-black tracking-tight text-white">{shop?.name}</h1>
                  {shop?.ekycVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[11px] font-bold border border-emerald-500/30">
                      <HiOutlineBadgeCheck className="h-3.5 w-3.5" />
                      eKYC
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hoạt động 10 phút trước</span>
                  <span>•</span>
                  <span className="truncate">{shop?.city}</span>
                </div>

                {/* Buttons: Follow + Chat + Report */}
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={handleFollowToggle}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm',
                      isFollowing
                        ? 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <HiOutlineCheck className="h-4 w-4" />
                        Đang theo dõi
                      </>
                    ) : (
                      <>
                        <HiOutlineUserAdd className="h-4 w-4" />
                        + Theo Dõi
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toast.success('Đang kết nối trung tâm chat với người bán...')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                  >
                    <HiOutlineChat className="h-4 w-4 text-amber-400" />
                    Chat Ngay
                  </button>

                  <button
                    onClick={handleShareShop}
                    className="p-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-colors"
                    title="Chia sẻ gian hàng"
                  >
                    <HiOutlineShare className="h-4 w-4" />
                  </button>

                  <ReportActionButton
                    targetId={shop?.id}
                    targetType="SHOP"
                    targetName={shop?.name}
                    label="Báo cáo"
                    variant="chip"
                  />
                </div>
              </div>
            </div>

            {/* Right Stats Grid (Shopee Metrics Grid) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineShoppingBag className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-slate-400 text-xs">Sản phẩm</div>
                  <div className="font-bold text-white text-base">{shop?.productCount || products.length}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineStar className="h-5 w-5 fill-amber-400" />
                </span>
                <div>
                  <div className="text-slate-400 text-xs">Đánh Giá</div>
                  <div className="font-bold text-white text-base">
                    {shop?.rating} <span className="text-xs text-slate-400 font-normal">({shop?.reviewCount})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineClock className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-slate-400 text-xs">Tỉ Lệ Phản Hồi</div>
                  <div className="font-bold text-white text-base">{shop?.responseRate || '99%'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineClock className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-slate-400 text-xs">Thời Gian Phản Hồi</div>
                  <div className="font-bold text-white text-base">{shop?.responseTime || 'trong vài phút'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineBadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-slate-400 text-xs">Tham Gia Sàn</div>
                  <div className="font-bold text-white text-base">{shop?.joinedTime || '1 năm trước'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shrink-0">
                  <HiOutlineLocationMarker className="h-5 w-5" />
                </span>
                <div className="truncate">
                  <div className="text-slate-400 text-xs">Kho Gửi Hàng GHN</div>
                  <div className="font-bold text-white text-base truncate">{shop?.city || 'Hà Nội'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP VOUCHERS STRIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-4 relative z-20">
        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
              <HiOutlineTicket className="h-5 w-5" />
            </span>
            <div>
              <span className="text-sm font-bold block text-rose-500">Mã Giảm Giá Độc Quyền Của Shop</span>
              <span className="text-xs text-stone-500 dark:text-slate-400">Thu thập voucher để áp dụng khi thanh toán đơn hàng tại shop này</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
              { code: 'SHOP15K', text: 'Giảm 15k đơn từ 150k', hsd: 'HSD: 30 ngày' },
              { code: 'SHOP30K', text: 'Giảm 30k đơn từ 300k', hsd: 'HSD: 15 ngày' },
              { code: 'VIP10', text: 'Giảm 10% tối đa 100k', hsd: 'Freeship GHN' },
            ].map((v) => (
              <div
                key={v.code}
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-dashed px-3 py-2 text-xs transition-all',
                  isDark ? 'border-amber-500/40 bg-amber-500/5' : 'border-amber-500/50 bg-amber-50/60'
                )}
              >
                <div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">{v.text}</div>
                  <div className="text-[10px] text-stone-400 dark:text-slate-500">{v.hsd}</div>
                </div>
                <button
                  onClick={() => handleSaveVoucher(v.code)}
                  disabled={savedVouchers[v.code]}
                  className={cn(
                    'rounded-lg px-2.5 py-1 font-bold text-[11px] transition-colors',
                    savedVouchers[v.code]
                      ? 'bg-stone-200 dark:bg-slate-800 text-stone-400 cursor-not-allowed'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  )}
                >
                  {savedVouchers[v.code] ? 'Đã lưu' : 'Lưu'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS (Shopee Tabs) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div
          className={cn(
            'flex items-center border-b px-2 gap-8 text-sm font-bold',
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
          )}
        >
          <button
            onClick={() => setActiveTab('ALL_PRODUCTS')}
            className={cn(
              'py-4 border-b-2 transition-all cursor-pointer uppercase tracking-wide',
              activeTab === 'ALL_PRODUCTS'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            Tất Cả Sản Phẩm ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('HOME')}
            className={cn(
              'py-4 border-b-2 transition-all cursor-pointer uppercase tracking-wide',
              activeTab === 'HOME'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            Dạo Shop & Ưu Đãi
          </button>

          <button
            onClick={() => setActiveTab('ABOUT')}
            className={cn(
              'py-4 border-b-2 transition-all cursor-pointer uppercase tracking-wide',
              activeTab === 'ABOUT'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            Hồ Sơ & Định Danh Shop
          </button>
        </div>
      </section>

      {/* 4. MAIN CONTENT BY TAB */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: ALL PRODUCTS */}
        {activeTab === 'ALL_PRODUCTS' && (
          <div className="space-y-6">
            {/* Shopee Sort & Filter Bar */}
            <div
              className={cn(
                'flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              {/* Sort pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 mr-2">Sắp xếp theo:</span>
                {[
                  { id: 'popular', label: 'Phổ biến' },
                  { id: 'newest', label: 'Mới nhất' },
                  { id: 'price_asc', label: 'Giá: Thấp → Cao' },
                  { id: 'price_desc', label: 'Giá: Cao → Thấp' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSortBy(item.id)}
                    className={cn(
                      'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
                      sortBy === item.id
                        ? 'bg-amber-500 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* In-Shop Search Bar */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Tìm trong Shop này..."
                  value={searchInShop}
                  onChange={(e) => setSearchInShop(e.target.value)}
                  className={cn(
                    'w-full rounded-xl pl-9 pr-4 py-2 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400'
                      : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400'
                  )}
                />
                <HiOutlineSearch className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
                <p className="mt-3 text-xs text-stone-500">Đang tải sản phẩm của gian hàng...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-stone-300 dark:border-slate-800 p-8">
                <HiOutlineShoppingBag className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-stone-700 dark:text-slate-300">Không tìm thấy sản phẩm nào</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
                  Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ gian hàng.
                </p>
                {searchInShop && (
                  <button
                    onClick={() => setSearchInShop('')}
                    className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DẠO SHOP (SHOP HIGHLIGHTS) */}
        {activeTab === 'HOME' && (
          <div className="space-y-8">
            {/* Promo Banner inside Shop */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-8 text-white shadow-xl">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3">
                  <HiOutlineTag className="h-4 w-4" />
                  Ưu Đãi Đặc Biệt Từ Gian Hàng
                </span>
                <h2 className="text-2xl sm:text-4xl font-black">Khám Phá Bộ Sưu Tập Mới Nhất</h2>
                <p className="mt-2 text-sm text-white/90">
                  Tận hưởng giảm giá đến 30%, tích lũy voucher và chính sách ký quỹ bảo đảm tài chính Escrow.
                </p>
                <button
                  onClick={() => setActiveTab('ALL_PRODUCTS')}
                  className="mt-5 rounded-2xl bg-white px-6 py-2.5 text-xs font-black text-amber-600 hover:bg-amber-50 shadow-md transition-all active:scale-95"
                >
                  Mua sắm ngay
                </button>
              </div>
            </div>

            {/* Featured Products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Sản Phẩm Bán Chạy Nhất Của Shop
                </h3>
                <button
                  onClick={() => setActiveTab('ALL_PRODUCTS')}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  Xem tất cả ({products.length}) &gt;
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {products.slice(0, 6).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HỒ SƠ & GIỚI THIỆU SHOP */}
        {activeTab === 'ABOUT' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div
              className={cn(
                'lg:col-span-2 rounded-3xl border p-6 sm:p-8 space-y-6 shadow-sm',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <div>
                <h3 className={cn('text-lg font-bold mb-2', isDark ? 'text-white' : 'text-stone-900')}>
                  Giới thiệu gian hàng
                </h3>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300 whitespace-pre-line">
                  {shop?.description}
                </p>
              </div>

              <div className="border-t border-stone-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className={cn('text-sm font-bold uppercase tracking-wider', isDark ? 'text-amber-400' : 'text-amber-600')}>
                  Cam kết dịch vụ & bảo vệ khách hàng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <HiOutlineShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white">Ký Quỹ Escrow An Toàn 100%</div>
                      <div className="text-stone-500 dark:text-slate-400 mt-0.5">Tiền giữ trong ví sàn cho đến khi bạn nhận và hài lòng với hàng.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <HiOutlineTruck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white">Giao Hàng Nhanh (GHN Express)</div>
                      <div className="text-stone-500 dark:text-slate-400 mt-0.5">Lấy hàng trực tiếp từ kho shop, giao toàn quốc trong 24-48h.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Legal & Contact Box */}
            <div
              className={cn(
                'rounded-3xl border p-6 space-y-4 shadow-sm h-fit',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <h3 className={cn('text-sm font-bold uppercase tracking-wider', isDark ? 'text-white' : 'text-stone-900')}>
                Thông tin xác thực
              </h3>
              <div className="space-y-3 text-xs text-stone-600 dark:text-slate-400">
                <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800">
                  <span>Chủ gian hàng:</span>
                  <span className="font-semibold text-stone-900 dark:text-white">{shop?.sellerName || 'Đã xác thực'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800">
                  <span>Định danh eKYC:</span>
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <HiOutlineBadgeCheck className="h-4 w-4" /> Đã duyệt VNPT eKYC
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800">
                  <span>Loại hình:</span>
                  <span className="font-semibold text-stone-900 dark:text-white">{shop?.mallBadge ? 'Doanh Nghiệp / E-Mall' : 'Cá nhân uy tín'}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-stone-100 dark:border-slate-800">
                  <span>Địa chỉ kho lấy hàng:</span>
                  <span className="font-semibold text-stone-900 dark:text-white text-right max-w-[180px]">{shop?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tỉ lệ đánh giá tích cực:</span>
                  <span className="font-bold text-amber-500">98.5% (Tốt)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
