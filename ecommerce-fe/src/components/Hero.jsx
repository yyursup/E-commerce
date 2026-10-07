import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineArrowRight,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineBadgeCheck,
  HiOutlineCreditCard,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

const heroBanners = [
  {
    id: 1,
    badge: 'Sàn Thương Mại Điện Tử & Đồ Công Nghệ',
    title: 'Hệ Sinh Thái Đồ Công Nghệ Chính Hãng',
    subtitle: 'Điện thoại, Laptop, Tablet, Linh kiện PC từ Apple, Samsung, Sony, Asus. Đầy đủ hóa đơn VAT & Bảo hành chính hãng.',
    ctaText: 'Khám phá ngay',
    ctaLink: '/products',
    bgGradient: 'from-blue-700 via-indigo-700 to-slate-900',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&h=600&fit=crop',
    tag: 'CHÍNH HÃNG 100%',
  },
  {
    id: 2,
    badge: 'Thị Trường Đồ Cũ Like New 99%',
    title: 'Máy Cũ Kiểm Định - An Tâm Tuyệt Đối',
    subtitle: 'Đội ngũ thẩm định chuyên nghiệp kiểm tra pin, bo mạch, màn hình. Minh bạch tình trạng máy & lịch sử sửa chữa.',
    ctaText: 'Xem máy Like New',
    ctaLink: '/products',
    bgGradient: 'from-amber-600 via-orange-600 to-stone-900',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000&h=600&fit=crop',
    tag: 'TEST MÁY 3 NGÀY',
  },
  {
    id: 3,
    badge: 'Cơ Chế Ký Quỹ Độc Quyền Escrow',
    title: 'Giao Dịch Đồ Công Nghệ Giá Trị Cao',
    subtitle: 'Tiền được khóa an toàn tại Escrow sàn. Sau khi nhận máy và test trong 3 ngày hài lòng, tiền mới được giải ngân cho Shop.',
    ctaText: 'Tìm hiểu Escrow',
    ctaLink: '/help',
    bgGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&h=600&fit=crop',
    tag: 'BẢO VỆ 100%',
  },
  {
    id: 4,
    badge: 'Vận Chuyển An Toàn GHN',
    title: 'Giao Hàng Công Nghệ Toàn Quốc',
    subtitle: 'Đóng gói chống sốc chuyên dụng, bảo hiểm 100% giá trị thiết bị điện tử cùng Giao Hàng Nhanh (GHN).',
    ctaText: 'Săn mã Freeship',
    ctaLink: '/deals',
    bgGradient: 'from-purple-700 via-violet-700 to-slate-900',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&h=600&fit=crop',
    tag: 'BẢO HIỂM THIẾT BỊ',
  },
]

const quickServices = [
  { icon: HiOutlineTag, label: 'Mã Giảm Giá Tech', color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20', link: '/deals' },
  { icon: HiOutlineBadgeCheck, label: 'Đồ Cũ Kiểm Định', color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20', link: '/products' },
  { icon: HiOutlineTruck, label: 'Giao Chống Sốc GHN', color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20', link: '/deals' },
  { icon: HiOutlineShieldCheck, label: 'Ký Quỹ Escrow', color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20', link: '/help' },
  { icon: HiOutlineCreditCard, label: 'Ví & Nạp Tiền', color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20', link: '/profile/wallet' },
  { icon: HiOutlineSparkles, label: 'AI Tư Vấn Cấu Hình', color: 'text-orange-500 bg-orange-500/10 dark:bg-orange-500/20', link: '/products' },
]

export default function Hero() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)

  const activeBanner = heroBanners[currentSlide]

  return (
    <section className="relative pt-4 pb-8 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Banner Area (Shopee Grid Style: Main Slider + 2 Side Banners) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Main Slider (8 cols) */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-xl min-h-[360px] sm:min-h-[420px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBanner.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'absolute inset-0 bg-gradient-to-br flex flex-col justify-end p-6 sm:p-10 lg:p-12 text-white',
                  activeBanner.bgGradient
                )}
              >
                {/* Background image with overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
                  style={{ backgroundImage: `url(${activeBanner.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="relative z-10 max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white mb-3">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {activeBanner.badge}
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                    {activeBanner.title}
                  </h2>

                  <p className="mt-2.5 text-sm sm:text-base text-white/90 line-clamp-2 sm:line-clamp-3">
                    {activeBanner.subtitle}
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <Link
                      to={activeBanner.ctaLink}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-stone-900 shadow-lg hover:bg-amber-400 hover:text-stone-900 transition-all active:scale-95"
                    >
                      {activeBanner.ctaText}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="rounded-lg bg-black/40 backdrop-blur-sm px-3 py-1.5 text-xs font-bold tracking-wider text-amber-300 border border-amber-400/30">
                      {activeBanner.tag}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation Buttons */}
            <button
              onClick={prevSlide}
              aria-label="Slide trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/70 transition-all"
            >
              <HiOutlineChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Slide sau"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/70 transition-all"
            >
              <HiOutlineChevronRight className="h-5 w-5" />
            </button>

            {/* Slider Dots */}
            <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
              {heroBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={`Đi tới banner ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 2 Side Promo Banners (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
            {/* Side Card 1 */}
            <Link
              to="/marketplace"
              className="relative flex-1 rounded-2xl overflow-hidden shadow-md group min-h-[170px] flex items-end p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-amber-950 text-white"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=300&fit=crop)` }}
              />
              <div className="relative z-10">
                <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  TECH MALL
                </span>
                <h3 className="mt-1.5 text-base font-bold group-hover:text-amber-400 transition-colors">
                  Đại Lý Phân Phối Ủy Quyền
                </h3>
                <p className="text-xs text-slate-300">Apple, Samsung, Sony, Asus chính hãng</p>
              </div>
            </Link>

            {/* Side Card 2 */}
            <Link
              to="/products"
              className="relative flex-1 rounded-2xl overflow-hidden shadow-md group min-h-[170px] flex items-end p-5 bg-gradient-to-tr from-indigo-950 via-slate-900 to-rose-950 text-white"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=300&fit=crop)` }}
              />
              <div className="relative z-10">
                <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  LIKE NEW 99%
                </span>
                <h3 className="mt-1.5 text-base font-bold group-hover:text-emerald-400 transition-colors">
                  Chợ Thiết Bị Cũ Kiểm Định
                </h3>
                <p className="text-xs text-slate-300">Bao test 3 ngày cùng Escrow ký quỹ</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Service Icons Strip (Shopee / Tiki Style) */}
        <div
          className={cn(
            'mt-6 rounded-2xl border p-4 sm:p-5 shadow-sm transition-colors',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200/90 bg-white'
          )}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {quickServices.map((service, index) => {
              const Icon = service.icon
              return (
                <Link
                  key={index}
                  to={service.link}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-xl transition-all group text-center',
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl mb-2 transition-transform group-hover:scale-110 shadow-sm',
                      service.color
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold tracking-tight transition-colors',
                      isDark ? 'text-slate-300 group-hover:text-white' : 'text-stone-700 group-hover:text-stone-900'
                    )}
                  >
                    {service.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
