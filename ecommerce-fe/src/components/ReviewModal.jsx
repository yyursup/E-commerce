import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiStar,
    HiX,
    HiPlay,
    HiOutlineCamera,
    HiOutlineVideoCamera,
} from 'react-icons/hi';
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

    // Media states (Images & Videos)
    const [images, setImages] = useState([]); // [{ id, file, previewUrl, name, size }]
    const [videos, setVideos] = useState([]); // [{ id, file, previewUrl, name, size }]

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Clean up preview object URLs to avoid memory leaks
    const cleanupMediaUrls = (imgList, vidList) => {
        imgList?.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        vidList?.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
    };

    // Reset and cleanup when modal closes
    const handleClose = () => {
        cleanupMediaUrls(images, videos);
        setImages([]);
        setVideos([]);
        setComment('');
        setRating(5);
        onClose();
    };

    useEffect(() => {
        return () => {
            cleanupMediaUrls(images, videos);
        };
    }, []);

    // Handle image file selection (up to 5 images, max 10MB each)
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const maxImages = 5;
        const remainingSlots = maxImages - images.length;

        if (remainingSlots <= 0) {
            toast.error(`Bạn chỉ có thể tải lên tối đa ${maxImages} hình ảnh`);
            e.target.value = '';
            return;
        }

        const validImages = [];
        for (const file of files.slice(0, remainingSlots)) {
            if (!file.type.startsWith('image/')) {
                toast.error(`"${file.name}" không phải là định dạng hình ảnh hợp lệ`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB`);
                continue;
            }

            validImages.push({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            });
        }

        if (files.length > remainingSlots) {
            toast(`Đã chọn ${validImages.length} ảnh (tối đa ${maxImages} ảnh)`);
        }

        setImages((prev) => [...prev, ...validImages]);
        e.target.value = '';
    };

    // Handle video file selection (up to 1 video, max 50MB)
    const handleVideoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (videos.length >= 1) {
            toast.error('Bạn chỉ có thể đính kèm tối đa 1 video');
            e.target.value = '';
            return;
        }

        const file = files[0];
        if (!file.type.startsWith('video/')) {
            toast.error(`"${file.name}" không phải là định dạng video hợp lệ`);
            e.target.value = '';
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            toast.error(`Video "${file.name}" vượt quá dung lượng tối đa 50MB`);
            e.target.value = '';
            return;
        }

        const newVideo = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
        };

        setVideos([newVideo]);
        e.target.value = '';
    };

    const handleRemoveImage = (id) => {
        setImages((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((item) => item.id !== id);
        });
    };

    const handleRemoveVideo = (id) => {
        setVideos((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((item) => item.id !== id);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setLoading(true);

            // Extract File objects
            const imageFiles = images.map((img) => img.file);
            const videoFiles = videos.map((vid) => vid.file);

            await reviewService.createReview(productId, {
                subOrderId,
                rating,
                comment,
                images: imageFiles,
                videos: videoFiles,
            });

            toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
            if (onPageRefresh) onPageRefresh();
            handleClose();
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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            'relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border shadow-2xl',
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-5 sm:p-6 dark:border-slate-800 shrink-0">
                            <div className="min-w-0 pr-4">
                                <h3 className="text-lg sm:text-xl font-bold text-amber-500 truncate">
                                    Đánh giá sản phẩm
                                </h3>
                                <p className={cn('text-xs sm:text-sm font-medium mt-0.5 truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                    {productName}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-xl p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                <HiX className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        {/* Form - Scrollable */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
                            {/* Star Rating */}
                            <div className="flex flex-col items-center justify-center space-y-3 py-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-slate-400">
                                    Chất lượng sản phẩm
                                </p>
                                <div className="flex gap-1.5 sm:gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(s)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(s)}
                                            className="transition-transform active:scale-90 cursor-pointer p-1"
                                        >
                                            <HiStar
                                                className={cn(
                                                    'h-8 w-8 sm:h-9 sm:w-9 transition-colors',
                                                    s <= (hoverRating || rating)
                                                        ? 'text-amber-400 drop-shadow-xs'
                                                        : 'text-stone-200 dark:text-slate-700'
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-amber-500 font-bold text-sm">
                                    {['Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'][rating - 1]}
                                </p>
                            </div>

                            {/* Comment Textarea */}
                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold block">
                                    Cảm nhận của bạn <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Sản phẩm dùng rất tốt, đóng gói cẩn thận, giao hàng nhanh chóng..."
                                    className={cn(
                                        'w-full rounded-2xl border p-3.5 text-xs sm:text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none',
                                        isDark
                                            ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500'
                                            : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                                    )}
                                />
                            </div>

                            {/* Section: Đính kèm Video & Hình ảnh */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                        <span>Đính kèm hình ảnh / video</span>
                                        <span className={cn('text-[11px] font-normal', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                            (Tối đa 5 ảnh, 1 video)
                                        </span>
                                    </label>
                                    <span className={cn('text-[11px] font-mono font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                        {images.length}/5 ảnh &bull; {videos.length}/1 video
                                    </span>
                                </div>

                                {/* Hidden file inputs */}
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <input
                                    type="file"
                                    ref={videoInputRef}
                                    accept="video/mp4,video/quicktime,video/webm"
                                    onChange={handleVideoSelect}
                                    className="hidden"
                                />

                                {/* Upload Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={images.length >= 5 || loading}
                                        className={cn(
                                            'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                                            images.length >= 5 || loading
                                                ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-slate-800'
                                                : isDark
                                                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700/80 hover:border-amber-500/60 hover:text-amber-400'
                                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-500/60 hover:text-amber-600 shadow-2xs'
                                        )}
                                    >
                                        <HiOutlineCamera className="h-4 w-4 text-amber-500" />
                                        <span>Thêm Hình Ảnh</span>
                                        {images.length > 0 && (
                                            <span className="text-[11px] font-mono font-bold text-amber-500">
                                                ({images.length}/5)
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => videoInputRef.current?.click()}
                                        disabled={videos.length >= 1 || loading}
                                        className={cn(
                                            'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                                            videos.length >= 1 || loading
                                                ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-slate-800'
                                                : isDark
                                                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700/80 hover:border-amber-500/60 hover:text-amber-400'
                                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-500/60 hover:text-amber-600 shadow-2xs'
                                        )}
                                    >
                                        <HiOutlineVideoCamera className="h-4 w-4 text-rose-500" />
                                        <span>Thêm Video</span>
                                        {videos.length > 0 && (
                                            <span className="text-[11px] font-mono font-bold text-rose-500">
                                                (1/1)
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Media Previews */}
                                {(images.length > 0 || videos.length > 0) && (
                                    <div className="flex flex-wrap gap-2.5 pt-1">
                                        {/* Video Previews */}
                                        {videos.map((vid) => (
                                            <div
                                                key={vid.id}
                                                className="relative group h-20 w-24 rounded-2xl overflow-hidden border border-rose-400/40 dark:border-rose-500/30 bg-black shadow-xs shrink-0"
                                            >
                                                <video
                                                    src={vid.previewUrl}
                                                    className="h-full w-full object-cover opacity-80"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="h-6 w-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                                                        <HiPlay className="h-3.5 w-3.5 ml-0.5" />
                                                    </div>
                                                </div>
                                                <span className="absolute bottom-1 left-1.5 rounded bg-rose-600 px-1 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                                    Video
                                                </span>
                                                {!loading && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVideo(vid.id)}
                                                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow cursor-pointer"
                                                        title="Xóa video"
                                                    >
                                                        <HiX className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Image Previews */}
                                        {images.map((img, idx) => (
                                            <div
                                                key={img.id}
                                                className="relative group h-20 w-20 rounded-2xl overflow-hidden border border-amber-400/30 dark:border-amber-500/30 bg-stone-100 dark:bg-slate-800 shadow-xs shrink-0"
                                            >
                                                <img
                                                    src={img.previewUrl}
                                                    alt={`Ảnh ${idx + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                                <span className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
                                                    Ảnh {idx + 1}
                                                </span>
                                                {!loading && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(img.id)}
                                                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow cursor-pointer"
                                                        title="Xóa ảnh"
                                                    >
                                                        <HiX className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Help Note */}
                                <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-500' : 'text-stone-400')}>
                                    Hình ảnh (tối đa 10MB/ảnh), Video (tối đa 50MB, định dạng MP4/MOV) giúp đánh giá sản phẩm chân thực và tin cậy hơn.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 px-6 font-bold text-sm text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            <span>Đang tải tệp & gửi đánh giá...</span>
                                        </>
                                    ) : (
                                        'Gửi đánh giá'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
