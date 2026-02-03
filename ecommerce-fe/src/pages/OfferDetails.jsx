import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineChat,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineEye,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import toast from 'react-hot-toast'

// Mock data - In real app, this would come from API
const mockTradePost = {
  id: 'trade-1',
  userId: 'user-1',
  userName: 'Nguyễn Văn A',
  userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  productOffering: {
    id: 'product-1',
    name: 'AirPods Pro (2nd gen)',
    image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
    condition: 'Mới 95%',
    description: 'Sử dụng 3 tháng, còn bảo hành, đầy đủ phụ kiện. Sản phẩm chính hãng, không có dấu hiệu hư hỏng.',
  },
  productWanted: {
    type: 'higher',
    category: 'AirPods Max',
    description: 'Muốn đổi lên AirPods Max hoặc AirPods Pro với tiền bù thêm',
  },
  status: 'active',
  createdAt: new Date('2024-01-15'),
  offersCount: 3,
  views: 45,
}

const mockOffers = [
  {
    id: 'offer-1',
    userId: 'user-2',
    userName: 'Trần Thị B',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    userEmail: 'tranthib@example.com',
    userPhone: '0901234567',
    productOffering: {
      name: 'AirPods Max',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 98%',
      description: 'Hàng chính hãng, mua 1 tháng, còn bảo hành đầy đủ',
    },
    additionalCash: 2000000,
    message: 'Tôi có AirPods Max muốn đổi với bạn, có thể bù thêm 2 triệu. Sản phẩm của tôi còn rất mới, chỉ sử dụng 1 tháng. Nếu bạn đồng ý, chúng ta có thể gặp mặt để trao đổi.',
    status: 'pending',
    createdAt: new Date('2024-01-16'),
  },
  {
    id: 'offer-2',
    userId: 'user-3',
    userName: 'Lê Văn C',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    userEmail: 'levanc@example.com',
    userPhone: '0912345678',
    productOffering: {
      name: 'AirPods Pro (1st gen)',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 95%',
      description: 'Đổi trực tiếp, không cần bù tiền. Sản phẩm còn tốt, sử dụng 6 tháng.',
    },
    additionalCash: 0,
    message: 'Đổi trực tiếp, không cần bù tiền. Tôi có AirPods Pro đời 1, bạn có đời 2. Nếu bạn muốn đổi xuống đời thấp hơn thì đây là cơ hội tốt.',
    status: 'pending',
    createdAt: new Date('2024-01-17'),
  },
  {
    id: 'offer-3',
    userId: 'user-4',
    userName: 'Phạm Thị D',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    userEmail: 'phamthid@example.com',
    userPhone: '0923456789',
    productOffering: {
      name: 'AirPods Max Premium',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 100%',
      description: 'Hàng mới 100%, chưa sử dụng, còn nguyên seal. Mua nhưng không dùng đến.',
    },
    additionalCash: 5000000,
    message: 'Tôi có AirPods Max mới 100%, chưa sử dụng. Tôi muốn đổi với AirPods Pro của bạn và bù thêm 5 triệu. Đây là deal tốt cho cả hai bên.',
    status: 'accepted',
    createdAt: new Date('2024-01-18'),
  },
]

export default function OfferDetails() {
  const { tradeId } = useParams()
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated, user } = useAuthStore()
  const [post, setPost] = useState(mockTradePost)
  const [offers, setOffers] = useState(mockOffers)
  const [selectedOffer, setSelectedOffer] = useState(null)

  const isOwner = user?.id === post.userId

  useEffect(() => {
    // In real app, fetch post and offers by tradeId
    // const fetchData = async () => {
    //   const postData = await fetchPost(tradeId)
    //   const offersData = await fetchOffers(tradeId)
    //   setPost(postData)
    //   setOffers(offersData)
    // }
    // fetchData()
  }, [tradeId])

  const handleAcceptOffer = (offerId) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId
          ? { ...offer, status: 'accepted' }
          : offer.status === 'accepted'
            ? { ...offer, status: 'rejected' }
            : offer,
      ),
    )
    toast.success('Đã chấp nhận offer! Liên hệ với người dùng để hoàn tất trao đổi.')
  }

  const handleRejectOffer = (offerId) => {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, status: 'rejected' } : offer)))
    toast.success('Đã từ chối offer')
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center">
          <p className={cn('mb-4', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Vui lòng đăng nhập để xem chi tiết offers
          </p>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/marketplace')}
            className={cn(
              'rounded-xl p-2 transition-colors',
              isDark ? 'hover:bg-slate-800' : 'hover:bg-stone-200',
            )}
          >
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Chi tiết Offers
            </h1>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {isOwner ? 'Quản lý offers cho bài đăng của bạn' : 'Xem offers cho bài đăng này'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Trade Post Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border p-6',
                isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-white',
              )}
            >
              <h2 className={cn('mb-4 text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                Bài đăng trao đổi
              </h2>

              {/* User Info */}
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={post.userAvatar || '/product-placeholder.svg'}
                  alt={post.userName}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/product-placeholder.svg'
                  }}
                />
                <div>
                  <p className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                    {post.userName}
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Product Offering */}
              <div className="mb-4">
                <h3 className={cn('mb-2 text-sm font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Sản phẩm đang trao đổi:
                </h3>
                <div className="flex gap-3">
                  <img
                    src={post.productOffering.image || '/product-placeholder.svg'}
                    alt={post.productOffering.name}
                    className="h-20 w-20 rounded-xl object-cover border border-stone-200 dark:border-slate-700"
                    onError={(e) => {
                      e.target.src = '/product-placeholder.svg'
                    }}
                  />
                  <div className="flex-1">
                    <h4 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                      {post.productOffering.name}
                    </h4>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                      {post.productOffering.condition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Wanted */}
              <div className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className={cn('mb-2 text-sm font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Muốn nhận:
                </h3>
                <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {post.productWanted.category}
                </p>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  {post.productWanted.description}
                </p>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 border-t pt-4 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <HiOutlineChat className={cn('h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-500')} />
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {offers.length} offers
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <HiOutlineEye className={cn('h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-500')} />
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    {post.views} lượt xem
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Offers List */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Danh sách Offers ({offers.length})
              </h2>
              {isOwner && (
                <div className="flex gap-2 text-xs">
                  <span className={cn('rounded-full px-3 py-1', 'bg-emerald-500/20 text-emerald-500')}>
                    {offers.filter((o) => o.status === 'accepted').length} Đã chấp nhận
                  </span>
                  <span className={cn('rounded-full px-3 py-1', 'bg-amber-500/20 text-amber-500')}>
                    {offers.filter((o) => o.status === 'pending').length} Đang chờ
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'rounded-2xl border p-6 transition-all',
                    offer.status === 'accepted'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : offer.status === 'rejected'
                        ? 'border-red-500/50 bg-red-500/5 opacity-60'
                        : isDark
                          ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          : 'border-stone-200 bg-white hover:border-amber-200',
                  )}
                >
                  {/* Offer Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={offer.userAvatar || '/product-placeholder.svg'}
                        alt={offer.userName}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/product-placeholder.svg'
                        }}
                      />
                      <div>
                        <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                          {offer.userName}
                        </h3>
                        <p className={cn('flex items-center gap-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                          <HiOutlineClock className="h-3 w-3" />
                          {new Date(offer.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    {offer.status === 'accepted' && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <HiOutlineCheckCircle className="h-3 w-3" />
                        Đã chấp nhận
                      </span>
                    )}
                    {offer.status === 'rejected' && (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-500">
                        <HiOutlineX className="h-3 w-3" />
                        Đã từ chối
                      </span>
                    )}
                  </div>

                  {/* Product Offering */}
                  <div className="mb-4 flex gap-4">
                    <img
                      src={offer.productOffering.image || '/product-placeholder.svg'}
                      alt={offer.productOffering.name}
                      className="h-24 w-24 rounded-xl object-cover border border-stone-200 dark:border-slate-700"
                      onError={(e) => {
                        e.target.src = '/product-placeholder.svg'
                      }}
                    />
                    <div className="flex-1">
                      <h4 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                        {offer.productOffering.name}
                      </h4>
                      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        {offer.productOffering.condition}
                      </p>
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-300' : 'text-stone-600')}>
                        {offer.productOffering.description}
                      </p>
                      {offer.additionalCash > 0 && (
                        <p className="mt-2 text-sm font-semibold text-emerald-500">
                          + {new Intl.NumberFormat('vi-VN').format(offer.additionalCash)} VNĐ
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div
                    className={cn(
                      'mb-4 rounded-xl border p-3',
                      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-stone-50',
                    )}
                  >
                    <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                      {offer.message}
                    </p>
                  </div>

                  {/* Contact Info */}
                  {isOwner && (
                    <div
                      className={cn(
                        'mb-4 flex flex-wrap gap-2 rounded-xl border p-3',
                        isDark ? 'border-slate-700 bg-slate-800/50' : 'border-stone-200 bg-stone-50',
                      )}
                    >
                      <a
                        href={`tel:${offer.userPhone}`}
                        className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/20"
                      >
                        <HiOutlinePhone className="h-4 w-4" />
                        {offer.userPhone}
                      </a>
                      <a
                        href={`mailto:${offer.userEmail}`}
                        className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-500 hover:bg-purple-500/20"
                      >
                        <HiOutlineMail className="h-4 w-4" />
                        {offer.userEmail}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {isOwner && offer.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                      >
                        Chấp nhận Offer
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer.id)}
                        className="rounded-xl border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {offers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <HiOutlineChat className={cn('mb-4 h-16 w-16', isDark ? 'text-slate-600' : 'text-stone-300')} />
                  <p className={cn('text-lg font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Chưa có offer nào
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
