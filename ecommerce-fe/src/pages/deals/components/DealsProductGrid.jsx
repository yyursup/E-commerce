import { Link } from 'react-router-dom'
import {
  HiOutlineShoppingBag,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import ProductCard from '../../../components/ProductCard'
import { cn } from '../../../lib/cn'

export default function DealsProductGrid({
  loadingProducts = false,
  products = [],
  categories = [],
  selectedCategoryId = 'ALL',
  setSelectedCategoryId,
  selectedCategoryObj,
  processedProductsForCategory = [],
  groupedCategories = [],
  expandedCategories = new Set(),
  toggleExpandCategory,
  sortBy = 'DEFAULT',
  setSortBy,
  categoryProductCounts = {},
  onQuickView,
  isDark = false,
}) {
  return (
    <div>
      {/* Selected Category Header (When single category is selected) */}
      {selectedCategoryId !== 'ALL' && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Đang xem ngành hàng:
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  ({processedProductsForCategory.length} sản phẩm)
                </span>
              </div>
              <h3 className={cn('text-lg sm:text-xl font-extrabold', isDark ? 'text-white' : 'text-stone-900')}>
                {selectedCategoryObj?.name || 'Ngành hàng'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={cn(
                'text-xs rounded-xl px-3 py-1.5 border font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30',
                isDark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-stone-200 bg-white text-stone-800'
              )}
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
            </select>

            {/* Reset to ALL button */}
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              Về tất cả ngành
            </button>
          </div>
        </div>
      )}

      {/* Product Grid Content */}
      {loadingProducts ? (
        <div className="py-20 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-r-transparent mb-4" />
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Đang tải danh sách sản phẩm khuyến mãi...
          </p>
        </div>
      ) : products.length === 0 ? (
        /* Empty Database State */
        <div className={cn('text-center py-16 rounded-3xl border p-8', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <HiOutlineShoppingBag className="h-14 w-14 mx-auto text-amber-500/80 mb-3" />
          <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Chưa có sản phẩm nào được đăng bán
          </h3>
          <p className={cn('text-xs sm:text-sm mt-1 max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hệ thống hiện đang cập nhật thêm các sản phẩm và chương trình ưu đãi mới từ các nhà bán hàng.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition-all"
          >
            Khám phá toàn bộ sản phẩm
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : selectedCategoryId !== 'ALL' && processedProductsForCategory.length === 0 ? (
        /* Empty Selected Category State */
        <div className={cn('text-center py-14 rounded-3xl border p-8', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <HiOutlineShoppingBag className="h-12 w-12 mx-auto text-stone-400 mb-3" />
          <h3 className={cn('text-base sm:text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Chưa có sản phẩm ưu đãi trong ngành &quot;{selectedCategoryObj?.name}&quot;
          </h3>
          <p className={cn('text-xs sm:text-sm mt-1 max-w-md mx-auto text-stone-500 dark:text-slate-400')}>
            Bạn có thể khám phá các ngành hàng khác đang có nhiều ưu đãi hot bên dưới:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {categories
              .filter((c) => (categoryProductCounts[c.id] || 0) > 0)
              .slice(0, 5)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-bold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
                >
                  {c.name} ({categoryProductCounts[c.id]})
                </button>
              ))}
          </div>
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-stone-800 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-stone-900 transition-all"
          >
            Xem tất cả ngành hàng
          </button>
        </div>
      ) : (
        /* Products Grouped By Category */
        <div className="space-y-10 sm:space-y-12">
          {groupedCategories.map((group) => {
            const cat = group.category
            const items = group.items || []

            if (items.length === 0) return null

            const isExpanded = expandedCategories.has(cat.id)
            const visibleItems = selectedCategoryId === 'ALL' && !isExpanded ? items.slice(0, 5) : items

            return (
              <div
                key={cat.id}
                className={cn(
                  'rounded-3xl border overflow-hidden p-5 sm:p-7 shadow-sm transition-colors',
                  isDark ? 'border-slate-800 bg-slate-900/80' : 'border-stone-200 bg-white'
                )}
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                        Ưu đãi ngành
                      </span>
                      <span className="text-xs text-stone-400 font-semibold">{items.length} sản phẩm</span>
                    </div>
                    <h3 className={cn('text-lg sm:text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-slate-400">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  {cat.id !== 'ALL' && (
                    <Link
                      to={`/products?categoryId=${cat.id}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-500 hover:text-amber-600 transition-colors shrink-0"
                    >
                      Xem tất cả trong ngành
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {/* Real Product Cards Grid (Links directly to /products/:id) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {visibleItems.map((prod) => (
                    <ProductCard key={prod.id} product={prod} onQuickView={onQuickView} />
                  ))}
                </div>

                {/* Expand / Collapse Toggle if in 'ALL' view and has > 5 products */}
                {selectedCategoryId === 'ALL' && items.length > 5 && cat.id !== 'ALL' && (
                  <div className="mt-5 text-center pt-2 border-t border-stone-100 dark:border-slate-800/60">
                    <button
                      onClick={() => toggleExpandCategory(cat.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors py-1 px-3 rounded-lg hover:bg-amber-500/10"
                    >
                      {isExpanded ? (
                        <>Thu gọn danh sách</>
                      ) : (
                        <>
                          Xem thêm {items.length - 5} sản phẩm khác của ngành {cat.name}
                          <HiOutlineArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
