import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import toast from 'react-hot-toast'
import sellerService from '../../../services/seller'
import categoryService from '../../../services/category'
import ImageUpload from './ImageUpload'

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

  // Initialize imageUrls when product changes
  useEffect(() => {
    if (product?.images && Array.isArray(product.images)) {
      setImageUrls(product.images.map((img) => img.imageUrl || img))
    } else if (product?.image) {
      setImageUrls([product.image])
    } else {
      setImageUrls([])
    }
  }, [product])

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
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl',
          isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900',
        )}
      >
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
          <div>
            <h2
              className={cn(
                'text-xl font-bold',
                isDark ? 'text-white' : 'text-stone-900',
              )}
            >
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              {product ? `Cập nhật thông tin cho mã SKU: ${product.sku}` : 'Điền thông tin và hình ảnh để đăng bán sản phẩm'}
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
              placeholder="Nhập tên sản phẩm (VD: Áo Thun Nam Cotton Cao Cấp...)"
              required
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
              placeholder="Mô tả chất liệu, nguồn gốc, quy cách đóng gói..."
              rows={3}
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
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="VD: PROD-001"
                required
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono uppercase outline-none transition-all focus:ring-2 focus:ring-amber-500',
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
                Giá niêm yết (VND) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="VD: 150000"
                required
                min="1000"
                step="1000"
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400',
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold uppercase tracking-wider',
                  isDark ? 'text-slate-300' : 'text-stone-700',
                )}
              >
                Số lượng tồn kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                min="0"
                placeholder="VD: 100"
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
