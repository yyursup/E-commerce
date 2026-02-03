import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineSwitchHorizontal, HiOutlinePlus, HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'
import MarketplacePost from '../components/MarketplacePost'
import CreateTradePost from '../components/CreateTradePost'
import Footer from '../components/Footer'

// Mock data for trade posts
const mockTradePosts = [
  {
    id: 'trade-1',
    userId: 'user-1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    productOffering: {
      id: 'product-1',
      name: 'AirPods Pro (2nd gen)',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 95%',
      description: 'Sử dụng 3 tháng, còn bảo hành, đầy đủ phụ kiện',
    },
    productWanted: {
      type: 'higher', // 'higher', 'lower', 'any'
      category: 'AirPods Max',
      description: 'Muốn đổi lên AirPods Max hoặc AirPods Pro với tiền bù thêm',
    },
    status: 'active', // 'active', 'pending', 'completed'
    createdAt: new Date('2024-01-15'),
    offersCount: 3,
    views: 45,
  },
  {
    id: 'trade-2',
    userId: 'user-2',
    userName: 'Trần Thị B',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    productOffering: {
      id: 'product-2',
      name: 'AirPods (3rd gen)',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 90%',
      description: 'Còn nguyên hộp, sử dụng 6 tháng',
    },
    productWanted: {
      type: 'any',
      category: 'AirPods Pro',
      description: 'Đổi lấy AirPods Pro (bất kỳ đời nào)',
    },
    status: 'active',
    createdAt: new Date('2024-01-18'),
    offersCount: 5,
    views: 78,
  },
  {
    id: 'trade-3',
    userId: 'user-3',
    userName: 'Lê Văn C',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    productOffering: {
      id: 'product-3',
      name: 'AirPods Max',
      image: 'https://images.unsplash.com/photo-1587523459887-e669248cf666?w=400&h=400&fit=crop',
      condition: 'Mới 98%',
      description: 'Hàng chính hãng, mua 2 tháng, muốn đổi xuống đời thấp hơn',
    },
    productWanted: {
      type: 'lower',
      category: 'AirPods Pro',
      description: 'Đổi xuống AirPods Pro + tiền thừa',
    },
    status: 'active',
    createdAt: new Date('2024-01-20'),
    offersCount: 2,
    views: 32,
  },
]

const filterOptions = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang hoạt động' },
  { id: 'pending', label: 'Đang xử lý' },
  { id: 'completed', label: 'Hoàn thành' },
]

export default function Marketplace() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [posts, setPosts] = useState(mockTradePosts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.productOffering.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.productWanted.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || post.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const handleCreatePost = (newPost) => {
    setPosts([newPost, ...posts])
    setShowCreateModal(false)
  }

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      {/* Header */}
      <section className={cn('border-b', isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-white')}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <HiOutlineSwitchHorizontal className="h-5 w-5" />
                Trao đổi sản phẩm
              </div>
              <h1
                className={cn(
                  'text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl',
                  isDark ? 'text-white' : 'text-stone-900',
                )}
              >
                Marketplace
              </h1>
              <p className={cn('mt-4 text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Trao đổi sản phẩm của bạn với người dùng khác
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm trao đổi..."
                className={cn(
                  'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                  isDark
                    ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-400'
                    : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                )}
              />
            </div>

            {/* Filter and Create Button */}
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex gap-2 overflow-x-auto">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFilter(option.id)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
                      selectedFilter === option.id
                        ? 'bg-amber-500 text-white shadow-lg'
                        : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Create Post Button */}
              {isAuthenticated ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                    'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-lg',
                  )}
                >
                  <HiOutlinePlus className="h-5 w-5" />
                  Đăng bài trao đổi
                </button>
              ) : (
                <button
                  disabled
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold opacity-50',
                    isDark ? 'bg-slate-700 text-slate-400' : 'bg-stone-200 text-stone-500',
                  )}
                >
                  <HiOutlinePlus className="h-5 w-5" />
                  Đăng nhập để đăng bài
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <HiOutlineSwitchHorizontal className={cn('mb-4 h-16 w-16', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('text-lg font-medium', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {searchQuery ? 'Không tìm thấy bài đăng nào' : 'Chưa có bài đăng trao đổi nào'}
            </p>
            {isAuthenticated && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={cn(
                  'mt-4 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  isDark
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
                )}
              >
                Tạo bài đăng đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post, index) => (
              <MarketplacePost key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </section>

      <Footer />

      {/* Create Trade Post Modal */}
      <CreateTradePost
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePost}
      />
    </div>
  )
}
