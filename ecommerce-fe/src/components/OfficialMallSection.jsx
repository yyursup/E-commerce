import { Link } from 'react-router-dom'
import { HiOutlineBadgeCheck, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh, HiOutlineChevronRight } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

const officialShops = [
  {
    id: 'apple',
    name: 'Apple Authorised Reseller',
    category: 'Điện Tử & Công Nghệ',
    rating: 4.9,
    location: 'TP. Hồ Chí Minh',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&h=200&fit=crop',
    badge: 'Official Mall',
    sample: 'iPhone, MacBook, AirPods, iPad...',
  },
  {
    id: 'trendy',
    name: 'Trendy Fashion Studio',
    category: 'Thời Trang & Phụ Kiện',
    rating: 4.8,
    location: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    badge: 'Shop Yêu Thích',
    sample: 'Áo thun, Quần jean, Bomber, Túi ví...',
  },
  {
    id: 'nhanam',
    name: 'Nhã Nam Books & Stationery',
    category: 'Sách & Tri Thức',
    rating: 4.9,
    location: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    badge: 'Official Mall',
    sample: 'Đắc Nhân Tâm, Nhà Giả Kim...',
  },
  {
    id: 'sunhouse',
    name: 'Sunhouse Home Official',
    category: 'Gia Dụng & Bếp',
    rating: 4.7,
    location: 'Đà Nẵng',
    logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&h=200&fit=crop',
    badge: 'Official Mall',
    sample: 'Nồi chiên, Nồi cơm điện, Chảo từ...',
  },
]

export default function OfficialMallSection() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mall Container Box */}
        <div
          className={cn(
            'rounded-3xl border p-6 sm:p-8 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}
        >
          {/* Top Bar with Guarantees */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white uppercase tracking-wider">
                  E-Mall
                </span>
                <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                  Gian Hàng Chính Hãng Đã Xác Thực
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
                Các thương hiệu và nhà bán uy tín đã hoàn thành định danh sinh trắc học VNPT eKYC
              </p>
            </div>

            {/* Badges / Guarantees */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-rose-500">
                <HiOutlineRefresh className="h-4 w-4" />
                <span>7 Ngày Đổi Trả</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <HiOutlineShieldCheck className="h-4 w-4" />
                <span>100% Chính Hãng</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-500">
                <HiOutlineTruck className="h-4 w-4" />
                <span>Giao Toàn Quốc GHN</span>
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors ml-2"
              >
                Xem tất cả shop
                <HiOutlineChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Shop Cards Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {officialShops.map((shop) => (
              <Link
                key={shop.id}
                to={`/marketplace`}
                className={cn(
                  'group flex flex-col p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                  isDark
                    ? 'border-slate-800 bg-slate-800/60 hover:border-amber-500/40 hover:bg-slate-800'
                    : 'border-stone-200/80 bg-stone-50/50 hover:border-amber-400 hover:bg-white'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Shop Logo */}
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-slate-700">
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Shop info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className={cn('text-sm font-bold truncate group-hover:text-amber-500 transition-colors', isDark ? 'text-white' : 'text-stone-900')}>
                        {shop.name}
                      </h3>
                      <HiOutlineBadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-xs text-stone-400 dark:text-slate-400 truncate">
                      {shop.category}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                  <span className="font-medium text-amber-500">★ {shop.rating}</span>
                  <span>{shop.location}</span>
                </div>

                <p className="mt-2 text-[11px] text-stone-400 dark:text-slate-500 italic line-clamp-1">
                  Mặt hàng: {shop.sample}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
