import { HiOutlineFire } from 'react-icons/hi'

export default function DealsHeroBanner({
  voucherCount = 0,
  productCount = 0,
  activeCategoryCount = 0,
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 text-white py-10 sm:py-14 shadow-inner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
              <HiOutlineFire className="h-4 w-4 text-amber-300 animate-bounce" />
              Săn Deal Hot & Kho Mã Giảm Giá
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Trung Tâm Khuyến Mãi E-commerce
            </h1>
            <p className="mt-2.5 text-xs sm:text-base text-white/90 leading-relaxed">
              Thu thập voucher giảm giá toàn sàn, mã miễn phí vận chuyển GHN và săn deal giảm giá trực tiếp từ các sản phẩm chính hãng.
            </p>
          </div>

          {/* Quick Live Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20">
            <div className="text-center px-2">
              <span className="block text-lg sm:text-2xl font-black text-amber-300">
                {voucherCount}
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">Voucher Sàn</span>
            </div>
            <div className="text-center px-2 border-x border-white/20">
              <span className="block text-lg sm:text-2xl font-black text-amber-300">
                {productCount}
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">Sản Phẩm</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-lg sm:text-2xl font-black text-amber-300">
                {activeCategoryCount}
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">Ngành Hàng</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
