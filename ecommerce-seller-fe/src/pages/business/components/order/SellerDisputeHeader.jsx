import {
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineArrowNarrowRight,
  HiOutlineScale,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export const getStageConfig = (stage) => {
  switch (stage) {
    case 'DIRECT_NEGOTIATION':
      return {
        label: 'Đang Thương Lượng 1:1',
        title: 'Yêu Cầu Khiếu Nại — Thương Lượng Trực Tiếp 1:1',
        desc: 'Khách hàng đã nộp khiếu nại. Bạn có 48 giờ để thương lượng trực tiếp nhằm bảo vệ uy tín Shop.',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        iconBg: 'bg-amber-500',
        icon: HiOutlineExclamationCircle,
      }
    case 'RETURN_IN_PROGRESS':
      return {
        label: 'Đang Đổi Trả Hàng',
        title: 'Tiến Trình Đổi Trả & Thu Hồi Hàng Hoàn',
        desc: 'Shop đã đồng ý đổi trả. Khách hàng đang tiến hành gửi trả kiện hàng về kho của bạn qua đơn vị vận chuyển.',
        badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        iconBg: 'bg-sky-500',
        icon: HiOutlineArrowNarrowRight,
      }
    case 'ESCALATED_TO_ADMIN':
      return {
        label: 'BQT Đang Phân Xử',
        title: 'Tranh Chấp Đang Chờ Ban Quản Trị Sàn Phán Quyết',
        desc: 'Hai bên không đạt được thỏa thuận trực tiếp. Ban Quản Trị sàn đang đối soát chứng từ để ban hành phán quyết cuối cùng.',
        badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        iconBg: 'bg-purple-600',
        icon: HiOutlineScale,
      }
    case 'RESOLVED':
      return {
        label: 'Đã Giải Quyết',
        title: 'Hồ Sơ Khiếu Nại Đã Được Giải Quyết',
        desc: 'Vụ việc khiếu nại đã được hai bên thống nhất xử lý thành công.',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-500',
        icon: HiOutlineCheckCircle,
      }
    case 'CLOSED':
      return {
        label: 'Đã Đóng / Hoàn Tất',
        title: 'Hồ Sơ Khiếu Nại Đã Đóng & Hoàn Tất Phán Quyết',
        desc: 'Hồ sơ khiếu nại đã chính thức khép lại theo phán quyết của Ban Quản Trị hoặc sau khi chu trình hoàn tiền kết thúc.',
        badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30',
        iconBg: 'bg-slate-700',
        icon: HiOutlineCheckCircle,
      }
    case 'CANCELLED':
      return {
        label: 'Đã Hủy / Rút Đơn',
        title: 'Khách Hàng Đã Rút Khiếu Nại',
        desc: 'Khách hàng đã tự nguyện hủy yêu cầu khiếu nại đối với đơn hàng này.',
        badgeClass: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-400/30',
        iconBg: 'bg-stone-500',
        icon: HiOutlineX,
      }
    default:
      return {
        label: stage || 'Đang Tiếp Nhận',
        title: 'Hồ Sơ Khiếu Nại Đơn Hàng',
        desc: 'Thông tin khiếu nại và phản hồi đối chất giữa Người mua và Shop.',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        iconBg: 'bg-amber-500',
        icon: HiOutlineShieldCheck,
      }
  }
}

export default function SellerDisputeHeader({ report, slaRemaining, isNegotiating, isDark }) {
  const stageConfig = getStageConfig(report?.stage)
  const StageIcon = stageConfig.icon

  return (
    <div
      className={cn(
        'p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b',
        isDark ? 'border-slate-800/80 bg-slate-800/40' : 'border-stone-200/80 bg-white/60'
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'p-2.5 rounded-2xl text-white shrink-0 mt-0.5 shadow-md flex items-center justify-center',
            stageConfig.iconBg
          )}
        >
          <StageIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className={cn('font-bold text-base sm:text-lg tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              {stageConfig.title}
            </h3>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors',
                stageConfig.badgeClass
              )}
            >
              {stageConfig.label}
            </span>
          </div>
          <p className={cn('text-xs mt-1 leading-relaxed max-w-2xl', isDark ? 'text-slate-400' : 'text-stone-500')}>
            {stageConfig.desc}
          </p>
        </div>
      </div>

      {/* SLA Countdown Badge */}
      {isNegotiating && slaRemaining && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 self-start sm:self-center shadow-xs">
          <HiOutlineClock className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>SLA phản hồi: {slaRemaining}</span>
        </div>
      )}
    </div>
  )
}
