import { HiOutlineScale } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function SellerDisputeAdminBanner({ report, isOrderRefunded, isDark }) {
  const resolvedAdminNote = report?.adminNote || report?.moderatorNote || report?.response

  if (
    !resolvedAdminNote &&
    !isOrderRefunded &&
    report?.stage !== 'CLOSED' &&
    report?.stage !== 'RESOLVED' &&
    report?.status !== 'APPROVED' &&
    report?.status !== 'REJECTED'
  ) {
    return null
  }

  const isApprovedRefund = isOrderRefunded || report?.status === 'APPROVED'
  const isRejectedDispute = report?.status === 'REJECTED'

  return (
    <div
      className={cn(
        'mx-4 sm:mx-6 mt-4 p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-xs',
        isApprovedRefund
          ? isDark
            ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : isRejectedDispute
            ? isDark
              ? 'border-sky-500/30 bg-sky-950/30 text-sky-300'
              : 'border-sky-200 bg-sky-50 text-sky-800'
            : isDark
              ? 'border-purple-500/30 bg-purple-950/30 text-purple-300'
              : 'border-purple-200 bg-purple-50 text-purple-800'
      )}
    >
      <HiOutlineScale
        className={cn(
          'h-5 w-5 shrink-0 mt-0.5',
          isApprovedRefund ? 'text-emerald-500' : isRejectedDispute ? 'text-sky-500' : 'text-purple-500'
        )}
      />
      <div className="space-y-1.5 flex-1">
        <p className="font-bold text-xs uppercase tracking-wider">
          {isApprovedRefund
            ? 'Phán quyết chính thức: Chấp thuận bồi hoàn cho Người mua'
            : isRejectedDispute
              ? 'Phán quyết chính thức: Bác bỏ khiếu nại (Bảo vệ Gian hàng / Giải ngân)'
              : 'Kết luận xử lý từ Ban Quản Trị sàn'}
        </p>
        {(report?.policyClauseTitle || report?.policyClauseCode) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-800 dark:text-amber-300 w-fit">
            <span>⚖️ Căn cứ Điều khoản:</span>
            <span>{report.policyClauseTitle || report.policyClauseCode}</span>
          </div>
        )}
        <p className="text-xs leading-relaxed opacity-95">
          {resolvedAdminNote ? (
            <span>
              <strong>Ghi chú phán quyết BQT:</strong> &ldquo;{resolvedAdminNote}&rdquo;
            </span>
          ) : isApprovedRefund ? (
            'Ban Quản Trị đã hoàn tất xem xét hồ sơ và thực thi hoàn tiền từ ký quỹ Escrow cho khách hàng. Vụ việc khiếu nại đã chính thức đóng lại.'
          ) : (
            'Hồ sơ khiếu nại đã hoàn tất thẩm định và phân xử.'
          )}
        </p>
      </div>
    </div>
  )
}
