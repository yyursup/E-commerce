import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiStar, HiOutlinePhotograph, HiOutlineChatAlt2 } from 'react-icons/hi';
import { cn } from '../../../lib/cn';
import reviewService from '../../../services/review';
import replyService from '../../../services/reply';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import toast from 'react-hot-toast';

export default function ProductReviews({ productId }) {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filterRating, setFilterRating] = useState(null);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const [statsData, reviewsData] = await Promise.all([
                reviewService.getProductReviewStats(productId),
                reviewService.getProductReviews(productId, { rating: filterRating, page, size: 5 })
            ]);
            setStats(statsData);
            setReviews(reviewsData.content || []);
            setTotalPages(reviewsData.totalPages || 0);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [productId, filterRating, page]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    if (loading && page === 0) {
        return <div className="py-10 text-center">Đang tải đánh giá...</div>;
    }

    const avgRatingNum = Number(stats?.avgRating ?? 0);
    const averageRating = avgRatingNum.toFixed(1);
    const totalReviews = stats?.totalReviews ?? 0;

    return (
        <div className="mt-12 space-y-8">
            <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Đánh giá kỹ thuật & cảm nhận ({totalReviews})
            </h2>

            {/* Stats Summary */}
            <div className={cn(
                'grid gap-6 rounded-2xl border p-6 sm:grid-cols-3',
                isDark ? 'border-slate-700/50 bg-slate-900/80' : 'border-stone-200 bg-white'
            )}>
                <div className="flex flex-col items-center justify-center border-stone-200 dark:border-slate-700 sm:border-r">
                    <span className="text-5xl font-bold text-amber-500">{averageRating}</span>
                    <div className="mt-2 flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <HiStar key={s} className={cn('h-5 w-5', s <= Math.round(avgRatingNum) ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600')} />
                        ))}
                    </div>
                    <span className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Dựa trên {totalReviews} đánh giá
                    </span>
                </div>

                <div className="col-span-2 flex flex-wrap gap-2 items-center content-center justify-center sm:justify-start">
                    <button
                        onClick={() => { setFilterRating(null); setPage(0); }}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition',
                            filterRating === null ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        )}
                    >
                        Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map((star) => (
                        <button
                            key={star}
                            onClick={() => { setFilterRating(star); setPage(0); }}
                            className={cn(
                                'flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition',
                                filterRating === star ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            )}
                        >
                            {star} <HiStar className="h-4 w-4" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Review List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className={cn('py-10 text-center', isDark ? 'text-slate-500' : 'text-stone-400')}>
                        Chưa có đánh giá nào cho bộ lọc này.
                    </div>
                ) : (
                    reviews.map((review) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={review.id}
                            className={cn(
                                'border-b pb-6 last:border-0',
                                isDark ? 'border-slate-800' : 'border-stone-200'
                            )}
                        >
                            <div className="flex items-start gap-4">
                                {review.userAvatarUrl ? (
                                    <img src={review.userAvatarUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                                        {review.userFullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-stone-900')}>
                                            {review.userFullName}
                                        </h4>
                                        <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <HiStar key={s} className={cn('h-4 w-4', s <= review.rating ? 'text-amber-400' : 'text-stone-300 dark:text-slate-600')} />
                                        ))}
                                    </div>
                                    <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                        {review.comment}
                                    </p>

                                    {/* Images */}
                                    {review.imageUrls && review.imageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {review.imageUrls.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt="Review"
                                                    className="h-20 w-20 rounded-lg object-cover border dark:border-slate-700"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Seller Reply */}
                                    {review.sellerReply ? (
                                        <div className={cn(
                                            'mt-4 rounded-xl p-4',
                                            isDark ? 'bg-slate-800/50' : 'bg-stone-100'
                                        )}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <HiOutlineChatAlt2 className="text-amber-500" />
                                                <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                                    Cửa hàng phản hồi
                                                </span>
                                                {review.sellerReply.repliedAt && (
                                                    <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-400')}>
                                                        · {new Date(review.sellerReply.repliedAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                                {review.sellerReply.reply}
                                            </p>
                                        </div>
                                    ) : (
                                        /* Show Reply Form for Admin/Business */
                                        (user?.role === 'ADMIN' || user?.role === 'BUSINESS') && (
                                            <ReplyForm reviewId={review.id} onSuccess={fetchReviews} />
                                        )
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-30',
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            )}
                        >
                            Trước
                        </button>
                        <span className="flex items-center px-4 text-sm font-medium dark:text-slate-400">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <button
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className={cn(
                                'rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-30',
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            )}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReplyForm({ reviewId, onSuccess }) {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        try {
            setLoading(true);
            await replyService.replyToReview(reviewId, reply);
            toast.success('Đã gửi phản hồi!');
            setReply('');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Lỗi khi gửi phản hồi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Phản hồi đánh giá này..."
                className={cn(
                    'flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition',
                    isDark ? 'border-slate-700 bg-slate-800 text-white focus:border-amber-500' : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                )}
            />
            <button
                type="submit"
                disabled={loading || !reply.trim()}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
                {loading ? '...' : 'Gửi'}
            </button>
        </form>
    );
}
