import { Link } from 'react-router-dom'

const footerLinkGroups = [
  {
    heading: 'Mua sắm',
    links: [
      { to: '/products?search=%C4%90i%E1%BB%87n%20tho%E1%BA%A1i', label: 'Điện thoại' },
      { to: '/products?search=Laptop', label: 'Laptop' },
      { to: '/products?search=%C3%82m%20thanh', label: 'Âm thanh' },
      { to: '/products?conditionGrade=GRADE_LIKE_NEW', label: 'Máy cũ đã kiểm định' },
      { to: '/deals', label: 'Ưu đãi & voucher' },
      { to: '/marketplace', label: 'Gian hàng' },
    ],
  },
  {
    heading: 'Hỗ trợ',
    links: [
      { to: '/help', label: 'Trung tâm trợ giúp' },
      { to: '/shipping', label: 'Vận chuyển cùng GHN' },
      { to: '/escrow-policy', label: 'Bảo vệ thanh toán Escrow' },
      { to: '/returns', label: 'Chính sách đổi trả 7 ngày' },
      { to: '/seller-policy', label: 'Quy chế Người bán hàng' },
    ],
  },
  {
    heading: 'Về E-Commerce',
    links: [
      { to: '/about', label: 'Giới thiệu nền tảng' },
      { to: '/seller/register', label: 'Kênh Người Bán (Bán hàng)' },
      { to: '/contact', label: 'Liên hệ ban quản trị' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-7 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link to="/" className="font-display text-3xl font-extrabold tracking-[-0.04em] text-white">
              E-Commerce<span className="text-amber-500">.</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              Sàn đồ công nghệ: hàng mới chính hãng và máy cũ đã kiểm định, tiền giữ trong ký quỹ đến khi bạn nhận hàng.
            </p>
            <p className="font-mono text-xs text-stone-400">hotro@ecommerce.vn · 1900 6868</p>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.heading} className="flex flex-col gap-2.5 text-sm">
              <h2 className="font-sans text-sm font-semibold tracking-normal text-white">{group.heading}</h2>
              {group.links.map(({ to, label }) => (
                <Link key={label} to={to} className="text-stone-300 transition-colors hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2.5 text-sm">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-white">Thanh toán</h2>
            <span>VNPay · ví E-Commerce</span>
            <h2 className="mt-2 font-sans text-sm font-semibold tracking-normal text-white">Vận chuyển</h2>
            <span>Giao hàng nhanh (GHN)</span>
            <h2 className="mt-2 font-sans text-sm font-semibold tracking-normal text-white">Định danh</h2>
            <span>VNPT eKYC</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-stone-800 pt-5 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} E-Commerce · Đồ án tốt nghiệp Kỹ thuật Phần mềm (SEP490)</span>
          <span className="flex gap-5">
            <Link to="/privacy" className="hover:text-white">Bảo mật</Link>
            <Link to="/terms" className="hover:text-white">Điều khoản</Link>
            <Link to="/seller/terms" className="hover:text-white">Quy định người bán</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
