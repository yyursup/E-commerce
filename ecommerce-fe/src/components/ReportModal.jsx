import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExclamationCircle, HiX, HiCheck } from 'react-icons/hi';
import { cn } from '../lib/cn';
import { useThemeStore } from '../store/useThemeStore';
import reportService from '../services/report';
import toast from 'react-hot-toast';

export default function ReportModal({ isOpen, onClose, targetId, targetName }) {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        reason: 'SPAM', // Default reason
        evidenceUrl: '', // Could be multiple, but we'll start with one
    });

    const reasons = [
        { value: 'SPAM', label: 'Spam / Nội dung rác' },
        { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
        { value: 'FRAUD', label: 'Lừa đảo / Giả mạo' },
        { value: 'BAD_QUALITY', label: 'Chất lượng quá kém' },
        { value: 'OTHER', label: 'Khác' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description) {
            toast.error('Vui lòng nhập mô tả chi tiết');
            return;
        }

        try {
            setLoading(true);
            await reportService.submitReport({
                targetId,
                description: `[${formData.reason}] ${formData.description}`,
                evidenceUrl: formData.evidenceUrl,
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
                                <label className="text-sm font-medium">Link bằng chứng (nếu có)</label>
                                <input
                                    type="url"
                                    value={formData.evidenceUrl}
                                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                                    placeholder="URL ảnh hoặc video bằng chứng..."
                                    className={cn(
                                        'w-full rounded-xl border p-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/50',
                                        isDark ? 'border-slate-700 bg-slate-800 focus:border-red-500' : 'border-stone-200 bg-stone-50 focus:border-red-500'
                                    )}
                                />
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
                                    disabled={loading}
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
