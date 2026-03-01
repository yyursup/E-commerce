import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiStar, HiX, HiCamera } from 'react-icons/hi';
import { cn } from '../lib/cn';
import { useThemeStore } from '../store/useThemeStore';
import reviewService from '../services/review';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, subOrderId, productId, productName, onPageRefresh }) {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setLoading(true);
            await reviewService.createReview(productId, {
                subOrderId,
                rating,
                comment,
                // Optional: images could be added here if we had an upload component
            });
            toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
            if (onPageRefresh) onPageRefresh();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error?.message || 'Không thể gửi đánh giá. Có thể bạn đã đánh giá sản phẩm này rồi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            'relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl',
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-6 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-bold text-amber-500">Đánh giá sản phẩm</h3>
                                <p className={cn('text-sm font-medium mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                    {productName}
                                </p>
                            </div>
                            <button onClick={onClose} className="rounded-xl p-2 hover:bg-stone-100 dark:hover:bg-slate-800 transition">
                                <HiX className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <p className="text-sm font-semibold uppercase tracking-widest text-stone-500">Chất lượng sản phẩm</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(s)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(s)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <HiStar
                                                className={cn(
                                                    'h-10 w-10 transition-colors',
                                                    s <= (hoverRating || rating) ? 'text-amber-400' : 'text-stone-200 dark:text-slate-700'
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-amber-500 font-bold">
                                    {['Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'][rating - 1]}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cảm nhận của bạn</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Sản phẩm dùng rất tốt, đóng gói cẩn thận..."
                                    className={cn(
                                        'w-full rounded-2xl border p-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                                        isDark ? 'border-slate-700 bg-slate-800 focus:border-amber-500' : 'border-stone-200 bg-stone-50 focus:border-amber-500'
                                    )}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 font-bold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
