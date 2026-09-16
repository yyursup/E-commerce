import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineX,
  HiOutlinePencilAlt,
  HiOutlineExternalLink,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlinePhotograph,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import toast from 'react-hot-toast'

export default function ProductDetailModal({
  product,
  onClose,
  onEdit,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const [copiedSku, setCopiedSku] = useState(false)

  if (!product) return null

  const images = product.images?.length
    ? product.images.map((img) => (typeof img === 'string' ? img : img.imageUrl || '/product-placeholder.svg'))
    : [product.image || '/product-placeholder.svg']

  const activeImg = images[selectedImgIndex] || images[0]

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  const handleCopySku = () => {
    if (!product.sku) return
    navigator.clipboard.writeText(product.sku)
    setCopiedSku(true)
    toast.success(`Đã sao chép SKU: ${product.sku}`)
    setTimeout(() => setCopiedSku(false), 2000)
  }

  const getStatusBadge = (status) => {
    const st = status?.toUpperCase() || 'PUBLISHED'
    if (st === 'PUBLISHED') {
      return { label: 'Đang mở bán', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
    }
    if (st === 'DRAFT') {
      return { label: 'Bản nháp', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
    }
    if (st === 'INACTIVE') {
      return { label: 'Tạm ngưng', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' }
    }
    return { label: 'Đã lưu trữ', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
  }

  const statusBadge = getStatusBadge(product.status)
  const price = product.basePrice ? Number(product.basePrice) : (product.price ? Number(product.price) : 0)
  const stock = product.stockQuantity ?? product.quantity ?? product.stock ?? 0
  const variants = product.variants || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col',
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-6 py-4 border-b shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-2xl shrink-0',
              isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'
            )}>
              <HiOutlineCube className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Chi Tiết Sản Phẩm
              </h2>
              <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Mã sản phẩm: <span className="font-mono font-bold text-amber-500">#{product.id?.slice(0, 8) || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn('px-3 py-1 rounded-full text-xs font-bold border shrink-0', statusBadge.color)}>
              {statusBadge.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-xl p-2 transition-all active:scale-95',
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100'
              )}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className={cn(
                'relative aspect-square w-full rounded-2xl overflow-hidden border flex items-center justify-center bg-slate-950/20',
                isDark ? 'border-slate-800' : 'border-stone-200'
              )}>
                <img
                  src={activeImg}
                  alt={product.name}
                  onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Thumbnails list */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImgIndex(idx)}
                      className={cn(
                        'h-14 w-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all active:scale-95',
                        selectedImgIndex === idx
                          ? 'border-amber-500 shadow-md shadow-amber-500/25 scale-105'
                          : isDark ? 'border-slate-800 opacity-60 hover:opacity-100' : 'border-stone-200 opacity-60 hover:opacity-100'
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Pricing (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className={cn(
                  'inline-block text-xs font-semibold px-2.5 py-0.5 rounded-lg border mb-2',
                  isDark ? 'border-slate-800 bg-slate-800/80 text-amber-400' : 'border-stone-200 bg-stone-100 text-amber-700'
                )}>
                  {product.categoryName || product.category?.name || 'Danh mục chung'}
                </span>
                <h3 className="text-lg sm:text-xl font-black leading-snug break-words">
                  {product.name}
                </h3>
              </div>

              {/* Price & Stock Highlight Box */}
              <div className={cn(
                'rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4',
                isDark ? 'border-slate-800 bg-slate-800/50' : 'border-amber-100 bg-amber-50/50'
              )}>
                <div>
                  <span className={cn('text-xs block', isDark ? 'text-slate-400' : 'text-stone-500')}>Giá niêm yết:</span>
                  <span className={cn('text-2xl font-black', isDark ? 'text-amber-400' : 'text-amber-600')}>
                    {formatVND(price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className={cn('text-xs block', isDark ? 'text-slate-400' : 'text-stone-500')}>Tổng tồn kho:</span>
                  <span className={cn(
                    'text-lg font-black',
                    stock === 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'
                  )}>
                    {stock} <span className="text-xs font-normal">sản phẩm</span>
                  </span>
                  {stock === 0 && (
                    <span className="block text-[11px] font-bold text-rose-500">(Hết hàng)</span>
                  )}
                </div>
              </div>

              {/* SKU & Category Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn('rounded-xl p-3 border', isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>Mã SKU</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-bold text-xs truncate">{product.sku || 'Chưa thiết lập'}</span>
                    {product.sku && (
                      <button
                        type="button"
                        onClick={handleCopySku}
                        className="text-stone-400 hover:text-amber-500 p-1"
                        title="Sao chép SKU"
                      >
                        {copiedSku ? <HiOutlineCheck className="h-4 w-4 text-emerald-500" /> : <HiOutlineClipboardCopy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className={cn('rounded-xl p-3 border', isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50')}>
                  <span className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>Trạng thái kho</span>
                  <p className={cn('text-xs font-bold mt-0.5', stock > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {stock > 0 ? 'Sẵn sàng giao hàng' : 'Cần nhập thêm hàng'}
                  </p>
                </div>
              </div>

              {/* Variants Section (if any) */}
              {variants.length > 0 && (
                <div className="space-y-2">
                  <h4 className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    Phân loại biến thể ({variants.length})
                  </h4>
                  <div className={cn('rounded-2xl border divide-y overflow-hidden', isDark ? 'border-slate-800 divide-slate-800' : 'border-stone-200 divide-stone-100')}>
                    {variants.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 text-xs">
                        <div className="font-semibold">
                          {v.variantName || v.name || `Biến thể #${i + 1}`}
                          {v.sku && <span className="ml-2 font-mono text-[11px] text-stone-400">({v.sku})</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn('font-bold', isDark ? 'text-amber-400' : 'text-amber-600')}>
                            {formatVND(v.price)}
                          </span>
                          <span className={cn('font-bold', Number(v.stock) === 0 ? 'text-rose-500' : isDark ? 'text-slate-300' : 'text-stone-700')}>
                            Kho: {v.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Box */}
          <div className="space-y-2 border-t pt-4 dark:border-slate-800 border-stone-200">
            <h4 className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-300' : 'text-stone-700')}>
              Mô tả chi tiết sản phẩm
            </h4>
            <div className={cn(
              'rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto',
              isDark ? 'border-slate-800 bg-slate-800/30 text-slate-300' : 'border-stone-100 bg-stone-50 text-stone-700'
            )}>
              {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={cn(
          'flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <a
            href={`http://localhost:3000/products/${product.id}`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold border transition-all active:scale-95',
              isDark
                ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'border-stone-300 text-stone-700 hover:bg-white'
            )}
          >
            <HiOutlineExternalLink className="h-4 w-4" />
            Xem trang bán lẻ trên sàn
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 sm:flex-initial rounded-xl px-4 py-2.5 text-xs font-bold border transition-all active:scale-95',
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-stone-300 text-stone-700 hover:bg-stone-100'
              )}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.()
                onEdit?.(product)
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
            >
              <HiOutlinePencilAlt className="h-4 w-4" />
              Chỉnh sửa sản phẩm
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
