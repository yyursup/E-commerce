import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineExclamationCircle,
  HiX,
  HiCheck,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineShieldExclamation,
  HiOutlineChatAlt2,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { cn } from '../lib/cn';
import { useThemeStore } from '../store/useThemeStore';
import reportService from '../services/report';
import fileService from '../services/fileService';
import toast from 'react-hot-toast';
import { getConditionBadge, getWarrantyBadge } from '../lib/techBadges';

const ORDER_REPORT_REASONS = [
  {
    value: 'HARDWARE_FAULT',
    title: 'Lỗi phần cứng / Không khởi động',
    desc: 'Thiết bị không lên nguồn, lỗi sạc, sọc màn hình, liệt cảm ứng hoặc lỗi chức năng chính',
    icon: HiOutlineExclamationCircle,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    value: 'NOT_AS_DESCRIBED',
    title: 'Tình trạng không đúng mô tả',
    desc: 'Pin chai nặng hơn cam kết, trầy xước cấn móp nghiêm trọng, dính iCloud/MDM hoặc khóa mạng',
    icon: HiOutlineShieldExclamation,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    value: 'WRONG_ITEM',
    title: 'Giao sai sản phẩm / Cấu hình',
    desc: 'Nhận nhầm máy, sai thông số kỹ thuật (RAM, ROM, Chip) hoặc khác phiên bản đã đặt',
    icon: HiOutlineRefresh,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    value: 'MISSING_ITEM',
    title: 'Giao thiếu phụ kiện / Quà tặng',
    desc: 'Kiện hàng thiếu củ sạc, dây cáp zin, bút cảm ứng hoặc linh kiện cam kết đi kèm',
    icon: HiOutlineClipboardList,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    value: 'COUNTERFEIT',
    title: 'Nghi vấn hàng dựng / Thay linh kiện',
    desc: 'Thiết bị có dấu hiệu bị thay màn lô, ép kính, đã qua sửa chữa phần cứng không báo trước',
    icon: HiOutlineShieldCheck,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    value: 'OTHER',
    title: 'Lý do khiếu nại khác',
    desc: 'Các phát sinh kỹ thuật khác cần đối soát và phân xử từ Ban Quản Trị sàn',
    icon: HiOutlineChatAlt2,
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  },
];

export default function OrderReportModal({ isOpen, onClose, order, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    reason: 'HARDWARE_FAULT',
    description: '',
    evidenceUrls: [],
  });

  if (!order) return null;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_IMAGES = 4;
    const remainingSlots = MAX_IMAGES - formData.evidenceUrls.length;

    if (remainingSlots <= 0) {
      toast.error('Chỉ được tải lên tối đa 4 hình ảnh bằng chứng!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

    let filesToUpload = validFiles;
    if (validFiles.length > remainingSlots) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh. Hệ thống sẽ xử lý ${remainingSlots} ảnh hợp lệ đầu tiên.`);
      filesToUpload = validFiles.slice(0, remainingSlots);
    }

    try {
      setUploadingImage(true);
      const uploaded = [];
      for (const file of filesToUpload) {
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
        toast.success(`Đã thêm ${uploaded.length} ảnh bằng chứng thành công!`);
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

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Vui lòng mô tả chi tiết lý do khiếu nại để được hỗ trợ tốt nhất');
      return;
    }

    try {
      setLoading(true);
      const selectedReasonObj = ORDER_REPORT_REASONS.find((r) => r.value === formData.reason);
      const reasonLabel = selectedReasonObj ? selectedReasonObj.title : formData.reason;

      await reportService.createReport({
        targetId: order.id,
        description: `[Khiếu nại đơn hàng ${order.orderNumber} - ${reasonLabel}]: ${formData.description.trim()}`,
        evidenceUrl: formData.evidenceUrls.length > 0 ? formData.evidenceUrls.join(',') : null,
      });

      toast.success('Hồ sơ khiếu nại đã gửi thành công! Tiền đơn hàng đang được bảo vệ trong Ký quỹ.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting order report:', error);
      toast.error(error?.message || 'Không thể gửi khiếu nại. Vui lòng kiểm tra lại điều kiện đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount) => {
    if (!amount) return '0 đ';
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'relative w-full max-w-2xl overflow-hidden rounded-[28px] border shadow-2xl z-10 max-h-[92vh] flex flex-col',
              isDark
                ? 'border-slate-800/90 bg-slate-900/95 text-slate-100 shadow-rose-950/20'
                : 'border-stone-200 bg-white/95 text-stone-900 shadow-stone-400/20'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between border-b px-5 sm:px-6 py-4.5 shrink-0',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-100 bg-stone-50/50'
            )}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-600/5 text-rose-500 border border-rose-500/20 shadow-sm">
                  <HiOutlineExclamationCircle className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight">Khiếu Nại & Bảo Vệ Đơn Hàng</h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Dispute Center
                    </span>
                  </div>
                  <p className={cn('text-xs flex items-center gap-2 mt-0.5 flex-wrap', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    <span className="inline-flex items-center gap-1 font-mono font-medium">
                      <HiOutlineShoppingBag className="h-3.5 w-3.5 text-stone-400" />
                      #{order.orderNumber}
                    </span>
                    {order.shopName && (
                      <span className="truncate max-w-[200px] sm:max-w-xs font-medium">
                        • {order.shopName}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'rounded-xl p-2 transition-all duration-150',
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-stone-100 text-stone-400 hover:text-stone-800'
                )}
                aria-label="Đóng modal"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Order Quick Summary Card */}
              <div className={cn(
                'p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                isDark ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-stone-50/80 border-stone-200/80 text-stone-700'
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 dark:text-slate-400">Giá trị đơn:</span>
                    <span className="text-sm font-bold text-rose-500 font-mono">{formatVND(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-slate-400">
                    <span>Thanh toán:</span>
                    <span className="font-semibold text-stone-700 dark:text-slate-300">
                      {order.paymentMethod === 'VNPAY'
                        ? 'VNPay Escrow (Ký quỹ trực tuyến)'
                        : order.paymentMethod === 'WALLET'
                          ? 'Ví Escrow (Ký quỹ số dư)'
                          : 'COD Escrow (Thu hộ & Ký quỹ sàn)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items List in Dispute */}
              {order.items && order.items.length > 0 && (
                <div className={cn(
                  'p-3 rounded-2xl border text-xs space-y-2',
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-stone-50/50 border-stone-200/70'
                )}>
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                    Sản phẩm trong kiện hàng ({order.items.length}):
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-2.5">
                        <img
                          src={item.productImageUrl || '/product-placeholder.svg'}
                          alt={item.productName}
                          className="h-10 w-10 rounded-lg object-cover bg-stone-100 dark:bg-slate-800 shrink-0 border"
                          onError={(e) => { e.target.src = '/product-placeholder.svg'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.productName}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {item.conditionGrade && (
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", getConditionBadge(item.conditionGrade)?.cls)}>
                                {getConditionBadge(item.conditionGrade)?.label}
                              </span>
                            )}
                            {item.warrantyType && (
                              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.cls)}>
                                {getWarrantyBadge(item.warrantyType, item.warrantyMonths)?.label}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400">x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AS-IS Items Alert */}
              {order.items?.some((item) => item.conditionGrade === 'GRADE_AS_IS') && (
                <div className={cn(
                  'p-3.5 rounded-2xl border text-xs flex items-start gap-3',
                  isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                )}>
                  <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-600 dark:text-amber-400">
                      Chính sách đối soát Hàng Xác Máy / Linh Kiện Rã Xác:
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Đơn hàng có mặt hàng diện <strong>Xác máy / Thanh lý không bảo hành</strong>. Theo quy chế sàn công nghệ, khiếu nại chỉ được chấp thuận nếu Người bán giao sai dòng máy hoặc thiếu phụ kiện đã mô tả. Các lỗi phần cứng, không lên nguồn hay hao mòn tự nhiên không được hoàn tiền.
                    </p>
                  </div>
                </div>
              )}

              {/* Reason Selection Cards Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    1. Chọn lý do khiếu nại chính xác <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400">Chọn 1 trong {ORDER_REPORT_REASONS.length} mục</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ORDER_REPORT_REASONS.map((r) => {
                    const isSelected = formData.reason === r.value;
                    const IconComp = r.icon;
                    return (
                      <div
                        key={r.value}
                        role="button"
                        tabIndex={0}
                        onClick={() => setFormData({ ...formData, reason: r.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFormData({ ...formData, reason: r.value });
                          }
                        }}
                        className={cn(
                          'relative group rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer select-none flex items-start gap-3',
                          isSelected
                            ? (isDark
                                ? 'border-rose-500 bg-rose-500/10 shadow-sm ring-1 ring-rose-500/40'
                                : 'border-rose-500 bg-rose-50/60 shadow-sm ring-1 ring-rose-500/30')
                            : (isDark
                                ? 'border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50'
                                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50')
                        )}
                      >
                        <div className={cn(
                          'p-2 rounded-xl shrink-0 border transition-transform duration-200 group-hover:scale-105',
                          isSelected ? 'bg-rose-500 text-white border-rose-500' : r.color
                        )}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={cn(
                            'text-xs font-bold leading-snug',
                            isSelected
                              ? (isDark ? 'text-rose-300' : 'text-rose-700')
                              : (isDark ? 'text-slate-200' : 'text-stone-800')
                          )}>
                            {r.title}
                          </p>
                          <p className={cn(
                            'text-[11px] leading-tight mt-1 line-clamp-2',
                            isDark ? 'text-slate-400' : 'text-stone-500'
                          )}>
                            {r.desc}
                          </p>
                        </div>

                        {/* Radio selection indicator */}
                        <div className={cn(
                          'absolute top-3 right-3 h-4 w-4 rounded-full border flex items-center justify-center transition-colors',
                          isSelected
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : (isDark ? 'border-slate-700' : 'border-stone-300')
                        )}>
                          {isSelected && <HiCheck className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    2. Mô tả chi tiết sự việc <span className="text-rose-500">*</span>
                  </label>
                  <span className={cn(
                    'text-[11px] font-mono',
                    formData.description.length > 450 ? 'text-rose-500 font-bold' : 'text-stone-400'
                  )}>
                    {formData.description.length}/500
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    required
                    maxLength={500}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Vui lòng nêu rõ tình trạng hàng thực tế nhận được (hoặc lý do chưa nhận được), thái độ shipper, chênh lệch so với đơn hàng để Ban Quản Trị đối soát và phân xử công minh..."
                    rows={3}
                    className={cn(
                      'w-full rounded-2xl border p-3.5 text-xs transition-all duration-200 focus:outline-none focus:ring-2 resize-none leading-relaxed',
                      isDark
                        ? 'border-slate-800 bg-slate-800/60 text-white placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-stone-200 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                </div>
                <p className="text-[11px] text-stone-400 dark:text-slate-500">
                  Mô tả càng chi tiết kèm mốc thời gian sẽ giúp yêu cầu được giải quyết nhanh hơn.
                </p>
              </div>

              {/* Evidence Images */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                      3. Bằng chứng hình ảnh / Biên bản (Tối đa 4 ảnh)
                    </label>
                    <p className="text-[11px] text-stone-400 dark:text-slate-500 mt-0.5">
                      Ảnh chụp kiện hàng, hóa đơn gửi, ảnh hư hại hoặc ảnh chụp màn hình tin nhắn
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full border font-mono',
                    formData.evidenceUrls.length === 4
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700'
                  )}>
                    {formData.evidenceUrls.length}/4
                  </span>
                </div>

                {/* Grid 4 columns preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {formData.evidenceUrls.map((url, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-2xl overflow-hidden border dark:border-slate-700/80 border-stone-200 h-24 sm:h-28 bg-stone-100 dark:bg-slate-800 shadow-sm"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Image index badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                        #{idx + 1}
                      </span>

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm transition-all"
                          title="Xem ảnh phóng to"
                        >
                          <HiOutlineExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 rounded-xl bg-rose-500/90 text-white hover:bg-rose-600 transition-all shadow-sm"
                          title="Gỡ ảnh này"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Dropzone button */}
                  {formData.evidenceUrls.length < 4 && (
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed h-24 sm:h-28 transition-all duration-200 p-2 text-center group cursor-pointer',
                        isDark
                          ? 'border-slate-700 hover:border-rose-500/60 bg-slate-800/20 hover:bg-rose-500/5'
                          : 'border-stone-300 hover:border-rose-500/60 bg-stone-50/50 hover:bg-rose-50/30',
                        uploadingImage && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                          <span className="text-[10px] font-medium text-stone-400">Đang tải...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-500/10 transition-colors mb-1">
                            <HiOutlineUpload className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-bold text-stone-600 dark:text-slate-300 group-hover:text-rose-500 transition-colors">
                            Thêm hình ảnh
                          </span>
                          <span className="text-[9px] text-stone-400 dark:text-slate-500">
                            Tối đa 10MB
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Escrow Fintech Guarantee Banner */}
              <div className={cn(
                'rounded-2xl p-4 border relative overflow-hidden transition-all',
                isDark
                  ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/25 text-amber-200/90'
                  : 'bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/30 border-amber-200 text-amber-950'
              )}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/25">
                    <HiOutlineShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      Bảo Chứng Thanh Toán Ký Quỹ (Escrow Protection)
                    </p>
                    <p className="leading-relaxed text-[11px] opacity-90">
                      Khi gửi khiếu nại, tiền đơn hàng sẽ được <strong>tạm khóa an toàn</strong> trong tài khoản ký quỹ của sàn. Người bán có tối đa <strong>72 giờ</strong> để phản hồi hoặc giải trình. Nếu không có kháng cáo hợp lệ, toàn bộ <strong>100% số tiền</strong> sẽ được tự động hoàn trả vào Ví của bạn.
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer with sticky action buttons */}
            <div className={cn(
              'flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t shrink-0',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-100 bg-white'
            )}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150',
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                )}
              >
                Đóng / Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadingImage}
                className={cn(
                  'rounded-xl px-6 py-2.5 text-xs font-bold text-white transition-all duration-200 shadow-md',
                  'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-rose-500/20 active:scale-[0.98]',
                  (loading || uploadingImage) && 'opacity-60 cursor-not-allowed hover:from-rose-500 hover:to-red-600'
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý hồ sơ...
                  </span>
                ) : (
                  'Gửi Khiếu Nại Đơn Hàng'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

