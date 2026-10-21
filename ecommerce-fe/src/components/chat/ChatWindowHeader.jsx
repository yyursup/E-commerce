import {
  HiOutlineChat,
  HiX,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineBell,
  HiArrowLeft,
  HiOutlineBadgeCheck,
  HiOutlineShoppingBag,
} from 'react-icons/hi'
import { HiOutlineBellSlash } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export default function ChatWindowHeader({
  activeShop,
  activeTab,
  setActiveTab,
  notifEnabled,
  toggleNotif,
  backToInbox,
  closeChat,
  isDark,
}) {
  if (activeShop) {
    return (
      /* TikTok Shop Header */
      <div
        className={cn(
          'flex items-center justify-between border-b px-3.5 py-3 transition-colors shrink-0',
          isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-white shadow-xs'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={backToInbox}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition shrink-0',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title="Quay lại Hộp thư"
          >
            <HiArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative shrink-0">
            {activeShop.logo ? (
              <img
                src={activeShop.logo}
                alt={activeShop.name}
                className="h-9 w-9 rounded-full object-cover border border-amber-500/30 shadow-xs"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {activeShop.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className={cn(
                  'text-sm font-bold truncate max-w-[140px]',
                  isDark ? 'text-white' : 'text-stone-900'
                )}
                title={activeShop.name}
              >
                {activeShop.name}
              </h3>
              {activeShop.mallBadge && (
                <span className="rounded bg-rose-600 px-1 py-0.2 text-[9px] font-black uppercase text-white shrink-0">
                  Mall
                </span>
              )}
              {activeShop.ekycVerified && (
                <HiOutlineBadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">
              Thường trả lời trong 1 giờ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to={`/shop/${activeShop.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title="Xem gian hàng của shop"
          >
            <HiOutlineShoppingBag className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={toggleNotif}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title={notifEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
          >
            {notifEnabled ? (
              <HiOutlineBell className="h-4 w-4 text-amber-500" />
            ) : (
              <HiOutlineBellSlash className="h-4 w-4 opacity-50" />
            )}
          </button>

          <button
            type="button"
            onClick={closeChat}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-stone-100 text-stone-600'
            )}
            title="Đóng cửa sổ chat"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  /* Support / AI Chat Top Bar with Tabs */
  return (
    <div
      className={cn(
        'flex flex-col border-b px-4 pt-3 pb-2 shrink-0',
        isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-amber-500 text-white',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={backToInbox}
            className="rounded-lg p-1 text-white hover:bg-white/10 transition shrink-0"
            title="Quay lại Hộp thư"
          >
            <HiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0">
            <HiOutlineChat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Trung tâm Trợ giúp</h3>
            <p className="text-[11px] opacity-80">Trực tuyến 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Notification toggle bell */}
          <button
            type="button"
            onClick={toggleNotif}
            className="rounded-lg p-1.5 hover:bg-white/10 transition"
            title={notifEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
          >
            {notifEnabled ? (
              <HiOutlineBell className="h-4 w-4" />
            ) : (
              <HiOutlineBellSlash className="h-4 w-4 opacity-60" />
            )}
          </button>
          <button
            type="button"
            onClick={closeChat}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex rounded-xl bg-black/10 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('bot')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition',
            activeTab === 'bot'
              ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400'
              : 'text-white/80 hover:text-white',
          )}
        >
          <HiOutlineSparkles className="h-4 w-4" />
          Trợ lý AI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition',
            activeTab === 'live'
              ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400'
              : 'text-white/80 hover:text-white',
          )}
        >
          <HiOutlineUserGroup className="h-4 w-4" />
          Hỗ trợ Trực tuyến
        </button>
      </div>
    </div>
  )
}
