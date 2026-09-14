import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineCurrencyDollar,
  HiOutlineIdentification,
  HiOutlineChartBar,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineLogin,
  HiOutlineLogout,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'

export default function SellerLanding() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const userRole = user?.role?.toUpperCase()
  const sellerStatus = user?.sellerStatus?.toUpperCase()

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      navigate('/register')
      return
    }

    if (userRole === 'BUSINESS') {
      navigate('/dashboard')
    } else if (sellerStatus === 'PENDING' || sellerStatus === 'REJECTED') {
      navigate('/pending')
    } else {
      navigate('/register')
    }
  }

  const features = [
    {
      icon: HiOutlineTruck,
      title: 'Tự động Định tuyến Vận chuyển GHN',
      desc: 'Tích hợp sâu API Giao Hàng Nhanh (GHN). Tự động lấy tọa độ kho của shop và tính cước vận chuyển chính xác.',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Ký Quỹ Escrow An Toàn',
      desc: 'Hệ thống bảo vệ dòng tiền ký quỹ tự động. Tiền bán hàng về ví ngay khi khách hàng xác nhận nhận hàng.',
    },
    {
      icon: HiOutlineIdentification,
      title: 'Xác Minh Danh Tính eKYC & GPKD',
      desc: 'Quy trình thẩm định minh bạch với công nghệ nhận diện CCCD và Giấy phép kinh doanh, bảo vệ uy tín người bán.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Báo Cáo & Thống Kê Thời Gian Thực',
      desc: 'Theo dõi chi tiết doanh số, lượng đơn theo trạng thái và đối soát dòng tiền hoa hồng sàn minh bạch.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Đăng Ký & eKYC',
      desc: 'Cung cấp thông tin gian hàng, định danh CCCD và Giấy phép kinh doanh.',
    },
    {
      number: '02',
      title: 'Ban Quản Trị Phê Duyệt',
      desc: 'Hồ sơ được thẩm định và kích hoạt quyền kinh doanh trên sàn.',
    },
    {
      number: '03',
      title: 'Đăng Sản Phẩm & Bán Hàng',
      desc: 'Tải sản phẩm lên MinIO, liên kết kho GHN và đón nhận đơn hàng đầu tiên.',
    },
  ]

  return (
    <div className={cn('min-h-screen flex flex-col font-sans transition-colors', isDark ? 'bg-slate-950 text-slate-100' : 'bg-stone-50 text-stone-900')}>
      {/* Navbar */}
      <header className={cn('sticky top-0 z-50 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between',
        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white/90'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
            <HiOutlineShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Kênh Người Bán
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-stone-400">
              E-Commerce Marketplace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={cn('p-2 rounded-xl border transition-colors',
              isDark ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
            title="Đổi giao diện"
          >
            {isDark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
          </button>

          <a
            href="http://localhost:3000"
            className="hidden md:inline-flex text-xs font-semibold text-stone-500 hover:text-amber-600 px-3 py-2 transition-colors"
          >
            &larr; Về Sàn Mua Sắm
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrimaryAction}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                {userRole === 'BUSINESS'
                  ? 'Vào Kênh Quản Trị'
                  : sellerStatus === 'PENDING'
                  ? 'Xem Hồ Sơ Đang Chờ Duyệt'
                  : sellerStatus === 'REJECTED'
                  ? 'Xem Phản Hồi Từ Chối'
                  : 'Hoàn Tất Đăng Ký Shop'}
              </button>
              <button
                onClick={logout}
                title="Đăng xuất"
                className={cn('p-2 rounded-xl border transition-colors',
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-stone-200 hover:bg-stone-100 text-stone-500'
                )}
              >
                <HiOutlineLogout className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={cn('px-4 py-2 rounded-xl text-xs font-bold border transition-colors',
                  isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                )}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Đăng ký Mở Shop
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            ⭐ Nền Tảng Bán Hàng Trực Tuyến Chuyên Nghiệp
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Kinh Doanh Dễ Dàng, Tiếp Cận{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Hàng Triệu Khách Hàng
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Hệ thống quản lý gian hàng toàn diện: Tự động kết nối kho vận Giao Hàng Nhanh (GHN), thanh toán trực tuyến VNPay và bảo đảm dòng tiền ký quỹ an toàn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handlePrimaryAction}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all group"
            >
              <span>
                {isAuthenticated
                  ? userRole === 'BUSINESS'
                    ? 'Truy cập Dashboard Quản lý'
                    : 'Kiểm tra Trạng thái Hồ sơ'
                  : 'Bắt Đầu Bán Hàng Ngay'}
              </span>
              <HiOutlineArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {!isAuthenticated && (
              <Link
                to="/login"
                className={cn('w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold transition-all',
                  isDark ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white' : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800 shadow-sm'
                )}
              >
                <HiOutlineLogin className="h-4 w-4" />
                Đăng nhập Kênh Người Bán
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className={cn('py-16 px-4 sm:px-8 border-t border-b', isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-stone-100/60 border-stone-200')}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl font-black">Tại Sao Nên Bán Hàng Cùng Chúng Tôi?</h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">Những công cụ mạnh mẽ hỗ trợ nhà bán hàng tăng trưởng doanh thu</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className={cn('p-6 rounded-3xl border transition-all hover:shadow-lg',
                    isDark ? 'border-slate-800 bg-slate-900/90 hover:border-amber-500/30' : 'border-stone-200 bg-white hover:border-amber-500/40'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold mb-2">{feat.title}</h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl font-black">3 Bước Đơn Giản Để Bắt Đầu</h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">Quy trình gia nhập tinh gọn, xét duyệt nhanh chóng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st, i) => (
            <div
              key={i}
              className={cn('p-8 rounded-3xl border text-center relative overflow-hidden',
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
              )}
            >
              <div className="text-4xl font-black text-amber-500/20 mb-3">{st.number}</div>
              <h3 className="text-base font-bold mb-2">{st.title}</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handlePrimaryAction}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
          >
            Đăng ký Gian hàng Ngay
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn('mt-auto py-8 px-4 sm:px-8 border-t text-center text-xs text-stone-400',
        isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-stone-50'
      )}>
        <p>© 2026 E-Commerce Marketplace - Kênh Quản Trị & Phát Triển Người Bán. Hotline CSKH: 1900 1234</p>
      </footer>
    </div>
  )
}
