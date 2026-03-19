import { HiOutlineFlag } from 'react-icons/hi'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { cn } from '../lib/cn'
import { buildReportCreatePath, getReportTargetMeta } from '../lib/reportTargets'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'

export default function ReportActionButton({
  targetId,
  targetType,
  targetName,
  label,
  variant = 'ghost',
  className,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!targetId) {
    return null
  }

  const reportMeta = getReportTargetMeta(targetType)
  const returnTo = `${location.pathname}${location.search}${location.hash}`

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error(`Vui lòng đăng nhập để báo cáo ${reportMeta.label.toLowerCase()}.`)
      navigate('/login')
      return
    }

    navigate(
      buildReportCreatePath({
        targetId,
        targetType,
        targetName,
        backTo: returnTo,
      }),
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 font-medium transition',
        variant === 'chip'
          ? [
              'rounded-full border px-3 py-1.5 text-xs',
              isDark
                ? 'border-slate-700 bg-slate-900/70 text-red-300 hover:border-red-500/40 hover:bg-red-500/10'
                : 'border-stone-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50',
            ]
          : [
              'rounded-lg px-4 py-2 text-sm',
              isDark
                ? 'text-red-300 hover:bg-slate-800 hover:text-red-200'
                : 'text-red-600 hover:bg-stone-100 hover:text-red-700',
            ],
        className,
      )}
    >
      <HiOutlineFlag className={cn(variant === 'chip' ? 'h-3.5 w-3.5' : 'h-5 w-5')} />
      <span>{label || `Báo cáo ${reportMeta.label.toLowerCase()}`}</span>
    </button>
  )
}
