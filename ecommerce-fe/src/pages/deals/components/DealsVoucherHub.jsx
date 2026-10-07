import {
  HiOutlineTicket,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShoppingBag,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function DealsVoucherHub({
  vouchers = [],
  filteredVouchers = [],
  voucherFilter = 'ALL',
  setVoucherFilter,
  loadingVouchers = false,
  collectedVouchers = new Set(),
  onCollectVoucher,
  voucherScrollRef,
  setIsVoucherHovered,
  scrollVouchers,
  isDark = false,
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
            <HiOutlineTicket className="h-5 w-5" />
          </span>
          <div>
            <h2 className={cn('text-lg sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              Kho Voucher Nổi Bật
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400">
              Lưu mã sàn và mã shop để tự động áp dụng khi đặt hàng thanh toán
            </p>
          </div>
        </div>

        {/* Voucher filter pills & Navigation Controls */}
        {vouchers.length > 0 && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-slate-900 p-1 rounded-xl border border-stone-200/80 dark:border-slate-800 flex-wrap">
              <button
                onClick={() => setVoucherFilter('ALL')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                Tất cả ({vouchers.length})
              </button>
              <button
                onClick={() => setVoucherFilter('PLATFORM')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'PLATFORM'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                Toàn Sàn
              </button>
              <button
                onClick={() => setVoucherFilter('SHOP')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'SHOP'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                Voucher Shop
              </button>
              <button
                onClick={() => setVoucherFilter('SHIPPING')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'SHIPPING'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                Freeship
              </button>
              <button
                onClick={() => setVoucherFilter('DISCOUNT')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  voucherFilter === 'DISCOUNT'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                Giảm giá
              </button>
            </div>

            {filteredVouchers.length > 4 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollVouchers('left')}
                  className={cn(
                    'p-2 rounded-xl border transition-all active:scale-95 shadow-sm',
                    isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                  )}
                  title="Voucher trước"
                >
                  <HiOutlineChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollVouchers('right')}
                  className={cn(
                    'p-2 rounded-xl border transition-all active:scale-95 shadow-sm',
                    isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                  )}
                  title="Voucher tiếp theo"
                >
                  <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voucher Cards Display */}
      {loadingVouchers ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'h-36 rounded-2xl border p-5 animate-pulse flex flex-col justify-between',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <div className="h-4 w-24 bg-stone-200 dark:bg-slate-800 rounded mb-2"></div>
              <div className="h-5 w-40 bg-stone-200 dark:bg-slate-800 rounded"></div>
              <div className="h-8 w-full bg-stone-200 dark:bg-slate-800 rounded mt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className={cn('text-center py-8 rounded-2xl border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <HiOutlineTicket className="h-10 w-10 mx-auto text-stone-400 mb-2" />
          <p className={cn('text-xs sm:text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Hiện chưa có voucher nào thuộc danh mục này. Hãy khám phá các danh mục khác nhé!
          </p>
        </div>
      ) : filteredVouchers.length > 4 ? (
        /* Carousel Slider Layout for > 4 Vouchers */
        <div
          className="relative group"
          onMouseEnter={() => setIsVoucherHovered(true)}
          onMouseLeave={() => setIsVoucherHovered(false)}
        >
          {/* Side Floating Controls */}
          <button
            onClick={() => scrollVouchers('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-stone-800 dark:text-white shadow-xl border border-stone-200 dark:border-slate-700 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <HiOutlineChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollVouchers('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-stone-800 dark:text-white shadow-xl border border-stone-200 dark:border-slate-700 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <HiOutlineChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={voucherScrollRef}
            className={cn(
              'flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth',
              isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'
            )}
          >
            {filteredVouchers.map((voucher) => {
              const isExhausted = voucher.isEligible === false && voucher.userRemainingUsage !== undefined && voucher.userRemainingUsage <= 0
              const isCollected = collectedVouchers.has(voucher.code)
              const hasMultipleUsage = voucher.userUsageLimit && voucher.userUsageLimit > 1
              return (
                <div
                  key={voucher.id || voucher.code}
                  className={cn(
                    'w-[285px] sm:w-[315px] min-h-[210px] shrink-0 relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-500/40',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                    isExhausted && 'opacity-60'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0 w-full">
                      <span
                        className={cn(
                          'rounded-lg px-2 py-0.5 text-xs font-bold border truncate min-w-0 max-w-[calc(100%-85px)]',
                          voucher.color
                        )}
                        title={voucher.badge}
                      >
                        {voucher.badge}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium shrink-0 whitespace-nowrap ml-auto">
                        {voucher.expiry}
                      </span>
                    </div>

                    <h3 className={cn('text-sm sm:text-base font-bold line-clamp-1', isDark ? 'text-white' : 'text-stone-900')}>
                      {voucher.title}
                    </h3>

                    {voucher.isShopVoucher && voucher.shopName && (
                      <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium max-w-full">
                        <HiOutlineShoppingBag className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span className="truncate">{voucher.shopName}</span>
                      </div>
                    )}

                    <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">
                      {voucher.description}
                    </p>

                    {hasMultipleUsage && (
                      <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {isExhausted ? 'Đã hết lượt cá nhân' : `Còn ${voucher.userRemainingUsage ?? voucher.userUsageLimit}/${voucher.userUsageLimit} lượt dùng`}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                      {voucher.code}
                    </span>
                    <button
                      onClick={() => !isExhausted && onCollectVoucher(voucher)}
                      disabled={isCollected || isExhausted}
                      className={cn(
                        'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5',
                        isExhausted
                          ? 'bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                          : isCollected
                            ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/20'
                            : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-amber-500/20'
                      )}
                    >
                      {isExhausted ? (
                        'Hết lượt'
                      ) : isCollected ? (
                        <>
                          <HiOutlineCheck className="h-4 w-4 stroke-[2.5]" />
                          Đã lưu
                        </>
                      ) : (
                        'Lưu mã'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Grid Layout for <= 4 Vouchers */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredVouchers.map((voucher) => {
            const isExhausted = voucher.isEligible === false && voucher.userRemainingUsage !== undefined && voucher.userRemainingUsage <= 0
            const isCollected = collectedVouchers.has(voucher.code)
            const hasMultipleUsage = voucher.userUsageLimit && voucher.userUsageLimit > 1
            return (
              <div
                key={voucher.id || voucher.code}
                className={cn(
                  'min-h-[210px] relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-500/40',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                  isExhausted && 'opacity-60'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0 w-full">
                    <span
                      className={cn(
                        'rounded-lg px-2 py-0.5 text-xs font-bold border truncate min-w-0 max-w-[calc(100%-85px)]',
                        voucher.color
                      )}
                      title={voucher.badge}
                    >
                      {voucher.badge}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium shrink-0 whitespace-nowrap ml-auto">
                      {voucher.expiry}
                    </span>
                  </div>

                  <h3 className={cn('text-sm sm:text-base font-bold line-clamp-1', isDark ? 'text-white' : 'text-stone-900')}>
                    {voucher.title}
                  </h3>

                  {voucher.isShopVoucher && voucher.shopName && (
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium max-w-full">
                      <HiOutlineShoppingBag className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                      <span className="truncate">{voucher.shopName}</span>
                    </div>
                  )}

                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">
                    {voucher.description}
                  </p>

                  {hasMultipleUsage && (
                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {isExhausted ? 'Đã hết lượt cá nhân' : `Còn ${voucher.userRemainingUsage ?? voucher.userUsageLimit}/${voucher.userUsageLimit} lượt dùng`}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                    {voucher.code}
                  </span>
                  <button
                    onClick={() => !isExhausted && onCollectVoucher(voucher)}
                    disabled={isCollected || isExhausted}
                    className={cn(
                      'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5',
                      isExhausted
                        ? 'bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                        : isCollected
                          ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/20'
                          : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-amber-500/20'
                    )}
                  >
                    {isExhausted ? (
                      'Hết lượt'
                    ) : isCollected ? (
                      <>
                        <HiOutlineCheck className="h-4 w-4 stroke-[2.5]" />
                        Đã lưu
                      </>
                    ) : (
                      'Lưu mã'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
