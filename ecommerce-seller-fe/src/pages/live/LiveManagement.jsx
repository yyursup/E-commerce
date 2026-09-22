import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlinePlay,
  HiOutlineShoppingBag,
} from 'react-icons/hi';
import liveStreamService from '../../services/liveStreamService';
import CreateLiveModal from './CreateLiveModal';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/cn';
import toast from 'react-hot-toast';

export default function LiveManagement() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const navigate = useNavigate();

  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED'

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const data = await liveStreamService.getMyStreams();
      setStreams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch streams error:', err);
      toast.error('Không thể tải danh sách phiên Live');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const filteredStreams = streams.filter((s) => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

  const totalViews = streams.reduce((acc, curr) => acc + (curr.totalViews || 0), 0);
  const totalLikes = streams.reduce((acc, curr) => acc + (curr.totalLikes || 0), 0);
  const liveCount = streams.filter((s) => s.status === 'LIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl p-8 border transition-all',
          isDark
            ? 'bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-900 border-rose-900/30'
            : 'bg-gradient-to-br from-rose-500/10 via-pink-50 to-white border-rose-100 shadow-sm'
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-semibold mb-3 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Live Commerce 4.0
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kênh Bán Hàng Trực Tiếp (Livestream)</h1>
            <p className="mt-2 text-sm text-zinc-500 max-w-xl">
              Phát trực tiếp chất lượng cao với công nghệ WebRTC độ trễ siêu thấp (&lt;300ms), tương tác thời gian thực, ghim sản phẩm và chốt đơn ngay trên sóng Live!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 shadow-xl shadow-rose-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Tạo phiên Live mới
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={cn(
            'p-5 rounded-2xl border transition-colors',
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          )}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Đang phát trực tiếp</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <HiOutlineVideoCamera className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-500">{liveCount} phiên</div>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border transition-colors',
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          )}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng lượt xem Live</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <HiOutlineEye className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border transition-colors',
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          )}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng lượt thích</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <HiOutlineHeart className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold">{totalLikes.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'LIVE', label: '🔴 Đang phát' },
          { key: 'SCHEDULED', label: '📅 Đã lên lịch' },
          { key: 'ENDED', label: '⏹ Đã kết thúc' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              filter === tab.key
                ? isDark
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stream Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400">Đang tải danh sách livestream...</div>
      ) : filteredStreams.length === 0 ? (
        <div
          className={cn(
            'py-16 text-center rounded-2xl border border-dashed',
            isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-400'
          )}
        >
          <HiOutlineVideoCamera className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Chưa có phiên livestream nào trong mục này</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 underline"
          >
            Tạo phiên Live ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStreams.map((stream) => {
            const isLive = stream.status === 'LIVE';
            const isScheduled = stream.status === 'SCHEDULED';
            const cover = stream.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

            return (
              <div
                key={stream.id}
                className={cn(
                  'group flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-xl',
                  isLive
                    ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/10'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-zinc-200'
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                  <img
                    src={cover}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md">
                    {isLive && (
                      <span className="flex items-center gap-1.5 bg-rose-600/90 text-white px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        TRỰC TIẾP
                      </span>
                    )}
                    {isScheduled && (
                      <span className="flex items-center gap-1 bg-amber-500/90 text-white px-2 py-0.5 rounded-full">
                        <HiOutlineCalendar className="w-3.5 h-3.5" />
                        SẮP DIỄN RA
                      </span>
                    )}
                    {stream.status === 'ENDED' && (
                      <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-full">
                        ĐÃ KẾT THÚC
                      </span>
                    )}
                  </div>

                  {/* Metrics overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white text-xs font-semibold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      {stream.totalViews || 0}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <HiOutlineHeart className="w-3.5 h-3.5" />
                      {stream.totalLikes || 0}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold line-clamp-2 mb-2 hover:text-rose-500 transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                      {stream.description || 'Không có mô tả'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <HiOutlineShoppingBag className="w-4 h-4 text-rose-500" />
                        {stream.products?.length || 0} sản phẩm
                      </span>
                      {stream.startedAt && (
                        <span className="flex items-center gap-1">
                          <HiOutlineClock className="w-4 h-4" />
                          {new Date(stream.startedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    {isLive ? (
                      <button
                        onClick={() => navigate(`/live/studio/${stream.id}`)}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all"
                      >
                        <HiOutlinePlay className="w-4 h-4 fill-white" />
                        Vào Studio Phát Sóng
                      </button>
                    ) : isScheduled ? (
                      <button
                        onClick={() => navigate(`/live/studio/${stream.id}`)}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-700 flex items-center justify-center gap-2 transition-all"
                      >
                        <HiOutlinePlay className="w-4 h-4" />
                        Bắt đầu phát sóng
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/live/studio/${stream.id}`)}
                        className="w-full py-2 rounded-xl font-medium text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 transition-colors"
                      >
                        Xem lại Studio / Thống kê
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create live */}
      <CreateLiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newStream) => {
          fetchStreams();
          navigate(`/live/studio/${newStream.id}`);
        }}
      />
    </div>
  );
}
