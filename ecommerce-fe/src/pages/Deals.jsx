import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineFire, HiOutlineClock, HiOutlineTag, HiOutlineArrowRight } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

// Mock data for deals
const mockDeals = [
  {
    id: 'deal-1',
    title: 'Flash Sale AirPods Pro',
    description: 'Giảm giá sốc AirPods Pro (2nd gen). Số lượng có hạn!',
    discount: 40,
    originalPrice: 5990000,
    salePrice: 3594000,
    image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=800&h=400&fit=crop',
    badge: 'Hot',
    endDate: '2024-12-31T23:59:59',
    products: [
      {
        id: 'product-1',
        name: 'AirPods Pro (2nd gen)',
        price: 3594000,
        oldPrice: 5990000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'Sale',
        rating: 4.8,
      },
      {
        id: 'product-2',
        name: 'AirPods Pro (1st gen)',
        price: 2990000,
        oldPrice: 4990000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'Sale',
        rating: 4.6,
      },
    ],
  },
  {
    id: 'deal-2',
    title: 'Miễn phí giao hàng',
    description: 'Miễn phí giao hàng cho đơn hàng từ 500.000đ. Không cần mã!',
    discount: 0,
    originalPrice: 0,
    salePrice: 0,
    image: 'https://images.unsplash.com/photo-1624258919367-5dc28f5dc293?w=800&h=400&fit=crop',
    badge: 'Free',
    endDate: '2024-12-31T23:59:59',
    products: [
      {
        id: 'product-3',
        name: 'AirPods Max',
        price: 12990000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'Bestseller',
        rating: 4.9,
      },
      {
        id: 'product-4',
        name: 'AirPods (3rd gen)',
        price: 4490000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'New',
        rating: 4.7,
      },
    ],
  },
  {
    id: 'deal-3',
    title: 'Combo AirPods + Case',
    description: 'Mua AirPods kèm case bảo vệ. Tiết kiệm đến 200.000đ!',
    discount: 15,
    originalPrice: 0,
    salePrice: 0,
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop',
    badge: 'Combo',
    endDate: '2024-12-25T23:59:59',
    products: [
      {
        id: 'product-5',
        name: 'AirPods Pro + Case',
        price: 3794000,
        oldPrice: 4494000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'Combo',
        rating: 4.8,
      },
    ],
  },
  {
    id: 'deal-4',
    title: 'Black Friday Sale',
    description: 'Giảm giá lên đến 50% cho tất cả sản phẩm AirPods!',
    discount: 50,
    originalPrice: 0,
    salePrice: 0,
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop',
    badge: 'Limited',
    endDate: '2024-11-30T23:59:59',
    products: [
      {
        id: 'product-6',
        name: 'AirPods Max Premium',
        price: 6495000,
        oldPrice: 12990000,
        image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
        badge: 'Sale',
        rating: 5.0,
      },
    ],
  },
]

const dealCategories = [
  { id: 'all', label: 'Tất cả', count: mockDeals.length },
  { id: 'flash', label: 'Flash Sale', count: 1 },
  { id: 'free', label: 'Miễn phí', count: 1 },
  { id: 'combo', label: 'Combo', count: 1 },
  { id: 'limited', label: 'Giới hạn', count: 1 },
]

export default function Deals() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDeal, setSelectedDeal] = useState(null)

  const filteredDeals = selectedCategory === 'all' 
    ? mockDeals 
    : mockDeals.filter(deal => {
        if (selectedCategory === 'flash') return deal.badge === 'Hot'
        if (selectedCategory === 'free') return deal.badge === 'Free'
        if (selectedCategory === 'combo') return deal.badge === 'Combo'
        if (selectedCategory === 'limited') return deal.badge === 'Limited'
        return true
      })

  const formatTimeRemaining = (endDate) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end - now

    if (diff <= 0) return 'Đã kết thúc'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `Còn ${days} ngày`
    if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`
    return `Còn ${minutes} phút`
  }

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Hot':
        return 'bg-red-500 text-white'
      case 'Free':
        return 'bg-emerald-500 text-white'
      case 'Combo':
        return 'bg-purple-500 text-white'
      case 'Limited':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-amber-500 text-white'
    }
  }

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      {/* Header */}
      <section className={cn('border-b', isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-white')}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <HiOutlineFire className="h-5 w-5" />
                Ưu đãi đặc biệt
              </div>
              <h1
                className={cn(
                  'text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Khuyến mãi & Ưu đãi
              </h1>
              <p className={cn('mt-4 text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Khám phá các ưu đãi hấp dẫn nhất dành cho bạn
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dealCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
                  selectedCategory === category.id
                    ? 'bg-amber-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                )}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Deals Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {filteredDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl border transition-all duration-300',
                isDark
                  ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20'
                  : 'border-stone-200 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10',
              )}
            >
              {/* Badge */}
              <div className="absolute left-4 top-4 z-10">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
                    getBadgeColor(deal.badge),
                  )}
                >
                  {deal.badge === 'Hot' && <HiOutlineFire className="h-3 w-3" />}
                  {deal.badge === 'Free' && <HiOutlineTag className="h-3 w-3" />}
                  {deal.discount > 0 && `-${deal.discount}%`}
                </span>
              </div>

              {/* Timer */}
              <div className="absolute right-4 top-4 z-10">
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                    isDark ? 'bg-slate-900/80 text-slate-200' : 'bg-white/90 text-stone-700',
                  )}
                >
                  <HiOutlineClock className="h-3 w-3" />
                  {formatTimeRemaining(deal.endDate)}
                </div>
              </div>

              {/* Banner Image */}
              <div className="relative h-48 overflow-hidden sm:h-56">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = '/product-placeholder.svg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white">{deal.title}</h3>
                  <p className="mt-1 text-sm text-white/90">{deal.description}</p>
                </div>
              </div>

              {/* Products */}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    Sản phẩm trong ưu đãi
                  </h4>
                  <button
                    onClick={() => setSelectedDeal(selectedDeal === deal.id ? null : deal.id)}
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium transition-colors',
                      isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700',
                    )}
                  >
                    {selectedDeal === deal.id ? 'Thu gọn' : 'Xem tất cả'}
                    <HiOutlineArrowRight
                      className={cn('h-3 w-3 transition-transform', selectedDeal === deal.id && 'rotate-90')}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {selectedDeal === deal.id ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        {deal.products.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            dataAos="fade-up"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {deal.products.slice(0, 2).map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          dataAos="fade-up"
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* CTA Button */}
                <Link
                  to="/products"
                  className={cn(
                    'mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
                    'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20',
                  )}
                >
                  Xem tất cả sản phẩm
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <HiOutlineTag className={cn('mb-4 h-16 w-16', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('text-lg font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Không có ưu đãi nào trong danh mục này
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'mt-4 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
              )}
            >
              Xem tất cả ưu đãi
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
