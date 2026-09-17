import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineX, HiOutlinePlusCircle, HiOutlineTrash, HiOutlineInformationCircle } from 'react-icons/hi'
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

  // Auto-calculate base price and total stock from variants
  useEffect(() => {
    if (variants.length > 0) {
      const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
      const prices = variants.map((v) => parseFloat(v.price) || 0).filter((p) => p > 0)
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0

      setFormData((prev) => ({
        ...prev,
        stockQuantity: totalStock,
        basePrice: minPrice > 0 ? minPrice : prev.basePrice,
      }))
    }
  }, [variants])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name?.trim() || !formData.sku?.trim() || !formData.basePrice || !formData.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, SKU, Giá, Danh mục)')
      return
    }

    try {
      setSubmitting(true)

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        sku: formData.sku.trim(),
        basePrice: parseFloat(formData.basePrice),
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
    setImageUrls((prev) => prev.filter((url) => {
      const u = typeof url === 'string' ? url : url?.url || url?.preview
      return u !== removedUrl
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl',
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điền thông tin chi tiết và phân loại sản phẩm cho gian hàng của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'rounded-xl p-2 transition-colors',
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
            )}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700',
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
                'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
              )}
            />
          </div>

          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700',
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
                'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
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
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Giá bán (VND) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
                min="0"
                step="1000"
                disabled={variants.length > 0}
                placeholder="VD: 5690000"
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
                  variants.length > 0 && 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-slate-900'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={cn(
                    'block text-xs font-bold uppercase tracking-wider',
                    isDark ? 'text-slate-300' : 'text-stone-700',
                  )}
                >
                  Số lượng tồn kho <span className="text-rose-500">*</span>
                </label>
                {variants.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
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
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
                  variants.length > 0 && 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-slate-900'
                )}
              />
              {variants.length > 0 ? (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight">
                  <HiOutlineInformationCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Khi nhập phân loại hàng, số lượng tồn kho tự động được tính từ tổng các biến thể, bạn không cần nhập SL ở đây.</span>
                </p>
              ) : (
                <p className={cn('mt-1 text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  * Lưu ý: Nếu nhập thêm biến thể phân loại bên dưới thì không cần nhập SL ở đây.
                </p>
              )}
            </div>

            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
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
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                  loadingCategories && 'opacity-50 cursor-not-allowed',
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
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                className={cn(
                  'block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Phân loại hàng ({(() => {
                  const selectedCategoryName = categories.find(c => c.id === formData.categoryId)?.name || '';
                  const { attr1, attr2 } = getVariantLabelsByCategory(selectedCategoryName);
                  return `${attr1} / ${attr2}`;
                })()})
              </label>
              <button
                type="button"
                onClick={() => setVariants([...variants, { id: null, color: '', size: '', price: '', stock: '' }])}
                className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
              >
                <HiOutlinePlusCircle className="h-4 w-4" />
                Thêm phân loại
              </button>
            </div>

            {variants.length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Bạn đang nhập biến thể: Số lượng tồn kho và giá bán sẽ tự động tính theo các biến thể dưới đây, không cần nhập SL ở trên.</span>
              </div>
            )}

            {variants.length > 0 && (
              <div className="space-y-3 mb-2">
                {variants.map((variant, index) => {
                  const selectedCategoryName = categories.find(c => c.id === formData.categoryId)?.name || '';
                  const { attr1, attr2 } = getVariantLabelsByCategory(selectedCategoryName);

                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-xl border flex gap-3 items-start transition-colors',
                        isDark ? 'border-slate-700 bg-slate-800/60' : 'border-stone-200 bg-stone-50'
                      )}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder={`${attr1} (VD: Đen)`}
                          value={variant.color || ''}
                          onChange={(e) => {
                            const newVar = [...variants]
                            newVar[index].color = e.target.value
                            setVariants(newVar)
                          }}
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs', isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-stone-300 bg-white text-stone-900')}
                        />
                        <input
                          type="text"
                          placeholder={`${attr2} (VD: XL, 256GB)`}
                          value={variant.size || ''}
                          onChange={(e) => {
                            const newVar = [...variants]
                            newVar[index].size = e.target.value
                            setVariants(newVar)
                          }}
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs', isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-stone-300 bg-white text-stone-900')}
                        />
                        <input
                          type="number"
                          placeholder="Giá riêng"
                          value={variant.price === 0 && !variant.id ? '' : variant.price}
                          onChange={(e) => {
                            const newVar = [...variants]
                            newVar[index].price = e.target.value
                            setVariants(newVar)
                          }}
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs', isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-stone-300 bg-white text-stone-900')}
                        />
                        <input
                          type="number"
                          placeholder="Tồn kho"
                          value={variant.stock === 0 && !variant.id ? '' : variant.stock}
                          onChange={(e) => {
                            const newVar = [...variants]
                            newVar[index].stock = e.target.value
                            setVariants(newVar)
                          }}
                          className={cn('w-full rounded-lg border px-2.5 py-1.5 text-xs', isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-stone-300 bg-white text-stone-900')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Xóa phân loại này"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {product && (
            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Trạng thái hiển thị
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white'
                    : 'border-stone-300 bg-white text-stone-900',
                )}
              >
                <option value="PUBLISHED">Đang bán (Hiển thị trên sàn)</option>
                <option value="DRAFT">Bản nháp (Tạm ẩn)</option>
                <option value="INACTIVE">Tạm ngưng (Tạm dừng bán)</option>
                <option value="ARCHIVED">Đã lưu trữ (Ngừng kinh doanh)</option>
              </select>
            </div>
          )}

          <div>
            <label
              className={cn(
                'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                isDark ? 'text-slate-300' : 'text-stone-700',
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

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
              )}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition-all',
                submitting
                  ? 'bg-amber-400 cursor-not-allowed opacity-70'
                  : 'bg-amber-500 hover:bg-amber-600 active:scale-95 shadow-amber-500/25',
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
