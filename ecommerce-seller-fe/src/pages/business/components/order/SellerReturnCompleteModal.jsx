import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineArchive,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function SellerReturnCompleteModal({
  isOpen,
  onClose,
  isDark,
  submitting,
  conditionNote,
  setConditionNote,
  isRestocked,
  setIsRestocked,
  onSubmit,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900',
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800 border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <HiOutlineCheckCircle className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-base">Xác Nhận Hàng Đạt & Hoàn Tiền</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <p className={cn('text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Bạn xác nhận đã nhận lại sản phẩm hoàn trả trong tình trạng nguyên vẹn. Hệ thống sẽ hoàn tiền cho Khách hàng từ tài khoản ký quỹ sàn (Escrow).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tình trạng kiểm tra thực tế:</label>
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border text-xs',
                  isDark ? 'bg-slate-800/80 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                )}>
                  <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold">Hàng nguyên vẹn / Đạt chuẩn kiểm tra (INTACT)</span>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Ghi chú kiểm tra (Tùy chọn):</label>
                <textarea
                  rows={3}
                  value={conditionNote}
                  onChange={(e) => setConditionNote(e.target.value)}
                  placeholder="Ví dụ: Sản phẩm nguyên seal, tem bảo hành còn mới đầy đủ..."
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-stone-50 border-stone-200',
                  )}
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none dark:border-slate-800 border-stone-200 hover:bg-stone-50 dark:hover:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={isRestocked}
                  onChange={(e) => setIsRestocked(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <div className="flex items-center gap-1.5">
                  <HiOutlineArchive className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Tự động cộng lại số lượng tồn kho cho sản phẩm</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t dark:border-slate-800 border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={onSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                {submitting ? 'Đang xử lý...' : 'Xác nhận hoàn tiền cho khách'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
