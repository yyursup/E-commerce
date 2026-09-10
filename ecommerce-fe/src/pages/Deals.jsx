import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineFire,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineTicket,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import Footer from '../components/Footer'

// Kho Voucher Sàn E-commerce
const platformVouchers = [
  {
    id: 'v-1',
    code: 'FREESHIP50',
    type: 'SHIPPING',
    title: 'Miễn Phí Vận Chuyển GHN',
    description: 'Giảm tối đa 50.000đ cước giao hàng GHN cho đơn hàng từ 250.000đ',
    badge: 'Freeship Xtra',
    color: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    expiry: 'Còn 3 ngày',
  },
  {
    id: 'v-2',
    code: 'ECOMNEW15',
    type: 'DISCOUNT',
    title: 'Giảm 15% Đơn Đầu Tiên',
    description: 'Ưu đãi dành riêng cho khách hàng mới, giảm tối đa 100.000đ toàn sàn',
    badge: 'Khách Hàng Mới',
    color: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    expiry: 'HSD: 30 ngày',
  },
  {
    id: 'v-3',
    code: 'TECH500',
    type: 'CATEGORY',
    title: 'Giảm 500.000đ Đồ Công Nghệ',
    description: 'Áp dụng cho Laptop, Điện thoại, Máy tính bảng và Âm thanh từ 8 triệu',
    badge: 'Đồ Điện Tử',
    color: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    expiry: 'Số lượng có hạn',
  },
  {
    id: 'v-4',
    code: 'FASHION30',
    type: 'CATEGORY',
    title: 'Giảm 30.000đ Thời Trang',
    description: 'Áp dụng cho Quần áo, Giày dép, Túi ví cho đơn hàng từ 200.000đ',
    badge: 'Thời Trang',
    color: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    expiry: 'Hôm nay',
  },
]

// Các chương trình Flash Sale & Mega Deals đa ngành
const multiCategoryDeals = [
  {
    id: 'deal-tech',
    title: 'Siêu Sale Công Nghệ Apple Official',
    description: 'iPhone 15 Pro Max, MacBook Air M3, AirPods Pro 2 giảm đến 25%',
    discount: 25,
    category: 'Điện Tử & Công Nghệ',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    badge: 'Mall Giảm Sốc',
    products: [
      {
        name: 'iPhone 15 Pro Max 256GB VN/A',
        price: 29490000,
        oldPrice: 34990000,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
        shopName: 'Apple Authorised Reseller',
      },
      {
        name: 'Tai nghe Apple AirPods Pro 2 Type-C',
        price: 5690000,
        oldPrice: 6790000,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop',
        shopName: 'Apple Authorised Reseller',
      },
    ],
  },
  {
    id: 'deal-fashion',
    title: 'Lễ Hội Thời Trang Trẻ Streetwear',
    description: 'Áo thun cotton, Quần jean slimfit, Áo khoác bomber giảm đến 40%',
    discount: 40,
    category: 'Thời Trang & Phụ Kiện',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    badge: 'Đồng Giá 199K',
    products: [
      {
        name: 'Áo Thun Nam Cotton 100% Co Giãn',
        price: 189000,
        oldPrice: 280000,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=400&fit=crop',
        shopName: 'Trendy Fashion Studio',
      },
      {
        name: 'Quần Jean Nam Slimfit Cao Cấp',
        price: 399000,
        oldPrice: 550000,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
        shopName: 'Trendy Fashion Studio',
      },
    ],
  },
  {
    id: 'deal-home',
    title: 'Gian Bếp Tiện Nghi Cùng Sunhouse',
    description: 'Nồi chiên không dầu điện tử, Máy xay sinh tố, Nồi cơm niêu cao cấp',
    discount: 35,
    category: 'Nhà Cửa & Đời Sống',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop',
    badge: 'Gia Dụng Bán Chạy',
    products: [
      {
        name: 'Nồi Chiên Không Dầu Sunhouse 6.0L',
        price: 1490000,
        oldPrice: 2190000,
        image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=400&fit=crop',
        shopName: 'Sunhouse Home Official',
      },
      {
        name: 'Bộ 3 Chảo Chống Dính Vân Đá Đáy Từ',
        price: 480000,
        oldPrice: 690000,
        image: 'https://images.unsplash.com/photo-1584990347449-389369d72728?w=400&h=400&fit=crop',
        shopName: 'Sunhouse Home Official',
      },
    ],
  },
  {
    id: 'deal-books',
    title: 'Hội Sách Tri Thức Nhã Nam',
    description: 'Sách Đắc Nhân Tâm, Nhà Giả Kim, Tâm Lý Học Tội Phạm giảm đồng loạt',
    discount: 30,
    category: 'Sách & Văn Phòng Phẩm',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=400&fit=crop',
    badge: 'Sách Hay Khuyên Đọc',
    products: [
      {
        name: 'Sách Đắc Nhân Tâm (Khổ Lớn Mới)',
        price: 98000,
        oldPrice: 138000,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
        shopName: 'Nhã Nam Books & Stationery',
      },
      {
        name: 'Sách Nhà Giả Kim - Paulo Coelho',
        price: 79000,
        oldPrice: 109000,
        image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop',
        shopName: 'Nhã Nam Books & Stationery',
      },
    ],
  },
]

export default function Deals() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [collectedVouchers, setCollectedVouchers] = useState(new Set())
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')

  const handleCollectVoucher = (code) => {
    setCollectedVouchers((prev) => new Set([...prev, code]))
    toast.success(`Đã lưu mã ${code} vào ví voucher của bạn!`)
  }

  const filteredDeals =
    selectedCategory === 'Tất cả'
      ? multiCategoryDeals
      : multiCategoryDeals.filter((d) => d.category === selectedCategory)

  return (
    <div className={cn(isDark ? 'bg-slate-950' : 'bg-stone-50/50')}>
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
              <HiOutlineFire className="h-4 w-4 text-amber-300 animate-bounce" />
              Săn Deal Hot & Kho Mã Giảm Giá
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Trung Tâm Khuyến Mãi E-commerce
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/90">
              Thu thập voucher giảm giá toàn sàn, mã miễn phí vận chuyển GHN và săn sale độc quyền từ các thương hiệu chính hãng.
            </p>
          </div>
        </div>
      </section>

      {/* Voucher Hub Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
              <HiOutlineTicket className="h-5 w-5" />
            </span>
            <div>
              <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Kho Voucher Nổi Bật
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                Lưu mã để tự động áp dụng tại bước thanh toán
              </p>
            </div>
          </div>
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformVouchers.map((voucher) => {
            const isCollected = collectedVouchers.has(voucher.code)
            return (
              <div
                key={voucher.id}
                className={cn(
                  'relative rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('rounded-lg px-2.5 py-1 text-xs font-bold border', voucher.color)}>
                      {voucher.badge}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                      {voucher.expiry}
                    </span>
                  </div>

                  <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    {voucher.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                    {voucher.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-dashed border-stone-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-500">
                    {voucher.code}
                  </span>
                  <button
                    onClick={() => handleCollectVoucher(voucher.code)}
                    disabled={isCollected}
                    className={cn(
                      'rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-sm',
                      isCollected
                        ? 'bg-emerald-500 text-white cursor-default'
                        : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                    )}
                  >
                    {isCollected ? (
                      <span className="flex items-center gap-1">
                        <HiOutlineCheck className="h-4 w-4" />
                        Đã lưu
                      </span>
                    ) : (
                      'Lưu mã'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Category Deals Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
          <div>
            <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Ưu Đãi Độc Quyền Theo Ngành Hàng
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-0.5">
              Các chương trình giảm giá trực tiếp từ các gian hàng chính hãng
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Tất cả', 'Điện Tử & Công Nghệ', 'Thời Trang & Phụ Kiện', 'Nhà Cửa & Đời Sống', 'Sách & Văn Phòng Phẩm'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-colors shrink-0',
                  selectedCategory === c
                    ? 'bg-amber-500 text-white shadow-sm'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Deals Listing */}
        <div className="space-y-8">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className={cn(
                'rounded-3xl border overflow-hidden p-6 shadow-sm transition-colors',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white uppercase">
                      {deal.badge}
                    </span>
                    <span className="text-xs text-stone-400 font-semibold">{deal.category}</span>
                  </div>
                  <h3 className={cn('mt-2 text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    {deal.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                    {deal.description}
                  </p>
                </div>
                <Link
                  to={`/products?search=${encodeURIComponent(deal.category.split(' ')[0])}`}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-500 hover:text-amber-600 transition-colors shrink-0"
                >
                  Xem toàn bộ ưu đãi ngành
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Sample Product Cards in Deal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deal.products.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-md',
                      isDark ? 'border-slate-800 bg-slate-800/50' : 'border-stone-200/80 bg-stone-50/50'
                    )}
                  >
                    <div className="relative h-24 w-24 rounded-xl overflow-hidden shrink-0 bg-stone-200 dark:bg-slate-700">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                          {item.shopName}
                        </span>
                        <h4 className={cn('text-sm font-bold line-clamp-2 mt-0.5', isDark ? 'text-white' : 'text-stone-900')}>
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                          {Number(item.price).toLocaleString('vi-VN')}₫
                        </span>
                        <span className="text-xs text-stone-400 line-through">
                          {Number(item.oldPrice).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
