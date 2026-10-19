import { HiOutlineChat, HiOutlineSearch, HiOutlineBell, HiOutlineRefresh, HiOutlineLockClosed } from 'react-icons/hi'
import { HiOutlineBellSlash } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'

function formatThreadDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

export default function ShopChatSidebar({
  threads,
  filteredThreads,
  selectedThreadId,
  connected,
  loadingThreads,
  searchTerm,
  setSearchTerm,
  notifEnabled,
  toggleNotif,
  loadThreads,
  loadMessages,
  handleSelectThread,
  isThreadMuted,
  isThreadClosed,
  isDark,
}) {
  return (
    <aside
      className={cn(
        'w-80 sm:w-96 flex flex-col border-r shrink-0',
        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-50/50'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <HiOutlineChat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Tin Nhắn Khách Hàng</h2>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                )}
              />
              <span className="opacity-60">{connected ? 'Trực tuyến' : 'Mất kết nối'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              loadThreads()
              if (selectedThreadId) loadMessages(selectedThreadId)
              toast.success('Đã làm mới danh sách tin nhắn')
            }}
            className={cn(
              'rounded-xl p-2 transition',
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'
            )}
            title="Làm mới tin nhắn"
          >
            <HiOutlineRefresh className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const nextState = !notifEnabled
              toggleNotif()
              if (nextState) {
                toast.success('Đã bật tất cả thông báo tin nhắn')
              } else {
                toast.success('Đã tắt tất cả thông báo tin nhắn')
              }
            }}
            className={cn(
              'rounded-xl p-2 transition',
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'
            )}
            title={notifEnabled ? 'Tắt tất cả thông báo tin nhắn' : 'Bật thông báo tin nhắn'}
          >
            {notifEnabled ? (
              <HiOutlineBell className="h-4 w-4 text-amber-500" />
            ) : (
              <HiOutlineBellSlash className="h-4 w-4 opacity-50" />
            )}
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className="p-3 border-b border-stone-200/60 dark:border-slate-800/80">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm khách hàng hoặc tin nhắn..."
            className={cn(
              'w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition focus:ring-2 focus:ring-amber-500/20',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-40'
                : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-40'
            )}
          />
        </div>
      </div>

      {/* Threads Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/50">
        {loadingThreads ? (
          <div className="p-6 text-center text-xs opacity-60">Đang tải cuộc trò chuyện...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-xs opacity-60 space-y-2">
            <HiOutlineChat className="h-8 w-8 mx-auto opacity-30" />
            <p>Chưa có cuộc trò chuyện nào từ khách hàng.</p>
          </div>
        ) : (
          filteredThreads.map((t) => {
            const isSelected =
              selectedThreadId &&
              String(t.id).toLowerCase() === String(selectedThreadId).toLowerCase()
            const unread = t.unreadCount || 0
            const isItemClosed =
              t.status === 'CLOSED' ||
              t.isLocked ||
              t.locked ||
              (isSelected && isThreadClosed)

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectThread(t.id)}
                className={cn(
                  'w-full p-3.5 text-left flex items-start gap-3 transition-colors relative',
                  isSelected
                    ? isDark
                      ? 'bg-slate-800/90'
                      : 'bg-amber-50/80'
                    : isDark
                      ? 'hover:bg-slate-850'
                      : 'hover:bg-stone-100/70'
                )}
              >
                {/* Active border indicator */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r" />
                )}

                {/* Customer Avatar */}
                <div className="relative shrink-0">
                  {t.customerAvatar ? (
                    <img
                      src={t.customerAvatar}
                      alt={t.customerName}
                      className="h-11 w-11 rounded-full object-cover border border-amber-500/20 shadow-xs"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                      {t.customerName?.charAt(0)?.toUpperCase() || 'K'}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900',
                      isItemClosed ? 'bg-stone-400 dark:bg-slate-600' : 'bg-emerald-500'
                    )}
                    title={isItemClosed ? 'Cuộc hội thoại đã đóng' : 'Đang hoạt động'}
                  />
                </div>

                {/* Thread details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4
                        className={cn(
                          'text-xs font-bold truncate',
                          unread > 0
                            ? isDark ? 'text-white' : 'text-stone-900 font-extrabold'
                            : isDark ? 'text-slate-200' : 'text-stone-800'
                        )}
                      >
                        {t.customerName || 'Khách hàng'}
                      </h4>
                      {isThreadMuted(t.id) && (
                        <HiOutlineBellSlash
                          className="h-3.5 w-3.5 text-stone-400 dark:text-slate-500 shrink-0"
                          title="Đã tắt thông báo từ khách hàng này"
                        />
                      )}
                    </div>
                    <span className="text-[10px] opacity-50 shrink-0">
                      {formatThreadDate(t.lastMessageAt || t.updatedAt)}
                    </span>
                  </div>

                  <p
                    className={cn(
                      'text-xs truncate leading-snug',
                      unread > 0
                        ? 'font-bold text-stone-900 dark:text-white'
                        : 'opacity-70'
                    )}
                  >
                    {t.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                  </p>
                </div>

                {/* Unread or Closed badge */}
                {isItemClosed ? (
                  <span className="shrink-0 flex items-center gap-0.5 rounded-md bg-stone-200/80 dark:bg-slate-750 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600 dark:text-slate-400 border border-stone-300/60 dark:border-slate-700">
                    <HiOutlineLockClosed className="h-2.5 w-2.5 text-stone-500" />
                    Đóng
                  </span>
                ) : unread > 0 ? (
                  <span className="shrink-0 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
