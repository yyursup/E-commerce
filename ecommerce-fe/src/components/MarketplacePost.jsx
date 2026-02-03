import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineEye,
  HiOutlineChat,
  HiOutlineSwitchHorizontal,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import TradeOffers from './TradeOffers'
import toast from 'react-hot-toast'

export default function MarketplacePost({ post, index }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated, user } = useAuthStore()
  const [showOffers, setShowOffers] = useState(false)

  const isOwner = user?.id === post.userId

  const getWantedTypeIcon = (type) => {
    switch (type) {
      case 'higher':
        return <HiOutlineArrowUp className="h-4 w-4 text-emerald-500" />
      case 'lower':
        return <HiOutlineArrowDown className="h-4 w-4 text-blue-500" />
      default:
        return <HiOutlineSwitchHorizontal className="h-4 w-4 text-amber-500" />
    }
  }

  const getWantedTypeLabel = (type) => {
    switch (type) {
      case 'higher':
        return 'Đổi lên đời cao hơn'
      case 'lower':
        return 'Đổi xuống đời thấp hơn'
      default:
        return 'Đổi bất kỳ'
    }
  }

  const handleViewOffers = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để xem offers')
      return
    }
    setShowOffers(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl border transition-all duration-300',
          isDark
            ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20'
            : 'border-stone-200 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/10',
        )}
      >
        {/* Status Badge */}
        <div className="absolute right-4 top-4 z-10">
          {post.status === 'active' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-500">
              <HiOutlineCheckCircle className="h-3 w-3" />
              Đang hoạt động
            </span>
          )}
          {post.status === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-500">
              Đang xử lý
            </span>
          )}
          {post.status === 'completed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-500">
              Hoàn thành
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 border-b p-4 dark:border-slate-700">
          <img
            src={post.userAvatar || '/product-placeholder.svg'}
            alt={post.userName}
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => {
              e.target.src = '/product-placeholder.svg'
            }}
          />
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              {post.userName}
            </p>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Product Offering */}
        <div className="p-4">
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
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-300' : 'text-stone-600')}>
                  {post.productOffering.description}
                </p>
              </div>
            </div>
          </div>

          {/* Product Wanted */}
          <div className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-2 flex items-center gap-2">
              {getWantedTypeIcon(post.productWanted.type)}
              <h3 className={cn('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
                {getWantedTypeLabel(post.productWanted.type)}
              </h3>
            </div>
            <p className={cn('text-xs font-medium', isDark ? 'text-white' : 'text-stone-900')}>
              {post.productWanted.category}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {post.productWanted.description}
            </p>
          </div>
        </div>

        {/* Stats and Actions */}
        <div
          className={cn(
            'flex items-center justify-between border-t p-4',
            isDark ? 'border-slate-700 bg-slate-800/30' : 'border-stone-200 bg-stone-50',
          )}
        >
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <HiOutlineEye className={cn('h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-500')} />
              <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>{post.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <HiOutlineChat className={cn('h-4 w-4', isDark ? 'text-slate-400' : 'text-stone-500')} />
              <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>
                {post.offersCount} offers
              </span>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleViewOffers}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                isOwner
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600',
              )}
            >
              {isOwner ? 'Xem offers' : 'Đưa ra offer'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Trade Offers Modal */}
      <TradeOffers
        open={showOffers}
        onClose={() => setShowOffers(false)}
        post={post}
        isOwner={isOwner}
      />
    </>
  )
}
