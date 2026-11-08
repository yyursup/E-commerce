import { HiOutlineFire } from 'react-icons/hi'

export default function DealsHeroBanner({
  voucherCount = 0,
  productCount = 0,
  activeCategoryCount = 0,
}) {
  return (
    <section className="relative overflow-hidden bg-amber-500 text-stone-950 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider mb-3">
              <HiOutlineFire className="h-4 w-4" />
              Săn Deal Hot & Kho Mã Giảm Giá
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] leading-[0.98]">
              Trung Tâm Khuyến Mãi E-Commerce
            </h1>
            <p className="mt-2.5 text-xs sm:text-base text-stone-900 leading-relaxed">
              Thu thập voucher giảm giá toàn sàn, mã miễn phí vận chuyển GHN và săn deal giảm giá trực tiếp từ các sản phẩm chính hãng.
            </p>
          </div>

          {/* Quick Live Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0 bg-stone-950 text-white p-3 sm:p-4 rounded-lg">
            <div className="text-center px-2">
              <span className="block text-lg sm:text-2xl font-mono font-semibold text-white">
                {voucherCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 font-medium">Voucher Sàn</span>
            </div>
            <div className="text-center px-2 border-x border-white/15">
              <span className="block text-lg sm:text-2xl font-mono font-semibold text-white">
                {productCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 font-medium">Sản Phẩm</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-lg sm:text-2xl font-mono font-semibold text-white">
                {activeCategoryCount}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 font-medium">Ngành Hàng</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
