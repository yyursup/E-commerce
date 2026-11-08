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
    <section aria-labelledby="home-categories" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 id="home-categories" className={cn('text-2xl sm:text-3xl font-bold', isDark ? 'text-white' : 'text-stone-950')}>
          Danh mục
        </h2>
        <Link to="/products" className={cn('text-sm font-semibold hover:underline', isDark ? 'text-white' : 'text-stone-950')}>
          Tất cả danh mục →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => {
          const targetUrl = category.categoryId
            ? `/products?categoryId=${category.categoryId}`
            : `/products?search=${encodeURIComponent(category.query || category.name)}`

          return (
            <Link
              key={category.id}
              to={targetUrl}
              className={cn(
                'group flex flex-col gap-2.5 rounded-lg border p-3 transition-colors',
                isDark
                  ? 'border-slate-800 bg-slate-900 hover:border-slate-400'
                  : 'border-stone-200 bg-white hover:border-stone-950',
              )}
            >
              <span className={cn('block aspect-[4/3] overflow-hidden rounded', isDark ? 'bg-slate-800' : 'bg-stone-100')}>
                <img
                  src={category.image}
                  alt=""
                  className="h-full w-full object-cover grayscale-[35%] transition duration-300 group-hover:grayscale-0"
                  loading="lazy"
                />
              </span>
              <span className={cn('text-sm font-semibold leading-snug', isDark ? 'text-slate-100' : 'text-stone-950')}>
                {category.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
