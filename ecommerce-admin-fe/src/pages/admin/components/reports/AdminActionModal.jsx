import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../../lib/cn'

export default function AdminActionModal({
  actionModal,
  setActionModal,
  isDark,
  submitting,
  handleActionConfirm,
}) {
  return (
    <AnimatePresence>
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
            )}
          >
            <h2 className="text-base font-bold mb-1">
              {actionModal.type === 'REPORT_APPROVE' && 'Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài'}
              {actionModal.type === 'REPORT_REJECT' && 'Phán Quyết: Bác Bỏ Báo Cáo Vi Phạm'}
              {actionModal.type === 'APPEAL_APPROVE' && 'Phán Quyết: Chấp Thuận Kháng Cáo (Gỡ Phạt)'}
              {actionModal.type === 'APPEAL_REJECT' && 'Phán Quyết: Bác Bỏ Đơn Kháng Cáo'}
              {actionModal.type === 'ESCROW_REFUND' && 'Phân Xử Ký Quỹ: Hoàn Tiền Cho Người Mua'}
              {actionModal.type === 'ESCROW_RELEASE' && 'Phân Xử Ký Quỹ: Giải Ngân Cho Người Bán'}
            </h2>
            <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Vui lòng nhập lý do / phán quyết chính thức từ Ban Quản Trị. Thông tin này sẽ được gửi trực tiếp tới gian hàng và lưu trữ trong hồ sơ vi phạm:
            </p>

            {/* Quick tags gợi ý lý do vi phạm nhanh */}
            {actionModal.type === 'REPORT_APPROVE' && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-amber-500 block mb-1.5">Gợi ý lý do vi phạm nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Gian hàng có dấu hiệu lừa đảo người mua',
                    'Kinh doanh hàng giả, hàng nhái, vi phạm nhãn hiệu',
                    'Mô tả sản phẩm sai sự thật, gian lận thông số',
                    'Gian lận đơn hàng / Lập đơn ảo trục lợi sàn',
                    'Hàng hóa thuộc danh mục cấm giao dịch',
                    'Thái độ xúc phạm hoặc quấy rối khách hàng',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                      className={cn(
                        'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                        actionModal.note === tag
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                      )}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionModal.type === 'REPORT_REJECT' && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-stone-400 block mb-1.5">Gợi ý lý do bác đơn nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Không đủ bằng chứng xác thực hành vi vi phạm',
                    'Nội dung thuộc tranh chấp bảo hành / khiếu nại thông thường',
                    'Hình ảnh đính kèm không liên quan đến sản phẩm/đơn hàng',
                    'Báo cáo không có căn cứ thực tế',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                      className={cn(
                        'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                        actionModal.note === tag
                          ? 'bg-stone-600 text-white border-stone-600 font-bold'
                          : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                      )}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionModal.type === 'APPEAL_APPROVE' && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-emerald-500 block mb-1.5">Gợi ý lý do chấp thuận nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Chấp thuận: Giấy tờ chứng từ hóa đơn hợp lệ và rõ ràng',
                    'Chấp thuận: Xác nhận nhầm lẫn trong quá trình kiểm duyệt',
                    'Chấp thuận: Gian hàng đã giải quyết thỏa đáng khiếu nại của khách',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                      className={cn(
                        'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                        actionModal.note === tag
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                      )}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionModal.type === 'APPEAL_REJECT' && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-rose-400 block mb-1.5">Gợi ý lý do từ chối nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Từ chối: Hóa đơn chứng từ không có giá trị pháp lý / mờ không rõ',
                    'Từ chối: Bằng chứng giải trình không làm rõ được vi phạm',
                    'Từ chối: Không cung cấp được ủy quyền phân phối chính hãng',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                      className={cn(
                        'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                        actionModal.note === tag
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                            : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
                      )}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Nhập chi tiết phán quyết của Ban Quản Trị (bắt buộc)..."
              value={actionModal.note}
              onChange={(e) => setActionModal({ ...actionModal, note: e.target.value })}
              className={cn(
                'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none mb-4',
                isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900',
              )}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null, note: '' })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleActionConfirm}
                disabled={submitting}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận xử lý'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
