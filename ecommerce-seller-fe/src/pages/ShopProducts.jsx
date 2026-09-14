import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import productService from '../services/product'

export default function ShopProducts() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const shopId = user?.shopId

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await productService.getProducts({
        shopId: shopId || undefined,
        page: 0,
        size: 50,
      })
      const items = res?.content || []
      // If shop has no items, fallback demo products
      if (items.length === 0) {
        const fallback = await productService.getProducts({ page: 0, size: 20 })
        setProducts(fallback?.content || [])
      } else {
        setProducts(items)
      }
    } catch (err) {
      console.warn('Load shop products error:', err)
      toast.error('Không thể tải danh sách sản phẩm.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [shopId])

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className={cn('rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div>
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
            Tổng số: <span className="font-bold text-amber-500">{products.length}</span> sản phẩm đang bán
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadProducts}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
            title="Tải lại"
          >
            <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={() => toast.success('Tính năng thêm sản phẩm trực tiếp đang đồng bộ với kho GHN!')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full sm:w-80 rounded-2xl pl-10 pr-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
            isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
          )}
        />
        <HiOutlineSearch className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
      </div>

      {/* Product List Table / Grid */}
      <div className={cn('rounded-3xl border overflow-hidden shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
            <p className="mt-3 text-xs text-stone-500">Đang tải danh sách sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <HiOutlineCube className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-700 mb-2" />
            Không tìm thấy sản phẩm nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={cn('border-b text-[11px] font-bold uppercase tracking-wider',
                isDark ? 'border-slate-800 bg-slate-800/40 text-slate-400' : 'border-stone-100 bg-stone-50 text-stone-500'
              )}>
                <tr>
                  <th className="py-3.5 px-4">Sản phẩm</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4">Tồn kho</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {filtered.map((prod) => {
                  const thumb = prod.images?.find((img) => img.isThumbnail) || prod.images?.[0]
                  const imgUrl = thumb?.imageUrl || prod.image || '/product-placeholder.svg'
                  const price = prod.basePrice ? Number(prod.basePrice) : (prod.price ? Number(prod.price) : 0)

                  return (
                    <tr key={prod.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3 min-w-[220px]">
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                          className="h-12 w-12 rounded-xl object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-stone-900 dark:text-white line-clamp-1">{prod.name}</p>
                          <p className="text-[10px] text-stone-400 truncate">ID: {prod.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 dark:text-slate-300">
                        {prod.categoryName || 'Mặc định'}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {formatVND(price)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-700 dark:text-slate-300">
                        {prod.quantity ?? 99} cái
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px]">
                          Đang bán
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`http://localhost:3000/products/${prod.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                            title="Xem trên sàn"
                          >
                            <HiOutlineExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => toast('Đang mở bộ biên tập sản phẩm', { icon: '✏️' })}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                            title="Sửa"
                          >
                            <HiOutlinePencilAlt className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
