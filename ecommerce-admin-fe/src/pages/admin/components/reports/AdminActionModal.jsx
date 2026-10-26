import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import { isSellerReturnDisputeItem } from '../../../../lib/reportHelpers'
import AdminActionQuickTags from './AdminActionQuickTags'
import AdminActionOrderResolution from './AdminActionOrderResolution'
import AdminActionEscrowSplit from './AdminActionEscrowSplit'
import AdminActionPolicyClauseSelector from './AdminActionPolicyClauseSelector'

export default function AdminActionModal({
  actionModal,
  setActionModal,
  isDark,
  submitting,
  formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`,
  handleActionConfirm,
  policyClauses = [],
}) {
  const targetType = actionModal.item?.targetType || actionModal.item?.detail?.targetType

  const lastAutoFilledNoteRef = useRef('')
  const [noteMismatchWarning, setNoteMismatchWarning] = useState(null)

  // Reset trạng thái theo dõi ghi chú khi mở modal mới hoặc đổi mục xử lý
  useEffect(() => {
    if (actionModal.isOpen) {
      lastAutoFilledNoteRef.current = ''
      setNoteMismatchWarning(null)
    }
  }, [actionModal.isOpen, actionModal.item?.id, actionModal.item?.requestId])

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

  const isSellerDispute = isSellerReturnDisputeItem(actionModal.item)

  const isReportAction = ['REPORT_APPROVE', 'REPORT_REJECT'].includes(actionModal.type)
  const isClauseMissing = isReportAction && !actionModal.policyClauseCode

  const handleClauseSelect = (clauseCode) => {
    const clauseInfo = policyClauses.find((c) => c.code === clauseCode)
    const newTemplateNote = clauseInfo ? `${clauseInfo.title}: ${clauseInfo.description}` : ''

    setActionModal((prev) => {
      const currentNote = prev.note || ''
      const trimmedCurrent = currentNote.trim()
      const lastAuto = lastAutoFilledNoteRef.current?.trim() || ''

      // Cập nhật tự động nếu note đang trống HOẶC note trùng khớp với nội dung auto-fill trước đó
      const canAutoUpdate = !trimmedCurrent || (lastAuto && trimmedCurrent === lastAuto)

      if (canAutoUpdate) {
        lastAutoFilledNoteRef.current = newTemplateNote
        setNoteMismatchWarning(null)
        return {
          ...prev,
          policyClauseCode: clauseCode,
          note: newTemplateNote,
        }
      }

      // Nếu admin đã chỉnh sửa thủ công: không tự ý ghi đè, hiển thị cảnh báo giao diện
      setNoteMismatchWarning({
        newClauseTitle: clauseInfo?.title || clauseCode,
        suggestedNote: newTemplateNote,
      })
      return {
        ...prev,
        policyClauseCode: clauseCode,
      }
    })
  }

  const getSubmitButtonConfig = () => {
    if (submitting) {
      return { text: 'Đang xử lý...', className: 'bg-amber-500 hover:bg-amber-600' }
    }

    if (isSellerDispute) {
      if (actionModal.type === 'REPORT_APPROVE') {
        return {
          text: 'Xác nhận Giải ngân cho Shop',
          className: 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-white',
        }
      }
      if (actionModal.type === 'REPORT_REJECT') {
        return {
          text: 'Xác nhận Bồi hoàn cho Người mua',
          className: 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 text-white',
        }
      }
    }

    switch (actionModal.type) {
      case 'REPORT_APPROVE':
        return {
          text: targetType === 'ORDER' ? 'Xác nhận vi phạm & Bồi hoàn' : 'Xác nhận vi phạm (Phạt Shop)',
          className: 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 text-white',
        }
      case 'REPORT_REJECT':
        return {
          text: 'Bác bỏ báo cáo (Bảo vệ Shop)',
          className: 'bg-stone-600 hover:bg-stone-700 shadow-md shadow-stone-600/20 text-white',
        }
      case 'ESCROW_REFUND':
        return {
          text: 'Xác nhận hoàn tiền 100% cho Buyer',
          className: 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 text-white',
        }
      case 'ESCROW_RELEASE':
        return {
          text: 'Xác nhận giải ngân 100% cho Shop',
          className: 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-white',
        }
      default:
        return {
          text: 'Xác nhận xử lý',
          className: 'bg-amber-500 hover:bg-amber-600 text-white',
        }
    }
  }

  const submitBtnConfig = getSubmitButtonConfig()

  return (
    <AnimatePresence>
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'w-full max-w-xl sm:max-w-2xl rounded-3xl border p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-700',
              isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900',
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-base font-bold">
                {actionModal.type === 'REPORT_APPROVE' && (isSellerDispute ? 'Phán Quyết: Chấp Thuận Shop Khiếu Nại (Giải Ngân Shop)' : 'Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài')}
                {actionModal.type === 'REPORT_REJECT' && (isSellerDispute ? 'Phán Quyết: Bác Bỏ Shop Khiếu Nại (Bồi Hoàn Cho Người Mua)' : 'Phán Quyết: Bác Bỏ Báo Cáo Vi Phạm')}
                {actionModal.type === 'ESCROW_REFUND' && 'Phân Xử Ký Quỹ: Hoàn Tiền 100% Cho Người Mua'}
                {actionModal.type === 'ESCROW_RELEASE' && 'Phân Xử Ký Quỹ: Giải Ngân 100% Cho Người Bán'}
                {actionModal.type === 'ESCROW_SPLIT' && 'Phân Xử Ký Quỹ: Phân Chia Tỷ Lệ Hoàn Tiền (%)'}
              </h2>
              {targetTypeLabel && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  {isSellerDispute ? 'Khiếu nại kiện hoàn' : targetTypeLabel}
                </span>
              )}
            </div>

            <p className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {actionModal.type === 'ESCROW_SPLIT'
                ? 'Thiết lập tỷ lệ % chia số tiền ký quỹ giữa Người mua và Người bán (sau khi đã trừ hoa hồng sàn):'
                : isSellerDispute && actionModal.type === 'REPORT_APPROVE'
                  ? 'Chấp thuận khiếu nại của Shop về kiện hàng hoàn. Tiền ký quỹ Escrow sẽ được giải ngân cho Shop. Người mua bị xử phạt +1 gậy vi phạm gian lận kiện hoàn (không thể kháng cáo):'
                  : isSellerDispute && actionModal.type === 'REPORT_REJECT'
                    ? 'Bác bỏ khiếu nại của Shop về kiện hàng hoàn. Tiền ký quỹ Escrow sẽ được bồi hoàn cho Người mua. Người mua không bị xử phạt:'
                    : 'Vui lòng nhập lý do / phán quyết chính thức từ Ban Quản Trị. Thông tin này sẽ được lưu trữ vào hồ sơ đối soát:'}
            </p>

            {/* Bộ chọn Căn Cứ Điều Khoản Chính Sách chuẩn hóa bắt buộc cho toàn bộ báo cáo vi phạm (ORDER, PRODUCT, SHOP, REVIEW, USER) */}
            {isReportAction && (
              <AdminActionPolicyClauseSelector
                policyClauses={policyClauses}
                selectedClause={actionModal.policyClauseCode}
                onChangeClause={handleClauseSelect}
                targetType={targetType}
                actionType={actionModal.type}
                isSellerDispute={isSellerDispute}
                isDark={isDark}
              />
            )}

            {/* Quick tags gợi ý lý do nhanh (áp dụng khi không phải báo cáo vi phạm cần chọn chính sách) */}
            {!isReportAction && (
              <AdminActionQuickTags
                actionType={actionModal.type}
                targetType={targetType}
                currentNote={actionModal.note}
                onSelectTag={(tag) => setActionModal((prev) => ({ ...prev, note: tag }))}
                isDark={isDark}
                targetTypeLabel={targetTypeLabel}
                isSellerDispute={isSellerDispute}
              />
            )}

            {/* Tùy chọn kỷ luật Shop & Chế tài Buyer khi Shop thắng khiếu nại kiện hoàn */}
            {isSellerDispute && actionModal.type === 'REPORT_APPROVE' && (
              <div
                className={cn(
                  'mb-3.5 p-3.5 rounded-2xl border transition-all',
                  isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    ⚖️ Phán quyết kỷ luật đối với Shop:
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                    Tùy chọn BQT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setActionModal((prev) => ({ ...prev, removeShopPenalty: true }))}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none',
                      actionModal.removeShopPenalty === true
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : isDark
                          ? 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="removeShopPenalty"
                      checked={actionModal.removeShopPenalty === true}
                      onChange={() => setActionModal((prev) => ({ ...prev, removeShopPenalty: true }))}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <span className="block leading-tight">Xóa gậy cho Shop</span>
                      <span className="text-[10px] font-normal text-stone-400 dark:text-slate-400">
                        Phục hồi 1 điểm uy tín vi phạm
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setActionModal((prev) => ({ ...prev, removeShopPenalty: false }))}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none',
                      actionModal.removeShopPenalty === false
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                        : isDark
                          ? 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="removeShopPenalty"
                      checked={actionModal.removeShopPenalty === false}
                      onChange={() => setActionModal((prev) => ({ ...prev, removeShopPenalty: false }))}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div className="min-w-0">
                      <span className="block leading-tight">Giữ nguyên gậy</span>
                      <span className="text-[10px] font-normal text-stone-400 dark:text-slate-400">
                        Shop vẫn có lỗi giao ẩu ban đầu
                      </span>
                    </div>
                  </label>
                </div>

                {(actionModal.removeShopPenalty === null || actionModal.removeShopPenalty === undefined) && (
                  <p className="mt-2 text-[10.5px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>⚠️ Vui lòng chọn 1 trong 2 phương án kỷ luật để tiếp tục</span>
                  </p>
                )}

                <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-stone-600 dark:text-slate-300">
                  <span className="shrink-0 text-amber-500 font-bold">⚠️ Chế tài Người mua:</span>
                  <span>
                    Người mua sẽ bị xử phạt <strong>+1 gậy vi phạm</strong> (Hành vi gian lận kiện hoàn). Đây là <strong>phán quyết tối cao cuối cùng</strong> của BQT sàn, Người mua <strong>không được phép kháng cáo</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Phương án bồi hoàn đơn hàng (Chỉ hiển thị khi đối tượng là ORDER và không phải khiếu nại kiện hoàn) */}
            {actionModal.type === 'REPORT_APPROVE' && targetType === 'ORDER' && !isSellerDispute && (
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

            {/* Cảnh báo khi đổi điều khoản nhưng ghi chú đã được chỉnh sửa thủ công */}
            {noteMismatchWarning && (
              <div className="mb-2.5 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 text-amber-500 font-bold">⚠️</span>
                  <span className="truncate">
                    Đã đổi sang <strong>{noteMismatchWarning.newClauseTitle}</strong>. Ghi chú đã sửa thủ công được giữ nguyên.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActionModal((prev) => ({ ...prev, note: noteMismatchWarning.suggestedNote }))
                    lastAutoFilledNoteRef.current = noteMismatchWarning.suggestedNote
                    setNoteMismatchWarning(null)
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 text-[11px] transition shadow-xs"
                >
                  Dùng mẫu mới
                </button>
              </div>
            )}

            {/* Input ghi chú phán quyết */}
            <textarea
              rows={3}
              placeholder="Nhập chi tiết phán quyết của Ban Quản Trị (bắt buộc)..."
              value={actionModal.note}
              onChange={(e) => {
                const val = e.target.value
                setActionModal({ ...actionModal, note: val })
                if (noteMismatchWarning && val.trim() === noteMismatchWarning.suggestedNote.trim()) {
                  setNoteMismatchWarning(null)
                  lastAutoFilledNoteRef.current = noteMismatchWarning.suggestedNote
                }
              }}
              className={cn(
                'w-full rounded-2xl px-3.5 py-2.5 text-xs border outline-none mb-4',
                isDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-stone-200 bg-white text-stone-900',
              )}
            />

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  lastAutoFilledNoteRef.current = ''
                  setNoteMismatchWarning(null)
                  setActionModal({ isOpen: false, type: '', item: null, note: '' })
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleActionConfirm}
                disabled={submitting || isClauseMissing}
                className={cn(
                  'px-4.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50',
                  submitBtnConfig.className,
                )}
              >
                {submitBtnConfig.text}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
