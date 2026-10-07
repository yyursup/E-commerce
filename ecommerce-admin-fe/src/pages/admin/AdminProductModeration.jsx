import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineTag,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import productService from '../../services/product'

const getConditionBadge = (grade) => {
  switch (grade) {
    case 'GRADE_NEW':
      return { label: 'Mới 100% Seal', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' }
    case 'GRADE_OPEN_BOX':
      return { label: 'Mở hộp / Trưng bày 99%', color: 'border-sky-500/30 bg-sky-500/10 text-sky-500' }
    case 'GRADE_LIKE_NEW':
      return { label: 'Like New 99%', color: 'border-amber-500/30 bg-amber-500/10 text-amber-500' }
    case 'GRADE_FAIR':
      return { label: 'Cũ 90-95%', color: 'border-orange-500/30 bg-orange-500/10 text-orange-500' }
    case 'GRADE_AS_IS':
      return { label: 'Xác máy / As-is', color: 'border-rose-500/30 bg-rose-500/10 text-rose-500' }
    default:
      return { label: 'Chưa phân loại', color: 'border-slate-500/30 bg-slate-500/10 text-slate-400' }
  }
}

const formatVND = (amt) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
}

export default function AdminProductModeration() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Rejection modal
  const [rejectingProduct, setRejectingProduct] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Detail preview modal
  const [previewProduct, setPreviewProduct] = useState(null)

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await productService.getPendingProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch pending products error:', err)
      toast.error(err?.message || 'Không thể tải danh sách sản phẩm chờ duyệt.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleApprove = async (productId, productName) => {
    if (!window.confirm(`Xác nhận phê duyệt sản phẩm "${productName || ''}" niêm yết lên sàn thương mại?`)) {
      return
    }

    try {
      setActionLoadingId(productId)
      await productService.approveProduct(productId)
      toast.success(`Đã phê duyệt sản phẩm "${productName}" thành công!`)
      fetchPending()
    } catch (err) {
      console.error('Approve product error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi phê duyệt sản phẩm.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleOpenReject = (product) => {
    setRejectingProduct(product)
    setRejectReason('Mô tả tình trạng ngoại quan hoặc ảnh chụp không đầy đủ chi tiết vết trầy xước theo quy chuẩn.')
  }

  const handleConfirmReject = async () => {
    if (!rejectingProduct) return
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối để thông báo cho người bán.')
      return
    }

    try {
      setActionLoadingId(rejectingProduct.id)
      await productService.rejectProduct(rejectingProduct.id, rejectReason.trim())
      toast.success(`Đã từ chối kiểm duyệt sản phẩm "${rejectingProduct.name}".`)
      setRejectingProduct(null)
      setRejectReason('')
      fetchPending()
    } catch (err) {
      console.error('Reject product error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi từ chối sản phẩm.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredProducts = products.filter((p) => {
    const s = search.toLowerCase()
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(s)) ||
      (p.sku && p.sku.toLowerCase().includes(s)) ||
      (p.shopName && p.shopName.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className={cn(
        'rounded-2xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={cn('p-2 rounded-xl', isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600')}>
              <HiOutlineShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kiểm Duyệt Sản Phẩm Công Nghệ
              </h1>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Hệ thống kiểm duyệt đồ điện tử đã qua sử dụng (Like New, Cũ), thiết bị kiểm định, và shop cần thẩm định trước khi mở bán.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPending}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition active:scale-95 disabled:opacity-50',
              isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
            Làm mới ({products.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU, danh mục hoặc Shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-xl pl-10 pr-4 py-2 text-xs border outline-none transition',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500'
            )}
          />
          <HiOutlineSearch className={cn('absolute left-3 top-2.5 h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-400')} />
        </div>

        <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang chờ xử lý: <strong className="text-amber-500">{filteredProducts.length}</strong> sản phẩm
        </span>
      </div>

      {/* Product List */}
      {loading ? (
        <div className={cn('rounded-2xl border p-12 text-center', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <HiOutlineRefresh className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-3" />
          <p className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-stone-600')}>
            Đang tải danh sách sản phẩm chờ kiểm duyệt...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={cn('rounded-2xl border p-12 text-center', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
          <HiOutlineCheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold">Hàng chờ kiểm duyệt đang trống!</h3>
          <p className={cn('text-xs mt-1 max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Không có sản phẩm nào đang ở trạng thái Chờ duyệt. Tất cả các sản phẩm đã được kiểm định hoặc đã xuất bản tự động.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((prod) => {
            const condition = getConditionBadge(prod.conditionGrade)
            const imgUrl = prod.image || (prod.images && prod.images[0]) || '/product-placeholder.svg'
            const isProcessing = actionLoadingId === prod.id

            // Parse specs safely
            let specs = null
            try {
              if (prod.specifications) {
                specs = typeof prod.specifications === 'string' ? JSON.parse(prod.specifications) : prod.specifications
              }
            } catch (e) {
              specs = null
            }

            return (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-2xl border p-5 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white shadow-sm'
                )}
              >
                {/* Product Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                    className={cn(
                      'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border shrink-0',
                      isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-100'
                    )}
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold border', condition.color)}>
                        {condition.label}
                      </span>

                      <span className={cn(
                        'text-xs px-2.5 py-0.5 rounded-lg border font-medium',
                        isDark ? 'border-slate-800 bg-slate-800/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600'
                      )}>
                        {prod.categoryName || 'Đồ điện tử'}
                      </span>

                      {prod.sku && (
                        <span className={cn(
                          'font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border',
                          isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-700'
                        )}>
                          SKU: {prod.sku}
                        </span>
                      )}

                      {/* Bảo hành */}
                      {prod.warrantyType && prod.warrantyType !== 'NONE' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-500">
                          BH: {prod.warrantyMonths ? `${prod.warrantyMonths} Tháng ` : ''}{prod.warrantyType === 'OFFICIAL' ? 'Chính hãng' : 'Cửa hàng'}
                        </span>
                      )}

                      {/* Pin */}
                      {prod.batteryHealth && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                          Pin: {prod.batteryHealth}%
                        </span>
                      )}

                      {/* Sửa chữa */}
                      {prod.isRepaired && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-500">
                          Đã thay thế/sửa chữa: {prod.repairDetails || 'Có can thiệp'}
                        </span>
                      )}
                    </div>

                    <h3 className={cn('font-bold text-sm sm:text-base leading-snug', isDark ? 'text-white' : 'text-stone-900')}>
                      {prod.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Giá đề xuất: <strong className={cn('text-sm', isDark ? 'text-amber-400' : 'text-amber-600')}>{formatVND(prod.basePrice || prod.price)}</strong>
                      </span>
                      <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                        Tồn kho: <strong>{prod.stockQuantity ?? prod.quantity ?? 0}</strong> cái
                      </span>
                      {prod.shopName && (
                        <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                          Gian hàng: <strong className="text-amber-500">{prod.shopName}</strong>
                        </span>
                      )}
                    </div>

                    {/* Preview specs quick pills */}
                    {specs && typeof specs === 'object' && Object.keys(specs).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {Object.entries(specs).slice(0, 4).map(([k, v], i) => (
                          <span
                            key={i}
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-md border font-medium',
                              isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-600'
                            )}
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-slate-800 shrink-0 w-full lg:w-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(prod)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition active:scale-95',
                        isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                      )}
                    >
                      <HiOutlineEye className="h-4 w-4" />
                      Chi tiết
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleOpenReject(prod)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition disabled:opacity-50"
                    >
                      <HiOutlineXCircle className="h-4 w-4" />
                      Từ chối
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(prod.id, prod.name)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                    >
                      <HiOutlineCheckCircle className="h-4 w-4" />
                      Phê duyệt
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
                  <HiOutlineExclamation className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Từ Chối Kiểm Duyệt Sản Phẩm</h3>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Sản phẩm: <span className="font-semibold text-rose-500">{rejectingProduct.name}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn('block text-xs font-bold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Lý do từ chối (Gửi thông báo giải trình cho người bán):
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể vì sao sản phẩm không đạt tiêu chuẩn niêm yết..."
                  className={cn(
                    'w-full rounded-xl p-3 text-xs border outline-none transition',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-rose-500'
                      : 'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-400 focus:border-rose-500'
                  )}
                />

                {/* Quick reason presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Ảnh chụp mờ hoặc không chụp góc cạnh trầy xước',
                    'Dung lượng pin không khớp với phân loại Like New',
                    'Thiếu hóa đơn bảo hành chính hãng hợp lệ',
                    'Mô tả phân loại đồ cũ có dấu hiệu vi phạm chính sách',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-lg border transition',
                        isDark ? 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600' : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800 border-stone-100">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-semibold border transition',
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-stone-300 hover:bg-stone-100'
                  )}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === rejectingProduct.id}
                  onClick={handleConfirmReject}
                  className="rounded-xl px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {actionLoadingId === rejectingProduct.id ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Preview Modal */}
      <AnimatePresence>
        {previewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-2xl rounded-2xl border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto',
                isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-lg border', getConditionBadge(previewProduct.conditionGrade).color)}>
                    {getConditionBadge(previewProduct.conditionGrade).label}
                  </span>
                  <h3 className="text-lg font-bold mt-1.5">{previewProduct.name}</h3>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Mã SKU: <span className="font-mono font-bold text-amber-500">{previewProduct.sku || 'N/A'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="rounded-lg p-1.5 hover:bg-slate-800 text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Gallery */}
              {previewProduct.images && previewProduct.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewProduct.images.map((img, i) => (
                    <img
                      key={i}
                      src={typeof img === 'string' ? img : img.imageUrl}
                      alt=""
                      className="h-24 w-full rounded-xl object-cover border dark:border-slate-700 border-stone-200"
                    />
                  ))}
                </div>
              )}

              {/* Specs & Hardware */}
              <div className={cn('rounded-xl p-4 border text-xs space-y-2', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50')}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-stone-400 block">Dung lượng pin:</span>
                    <strong className="text-emerald-500">{previewProduct.batteryHealth ? `${previewProduct.batteryHealth}%` : 'Chưa cập nhật / N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Bảo hành:</span>
                    <strong>{previewProduct.warrantyMonths ? `${previewProduct.warrantyMonths} tháng ` : ''}({previewProduct.warrantyType || 'NONE'})</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400 block">Trạng thái linh kiện & sửa chữa:</span>
                    <strong className={previewProduct.isRepaired ? 'text-rose-400' : 'text-emerald-500'}>
                      {previewProduct.isRepaired ? `Đã thay thế: ${previewProduct.repairDetails || 'Có can thiệp'}` : 'Zin 100% nguyên bản'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Full description */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Mô tả sản phẩm</span>
                <p className={cn('text-xs whitespace-pre-wrap rounded-xl p-3 border', isDark ? 'border-slate-800 bg-slate-800/20' : 'border-stone-200 bg-stone-50')}>
                  {previewProduct.description || 'Chưa có mô tả.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-800 border-stone-100">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-semibold border transition',
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-stone-300 hover:bg-stone-100'
                  )}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = previewProduct
                    setPreviewProduct(null)
                    handleOpenReject(p)
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = previewProduct
                    setPreviewProduct(null)
                    handleApprove(p.id, p.name)
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Phê duyệt ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
