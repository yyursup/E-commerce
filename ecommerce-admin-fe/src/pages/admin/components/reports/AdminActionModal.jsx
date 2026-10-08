import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import AdminActionQuickTags from './AdminActionQuickTags'
import AdminActionOrderResolution from './AdminActionOrderResolution'
import AdminActionEscrowSplit from './AdminActionEscrowSplit'

export default function AdminActionModal({
  actionModal,
  setActionModal,
  isDark,
  submitting,
  formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`,
  handleActionConfirm,
}) {
  const targetType = actionModal.item?.targetType || actionModal.item?.detail?.targetType

  const getTargetTypeLabel = (type) => {
    switch (type) {
      case 'USER':
        return 'Tài khoản người dùng'
      case 'REVIEW':
        return 'Đánh giá / Nhận xét'
      case 'PRODUCT':
        return 'Sản phẩm'
      case 'SHOP':
        return 'Gian hàng (Shop)'
      case 'ORDER':
        return 'Đơn hàng'
      default:
        return null
    }
  }

  const targetTypeLabel = getTargetTypeLabel(targetType)

  return (
    <AnimatePresence>
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-base font-bold">
                {actionModal.type === 'REPORT_APPROVE' && 'Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài'}
                {actionModal.type === 'REPORT_REJECT' && 'Phán Quyết: Bác Bỏ Báo Cáo Vi Phạm'}
                {actionModal.type === 'APPEAL_APPROVE' && 'Phán Quyết: Chấp Thuận Kháng Cáo (Gỡ Phạt)'}
                {actionModal.type === 'APPEAL_REJECT' && 'Phán Quyết: Bác Bỏ Đơn Kháng Cáo'}
                {actionModal.type === 'ESCROW_REFUND' && 'Phân Xử Ký Quỹ: Hoàn Tiền 100% Cho Người Mua'}
                {actionModal.type === 'ESCROW_RELEASE' && 'Phân Xử Ký Quỹ: Giải Ngân 100% Cho Người Bán'}
                {actionModal.type === 'ESCROW_SPLIT' && 'Phân Xử Ký Quỹ: Phân Chia Tỷ Lệ Hoàn Tiền (%)'}
              </h2>
              {targetTypeLabel && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  {targetTypeLabel}
                </span>
              )}
            </div>

            <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {actionModal.type === 'ESCROW_SPLIT'
                ? 'Thiết lập tỷ lệ % chia số tiền ký quỹ giữa Người mua và Người bán (sau khi đã trừ hoa hồng sàn):'
                : 'Vui lòng nhập lý do / phán quyết chính thức từ Ban Quản Trị. Thông tin này sẽ được lưu trữ vào hồ sơ đối soát:'}
            </p>

            {/* Quick tags gợi ý lý do nhanh */}
            <AdminActionQuickTags
              actionType={actionModal.type}
              targetType={targetType}
              currentNote={actionModal.note}
              onSelectTag={(tag) => setActionModal((prev) => ({ ...prev, note: tag }))}
              isDark={isDark}
              targetTypeLabel={targetTypeLabel}
            />

            {/* Phương án bồi hoàn đơn hàng (Chỉ hiển thị khi đối tượng là ORDER) */}
            {actionModal.type === 'REPORT_APPROVE' && targetType === 'ORDER' && (
              <AdminActionOrderResolution
                resolutionType={actionModal.resolutionType}
                onChangeResolution={(resType) =>
                  setActionModal((prev) => ({ ...prev, resolutionType: resType }))
                }
                isDark={isDark}
              />
            )}

            {/* Giao diện phân chia tỷ lệ ký quỹ Escrow */}
            {actionModal.type === 'ESCROW_SPLIT' && (
              <AdminActionEscrowSplit
                actionModal={actionModal}
                setActionModal={setActionModal}
                isDark={isDark}
                formatVND={formatVND}
              />
            )}

            {/* Input ghi chú phán quyết */}
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

            {/* Footer Buttons */}
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
