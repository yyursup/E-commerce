import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiOutlineFilter } from 'react-icons/hi'
import ProductCard from '../../components/ProductCard'
import Modal from '../../components/Modal'
import ProductQuickView from '../../components/ProductQuickView'
import ProductSearchBar from './components/ProductSearchBar'
import ProductSortDropdown from './components/ProductSortDropdown'
import ProductFilterSidebar from './components/ProductFilterSidebar'
import ProductFilterModal from './components/ProductFilterModal'
import ProductListStates from './components/ProductListStates'
import Pagination from './components/Pagination'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import productService from '../../services/product'
import { PRICE_RANGES } from './components/PriceRangeFilter'

export default function Products() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  
  // Filter states from URL params
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const shopId = searchParams.get('shopId') || ''
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortDir = searchParams.get('sortDir') || 'desc'
  const page = parseInt(searchParams.get('page') || '0', 10)
  const size = parseInt(searchParams.get('size') || '20', 10)
  
  // Pagination
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Local filter states
  const [localSearch, setLocalSearch] = useState(search)
  const [selectedPriceRange, setSelectedPriceRange] = useState(() => {
    if (minPrice !== null || maxPrice !== null) {
      return PRICE_RANGES.find(
        r => r.min === minPrice && r.max === maxPrice
      ) || PRICE_RANGES[0]
    }
    return PRICE_RANGES[0]
  })

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = {
          page,
          size,
          sortBy,
          sortDir,
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(shopId && { shopId }),
          ...(minPrice !== null && { minPrice }),
          ...(maxPrice !== null && { maxPrice }),
        }
        
        const response = await productService.getProducts(params)
        
        // Map API response to component format
        const mappedProducts = response.content?.map((product) => {
          const thumbnailImage = product.images?.find(img => img.isThumbnail) || product.images?.[0]
          const imageUrl = thumbnailImage?.imageUrl || 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop'
          const price = product.basePrice ? Number(product.basePrice) : 0
          
          let badge = null
          if (product.status === 'PUBLISHED') {
            badge = 'Bestseller'
          }
          
          return {
            id: product.id,
            name: product.name,
            price: price,
            image: imageUrl,
            badge: badge,
            rating: 4.5,
            description: product.description,
            basePrice: product.basePrice,
            shopName: product.shopName,
            categoryName: product.categoryName,
            categoryId: product.categoryId,
            shopId: product.shopId,
            originalProduct: product,
          }
        }) || []
        
        setProducts(mappedProducts)
        setTotalPages(response.totalPages || 0)
        setTotalElements(response.totalElements || 0)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message || 'Không thể tải danh sách sản phẩm')
        toast.error('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [page, size, search, categoryId, shopId, minPrice, maxPrice, sortBy, sortDir])

  // Update local search when URL changes
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  // Update price range when URL changes
  useEffect(() => {
    if (minPrice !== null || maxPrice !== null) {
      const range = PRICE_RANGES.find(
        r => r.min === minPrice && r.max === maxPrice
      )
      if (range) setSelectedPriceRange(range)
    } else {
      setSelectedPriceRange(PRICE_RANGES[0])
    }
  }, [minPrice, maxPrice])

  // Handle search
  const handleSearch = (searchValue) => {
    const newParams = new URLSearchParams(searchParams)
    if (searchValue) {
      newParams.set('search', searchValue)
    } else {
      newParams.delete('search')
    }
    newParams.set('page', '0')
    setSearchParams(newParams)
  }

  const handleSearchClear = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('search')
    setSearchParams(newParams)
  }

  // Handle filter changes
  const handlePriceRangeChange = (range) => {
    setSelectedPriceRange(range)
    const newParams = new URLSearchParams(searchParams)
    if (range.min !== null) {
      newParams.set('minPrice', range.min.toString())
    } else {
      newParams.delete('minPrice')
    }
    if (range.max !== null) {
      newParams.set('maxPrice', range.max.toString())
    } else {
      newParams.delete('maxPrice')
    }
    newParams.set('page', '0')
    setSearchParams(newParams)
  }

  const handleCategoryChange = (categoryId) => {
    const newParams = new URLSearchParams(searchParams)
    if (categoryId) {
      newParams.set('categoryId', categoryId)
    } else {
      newParams.delete('categoryId')
    }
    newParams.set('page', '0')
    setSearchParams(newParams)
  }

  const handleSortChange = (sortValue) => {
    const [sortBy, sortDir] = sortValue.split(',')
    const newParams = new URLSearchParams(searchParams)
    newParams.set('sortBy', sortBy)
    newParams.set('sortDir', sortDir)
    newParams.set('page', '0')
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchParams({})
    setLocalSearch('')
    setSelectedPriceRange(PRICE_RANGES[0])
  }

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', newPage.toString())
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuickView = (product) => setQuickViewProduct(product)
  const handleAddToCart = (product) => {
    toast.success(`${product.name} đã thêm vào giỏ (demo)`)
    setQuickViewProduct(null)
  }

  const hasActiveFilters = search || categoryId || shopId || minPrice !== null || maxPrice !== null

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={cn(
              'text-3xl font-bold tracking-tight sm:text-4xl',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            Tất cả sản phẩm
          </h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            {totalElements > 0
              ? `Tìm thấy ${totalElements} sản phẩm`
              : 'Không có sản phẩm nào'}
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProductSearchBar
            value={localSearch}
            onChange={setLocalSearch}
            onSubmit={handleSearch}
            onClear={handleSearchClear}
          />

          {/* Sort and Mobile Filter */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition sm:hidden',
                isDark
                  ? 'border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
              )}
            >
              <HiOutlineFilter className="h-4 w-4" />
              Bộ lọc
            </button>

            <ProductSortDropdown
              value={`${sortBy},${sortDir}`}
              onChange={handleSortChange}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <ProductFilterSidebar
            selectedPriceRange={selectedPriceRange}
            onPriceRangeChange={handlePriceRangeChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {/* Main Content */}
          <main className="flex-1">
            <ProductListStates
              loading={loading}
              error={error}
              empty={products.length === 0 && !loading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onRetry={() => window.location.reload()}
            />

            {!loading && !error && products.length > 0 && (
              <>
                {/* Products Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={handleQuickView}
                      dataAos="fade-up"
                      dataAosDelay={i % 3 === 0 ? 0 : (i % 3) * 100}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <ProductFilterModal
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={handlePriceRangeChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Product Quick View Modal */}
      <Modal
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name ?? 'Sản phẩm'}
        size="md"
      >
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
            onAddToCart={handleAddToCart}
          />
        )}
      </Modal>
    </div>
  )
}
