import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineChip,
  HiOutlineVolumeUp,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineHome,
  HiOutlineCamera,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import categoryService from '../services/category'

const defaultTechCategories = [
  {
    id: 'phones',
    name: 'Điện Thoại & Tablet',
    icon: HiOutlineDeviceMobile,
    itemCount: 'iPhone, Galaxy, iPad...',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
    color: 'from-blue-500 to-indigo-600',
    query: 'Điện Thoại',
  },
  {
    id: 'laptops',
    name: 'Laptop & Máy Tính',
    icon: HiOutlineDesktopComputer,
    itemCount: 'MacBook, ROG, Dell...',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
    color: 'from-purple-500 to-indigo-700',
    query: 'Laptop',
  },
  {
    id: 'components',
    name: 'Linh Kiện & PC Build',
    icon: HiOutlineChip,
    itemCount: 'RTX 4090, CPU, RAM...',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=300&fit=crop',
    color: 'from-emerald-500 to-teal-700',
    query: 'Linh Kiện',
  },
  {
    id: 'audio',
    name: 'Thiết Bị Âm Thanh',
    icon: HiOutlineVolumeUp,
    itemCount: 'AirPods, Sony, Marshall...',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    color: 'from-rose-500 to-pink-600',
    query: 'Âm Thanh',
  },
  {
    id: 'gaming-gear',
    name: 'Phụ Kiện & Gaming Gear',
    icon: HiOutlineSparkles,
    itemCount: 'Bàn phím cơ, Chuột...',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
    color: 'from-amber-500 to-orange-600',
    query: 'Phụ Kiện',
  },
  {
    id: 'wearables',
    name: 'Đồng Hồ Thông Minh',
    icon: HiOutlineClock,
    itemCount: 'Apple Watch, Garmin...',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
    color: 'from-cyan-500 to-blue-600',
    query: 'Đồng Hồ',
  },
  {
    id: 'smarthome',
    name: 'Nhà Thông Minh & IoT',
    icon: HiOutlineHome,
    itemCount: 'Camera, Robot hút bụi...',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop',
    color: 'from-violet-500 to-purple-600',
    query: 'Nhà Thông Minh',
  },
  {
    id: 'cameras',
    name: 'Máy Ảnh & Flycam',
    icon: HiOutlineCamera,
    itemCount: 'Sony Alpha, DJI Drone...',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
    color: 'from-yellow-500 to-amber-600',
    query: 'Máy Ảnh',
  },
]

export default function CategoryGrid() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [categories, setCategories] = useState(defaultTechCategories)

  useEffect(() => {
    let isMounted = true
    categoryService.getAllCategories().then((res) => {
      if (isMounted && Array.isArray(res) && res.length > 0) {
        // Lấy danh mục gốc (root categories không có parentId / parentCategory)
        const roots = res.filter((c) => !c.parentCategory && !c.parentId && !c.parent)
        if (roots.length > 0) {
          const mapped = roots.slice(0, 8).map((cat, idx) => {
            const fallback = defaultTechCategories[idx % defaultTechCategories.length]
            return {
              ...fallback,
              id: cat.id || fallback.id,
              name: cat.name || fallback.name,
              categoryId: cat.id,
              image: cat.imageUrl || cat.image || fallback.image,
            }
          })
          setCategories(mapped)
        }
      }
    }).catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Danh Mục Thiết Bị Công Nghệ
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
              Khám phá hệ sinh thái sản phẩm điện tử chính hãng và đồ cũ Like New kiểm định
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        {/* Categories Grid (8 Tech Categories) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            const targetUrl = category.categoryId
              ? `/products?categoryId=${category.categoryId}`
              : `/products?search=${encodeURIComponent(category.query || category.name)}`

            return (
              <Link
                key={category.id}
                to={targetUrl}
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
                    'text-xs font-bold line-clamp-2 transition-colors min-h-[32px] flex items-center justify-center',
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
