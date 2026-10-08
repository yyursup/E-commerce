import { useState } from 'react'
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineClipboardCopy,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../lib/cn'

export default function ReturnAddressSnapshot({ returnInfo, isDark }) {
  const [copied, setCopied] = useState(false)

  if (!returnInfo || returnInfo.status === 'CANCELLED') return null

  const copyAddress = () => {
    const text = `${returnInfo.returnRecipientName || 'Chủ gian hàng'} - ${returnInfo.returnRecipientPhone || ''} - ${returnInfo.returnAddress || ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép địa chỉ hoàn hàng')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border text-xs space-y-2',
        isDark ? 'border-slate-800 bg-slate-800/60' : 'border-stone-200 bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-bold text-amber-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
          <HiOutlineLocationMarker className="h-4 w-4 shrink-0" /> Địa chỉ gửi trả hàng về cho Shop:
        </span>
        <button
          type="button"
          onClick={copyAddress}
          className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
          {copied ? 'Đã sao chép' : 'Sao chép địa chỉ'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-stone-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 min-w-0">
          <HiOutlineUser className="h-4 w-4 text-stone-400 shrink-0" />
          <span className="break-words">
            Người nhận:{' '}
            <strong className="text-stone-900 dark:text-white font-semibold">
              {returnInfo.returnRecipientName || 'Chủ gian hàng'}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <HiOutlinePhone className="h-4 w-4 text-stone-400 shrink-0" />
          <span>
            Số điện thoại:{' '}
            <a
              href={`tel:${returnInfo.returnRecipientPhone}`}
              className="font-mono text-stone-900 dark:text-white font-semibold hover:text-amber-500 transition-colors"
            >
              {returnInfo.returnRecipientPhone || '-'}
            </a>
          </span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-stone-600 dark:text-slate-300 font-medium">
        <HiOutlineLocationMarker className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
        <p className="break-words">
          Địa chỉ: {returnInfo.returnAddress || 'Theo địa chỉ kho của Shop'}
        </p>
      </div>
    </div>
  )
}
