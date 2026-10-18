import { HiOutlineScale } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function SellerDisputeAdminBanner({ report, isOrderRefunded, isDark }) {
  if (!report?.adminNote && !isOrderRefunded && report?.stage !== 'CLOSED' && report?.stage !== 'RESOLVED') {
    return null
  }

  const isApprovedRefund = isOrderRefunded || report?.status === 'APPROVED'

  return (
    <div
      className={cn(
        'mx-4 sm:mx-6 mt-4 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3',
        isApprovedRefund
          ? isDark
            ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : isDark
            ? 'border-sky-500/30 bg-sky-950/30 text-sky-300'
            : 'border-sky-200 bg-sky-50 text-sky-800'
      )}
    >
      <HiOutlineScale className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
      <div className="space-y-1">
        <p className="font-bold text-xs uppercase tracking-wider">
          {isApprovedRefund
            ? 'Phán quyết chính thức: Chấp thuận bồi hoàn 100% cho Người mua'
            : 'Kết luận xử lý từ Ban Quản Trị sàn'}
        </p>
        <p className="text-xs leading-relaxed opacity-90">
          {report?.adminNote ||
            (isApprovedRefund
              ? 'Ban Quản Trị đã hoàn tất xem xét hồ sơ và thực thi hoàn tiền từ ký quỹ Escrow cho khách hàng. Vụ việc khiếu nại đã chính thức đóng lại.'
              : 'Hồ sơ khiếu nại đã hoàn tất thẩm định và phân xử.')}
        </p>
      </div>
    </div>
  )
}
