import { Link } from 'react-router-dom'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineShoppingBag,
} from 'react-icons/hi'
import { cn } from '../lib/cn'

const footerLinkGroups = [
  {
    heading: 'Danh mục ngành hàng',
    links: [
      { to: '/products?category=dien-tu', label: 'Điện Tử & Công Nghệ' },
      { to: '/products?category=thoi-trang', label: 'Thời Trang & Phụ Kiện' },
      { to: '/products?category=nha-cua', label: 'Nhà Cửa & Đời Sống' },
      { to: '/products?category=sach', label: 'Sách & Văn Phòng Phẩm' },
      { to: '/products?category=lam-dep', label: 'Sức Khỏe & Sắc Đẹp' },
      { to: '/products?category=the-thao', label: 'Thể Thao & Dã Ngoại' },
    ],
  },
  {
    heading: 'Chính sách & Hỗ trợ',
    links: [
      { to: '/help', label: 'Trung tâm trợ giúp' },
      { to: '/shipping', label: 'Vận chuyển cùng GHN' },
      { to: '/escrow-policy', label: 'Bảo vệ thanh toán Escrow' },
      { to: '/returns', label: 'Chính sách đổi trả 7 ngày' },
      { to: '/seller-policy', label: 'Quy chế Người bán hàng' },
    ],
  },
  {
    heading: 'Về E-commerce',
    links: [
      { to: '/about', label: 'Giới thiệu nền tảng' },
      { to: '/seller/register', label: 'Kênh Người Bán (Bán hàng)' },
      { to: '/kyc/intro', label: 'Chứng nhận VNPT eKYC' },
      { to: '/contact', label: 'Liên hệ ban quản trị' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* Platform Key Pillars Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <HiOutlineTruck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Giao Hàng Nhanh (GHN)</h4>
                <p className="text-xs text-slate-400">Tự động tính phí & theo dõi đơn hàng</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Ký Quỹ Escrow An Toàn</h4>
                <p className="text-xs text-slate-400">Giữ tiền bảo vệ người mua 100%</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <HiOutlineCreditCard className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Thanh Toán Trực Tuyến VNPay</h4>
                <p className="text-xs text-slate-400">ATM, QR Code, Thẻ quốc tế Visa/Master</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <HiOutlineShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Định Danh VNPT eKYC</h4>
                <p className="text-xs text-slate-400">Người bán xác thực CCCD & khuôn mặt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Brand & info */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                <HiOutlineShoppingBag className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-white">
                E-<span className="text-amber-500">commerce</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Sàn thương mại điện tử đa ngành hàng hàng đầu. Nền tảng kết nối hàng triệu người tiêu dùng và nhà bán hàng uy tín, ứng dụng AI gợi ý thông minh và công nghệ ký quỹ Escrow bảo vệ tài chính an toàn tuyệt đối.
            </p>
            <div className="mt-6 space-y-2.5 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <HiOutlineMail className="h-4 w-4 text-amber-400 shrink-0" />
                <span>hotro@ecommerce.vn</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlinePhone className="h-4 w-4 text-amber-400 shrink-0" />
                <span>1900 6868 (8:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineLocationMarker className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội</span>
              </div>
            </div>
          </div>

          {/* Links grid */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {footerLinkGroups.map((group) => (
              <div key={group.heading}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
                  {group.heading}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-slate-400 transition-colors hover:text-white"
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

        {/* Bottom copyright */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} E-commerce Platform. Đồ án Tốt nghiệp Kỹ thuật Phần mềm (SEP490).
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-amber-400">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="hover:text-amber-400">
              Điều khoản sử dụng
            </Link>
            <Link to="/seller/terms" className="hover:text-amber-400">
              Quy định Người bán
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
