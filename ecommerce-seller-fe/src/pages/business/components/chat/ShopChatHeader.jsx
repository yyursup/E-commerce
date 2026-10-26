import { HiOutlineLockClosed } from 'react-icons/hi'
import { HiOutlineBell, HiOutlineBellSlash } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'

export default function ShopChatHeader({
  selectedThread,
  isThreadClosed,
  partnerTyping,
  isThreadMuted,
  toggleMuteThread,
  isDark,
}) {
  if (!selectedThread) return null

  return (
    <div
      className={cn(
        'p-3.5 px-6 border-b flex items-center justify-between shrink-0',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {selectedThread.customerAvatar ? (
            <img
              src={selectedThread.customerAvatar}
              alt={selectedThread.customerName}
              className="h-10 w-10 rounded-full object-cover border border-amber-500/20"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {selectedThread.customerName?.charAt(0)?.toUpperCase() || 'K'}
            </div>
          )}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900',
              isThreadClosed ? 'bg-stone-400 dark:bg-slate-600' : 'bg-emerald-500'
            )}
            title={isThreadClosed ? 'Phòng chat đã khóa' : 'Đang hoạt động'}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate text-stone-900 dark:text-white">
              {selectedThread.customerName || 'Khách hàng'}
            </h3>
            {isThreadClosed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-stone-700 dark:text-slate-300 border border-stone-300 dark:border-slate-700 shrink-0">
                <HiOutlineLockClosed className="h-3 w-3 text-stone-500" />
                ĐÃ ĐÓNG
              </span>
            )}
            {isThreadMuted(selectedThread.id) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700">
                <HiOutlineBellSlash className="h-3 w-3 text-rose-500" />
                Đã tắt thông báo
              </span>
            )}
          </div>
          {isThreadClosed ? (
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
              Phòng chat đã khóa • Toàn bộ lịch sử trao đổi được lưu trữ đối soát
            </p>
          ) : partnerTyping ? (
            <p className="text-[11px] text-amber-500 font-medium animate-pulse">
              Khách hàng đang soạn tin...
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Đang hoạt động trên sàn
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const willMute = !isThreadMuted(selectedThread.id)
            toggleMuteThread(selectedThread.id)
            if (willMute) {
              toast.success(`Đã tắt thông báo từ ${selectedThread.customerName || 'khách hàng này'}`)
            } else {
              toast.success(`Đã bật thông báo từ ${selectedThread.customerName || 'khách hàng này'}`)
            }
          }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs',
            isThreadMuted(selectedThread.id)
              ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
              : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
          )}
          title={isThreadMuted(selectedThread.id) ? 'Bật lại thông báo từ khách hàng này' : 'Tắt thông báo từ khách hàng này'}
        >
          {isThreadMuted(selectedThread.id) ? (
            <>
              <HiOutlineBellSlash className="h-4 w-4 text-rose-500" />
              <span className="hidden sm:inline">Bật thông báo</span>
            </>
          ) : (
            <>
              <HiOutlineBell className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Tắt thông báo</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
