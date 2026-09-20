import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineVideoCamera,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlinePlay,
  HiOutlineSparkles,
} from 'react-icons/hi';
import liveStreamService from '../../services/liveStreamService';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/cn';
import toast from 'react-hot-toast';

export default function LiveList() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const navigate = useNavigate();

  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveStreams = async () => {
    try {
      setLoading(true);
      const data = await liveStreamService.getActiveLiveStreams();
      setStreams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch active streams error:', err);
      toast.error('Không thể tải danh sách Livestream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStreams();
    // Auto refresh active live streams every 15 seconds
    const interval = setInterval(fetchActiveStreams, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl p-8 sm:p-12 border shadow-lg transition-all',
          isDark
            ? 'bg-gradient-to-r from-rose-950/60 via-zinc-900 to-zinc-900 border-rose-900/40'
            : 'bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-white border-rose-200'
        )}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold mb-4 border border-rose-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            LIVESTREAM TRỰC TIẾP
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Mua Sắm & Săn Sale <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              Trực Tiếp Siêu Tốc
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Xem sản phẩm cận cảnh không độ trễ (&lt;300ms) với WebRTC, chốt giá sốc độc quyền của Shop, tương tác trực tiếp và nhận voucher giảm giá ngay trên sóng Live!
          </p>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none"></div>
      </div>

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-pulse"></div>
          <h2 className="text-2xl font-bold">Các phiên Live đang phát sóng ({streams.length})</h2>
        </div>
        <button
          onClick={fetchActiveStreams}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          Làm mới
        </button>
      </div>

      {/* Streams Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-500">Đang tìm các phòng Live...</p>
        </div>
      ) : streams.length === 0 ? (
        <div
          className={cn(
            'py-20 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center',
            isDark ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400' : 'border-zinc-300 bg-zinc-50/50 text-zinc-500'
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <HiOutlineVideoCamera className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-lg font-bold">Hiện chưa có phiên Livestream nào đang phát</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">
            Các gian hàng sẽ sớm lên sóng với nhiều deal hời. Hãy quay lại sau hoặc dạo xem các sản phẩm giảm giá khác nhé!
          </p>
          <Link
            to="/deals"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20"
          >
            <HiOutlineSparkles className="w-4 h-4" />
            Khám phá khuyến mãi
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {streams.map((stream) => {
            const cover =
              stream.coverImageUrl ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
            const pinned = stream.pinnedProduct;

            return (
              <div
                key={stream.id}
                onClick={() => navigate(`/live/${stream.id}`)}
                className={cn(
                  'group cursor-pointer flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 hover:border-rose-500/50'
                    : 'bg-white border-zinc-200 hover:border-rose-300'
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-[9/12] bg-zinc-950 overflow-hidden">
                  <img
                    src={cover}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Gradient shade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                  {/* Live Badge & Viewers (Top Left & Right) */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-lg shadow-rose-600/50">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      TRỰC TIẾP
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                      <HiOutlineEye className="w-3.5 h-3.5 text-rose-400" />
                      <span>{stream.currentViewers || stream.totalViews || 1}</span>
                    </div>
                  </div>

                  {/* Play Button Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <HiOutlinePlay className="w-7 h-7 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Floating Pinned Product Mini Banner (Bottom Thumbnail) */}
                  {pinned && (
                    <div className="absolute bottom-3 inset-x-3 p-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                      <img
                        src={pinned.imageUrl || 'https://placehold.co/80x80?text=SP'}
                        alt={pinned.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-rose-400">Đang ghim</span>
                        <p className="text-xs font-semibold text-white truncate">{pinned.name}</p>
                        <p className="text-xs font-extrabold text-rose-300">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            pinned.livePrice || pinned.basePrice || 0
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Shop details */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {stream.shopName?.charAt(0) || 'S'}
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate">
                        {stream.shopName}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold line-clamp-2 group-hover:text-rose-500 transition-colors">
                      {stream.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                      {stream.products?.length || 0} sản phẩm
                    </span>
                    <span className="flex items-center gap-1 text-pink-500">
                      <HiOutlineHeart className="w-3.5 h-3.5" />
                      {stream.totalLikes || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
