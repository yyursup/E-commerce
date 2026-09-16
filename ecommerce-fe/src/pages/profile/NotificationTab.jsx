import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineTicket,
  HiOutlineShoppingBag,
  HiOutlineInformationCircle,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { cn } from '../../lib/cn';
import notificationService from '../../services/notification';

export default function NotificationTab({ isDark }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications(0, 30);
      const list = res?.content || (Array.isArray(res) ? res : []);
      setNotifications(list);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc', { id: 'notif-action-toast' });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Không thể đánh dấu đã đọc', { id: 'notif-action-toast' });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã: ${code}`, { id: 'copy-voucher-toast' });
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Thông Báo Của Tôi
          </h2>
          <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Cập nhật tin tức đơn hàng, ưu đãi và voucher mới từ các shop bạn theo dõi
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
            )}
          >
            <HiOutlineCheck className="h-3.5 w-3.5 text-amber-500" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className={cn('mt-3 text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Đang tải thông báo...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <HiOutlineBell className="h-7 w-7" />
          </div>
          <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Chưa có thông báo nào
          </h3>
          <p className={cn('text-xs max-w-sm mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hãy theo dõi các gian hàng bạn yêu thích để nhận ngay thông báo khi họ phát hành voucher và ưu đãi mới!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-slate-800">
          {notifications.map((notif) => {
            const isVoucher = notif.type === 'SHOP_VOUCHER' || notif.type === 'PROMOTION';
            const isOrder = notif.type === 'ORDER';
            const payload = notif.payload || {};
            const voucherCode = payload.voucherCode || payload.code;
            const shopId = payload.shopId;

            return (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif)}
                className={cn(
                  'py-4 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex gap-3.5 items-start',
                  !notif.isRead
                    ? isDark
                      ? 'bg-amber-500/10 hover:bg-amber-500/15'
                      : 'bg-amber-50/70 hover:bg-amber-50'
                    : isDark
                    ? 'hover:bg-slate-800/40'
                    : 'hover:bg-stone-50'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm',
                    isVoucher
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                      : isOrder
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
                      : 'bg-gradient-to-tr from-sky-500 to-blue-500 text-white'
                  )}
                >
                  {isVoucher ? (
                    <HiOutlineTicket className="h-5 w-5" />
                  ) : isOrder ? (
                    <HiOutlineShoppingBag className="h-5 w-5" />
                  ) : (
                    <HiOutlineInformationCircle className="h-5 w-5" />
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        'text-xs sm:text-sm font-bold truncate',
                        !notif.isRead
                          ? isDark
                            ? 'text-amber-400'
                            : 'text-amber-700'
                          : isDark
                          ? 'text-white'
                          : 'text-stone-900'
                      )}
                    >
                      {notif.title}
                    </h4>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-400')}>
                        {formatDate(notif.createdAt)}
                      </span>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                  </div>

                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed',
                      isDark ? 'text-slate-300' : 'text-stone-600'
                    )}
                  >
                    {notif.content}
                  </p>

                  {/* Actions / Voucher Tag */}
                  {(voucherCode || shopId) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {voucherCode && (
                        <button
                          onClick={() => handleCopyCode(voucherCode)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all active:scale-95',
                            isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                          )}
                          title="Sao chép mã voucher"
                        >
                          <HiOutlineClipboardCopy className="h-3.5 w-3.5" />
                          Mã: <span className="font-mono">{voucherCode}</span>
                        </button>
                      )}

                      {shopId && (
                        <Link
                          to={`/shop/${shopId}`}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors',
                            isDark
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                          )}
                        >
                          <HiOutlineExternalLink className="h-3.5 w-3.5" />
                          Ghé thăm Shop
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
