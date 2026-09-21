import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamationCircle, HiX, HiCheck, HiOutlineUpload, HiOutlineTrash, HiOutlineExternalLink } from 'react-icons/hi';
import { cn } from '../lib/cn';
import { useThemeStore } from '../store/useThemeStore';
import reportService from '../services/report';
import fileService from '../services/fileService';
import toast from 'react-hot-toast';

export default function ReportModal({ isOpen, onClose, targetId, targetName }) {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        description: '',
        reason: 'SPAM', // Default reason
        evidenceUrls: [],
    });

    const reasons = [
        { value: 'SPAM', label: 'Spam / Nội dung rác' },
        { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
        { value: 'FRAUD', label: 'Lừa đảo / Giả mạo' },
        { value: 'BAD_QUALITY', label: 'Chất lượng quá kém' },
        { value: 'OTHER', label: 'Khác' },
    ];

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const validFiles = [];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB!`);
            } else {
                validFiles.push(file);
            }
        }

        if (!validFiles.length) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setUploadingImage(true);
            const uploaded = [];
            for (const file of validFiles) {
                const res = await fileService.uploadFile(file, 'reports');
                const uploadedUrl = res?.url || res?.data?.url;
                if (uploadedUrl) {
                    uploaded.push(uploadedUrl);
                }
            }

            if (uploaded.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    evidenceUrls: [...prev.evidenceUrls, ...uploaded],
                }));
                toast.success(`Đã tải lên ${uploaded.length} ảnh thành công!`);
            } else {
                toast.error('Không nhận được đường dẫn ảnh từ máy chủ.');
            }
        } catch (err) {
            console.error('Upload image error:', err);
            toast.error(err?.message || 'Lỗi khi tải ảnh lên.');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description) {
            toast.error('Vui lòng nhập mô tả chi tiết');
            return;
        }

        try {
            setLoading(true);
            await reportService.createReport({
                targetId,
                description: `[${formData.reason}] ${formData.description}`,
                evidenceUrl: formData.evidenceUrls.length > 0 ? formData.evidenceUrls.join(',') : null,
            });
            toast.success('Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét sớm nhất.');
            onClose();
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error(error?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
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
                            'relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl',
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-white text-stone-900'
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-4 px-6 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                                    <HiOutlineExclamationCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Báo cáo vi phạm</h3>
                                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                        Bạn đang báo cáo: <span className="font-semibold">{targetName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={cn(
                                    'rounded-lg p-2 transition',
                                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-stone-100 text-stone-500'
                                )}
                            >
                                <HiX className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lý do báo cáo</label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {reasons.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, reason: r.value })}
                                            className={cn(
                                                'flex items-center justify-between rounded-xl border p-3 text-left text-sm transition',
                                                formData.reason === r.value
                                                    ? (isDark ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-red-500 bg-red-50 text-red-700')
                                                    : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-stone-200 hover:border-stone-300')
                                            )}
                                        >
                                            {r.label}
                                            {formData.reason === r.value && <HiCheck className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Chi tiết vi phạm</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Vui lòng cung cấp thêm thông tin về vi phạm để giúp chúng tôi xử lý nhanh hơn..."
                                    rows={4}
                                    className={cn(
                                        'w-full rounded-xl border p-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/50',
                                        isDark ? 'border-slate-700 bg-slate-800 focus:border-red-500' : 'border-stone-200 bg-stone-50 focus:border-red-500'
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Hình ảnh bằng chứng ({formData.evidenceUrls.length})</label>
                                    <span className="text-[11px] text-stone-400">Tối đa 10MB / ảnh</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {formData.evidenceUrls.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {formData.evidenceUrls.map((url, idx) => (
                                            <div key={idx} className="relative rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden group h-28 bg-stone-900/10">
                                                <img
                                                    src={url}
                                                    alt={`Bằng chứng ${idx + 1}`}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow"
                                                        title="Xem ảnh gốc"
                                                    >
                                                        <HiOutlineExternalLink className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData((prev) => ({
                                                            ...prev,
                                                            evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== idx),
                                                        }))}
                                                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow"
                                                        title="Xóa ảnh"
                                                    >
                                                        <HiOutlineTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        'w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition',
                                        uploadingImage ? 'opacity-50 pointer-events-none' : '',
                                        isDark
                                            ? 'border-slate-700 hover:border-red-500 bg-slate-800/50'
                                            : 'border-stone-300 hover:border-red-500 bg-stone-50'
                                    )}
                                >
                                    {uploadingImage ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-1">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                                            <span className="text-xs font-medium text-red-500">Đang tải ảnh lên...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1 py-1">
                                            <HiOutlineUpload className="h-6 w-6 text-red-500" />
                                            <span className="text-xs font-semibold">
                                                {formData.evidenceUrls.length > 0 ? '+ Thêm ảnh bằng chứng' : 'Bấm để tải ảnh bằng chứng lên'}
                                            </span>
                                            <span className="text-[11px] text-stone-400">Chọn 1 hoặc nhiều ảnh (JPG, PNG, WEBP)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={cn(
                                        'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition',
                                        isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                    )}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploadingImage}
                                    className={cn(
                                        'flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50'
                                    )}
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
