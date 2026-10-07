import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { HiStar, HiOutlineScale, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import reviewService from '../../services/review'
import ReviewAppealModal from '../../components/ReviewAppealModal'
import toast from 'react-hot-toast'

export default function ProfileMyReviews({ isDark }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [appealModal, setAppealModal] = useState({ isOpen: false, review: null })

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reviewService.getMyAllReviews({ page, size: 8 })
      const content = res?.content || (Array.isArray(res) ? res : [])
      setReviews(content)
      setTotalPages(res?.totalPages || 0)
      setTotalElements(res?.totalElements || content.length)
    } catch (err) {
      console.error('Fetch my reviews error:', err)
      toast.error('Không thể tải danh sách đánh giá của bạn.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Đánh giá của tôi ({totalElements})
          </h2>
          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Quản lý và theo dõi trạng thái các đánh giá, nhận xét bạn đã gửi về sản phẩm
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          disabled={loading}
          className={cn(
            'p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95',
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
          )}
          title="Tải lại danh sách"
        >
          <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Danh sách reviews */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="mt-2 text-xs text-stone-400">Đang tải lịch sử đánh giá...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div
          className={cn(
            'py-16 text-center rounded-2xl border',
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white',
          )}
        >
          <p className="text-sm font-semibold text-stone-500 dark:text-slate-400">
            Bạn chưa gửi đánh giá nào cho các sản phẩm đã mua.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isHidden = rev.status === 'HIDDEN'
            const isWarning = rev.warning || rev.flagged
            const flagCount = rev.flagCount || rev.reportCount || 0

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={rev.id}
                className={cn(
                  'p-5 rounded-2xl border transition-colors space-y-3.5',
                  isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
                )}
              >
                {/* Header item: Sản phẩm & Trạng thái */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b dark:border-slate-800 border-stone-100">
                  <div className="flex items-center gap-3 min-w-0">
                    {rev.productThumbnail ? (
                      <img
                        src={rev.productThumbnail}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover border border-stone-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold shrink-0">
                        SP
                      </div>
                    )}
                    <div className="min-w-0">
                      {rev.productId ? (
                        <Link
                          to={`/products/${rev.productId}`}
                          className={cn(
                            'text-sm font-bold truncate block hover:text-amber-500 transition',
                            isDark ? 'text-white' : 'text-stone-900',
                          )}
                        >
                          {rev.productName || 'Xem sản phẩm'}
                        </Link>
                      ) : (
                        <span className={cn('text-sm font-bold truncate block', isDark ? 'text-white' : 'text-stone-900')}>
                          {rev.productName || 'Sản phẩm đã mua'}
                        </span>
                      )}
                      <span className="text-xs text-stone-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                  </div>

                  {/* Badge Trạng thái đánh giá */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isHidden ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
                        Đã bị ẩn vi phạm
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
                        Bị cảnh báo vi phạm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                        Đang hiển thị bình thường
                      </span>
                    )}
                  </div>
                </div>

                {/* Stars & Comment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiStar
                        key={star}
                        className={cn('h-4 w-4', star <= rev.rating ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600')}
                      />
                    ))}
                    <span className="text-xs font-semibold text-amber-500 ml-1.5">{rev.rating} sao</span>
                  </div>

                  <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    {rev.comment}
                  </p>

                  {/* Ảnh đính kèm trong review nếu có */}
                  {rev.imageUrls && rev.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.imageUrls.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="review attachment"
                          className="h-16 w-16 rounded-xl object-cover border border-stone-200 dark:border-slate-800"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Banner cảnh báo & Nút Kháng Cáo nếu bị ẩn hoặc cảnh báo */}
                {(isHidden || isWarning) && (
                  <div
                    className={cn(
                      'p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                      isHidden
                        ? 'bg-rose-500/5 border-rose-500/25'
                        : 'bg-amber-500/5 border-amber-500/25',
                    )}
                  >
                    <div className="text-xs space-y-0.5">
                      <p className={cn('font-bold', isHidden ? 'text-rose-500' : 'text-amber-500')}>
                        {isHidden
                          ? 'Đánh giá này đã bị ẩn khỏi hiển thị công khai do nhận nhiều tố cáo.'
                          : 'Đánh giá này đang nhận tố cáo từ cộng đồng. Bạn có thể giải trình để bảo vệ quyền lợi.'}
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        Nếu bạn cho rằng đánh giá bị báo cáo sai, hãy nộp hồ sơ kháng cáo kèm chứng từ để Quản trị viên phục hồi.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAppealModal({ isOpen: true, review: rev })}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition shrink-0 shadow-sm"
                    >
                      <HiOutlineScale className="h-4 w-4" />
                      Kháng cáo đánh giá
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-2">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={cn(
              'rounded-xl px-4 py-2 font-semibold transition',
              page <= 0
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200',
            )}
          >
            Trang trước
          </button>
          <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              'rounded-xl px-4 py-2 font-semibold transition',
              page + 1 >= totalPages
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200',
            )}
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Modal Kháng cáo */}
      <ReviewAppealModal
        isOpen={appealModal.isOpen}
        onClose={() => setAppealModal({ isOpen: false, review: null })}
        review={appealModal.review}
        onSuccess={fetchReviews}
      />
    </div>
  )
}
