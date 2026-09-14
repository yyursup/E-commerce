import { Link } from 'react-router-dom'
import {
  HiOutlineDeviceMobile,
  HiOutlineSparkles,
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineHeart,
  HiOutlineLightningBolt,
  HiOutlineGift,
  HiOutlineShoppingBag,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

const categories = [
  {
    id: 'tech',
    name: 'Điện Tử & Công Nghệ',
    icon: HiOutlineDeviceMobile,
    itemCount: '150+ sản phẩm',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    color: 'from-blue-500 to-indigo-600',
    query: 'Điện Tử',
  },
  {
    id: 'fashion',
    name: 'Thời Trang & Phụ Kiện',
    icon: HiOutlineSparkles,
    itemCount: '200+ mẫu mới',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    color: 'from-rose-500 to-pink-600',
    query: 'Thời Trang',
  },
  {
    id: 'home',
    name: 'Nhà Cửa & Đời Sống',
    icon: HiOutlineHome,
    itemCount: '120+ đồ tiện ích',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&h=300&fit=crop',
    color: 'from-amber-500 to-orange-600',
    query: 'Nhà Cửa',
  },
  {
    id: 'books',
    name: 'Sách & Văn Phòng Phẩm',
    icon: HiOutlineBookOpen,
    itemCount: '500+ đầu sách',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop',
    color: 'from-emerald-500 to-teal-600',
    query: 'Sách',
  },
  {
    id: 'beauty',
    name: 'Sức Khỏe & Sắc Đẹp',
    icon: HiOutlineHeart,
    itemCount: '180+ mỹ phẩm',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
    color: 'from-pink-500 to-rose-600',
    query: 'Sắc Đẹp',
  },
  {
    id: 'sports',
    name: 'Thể Thao & Dã Ngoại',
    icon: HiOutlineLightningBolt,
    itemCount: '90+ dụng cụ',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400&h=300&fit=crop',
    color: 'from-cyan-500 to-blue-600',
    query: 'Thể Thao',
  },
  {
    id: 'mom-baby',
    name: 'Mẹ & Bé',
    icon: HiOutlineGift,
    itemCount: '80+ đồ dùng',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
    color: 'from-violet-500 to-purple-600',
    query: 'Mẹ & Bé',
  },
  {
    id: 'grocery',
    name: 'Bách Hóa Online',
    icon: HiOutlineShoppingBag,
    itemCount: 'Giao nhanh 2h',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    color: 'from-yellow-500 to-amber-600',
    query: 'Bách Hóa',
  },
]

export default function CategoryGrid() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Danh Mục Ngành Hàng
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
              Khám phá hàng triệu sản phẩm từ các ngành hàng thiết yếu
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        {/* Categories Grid (8 categories) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                to={`/products?search=${encodeURIComponent(category.query)}`}
                className={cn(
                  'group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                  isDark
                    ? 'border-slate-800 bg-slate-900/90 hover:border-amber-500/40 hover:bg-slate-800'
                    : 'border-stone-200/90 bg-white hover:border-amber-400 hover:shadow-amber-500/5'
                )}
              >
                {/* Thumbnail image with subtle icon */}
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden mb-3 shadow-inner">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div
                    className={cn(
                      'absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr text-white shadow',
                      category.color
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Name */}
                <h3
                  className={cn(
                    'text-xs font-bold line-clamp-2 transition-colors',
                    isDark ? 'text-slate-200 group-hover:text-amber-400' : 'text-stone-800 group-hover:text-amber-600'
                  )}
                >
                  {category.name}
                </h3>

                <span className="text-[10px] text-stone-400 dark:text-slate-500 mt-1">
                  {category.itemCount}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
