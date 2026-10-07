import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'

export default function OrderDisputeBanner({ order, returnInfo, isDark }) {
  if (!order) return null

  const hasActiveReturn = returnInfo || order.returnInfo
  const isDeliveredNoDispute =
    order.status === 'DELIVERED' &&
    !order.hasActiveDispute &&
    !hasActiveReturn

  return (
    <>
      {/* 1. Escrow Guidance Banner when DELIVERED and NO dispute and NO return */}
      {isDeliveredNoDispute && (
        <div
          className={cn(
            'rounded-2xl p-3.5 sm:p-4 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
            isDark
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-900',
          )}
        >
          <div className="flex items-start gap-2.5">
            <HiOutlineShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đơn hàng đã được giao đến bạn</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                Vui lòng kiểm tra kỹ sản phẩm. Tiền đang được{' '}
                <strong>Sàn ký quỹ giữ an toàn</strong>. Nếu có vấn đề về sản phẩm, hãy bấm{' '}
                <strong>Khiếu nại</strong> để tạm giữ tiền giải ngân cho Shop.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dispute Status Banner when order has active dispute */}
      {order.hasActiveDispute && (
        <div
          className={cn(
            'rounded-2xl p-4 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm',
            order.disputeStatus === 'REPORT_PENDING'
              ? isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-900'
              : isDark
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-rose-50 border-rose-300 text-rose-900',
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-xl text-white shrink-0 mt-0.5 shadow-sm',
                order.disputeStatus === 'REPORT_PENDING' ? 'bg-amber-500' : 'bg-rose-500',
              )}
            >
              {order.disputeStatus === 'REPORT_PENDING' ? (
                <HiOutlineExclamationCircle className="h-5 w-5" />
              ) : (
                <HiOutlineShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm">
                  {order.disputeStatus === 'REPORT_PENDING' && 'Đang giải quyết khiếu nại đơn hàng'}
                  {order.disputeStatus === 'REPORT_APPROVED' && 'Khiếu nại của bạn đã được chấp thuận'}
                  {order.disputeStatus === 'APPEAL_PENDING' && 'Shop đang gửi đơn kháng cáo'}
                </p>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider',
                    order.disputeStatus === 'REPORT_PENDING'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
                  )}
                >
                  {order.disputeStatus === 'REPORT_PENDING' && 'Chờ BQT duyệt'}
                  {order.disputeStatus === 'REPORT_APPROVED' && 'Tạm khóa Escrow'}
                  {order.disputeStatus === 'APPEAL_PENDING' && 'Chờ đối soát kháng cáo'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                {order.disputeStatus === 'REPORT_PENDING' &&
                  'Hồ sơ khiếu nại của bạn đang được Ban Quản Trị xem xét và đối soát. Tiền đơn hàng đang được tạm khóa trong Ký quỹ sàn (Escrow), nút xác nhận nhận hàng tạm khóa để bảo vệ quyền lợi.'}
                {order.disputeStatus === 'REPORT_APPROVED' &&
                  'Ban Quản Trị đã xác nhận khiếu nại của bạn là hợp lệ. Tiền vẫn đang được giữ an toàn trong Ký quỹ sàn. Shop có thời hạn tối đa 72 giờ để gửi phản hồi / kháng cáo trước khi hệ thống tự động hoàn tiền.'}
                {order.disputeStatus === 'APPEAL_PENDING' &&
                  'Shop đã nộp đơn kháng cáo kèm bằng chứng. Ban Quản Trị đang tiến hành phân xử công bằng để đưa ra phán quyết giải ngân hoặc hoàn tiền cuối cùng.'}
              </p>
              {order.disputeReason && (
                <p className="text-[11px] font-mono mt-1.5 opacity-80 line-clamp-2">
                  Lý do: {order.disputeReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
