import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineSwitchHorizontal } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import toast from 'react-hot-toast'

export default function CreateTradePost({ open, onClose, onCreate }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [formData, setFormData] = useState({
    productName: '',
    productImage: '',
    condition: 'Mới 95%',
    description: '',
    wantedType: 'any', // 'higher', 'lower', 'any'
    wantedCategory: '',
    wantedDescription: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.productName || !formData.wantedCategory) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const newPost = {
      id: `trade-${Date.now()}`,
      userId: 'current-user',
      userName: 'Bạn',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      productOffering: {
        id: `product-${Date.now()}`,
        name: formData.productName,
        image: formData.productImage || '/product-placeholder.svg',
        condition: formData.condition,
        description: formData.description,
      },
      productWanted: {
        type: formData.wantedType,
        category: formData.wantedCategory,
        description: formData.wantedDescription,
      },
      status: 'active',
      createdAt: new Date(),
      offersCount: 0,
      views: 0,
    }

    onCreate(newPost)
    toast.success('Đã tạo bài đăng trao đổi thành công!')
    setFormData({
      productName: '',
      productImage: '',
      condition: 'Mới 95%',
      description: '',
      wantedType: 'any',
      wantedCategory: '',
      wantedDescription: '',
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl',
          isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'sticky top-0 flex items-center justify-between border-b p-6',
            isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50',
          )}
        >
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Đăng bài trao đổi
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-200',
            )}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Offering */}
          <div>
            <h3 className={cn('mb-4 text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Sản phẩm bạn muốn trao đổi
            </h3>
            <div className="space-y-4">
              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Ví dụ: AirPods Pro (2nd gen)"
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                  required
                />
              </div>

              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Link hình ảnh
                </label>
                <input
                  type="url"
                  value={formData.productImage}
                  onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                  placeholder="https://..."
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                />
              </div>

              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Tình trạng
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white'
                      : 'border-stone-300 bg-white text-stone-900',
                  )}
                >
                  <option>Mới 100%</option>
                  <option>Mới 98%</option>
                  <option>Mới 95%</option>
                  <option>Mới 90%</option>
                  <option>Đã sử dụng</option>
                </select>
              </div>

              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về sản phẩm của bạn..."
                  rows={3}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                />
              </div>
            </div>
          </div>

          {/* Product Wanted */}
          <div>
            <h3 className={cn('mb-4 text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Sản phẩm bạn muốn nhận
            </h3>
            <div className="space-y-4">
              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Loại trao đổi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'higher', label: 'Đổi lên', icon: HiOutlineArrowUp, color: 'emerald' },
                    { value: 'lower', label: 'Đổi xuống', icon: HiOutlineArrowDown, color: 'blue' },
                    { value: 'any', label: 'Bất kỳ', icon: HiOutlineSwitchHorizontal, color: 'amber' },
                  ].map((option) => {
                    const Icon = option.icon
                    const isSelected = formData.wantedType === option.value
                    const colorClasses = {
                      emerald: isSelected ? 'border-emerald-500 bg-emerald-500/10' : '',
                      blue: isSelected ? 'border-blue-500 bg-blue-500/10' : '',
                      amber: isSelected ? 'border-amber-500 bg-amber-500/10' : '',
                    }
                    const textColorClasses = {
                      emerald: 'text-emerald-500',
                      blue: 'text-blue-500',
                      amber: 'text-amber-500',
                    }
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, wantedType: option.value })}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                          colorClasses[option.color],
                          !isSelected && isDark
                            ? 'border-slate-600 bg-slate-800 hover:border-slate-500'
                            : !isSelected
                              ? 'border-stone-300 bg-white hover:border-stone-400'
                              : '',
                        )}
                      >
                        <Icon className={cn('h-5 w-5', textColorClasses[option.color])} />
                        <span className={cn('text-xs font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Sản phẩm muốn nhận *
                </label>
                <input
                  type="text"
                  value={formData.wantedCategory}
                  onChange={(e) => setFormData({ ...formData, wantedCategory: e.target.value })}
                  placeholder="Ví dụ: AirPods Max"
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                  required
                />
              </div>

              <div>
                <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Mô tả chi tiết
                </label>
                <textarea
                  value={formData.wantedDescription}
                  onChange={(e) => setFormData({ ...formData, wantedDescription: e.target.value })}
                  placeholder="Mô tả về sản phẩm bạn muốn nhận, điều kiện trao đổi..."
                  rows={3}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
              )}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
            >
              Đăng bài
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
