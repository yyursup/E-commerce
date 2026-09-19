import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineX, HiOutlinePlusCircle, HiOutlineTrash, HiOutlineInformationCircle, HiOutlineExclamation, HiOutlineLightningBolt } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import toast from 'react-hot-toast'
import sellerService from '../../../services/seller'
import categoryService from '../../../services/category'
import ImageUpload from './ImageUpload'
import { getVariantLabelsByCategory } from '../../../lib/variantMapping'

export default function ProductFormModal({ product = null, onClose, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    basePrice: product?.basePrice || product?.price || '',
    stockQuantity: product?.stockQuantity ?? product?.quantity ?? product?.stock ?? 0,
    categoryId: product?.categoryId || product?.category?.id || '',
    status: product?.status || 'PUBLISHED',
  })
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [imageUrls, setImageUrls] = useState([])
  const [variants, setVariants] = useState([])

  // Quick bulk apply state
  const [showBulkApply, setShowBulkApply] = useState(false)
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')

  useEffect(() => {
    setImageUrls(product?.images?.map((img) => img.imageUrl || img) || [])
    setVariants(product?.variants || [])

    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        basePrice: product.basePrice || product.price || '',
        stockQuantity: product.stockQuantity ?? product.quantity ?? product.stock ?? 0,
        categoryId: product.categoryId || product.category?.id || '',
        status: product.status || 'PUBLISHED',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        basePrice: '',
        stockQuantity: 0,
        categoryId: '',
        status: 'PUBLISHED',
      })
    }
  }, [product])

  // Calculate prices & stock from variants
  const prices = variants.map((v) => parseFloat(v.price) || 0).filter((p) => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const totalVariantStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)

  // Auto-calculate base price and total stock from variants
  useEffect(() => {
    if (variants.length > 0) {
      setFormData((prev) => ({
        ...prev,
        stockQuantity: totalVariantStock,
        basePrice: minPrice > 0 ? minPrice : prev.basePrice,
      }))
    }
  }, [variants, totalVariantStock, minPrice])

  // Helper to detect duplicate variant combinations
  const getDuplicateIndices = (varList) => {
    const countMap = {}
    varList.forEach((v, idx) => {
      const c = (v.color || '').trim().toLowerCase()
      const s = (v.size || '').trim().toLowerCase()
      if (!c && !s) return
      const key = `${c}___${s}`
      if (!countMap[key]) countMap[key] = []
      countMap[key].push(idx)
    })
    const duplicateSet = new Set()
    Object.values(countMap).forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((i) => duplicateSet.add(i))
      }
    })
    return duplicateSet
  }

  const duplicateIndices = getDuplicateIndices(variants)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const categoriesData = await categoryService.getAllCategories()
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        toast.error('Không thể tải danh sách danh mục')
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleApplyBulk = () => {
    if (!bulkPrice && !bulkStock) {
      toast.error('Vui lòng nhập giá hoặc số lượng tồn kho để áp dụng')
      return
    }

    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        price: bulkPrice !== '' ? Number(bulkPrice) : v.price,
        stock: bulkStock !== '' ? Number(bulkStock) : v.stock,
      }))
    )
    toast.success(`Đã áp dụng cho ${variants.length} phân loại hàng`)
    setShowBulkApply(false)
  }

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name?.trim() || !formData.sku?.trim() || !formData.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, SKU, Danh mục)')
      return
    }

    if (variants.length === 0 && (!formData.basePrice || Number(formData.basePrice) <= 0)) {
      toast.error('Vui lòng nhập giá bán hợp lệ (> 0 VND)')
      return
    }

    // Validate variants if exists
    if (variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        const c = (v.color || '').trim()
        const s = (v.size || '').trim()

        if (!c && !s) {
          toast.error(`Phân loại #${i + 1} chưa điền thông tin thuộc tính. Vui lòng nhập tên phân loại hoặc xóa bớt.`)
          return
        }

        if (v.price === '' || v.price === null || isNaN(v.price) || Number(v.price) < 0) {
          toast.error(`Phân loại #${i + 1} (${c || s}) chưa có giá bán hợp lệ (>= 0).`)
          return
        }

        if (v.stock === '' || v.stock === null || isNaN(v.stock) || Number(v.stock) < 0) {
          toast.error(`Phân loại #${i + 1} (${c || s}) chưa có số lượng tồn kho hợp lệ (>= 0).`)
          return
        }
      }

      if (duplicateIndices.size > 0) {
        toast.error('Phát hiện các phân loại hàng bị trùng lặp thuộc tính. Mỗi phân loại phải có thuộc tính khác nhau!')
        return
      }
    }

    try {
      setSubmitting(true)

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        sku: formData.sku.trim(),
        basePrice: parseFloat(formData.basePrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        categoryId: formData.categoryId,
        variants: variants.map((v) => ({
          id: v.id || null,
          color: v.color?.trim() || '',
          size: v.size?.trim() || '',
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock, 10) || 0,
        })),
        images: imageUrls.map((url, index) => ({
          imageUrl: typeof url === 'string' ? url : url?.url || url?.preview,
          isThumbnail: index === 0,
          displayOrder: index,
        })),
      }

      if (product?.id) {
        // Update product
        productData.status = formData.status
        await sellerService.updateProduct(product.id, productData)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        // Create product
        await sellerService.createProduct(productData)
        toast.success('Tạo sản phẩm mới thành công!')
      }

      onSuccess && onSuccess()
    } catch (err) {
      console.error('Error saving product:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu sản phẩm'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = (newUrls) => {
    setImageUrls((prev) => [...prev, ...newUrls])
  }

  const handleImageRemove = (removedUrl) => {
    setImageUrls((prev) =>
      prev.filter((url) => {
        const u = typeof url === 'string' ? url : url?.url || url?.preview
        return u !== removedUrl
      })
    )
  }

  const selectedCategory = categories.find((c) => String(c.id) === String(formData.categoryId))
  const selectedCategoryName = selectedCategory?.name || product?.categoryName || product?.category?.name || ''
  const { attr1, attr2, ph1, ph2 } = getVariantLabelsByCategory(selectedCategoryName)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          'relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border p-6 sm:p-7 shadow-2xl transition-colors',
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điền thông tin chi tiết và phân loại sản phẩm cho gian hàng của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'rounded-xl p-2 transition-colors active:scale-95',
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100 text-stone-900'
            )}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tên sản phẩm */}
          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700'
              )}
            >
              Tên sản phẩm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="VD: Tai nghe Apple AirPods Pro Gen 2..."
              className={cn(
                'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
              )}
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700'
              )}
            >
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Mô tả đặc điểm nổi bật, thông số kỹ thuật, bảo hành..."
              className={cn(
                'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                isDark
                  ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
              )}
            />
          </div>

          {/* SKU & Giá bán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Mã SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                placeholder="VD: TECH-10-CF6E"
                className={cn(
                  'w-full rounded-2xl border px-4 py-2.5 text-sm font-mono outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
                )}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={cn(
                    'block text-xs font-bold uppercase tracking-wider',
                    isDark ? 'text-slate-300' : 'text-stone-700'
                  )}
                >
                  Giá bán (VND) <span className="text-rose-500">*</span>
                </label>
                {variants.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Tự động tính từ biến thể
                  </span>
                )}
              </div>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required={variants.length === 0}
                min="0"
                step="1000"
                disabled={variants.length > 0}
                placeholder="VD: 5690000"
                className={cn(
                  'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500',
                  variants.length > 0 && 'opacity-70 cursor-not-allowed bg-stone-100 dark:bg-slate-950 font-bold'
                )}
              />
              {variants.length > 0 ? (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight">
                  <HiOutlineInformationCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Khoảng giá biến thể:{' '}
                    <strong>
                      {minPrice !== maxPrice
                        ? `${formatVND(minPrice)} - ${formatVND(maxPrice)}`
                        : formatVND(minPrice)}
                    </strong>
                    . Giá niêm yết sẽ tự động cập nhật từ giá thấp nhất.
                  </span>
                </p>
              ) : (
                <p className={cn('mt-1 text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  * Nhập giá bán niêm yết nếu sản phẩm không có phân loại hàng riêng.
                </p>
              )}
            </div>
          </div>

          {/* Tồn kho & Danh mục */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={cn(
                    'block text-xs font-bold uppercase tracking-wider',
                    isDark ? 'text-slate-300' : 'text-stone-700'
                  )}
                >
                  Số lượng tồn kho <span className="text-rose-500">*</span>
                </label>
                {variants.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Tự động tính từ biến thể
                  </span>
                )}
              </div>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                min="0"
                disabled={variants.length > 0}
                placeholder="VD: 100"
                className={cn(
                  'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500',
                  variants.length > 0 && 'opacity-70 cursor-not-allowed bg-stone-100 dark:bg-slate-950 font-bold'
                )}
              />
              {variants.length > 0 ? (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight">
                  <HiOutlineInformationCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Tổng tồn kho:{' '}
                    <strong className="text-amber-500">{totalVariantStock}</strong> cái (tự động cộng dồn từ các biến thể).
                  </span>
                </p>
              ) : (
                <p className={cn('mt-1 text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  * Nhập số lượng hàng có sẵn trong kho của bạn.
                </p>
              )}
            </div>

            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Ngành hàng / Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                disabled={loadingCategories}
                className={cn(
                  'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-white focus:border-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 focus:border-amber-500',
                  loadingCategories && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">
                  {loadingCategories ? 'Đang tải danh mục...' : '--- Chọn danh mục ---'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variants section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 dark:border-slate-800">
              <div>
                <label
                  className={cn(
                    'block text-xs font-bold uppercase tracking-wider',
                    isDark ? 'text-slate-300' : 'text-stone-700'
                  )}
                >
                  Phân loại hàng ({attr1} / {attr2})
                </label>
                <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Tạo các biến thể màu sắc, kích thước, dung lượng với giá và tồn kho riêng biệt
                </p>
              </div>

              <div className="flex items-center gap-2">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowBulkApply(!showBulkApply)}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all',
                      showBulkApply
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                        : isDark
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                    )}
                  >
                    <HiOutlineLightningBolt className="h-3.5 w-3.5 text-amber-500" />
                    Áp dụng nhanh
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setVariants([
                      ...variants,
                      { id: null, color: '', size: '', price: formData.basePrice || '', stock: '1' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <HiOutlinePlusCircle className="h-4 w-4" />
                  Thêm phân loại
                </button>
              </div>
            </div>

            {/* Bulk Apply Bar */}
            {showBulkApply && variants.length > 0 && (
              <div
                className={cn(
                  'p-3.5 rounded-2xl border flex flex-wrap items-center gap-3 transition-all',
                  isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-300 bg-amber-50/70'
                )}
              >
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  ⚡ Điền nhanh cho tất cả {variants.length} biến thể:
                </span>
                <input
                  type="number"
                  placeholder="Giá bán chung (VND)"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className={cn(
                    'w-36 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                  )}
                />
                <input
                  type="number"
                  placeholder="Kho chung"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  className={cn(
                    'w-28 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                  )}
                />
                <button
                  type="button"
                  onClick={handleApplyBulk}
                  className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                >
                  Áp dụng
                </button>
              </div>
            )}

            {/* Duplicate Error Banner if duplicates detected */}
            {duplicateIndices.size > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <HiOutlineExclamation className="h-4 w-4 shrink-0 text-rose-500" />
                <span>
                  Phát hiện {duplicateIndices.size} phân loại hàng bị trùng lặp tổ hợp thuộc tính. Mỗi phân loại bắt buộc phải có ít nhất một thuộc tính khác biệt!
                </span>
              </div>
            )}

            {/* Variants Table / Grid */}
            {variants.length > 0 && (
              <div className="space-y-2.5">
                {/* Column Headers (Desktop) */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  <div className="col-span-1 text-center">STT</div>
                  <div className="col-span-3">{attr1} <span className="text-rose-500">*</span></div>
                  <div className="col-span-3">{attr2}</div>
                  <div className="col-span-3">Giá bán (VND) <span className="text-rose-500">*</span></div>
                  <div className="col-span-1 text-center">Kho <span className="text-rose-500">*</span></div>
                  <div className="col-span-1 text-right">Xóa</div>
                </div>

                {/* Rows list */}
                {variants.map((variant, index) => {
                  const isDuplicate = duplicateIndices.has(index)

                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-3 sm:p-2.5 rounded-2xl border transition-all',
                        isDuplicate
                          ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 ring-1 ring-rose-500/30'
                          : isDark
                            ? 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                            : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                      )}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* STT */}
                        <div className="hidden sm:flex sm:col-span-1 items-center justify-center font-mono font-bold text-xs text-stone-400 dark:text-slate-500">
                          #{index + 1}
                        </div>

                        {/* Attr 1 (Color) */}
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1">
                            {attr1} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder={ph1}
                            value={variant.color || ''}
                            onChange={(e) => {
                              const newVar = [...variants]
                              newVar[index].color = e.target.value
                              setVariants(newVar)
                            }}
                            className={cn(
                              'w-full rounded-xl border px-3 py-1.5 text-xs outline-none transition-all',
                              isDuplicate && 'border-rose-500/70 focus:ring-1 focus:ring-rose-500',
                              isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Attr 2 (Size) */}
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1">
                            {attr2}
                          </label>
                          <input
                            type="text"
                            placeholder={ph2 || `VD: XL, 256GB, 100ml...`}
                            value={variant.size || ''}
                            onChange={(e) => {
                              const newVar = [...variants]
                              newVar[index].size = e.target.value
                              setVariants(newVar)
                            }}
                            className={cn(
                              'w-full rounded-xl border px-3 py-1.5 text-xs outline-none transition-all',
                              isDuplicate && 'border-rose-500/70 focus:ring-1 focus:ring-rose-500',
                              isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Price */}
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1">
                            Giá bán (VND) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="Giá bán (VND)"
                            min="0"
                            step="1000"
                            value={variant.price === 0 && !variant.id ? '' : variant.price}
                            onChange={(e) => {
                              const newVar = [...variants]
                              newVar[index].price = e.target.value
                              setVariants(newVar)
                            }}
                            className={cn(
                              'w-full rounded-xl border px-3 py-1.5 text-xs outline-none font-medium transition-all',
                              isDark ? 'border-slate-700 bg-slate-800 text-amber-400' : 'border-stone-300 bg-white text-amber-700'
                            )}
                          />
                        </div>

                        {/* Stock */}
                        <div className="sm:col-span-1">
                          <label className="block sm:hidden text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1">
                            Kho <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="Kho"
                            min="0"
                            value={variant.stock === 0 && !variant.id ? '' : variant.stock}
                            onChange={(e) => {
                              const newVar = [...variants]
                              newVar[index].stock = e.target.value
                              setVariants(newVar)
                            }}
                            className={cn(
                              'w-full rounded-xl border px-2.5 py-1.5 text-xs text-center outline-none transition-all',
                              isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Delete Action */}
                        <div className="sm:col-span-1 flex items-center justify-end sm:justify-center">
                          <button
                            type="button"
                            onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"
                            title="Xóa phân loại này"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Duplicate row inline warning */}
                      {isDuplicate && (
                        <p className="mt-1.5 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                          <HiOutlineExclamation className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Phân loại này trùng thuộc tính ({variant.color || 'Trống'} - {variant.size || 'Trống'}) với dòng khác. Vui lòng sửa lại thông tin sản phẩm.
                          </span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Trạng thái (khi sửa sản phẩm) */}
          {product && (
            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700'
                )}
              >
                Trạng thái hiển thị
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={cn(
                  'w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/30',
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-white focus:border-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 focus:border-amber-500'
                )}
              >
                <option value="PUBLISHED">Đang bán (Hiển thị trên sàn)</option>
                <option value="DRAFT">Bản nháp (Tạm ẩn)</option>
                <option value="INACTIVE">Tạm ngưng (Tạm dừng bán)</option>
                <option value="ARCHIVED">Đã lưu trữ (Ngừng kinh doanh)</option>
              </select>
            </div>
          )}

          {/* Hình ảnh sản phẩm */}
          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700'
              )}
            >
              Hình ảnh sản phẩm (Tối đa 5MB / ảnh)
            </label>
            <ImageUpload
              onUpload={handleImageUpload}
              existingImages={imageUrls}
              onRemove={handleImageRemove}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95',
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              )}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || duplicateIndices.size > 0}
              className={cn(
                'rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95',
                submitting || duplicateIndices.size > 0
                  ? 'bg-amber-400/60 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
              )}
            >
              {submitting ? 'Đang xử lý...' : product ? 'Cập nhật sản phẩm' : 'Đăng bán sản phẩm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
