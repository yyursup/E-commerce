import { Link } from 'react-router-dom'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
} from 'react-icons/hi'
import { cn } from '../lib/cn'

const footerLinkGroups = [
  {
    heading: 'Mua sắm',
    links: [
      { to: '/#products', label: 'Tất cả AirPods & Tai nghe' },
      { to: '/deals', label: 'Ưu đãi' },
      { to: '/#new', label: 'Hàng mới' },
      { to: '/#bestsellers', label: 'Bán chạy' },
    ],
  },
  {
    heading: 'Hỗ trợ',
    links: [
      { to: '/help', label: 'Trung tâm trợ giúp' },
      { to: '/shipping', label: 'Giao hàng' },
      { to: '/returns', label: 'Đổi trả' },
      { to: '/contact', label: 'Liên hệ' },
    ],
  },
  {
    heading: 'Công ty',
    links: [
      { to: '/about', label: 'Về chúng tôi' },
      { to: '/careers', label: 'Tuyển dụng' },
      { to: '/blog', label: 'Blog' },
      { to: '/press', label: 'Báo chí' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Dark background with image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80)`,
        }}
      />
      <div className="absolute inset-0 bg-slate-950/95" />
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Brand & contact */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </span>
              <span className="text-xl font-semibold text-white">AirPod Store</span>
            </Link>
            <p className="mt-4 max-w-sm text-slate-400">
              Sàn chuyên AirPods & tai nghe Apple. Giao nhanh, bảo hành toàn quốc. Mua sắm đơn giản, an tâm.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="mailto:hello@airpodstore.com"
                className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-amber-400"
              >
                <HiOutlineMail className="h-5 w-5 text-amber-500/80" />
                hello@airpodstore.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-amber-400"
              >
                <HiOutlinePhone className="h-5 w-5 text-amber-500/80" />
                +1 (234) 567-890
              </a>
              <p className="flex items-center gap-3 text-sm text-slate-400">
                <HiOutlineLocationMarker className="h-5 w-5 flex-shrink-0 text-amber-500/80" />
                123 Nguyễn Huệ, Q.1, TP.HCM
              </p>
            </div>
          </div>

          {/* Links grid */}
          <div className="grid gap-8 sm:grid-cols-3">
            {footerLinkGroups.map((group) => (
              <div key={group.heading}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">
                  {group.heading}
                </h4>
                <ul className="mt-4 space-y-3">
                  {group.links.map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-slate-400 transition hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} AirPod Store. AirPods & Tai nghe Apple.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-slate-500 hover:text-amber-400">
              Chính sách
            </Link>
            <Link to="/terms" className="text-slate-500 hover:text-amber-400">
              Điều khoản
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
