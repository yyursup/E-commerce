import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineSearch,
  HiOutlineBadgeCheck,
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineShoppingBag,
  HiOutlineChat,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import Footer from '../components/Footer'

// Danh sách Shop thực tế từ hệ thống sàn E-commerce
const mockMarketplaceShops = [
  {
    id: 'shop-1',
    name: 'Apple Authorised Reseller',
    sellerName: 'Nguyễn Thành Đạt',
    category: 'Điện Tử & Công Nghệ',
    rating: 4.9,
    reviewCount: 382,
    productCount: 35,
    location: 'Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'Hồ Chí Minh',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
    description: 'Gian hàng chính hãng phân phối ủy quyền các sản phẩm Apple: iPhone, MacBook, iPad, AirPods và phụ kiện chính hãng.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Chính Hãng VN/A', 'Đổi Trả 7 Ngày', 'Freeship GHN'],
  },
  {
    id: 'shop-2',
    name: 'Trendy Fashion Studio',
    sellerName: 'Trần Thị Mai',
    category: 'Thời Trang & Phụ Kiện',
    rating: 4.8,
    reviewCount: 245,
    productCount: 42,
    location: 'Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    description: 'Thương hiệu thời trang giới trẻ phong cách streetwear hiện đại, tối giản và thời thượng. Cam kết chất vải cao cấp.',
    ekycVerified: true,
    mallBadge: false,
    tags: ['Shop Yêu Thích', 'Hàng Thiết Kế', 'Giao 24h'],
  },
  {
    id: 'shop-3',
    name: 'Nhã Nam Books & Stationery',
    sellerName: 'Lê Tri Thức',
    category: 'Sách & Văn Phòng Phẩm',
    rating: 4.9,
    reviewCount: 512,
    productCount: 68,
    location: 'Trung Hòa, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1507842229451-7f01be837453?w=1200&h=400&fit=crop',
    description: 'Nhà sách phát hành các tác phẩm văn học, kinh tế, tâm lý học và dụng cụ văn phòng phẩm nhập khẩu cao cấp.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Sách Bản Quyền', 'Bọc Sách Miễn Phí', 'Giao Nhanh'],
  },
  {
    id: 'shop-4',
    name: 'Sunhouse Home Official',
    sellerName: 'Phạm Hoàng Gia',
    category: 'Nhà Cửa & Đời Sống',
    rating: 4.7,
    reviewCount: 198,
    productCount: 28,
    location: 'Hải Châu 1, Quận Hải Châu, Đà Nẵng',
    city: 'Đà Nẵng',
    logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&h=400&fit=crop',
    description: 'Thiết bị gia dụng và đồ dùng nhà bếp thông minh hàng đầu Việt Nam. Nồi chiên, máy xay, chảo chống dính chuẩn chất lượng.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Bảo Hành 12T', 'Chống Dính Kép', 'Tiết Kiệm Điện'],
  },
  {
    id: 'shop-5',
    name: 'Beauty Garden Cosmetics',
    sellerName: 'Hoàng Thảo My',
    category: 'Sức Khỏe & Sắc Đẹp',
    rating: 4.8,
    reviewCount: 420,
    productCount: 50,
    location: 'Phường 5, Quận Phú Nhuận, TP. Hồ Chí Minh',
    city: 'Hồ Chí Minh',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop',
    description: 'Thiên đường mỹ phẩm và chăm sóc sắc đẹp chính hãng Hàn Quốc, Nhật Bản, Âu Mỹ. 100% hóa đơn chứng từ xác thực eKYC.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Hóa Đơn Đỏ', 'Dược Mỹ Phẩm', 'Tư Vấn Miễn Phí'],
  },
  {
    id: 'shop-6',
    name: 'Decathlon Sports Hub',
    sellerName: 'Vũ Quốc Dũng',
    category: 'Thể Thao & Dã Ngoại',
    rating: 4.8,
    reviewCount: 165,
    productCount: 30,
    location: 'Thượng Đình, Quận Thanh Xuân, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop',
    description: 'Cửa hàng thể thao đa năng: Trang phục thể thao, thiết bị tập gym, yoga, dã ngoại và leo núi chuyên nghiệp.',
    ekycVerified: true,
    mallBadge: false,
    tags: ['Thể Thao Chuyên Nghiệp', 'Bền Bỉ', 'Freeship'],
  },
]

const cityFilters = ['Tất cả', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng']
const categoryFilters = [
  'Tất cả',
  'Điện Tử & Công Nghệ',
  'Thời Trang & Phụ Kiện',
  'Sách & Văn Phòng Phẩm',
  'Nhà Cửa & Đời Sống',
  'Sức Khỏe & Sắc Đẹp',
  'Thể Thao & Dã Ngoại',
]

export default function Marketplace() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Tất cả')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')

  // Filter shops
  const filteredShops = mockMarketplaceShops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = selectedCity === 'Tất cả' || shop.city === selectedCity
    const matchesCategory = selectedCategory === 'Tất cả' || shop.category === selectedCategory
    return matchesSearch && matchesCity && matchesCategory
  })

  return (
    <div className={cn(isDark ? 'bg-slate-950' : 'bg-stone-50/50')}>
      {/* Marketplace Header Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
              <HiOutlineShieldCheck className="h-4 w-4 text-emerald-300" />
              100% Shop Đã Xác Thực VNPT eKYC
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Khám Phá Gian Hàng
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/90">
              Kết nối trực tiếp với các nhà bán hàng và thương hiệu chính hãng được bảo vệ bởi hệ thống Ký quỹ Escrow và vận chuyển toàn quốc GHN.
            </p>

            {/* Search Input */}
            <div className="mt-6 flex max-w-lg items-center relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm shop theo tên, ngành hàng, địa chỉ..."
                className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <HiOutlineSearch className="absolute left-4 h-5 w-5 text-stone-400" />
            </div>
          </div>
        </div>

        {/* Decorative Circle */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </section>

      {/* Filter Tabs & Controls */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-col gap-4">
          {/* City Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-stone-400 dark:text-slate-400 shrink-0 mr-1">
              Khu vực kho:
            </span>
            {cityFilters.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0',
                  selectedCity === city
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                )}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-stone-400 dark:text-slate-400 shrink-0 mr-1">
              Ngành hàng:
            </span>
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0',
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shops Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className={cn(
                'group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              {/* Cover Image */}
              <div className="relative h-32 w-full overflow-hidden bg-slate-800">
                <img
                  src={shop.cover}
                  alt={shop.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {shop.mallBadge && (
                  <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    E-Mall
                  </span>
                )}
              </div>

              {/* Shop Header & Logo */}
              <div className="relative px-5 pt-0 pb-5 flex-1 flex flex-col justify-between">
                {/* Logo & Basic Info */}
                <div>
                  <div className="flex items-end justify-between -mt-8 mb-3">
                    <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-900 shadow-md shrink-0 bg-white">
                      <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover" />
                    </div>
                    {shop.ekycVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold border border-emerald-500/20">
                        <HiOutlineBadgeCheck className="h-4 w-4" />
                        eKYC Verified
                      </span>
                    )}
                  </div>

                  <h3
                    className={cn(
                      'text-base font-bold tracking-tight group-hover:text-amber-500 transition-colors',
                      isDark ? 'text-white' : 'text-stone-900'
                    )}
                  >
                    {shop.name}
                  </h3>

                  <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 line-clamp-2">
                    {shop.description}
                  </p>

                  {/* Location & Stats */}
                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-stone-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineLocationMarker className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="truncate">{shop.location}</span>
                    </div>
                    <div className="flex items-center gap-4 pt-1 font-medium">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <HiOutlineStar className="h-4 w-4 fill-amber-400" />
                        {shop.rating} ({shop.reviewCount})
                      </span>
                      <span className="flex items-center gap-1 text-stone-600 dark:text-slate-300">
                        <HiOutlineShoppingBag className="h-4 w-4" />
                        {shop.productCount} sản phẩm
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {shop.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'rounded-lg px-2 py-0.5 text-[10px] font-semibold',
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600'
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
                  <Link
                    to={`/products?search=${encodeURIComponent(shop.name.split(' ')[0])}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    Xem sản phẩm
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => {}}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-xl border transition-colors',
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                    )}
                    title="Nhắn tin với Shop"
                  >
                    <HiOutlineChat className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout: Become a Seller */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black">Bạn muốn mở gian hàng trên E-commerce?</h3>
            <p className="mt-1 text-sm text-white/90">
              Định danh eKYC nhanh chóng trong 3 phút, tiếp cận hàng triệu khách hàng và tận hưởng nền tảng ký quỹ Escrow bảo đảm tài chính.
            </p>
          </div>
          <Link
            to="/seller/register"
            className="shrink-0 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 transition-all shadow-md active:scale-95"
          >
            Đăng ký bán hàng ngay
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
