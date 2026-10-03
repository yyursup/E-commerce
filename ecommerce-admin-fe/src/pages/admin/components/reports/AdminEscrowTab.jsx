import {
  HiOutlineCash,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineReceiptRefund,
  HiOutlineScale,
  HiOutlineExclamation,
  HiOutlineClock,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminEscrowTab({
  escrows,
  isDark,
  formatVND,
  setActionModal,
  handleOpenEscrowDetail,
}) {
  if (escrows.length === 0) {
    return (
      <div className="py-16 text-center">
        <HiOutlineCash className="mx-auto h-12 w-12 text-stone-300 dark:text-slate-600 mb-2" />
        <p className="font-semibold text-sm text-stone-600 dark:text-slate-300">
          Không có giao dịch ký quỹ nào
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-stone-100 dark:divide-slate-800">
      {escrows.map((item) => {
        const returnStatus = item.orderReturn?.status || item.returnStatus
        const isReturnDisputed = returnStatus === 'DISPUTED'
        // Admin CHỈ ĐƯỢC QUYỀN can thiệp xử lý ký quỹ khi đơn có khiếu nại kiện hàng hoàn ở trạng thái DISPUTED
        const canAdminSettle = (item.status === 'HELD' || item.status === 'DISPUTED') && isReturnDisputed

        // Xác định thông điệp lý do khi chưa được quyền can thiệp
        let settleBlockedReason = ''
        if (!canAdminSettle && (item.status === 'HELD' || item.status === 'DISPUTED')) {
          if (!returnStatus) {
            if (item.status === 'DISPUTED') {
              settleBlockedReason = 'Đơn hàng đang trong quy trình Báo cáo / Kháng cáo. Vui lòng xử lý phán quyết tại tab Báo cáo hoặc Kháng cáo để hệ thống tự động xử lý tiền ký quỹ theo đúng quy trình.'
            } else {
              settleBlockedReason = 'Đơn hàng đang trong quy trình ký quỹ thông thường (tự động giải ngân sau 3 ngày giao hàng thành công). Admin chỉ can thiệp khi có tranh chấp kiện hoàn (DISPUTED).'
            }
          } else if (returnStatus === 'RETURNED') {
            settleBlockedReason = 'Kiện hàng hoàn đã giao tới Người bán (đang trong 72h kiểm hàng). Admin chỉ can thiệp khi Shop khiếu nại (DISPUTED).'
          } else if (returnStatus === 'WAITING_FOR_SHIPMENT' || returnStatus === 'SHIPPED') {
            settleBlockedReason = 'Kiện hàng hoàn đang xử lý vận chuyển. Admin chỉ can thiệp khi Shop khiếu nại (DISPUTED).'
          } else if (returnStatus === 'COMPLETED' || returnStatus === 'CANCELLED') {
            settleBlockedReason = 'Yêu cầu trả hàng đã kết thúc.'
          }
        }

        return (
          <div
            key={item.escrowId || item.id}
            className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-colors"
          >
            {/* Vùng thông tin có thể nhấp để xem chi tiết */}
            <div
              onClick={() => handleOpenEscrowDetail && handleOpenEscrowDetail(item)}
              className="space-y-1.5 flex-1 min-w-0 cursor-pointer"
              title="Bấm để xem chi tiết đầy đủ hồ sơ ký quỹ"
            >
              {/* Hàng 1: Trạng thái Escrow, Mã Escrow, Thời gian, Badge hoàn hàng nếu có */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                    item.status === 'RELEASED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : item.status === 'REFUNDED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : item.status === 'DISPUTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  )}
                >
                  {item.status === 'DISPUTED'
                    ? 'Đang tranh chấp'
                    : item.status === 'RELEASED'
                      ? 'Đã giải ngân'
                      : item.status === 'REFUNDED'
                        ? 'Đã hoàn tiền'
                        : 'Đang tạm giữ'}
                </span>

                {/* Badge trạng thái Hoàn hàng (nếu đơn có yêu cầu trả hàng) */}
                {returnStatus && (
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                      returnStatus === 'RETURNED'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : returnStatus === 'DISPUTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : returnStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : returnStatus === 'CANCELLED'
                              ? 'bg-stone-500/10 text-stone-400 border-stone-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    )}
                  >
                    {returnStatus === 'RETURNED'
                      ? 'Đã giao hàng hoàn (Shop kiểm 72h)'
                      : returnStatus === 'DISPUTED'
                        ? 'Tranh chấp hoàn hàng'
                        : returnStatus === 'WAITING_FOR_SHIPMENT'
                          ? 'Chờ người mua gửi hàng'
                          : returnStatus === 'SHIPPED'
                            ? 'Đang giao hàng hoàn'
                            : returnStatus === 'COMPLETED'
                              ? 'Hoàn hàng thành công'
                              : 'Đã hủy đơn hoàn'}
                  </span>
                )}

                <span className="text-xs text-stone-400 font-mono">
                  #{String(item.escrowId || item.id || '').substring(0, 8)}
                </span>
                <span className="text-xs text-stone-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                </span>
              </div>

              {/* Hàng 2: Tiền ký quỹ & Mã đơn hàng kèm hiệu ứng hover */}
              <p
                className={cn(
                  'text-xs font-medium group-hover:text-amber-500 transition-colors flex items-center gap-2 flex-wrap',
                  isDark ? 'text-slate-200' : 'text-stone-800',
                )}
              >
                <span className="font-mono font-bold text-sm text-amber-500">
                  {formatVND(item.amount)}
                </span>
                <span className="text-stone-400">•</span>
                <span>
                  Đơn hàng: <strong className="font-mono">{item.orderNumber || `#${String(item.orderId || '').substring(0, 8)}`}</strong>
                </span>
              </p>

              {/* Hàng 3: Mô tả ngữ cảnh ngắn gọn */}
              <p className="text-[11px] text-stone-400 line-clamp-1">
                {returnStatus === 'DISPUTED' ? (
                  <span className="text-rose-400 font-medium inline-flex items-center gap-1">
                    <HiOutlineScale className="h-3.5 w-3.5 shrink-0" />
                    <span>Kiện hàng hoàn đang tranh chấp từ Người bán. Admin có thẩm quyền can thiệp phân xử ký quỹ.</span>
                  </span>
                ) : returnStatus === 'RETURNED' ? (
                  <span className="text-purple-400 font-medium inline-flex items-center gap-1">
                    <HiOutlineExclamation className="h-3.5 w-3.5 shrink-0" />
                    <span>Kiện hàng hoàn đã giao tới Người bán (đang trong 72h kiểm hàng). Admin chỉ can thiệp khi Shop khiếu nại (DISPUTED).</span>
                  </span>
                ) : (returnStatus === 'WAITING_FOR_SHIPMENT' || returnStatus === 'SHIPPED') ? (
                  <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                    <HiOutlineExclamation className="h-3.5 w-3.5 shrink-0" />
                    <span>Kiện hàng hoàn đang trên đường vận chuyển. Chờ giao tới Người bán và phát sinh tranh chấp.</span>
                  </span>
                ) : item.status === 'DISPUTED' ? (
                  <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                    <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                    <span>Đơn hàng có báo cáo vi phạm. Xử lý tại tab Báo cáo / Kháng cáo (hệ thống tự động chuyển tiền).</span>
                  </span>
                ) : item.status === 'RELEASED' ? (
                  'Doanh thu đơn hàng đã giải ngân về Ví Người bán (sau khi khấu trừ phí hoa hồng sàn).'
                ) : item.status === 'REFUNDED' ? (
                  '100% tiền ký quỹ từ Escrow đã hoàn về Ví Người mua.'
                ) : (
                  'Tiền thanh toán đang được ký quỹ tạm giữ an toàn, chờ xác nhận giao hàng hoặc hoàn tất.'
                )}
              </p>
            </div>

            {/* Vùng nút bấm hành động (Responsive trên mọi kích thước màn hình) */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-start md:justify-end">
              <button
                type="button"
                onClick={() => handleOpenEscrowDetail && handleOpenEscrowDetail(item)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 hover:border-amber-500/50 hover:text-amber-400'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-amber-400 hover:text-amber-600',
                )}
              >
                <HiOutlineEye className="h-4 w-4" />
                Chi tiết
              </button>

              {(item.status === 'HELD' || item.status === 'DISPUTED') && (
                <>
                  {/* Nút Phân chia hoàn tiền (%) */}
                  <button
                    type="button"
                    disabled={!canAdminSettle}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!canAdminSettle) return
                      setActionModal({
                        isOpen: true,
                        type: 'ESCROW_SPLIT',
                        item,
                        buyerPercentage: 50,
                        note: '',
                      })
                    }}
                    title={!canAdminSettle ? settleBlockedReason : 'Phân chia hoàn tiền theo tỷ lệ %'}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm',
                      !canAdminSettle
                        ? 'bg-slate-500/40 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20',
                    )}
                  >
                    <HiOutlineScale className="h-4 w-4" />
                    Phân chia (%)
                  </button>

                  {/* Nút Giải ngân cho Shop */}
                  <button
                    type="button"
                    disabled={!canAdminSettle}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!canAdminSettle) return
                      setActionModal({ isOpen: true, type: 'ESCROW_RELEASE', item, note: '' })
                    }}
                    title={!canAdminSettle ? settleBlockedReason : 'Giải ngân 100% cho Shop'}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm',
                      !canAdminSettle
                        ? 'bg-slate-500/40 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20',
                    )}
                  >
                    <HiOutlineCheck className="h-4 w-4" />
                    Giải ngân
                  </button>

                  {/* Nút Hoàn tiền cho Người mua */}
                  <button
                    type="button"
                    disabled={!canAdminSettle}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!canAdminSettle) return
                      setActionModal({ isOpen: true, type: 'ESCROW_REFUND', item, note: '' })
                    }}
                    title={!canAdminSettle ? settleBlockedReason : 'Hoàn tiền 100% cho Người mua'}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm',
                      !canAdminSettle
                        ? 'bg-slate-500/40 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/20',
                    )}
                  >
                    <HiOutlineReceiptRefund className="h-4 w-4" />
                    Hoàn tiền
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
