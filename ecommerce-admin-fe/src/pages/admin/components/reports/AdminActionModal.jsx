import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../../lib/cn'

export default function AdminActionModal({
  actionModal,
  setActionModal,
  isDark,
  submitting,
  formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`,
  handleActionConfirm,
}) {
  const totalAmount = Number(actionModal.item?.amount || 0)
  const commission = Number(actionModal.item?.platformCommission || 0)
  const netAmount = Math.max(0, totalAmount - commission)
  const buyerPct = actionModal.buyerPercentage != null ? Number(actionModal.buyerPercentage) : 50
  const sellerPct = 100 - buyerPct
  const buyerAmount = Math.round((netAmount * buyerPct) / 100)
  const sellerAmount = netAmount - buyerAmount

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
              {actionModal.type === 'ESCROW_REFUND' && 'Phân Xử Ký Quỹ: Hoàn Tiền 100% Cho Người Mua'}
              {actionModal.type === 'ESCROW_RELEASE' && 'Phân Xử Ký Quỹ: Giải Ngân 100% Cho Người Bán'}
              {actionModal.type === 'ESCROW_SPLIT' && 'Phân Xử Ký Quỹ: Phân Chia Tỷ Lệ Hoàn Tiền (%)'}
            </h2>
            <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {actionModal.type === 'ESCROW_SPLIT'
                ? 'Thiết lập tỷ lệ % chia số tiền ký quỹ giữa Người mua và Người bán (sau khi đã trừ hoa hồng sàn):'
                : 'Vui lòng nhập lý do / phán quyết chính thức từ Ban Quản Trị. Thông tin này sẽ được lưu trữ vào hồ sơ đối soát:'}
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

            {actionModal.type === 'REPORT_APPROVE' && (
              <div className="mb-4 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <span className="text-[11px] font-bold text-amber-500 block mb-2">
                  Phương án xử lý nếu Customer thắng khiếu nại:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition',
                      (actionModal.resolutionType || 'REFUND_ONLY') === 'REFUND_ONLY'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      value="REFUND_ONLY"
                      checked={(actionModal.resolutionType || 'REFUND_ONLY') === 'REFUND_ONLY'}
                      onChange={() => setActionModal((prev) => ({ ...prev, resolutionType: 'REFUND_ONLY' }))}
                      className="text-amber-500"
                    />
                    <span>Chỉ hoàn tiền</span>
                  </label>

                  <label
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition',
                      actionModal.resolutionType === 'RETURN_AND_REFUND'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      value="RETURN_AND_REFUND"
                      checked={actionModal.resolutionType === 'RETURN_AND_REFUND'}
                      onChange={() => setActionModal((prev) => ({ ...prev, resolutionType: 'RETURN_AND_REFUND' }))}
                      className="text-amber-500"
                    />
                    <span>Trả hàng & Hoàn tiền</span>
                  </label>
                </div>
                <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-2 leading-relaxed">
                  Phương án này sẽ có hiệu lực sau khi kết thúc thời hạn 72h kháng cáo của Shop.
                </p>
              </div>
            )}

            {/* Giao diện phân chia hoàn tiền ký quỹ theo % */}
            {actionModal.type === 'ESCROW_SPLIT' && (
              <div className="mb-4 space-y-3.5">
                {/* Thẻ tóm tắt số liệu dòng tiền */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border space-y-2 text-xs',
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-stone-50 border-stone-200'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Tổng tiền ký quỹ Escrow:</span>
                    <span className="font-mono font-bold text-stone-300 dark:text-slate-200">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Khấu trừ phí hoa hồng sàn:</span>
                    <span className="font-mono text-rose-400">
                      - {formatVND(commission)}
                    </span>
                  </div>
                  <div className="pt-1 border-t dark:border-slate-700 border-stone-200 flex items-center justify-between font-bold">
                    <span>Tổng số tiền thực tế phân chia:</span>
                    <span className="font-mono text-amber-500 text-sm">
                      {formatVND(netAmount)}
                    </span>
                  </div>
                </div>

                {/* Slider & Nhập % */}
                <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">
                      Tỷ lệ phân chia: Người mua {buyerPct}% — Người bán {sellerPct}%
                    </span>
                  </div>

                  {/* Thanh kéo Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={buyerPct}
                    onChange={(e) =>
                      setActionModal((prev) => ({
                        ...prev,
                        buyerPercentage: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-stone-200 dark:bg-slate-700 rounded-lg"
                  />

                  {/* Nút Presets tỷ lệ nhanh */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '100% Khách - 0% Shop', buyer: 100 },
                      { label: '70% Khách - 30% Shop', buyer: 70 },
                      { label: '50% Khách - 50% Shop', buyer: 50 },
                      { label: '30% Khách - 70% Shop', buyer: 30 },
                      { label: '0% Khách - 100% Shop', buyer: 0 },
                    ].map((preset) => (
                      <button
                        key={preset.buyer}
                        type="button"
                        onClick={() =>
                          setActionModal((prev) => ({
                            ...prev,
                            buyerPercentage: preset.buyer,
                          }))
                        }
                        className={cn(
                          'text-[10px] font-bold px-2 py-1 rounded-lg border transition active:scale-95',
                          buyerPct === preset.buyer
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Chi tiết số tiền mỗi bên nhận được */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-700/60 border-stone-200">
                    <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10">
                      <p className="text-[10px] text-blue-400 font-semibold">Người mua nhận ({buyerPct}%):</p>
                      <p className="text-xs font-mono font-bold text-blue-400 mt-0.5">
                        {formatVND(buyerAmount)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <p className="text-[10px] text-emerald-400 font-semibold">Người bán nhận ({sellerPct}%):</p>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                        {formatVND(sellerAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gợi ý lý do phân xử nhanh */}
                <div>
                  <span className="text-[11px] font-bold text-stone-400 block mb-1.5">
                    Gợi ý lý do phân xử nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Hòa giải: Hai bên cùng chịu một phần chi phí rủi ro vận chuyển',
                      'Người mua nhận hoàn phần lớn do sản phẩm có lỗi ngoại quan nhẹ',
                      'Người bán nhận phần lớn do kiện hàng hoàn bị thiếu một phần phụ kiện',
                      'Thống nhất phương án phân chia sau khi đối soát bằng chứng mở hộp',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActionModal((prev) => ({ ...prev, note: tag }))}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
                          actionModal.note === tag
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : isDark
                              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                              : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                        )}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
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
