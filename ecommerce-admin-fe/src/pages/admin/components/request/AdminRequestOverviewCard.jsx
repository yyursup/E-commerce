import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineDuplicate } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { formatAdminRequestDate, getRequestTypeBadge, isUUID, shortUUID } from './requestHelpers'

export default function AdminRequestOverviewCard({ detail, isDark }) {
  const typeBadge = getRequestTypeBadge(detail?.type, isDark)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border p-6 shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <h2 className="text-lg font-semibold">Tổng quan yêu cầu</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center justify-between bg-stone-50 dark:bg-slate-800/50 p-3 rounded-xl border border-stone-100 dark:border-slate-800">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-stone-500 dark:text-slate-400">
              Mã yêu cầu (ID)
            </p>
            <p className="mt-0.5 text-sm font-mono font-semibold text-stone-700 dark:text-slate-300">
              {detail?.displayCode || detail?.id || '-'}
            </p>
          </div>
          {(detail?.displayCode || detail?.id) && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(detail.displayCode || detail.id);
                toast.success('Đã copy Mã yêu cầu');
              }}
              className={cn(
                'p-2 rounded-lg transition hover:shadow-sm',
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-stone-500 hover:bg-stone-100 shadow-sm border border-stone-200'
              )}
              title="Copy Mã yêu cầu"
            >
              <HiOutlineDuplicate className="h-4 w-4" />
            </button>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Loại yêu cầu</p>
          <p className="mt-1 text-sm font-semibold">{typeBadge.label || detail?.type || '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Trạng thái</p>
          <p className="mt-1 text-sm font-semibold">
            {detail?.status === 'APPROVED' ? 'Đã duyệt' : detail?.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Thời gian tạo</p>
          <p className="mt-1 text-sm">{formatAdminRequestDate(detail?.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Cập nhật lúc</p>
          <p className="mt-1 text-sm">{formatAdminRequestDate(detail?.updatedAt)}</p>
        </div>
        {detail?.reviewedBy && (
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Người duyệt</p>
            {isUUID(detail.reviewedBy) ? (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium font-mono" title={detail.reviewedBy}>{shortUUID(detail.reviewedBy)}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(detail.reviewedBy);
                    toast.success('Đã copy ID');
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition hover:shadow-sm',
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  )}
                  title="Copy ID"
                >
                  <HiOutlineDuplicate className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm font-mono text-xs">{detail.reviewedBy}</p>
            )}
          </div>
        )}
        {detail?.reviewedAt && (
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Thời gian duyệt</p>
            <p className="mt-1 text-sm">{formatAdminRequestDate(detail.reviewedAt)}</p>
          </div>
        )}
        {detail?.response && (
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Phản hồi duyệt</p>
            <p className="mt-1 text-sm font-medium text-amber-600 dark:text-amber-400">{detail.response}</p>
          </div>
        )}
      </div>

      {detail?.coverImageUrl && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Ảnh bìa shop</p>
          <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-700">
            <img src={detail.coverImageUrl} alt="cover" className="h-44 w-full object-cover" />
          </div>
        </div>
      )}

      {detail?.description && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Mô tả / Lời nhắn</p>
          <p className="mt-2 text-sm leading-relaxed p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700">
            {detail.description}
          </p>
        </div>
      )}
    </motion.div>
  )
}
