import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineUser, HiOutlineClock } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import toast from 'react-hot-toast'

// Mock offers data
const mockOffers = [
  {
    id: 'offer-1',
    userId: 'user-2',
    userName: 'Trần Thị B',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    productOffering: {
      name: 'AirPods Max',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 98%',
    },
    additionalCash: 2000000,
    message: 'Tôi có AirPods Max muốn đổi với bạn, có thể bù thêm 2 triệu.',
    status: 'pending', // 'pending', 'accepted', 'rejected'
    createdAt: new Date('2024-01-16'),
  },
  {
    id: 'offer-2',
    userId: 'user-3',
    userName: 'Lê Văn C',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    productOffering: {
      name: 'AirPods Pro (1st gen)',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 95%',
    },
    additionalCash: 0,
    message: 'Đổi trực tiếp, không cần bù tiền.',
    status: 'pending',
    createdAt: new Date('2024-01-17'),
  },
]

export default function TradeOffers({ open, onClose, post, isOwner }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [offers, setOffers] = useState(mockOffers)
  const [newOffer, setNewOffer] = useState({
    productName: '',
    productImage: '',
    condition: 'Mới 95%',
    additionalCash: 0,
    message: '',
  })

  const handleAcceptOffer = (offerId) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId ? { ...offer, status: 'accepted' } : { ...offer, status: 'rejected' },
      ),
    )
    toast.success('Đã chấp nhận offer! Liên hệ với người dùng để hoàn tất trao đổi.')
  }

  const handleSubmitOffer = () => {
    if (!newOffer.productName || !newOffer.message) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const offer = {
      id: `offer-${Date.now()}`,
      userId: 'current-user',
      userName: 'Bạn',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      productOffering: {
        name: newOffer.productName,
        image: newOffer.productImage || '/product-placeholder.svg',
        condition: newOffer.condition,
      },
      additionalCash: newOffer.additionalCash,
      message: newOffer.message,
      status: 'pending',
      createdAt: new Date(),
    }

    setOffers([offer, ...offers])
    setNewOffer({
      productName: '',
      productImage: '',
      condition: 'Mới 95%',
      additionalCash: 0,
      message: '',
    })
    toast.success('Đã gửi offer thành công!')
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
          'relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl',
          isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-6',
            isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50',
          )}
        >
          <div>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              {isOwner ? 'Quản lý Offers' : 'Đưa ra Offer'}
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {isOwner
                ? `${offers.length} offers cho bài đăng của bạn`
                : 'Gửi offer cho người đăng bài'}
            </p>
          </div>
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

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Offers List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isOwner ? (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-xl border p-4',
                      offer.status === 'accepted'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-stone-200 bg-stone-50',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={offer.userAvatar || '/product-placeholder.svg'}
                        alt={offer.userName}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/product-placeholder.svg'
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                            {offer.userName}
                          </h4>
                          {offer.status === 'accepted' && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-500">
                              <HiOutlineCheckCircle className="h-3 w-3" />
                              Đã chấp nhận
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-3">
                          <img
                            src={offer.productOffering.image || '/product-placeholder.svg'}
                            alt={offer.productOffering.name}
                            className="h-16 w-16 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                            onError={(e) => {
                              e.target.src = '/product-placeholder.svg'
                            }}
                          />
                          <div className="flex-1">
                            <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                              {offer.productOffering.name}
                            </p>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                              {offer.productOffering.condition}
                            </p>
                            {offer.additionalCash > 0 && (
                              <p className="mt-1 text-sm font-semibold text-emerald-500">
                                + {new Intl.NumberFormat('vi-VN').format(offer.additionalCash)} VNĐ
                              </p>
                            )}
                          </div>
                        </div>
                        <p className={cn('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-stone-600')}>
                          {offer.message}
                        </p>
                        <p className={cn('mt-2 flex items-center gap-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                          <HiOutlineClock className="h-3 w-3" />
                          {new Date(offer.createdAt).toLocaleString('vi-VN')}
                        </p>
                        {isOwner && offer.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                          >
                            Chấp nhận Offer
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={cn('rounded-xl border p-4', isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-stone-50')}>
                  <h4 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                    Sản phẩm bạn muốn trao đổi
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newOffer.productName}
                      onChange={(e) => setNewOffer({ ...newOffer, productName: e.target.value })}
                      placeholder="Tên sản phẩm *"
                      className={cn(
                        'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                          : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                      )}
                    />
                    <input
                      type="url"
                      value={newOffer.productImage}
                      onChange={(e) => setNewOffer({ ...newOffer, productImage: e.target.value })}
                      placeholder="Link hình ảnh"
                      className={cn(
                        'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                          : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                      )}
                    />
                    <select
                      value={newOffer.condition}
                      onChange={(e) => setNewOffer({ ...newOffer, condition: e.target.value })}
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
                    <input
                      type="number"
                      value={newOffer.additionalCash}
                      onChange={(e) => setNewOffer({ ...newOffer, additionalCash: Number(e.target.value) })}
                      placeholder="Tiền bù thêm (VNĐ)"
                      className={cn(
                        'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                          : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                      )}
                    />
                    <textarea
                      value={newOffer.message}
                      onChange={(e) => setNewOffer({ ...newOffer, message: e.target.value })}
                      placeholder="Tin nhắn cho người đăng bài *"
                      rows={3}
                      className={cn(
                        'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                        isDark
                          ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                          : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                      )}
                    />
                    <button
                      onClick={handleSubmitOffer}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
                    >
                      Gửi Offer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
