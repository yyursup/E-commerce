import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineX,
  HiOutlineVolumeUp,
  HiOutlineVolumeOff,
  HiOutlinePaperAirplane,
  HiOutlineShare,
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineShoppingCart,
} from 'react-icons/hi';
import liveStreamService from '../../services/liveStreamService';
import cartService from '../../services/cart';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { cn } from '../../lib/cn';
import toast from 'react-hot-toast';

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { updateCartCount } = useCartStore();

  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [isStreamEnded, setIsStreamEnded] = useState(false);

  // Video & Audio elements
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHostVideo, setHasHostVideo] = useState(false);

  // Live Stats
  const [viewerCount, setViewerCount] = useState(1);
  const [likesCount, setLikesCount] = useState(0);

  // Pinned Product & Drawer
  const [pinnedProduct, setPinnedProduct] = useState(null);
  const [showProductBag, setShowProductBag] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState(null);

  // Chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Hệ thống Live',
      text: 'Chào mừng bạn đến với phiên Live! Hãy lịch sự khi bình luận và mua sắm thông minh nhé.',
      isSystem: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef(null);

  // Floating Hearts
  const [floatingHearts, setFloatingHearts] = useState([]);

  // Fetch LiveStream details
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const detail = await liveStreamService.getLiveStreamDetail(id);
        setStreamInfo(detail);
        setPinnedProduct(detail.pinnedProduct || null);
        setLikesCount(detail.totalLikes || 0);

        if (detail.status === 'ENDED') {
          setIsStreamEnded(true);
        }
      } catch (err) {
        console.error('Fetch live stream detail error:', err);
        toast.error('Không tìm thấy phiên Livestream');
        navigate('/live');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  // Connect to LiveKit Room as Viewer (Subscriber)
  useEffect(() => {
    let active = true;
    let currentRoom = null;

    const initViewerRoom = async () => {
      try {
        const guestName = !isAuthenticated ? `Khách_${Math.floor(1000 + Math.random() * 9000)}` : null;
        const joinData = await liveStreamService.joinLiveStream(id, guestName);
        if (!active) return;
        const token = joinData?.token;
        const liveKitUrl =
          joinData?.liveKitUrl ||
          joinData?.livekitUrl ||
          'wss://project-e-commerce-eqw785us.livekit.cloud';

        const r = new Room({
          adaptiveStream: false,
          dynacast: false,
          autoSubscribe: true,
        });
        currentRoom = r;

        const attachHostTrack = (track) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
            setHasHostVideo(true);
            videoRef.current.play().catch((e) => console.log('Video play policy:', e));
          }
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
            audioRef.current.play().catch((e) => console.log('Audio play policy:', e));
          }
        };

        // Track subscribed (Host published camera/mic)
        r.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          attachHostTrack(track);
        });

        r.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
          let hasAnyVideo = false;
          r.remoteParticipants.forEach((p) => {
            p.trackPublications.forEach((pub) => {
              if (pub.kind === Track.Kind.Video && pub.track && pub.isSubscribed) {
                hasAnyVideo = true;
              }
            });
          });
          setHasHostVideo(hasAnyVideo);
        });

        // Connected
        r.on(RoomEvent.Connected, () => {
          setViewerCount(r.remoteParticipants.size + 1);
          // Look for already published host tracks
          r.remoteParticipants.forEach((p) => {
            p.trackPublications.forEach((pub) => {
              if (pub.track) {
                attachHostTrack(pub.track);
              }
            });
          });
        });

        r.on(RoomEvent.Reconnected, () => {
          r.remoteParticipants.forEach((p) => {
            p.trackPublications.forEach((pub) => {
              if (pub.track) {
                attachHostTrack(pub.track);
              }
            });
          });
        });

        r.on(RoomEvent.ParticipantConnected, () => {
          setViewerCount(r.remoteParticipants.size + 1);
        });

        r.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setViewerCount(r.remoteParticipants.size + 1);
          // If Host disconnected, stream ended
          if (participant.identity?.startsWith('host_')) {
            setIsStreamEnded(true);
            toast('Chủ Shop đã kết thúc phiên Live!', { icon: '📺' });
          }
        });

        // Realtime Data Channel messages
        r.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const str = new TextDecoder().decode(payload);
            const data = JSON.parse(str);

            if (data.type === 'CHAT') {
              const msgId = data.id || `msg_${Date.now()}_${Math.random()}`;
              const newMsg = {
                id: msgId,
                sender: data.sender || participant?.identity || 'Khán giả',
                text: data.text,
                isHost: !!data.isHost,
                time: Date.now(),
              };

              setMessages((prev) => {
                if (
                  prev.some(
                    (m) =>
                      m.id === msgId ||
                      (m.sender === newMsg.sender &&
                        m.text === newMsg.text &&
                        Math.abs((m.time || 0) - newMsg.time) < 2000)
                  )
                ) {
                  return prev;
                }
                return [...prev, newMsg];
              });
            } else if (data.type === 'LIKE') {
              // Ignore like broadcast if it came from ourselves (already spawned and counted locally)
              if (
                participant?.identity === r.localParticipant?.identity ||
                data.senderIdentity === r.localParticipant?.identity
              ) {
                return;
              }
              setLikesCount((prev) => prev + (data.count || 1));
              spawnHeart();
            } else if (data.type === 'PIN_PRODUCT') {
              setPinnedProduct(data.product);
              toast.success(`Shop vừa ghim: ${data.product?.name}`, { icon: '📌' });
            } else if (data.type === 'UNPIN_PRODUCT') {
              setPinnedProduct(null);
            }
          } catch (e) {
            console.error('Error parsing livekit message:', e);
          }
        });

        // Connect room
        await r.connect(liveKitUrl, token);
        if (!active) {
          r.disconnect();
          return;
        }
        setRoom(r);

      } catch (err) {
        if (!active) return;
        console.error('Failed to join LiveKit room:', err);
      }
    };

    if (id && !isStreamEnded) {
      initViewerRoom();
    }

    return () => {
      active = false;
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [id, isStreamEnded]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Floating heart spawn
  const spawnHeart = () => {
    const heartColors = ['#f43f5e', '#ec4899', '#f97316', '#a855f7', '#e11d48'];
    const randomColor = heartColors[Math.floor(Math.random() * heartColors.length)];
    const heartId = Date.now() + Math.random();
    const xPos = Math.floor(Math.random() * 60) + 20; // 20% to 80%

    setFloatingHearts((prev) => [
      ...prev,
      { id: heartId, x: xPos, color: randomColor },
    ]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 2200);
  };

  // Like stream button
  const handleLike = async () => {
    spawnHeart();
    setLikesCount((prev) => prev + 1);

    // Broadcast to room via data channel
    if (room) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: 'LIKE',
            count: 1,
            senderIdentity: room.localParticipant?.identity,
          })
        );
        room.localParticipant.publishData(payload, { reliable: false });
      } catch (err) {
        console.error('Failed to publish like data:', err);
      }
    }

    // Call API to persist like in Redis
    try {
      await liveStreamService.likeLiveStream(id);
    } catch (e) {
      // ignore
    }
  };

  // Send Viewer Chat
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = user?.fullName || user?.username || 'Khách';
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const msgObj = {
      id: msgId,
      type: 'CHAT',
      sender: senderName,
      text: inputMessage.trim(),
      isHost: false,
    };

    // Broadcast to room
    if (room) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify(msgObj));
        room.localParticipant.publishData(payload, { reliable: true });
      } catch (err) {
        console.error('Failed to send chat data:', err);
      }
    }

    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [
        ...prev,
        {
          id: msgId,
          sender: senderName,
          text: inputMessage.trim(),
          isHost: false,
          time: Date.now(),
        },
      ];
    });
    setInputMessage('');
  };

  // Buy Now / Add to Cart from Live
  const handleBuyNow = async (prod) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }

    const prodId = prod.productId || prod.id;
    try {
      setAddingToCartId(prodId);
      await cartService.addToCart(prodId, 1);
      updateCartCount();
      toast.success(`Đã thêm "${prod.name}" vào giỏ hàng!`, { icon: '🛍️' });
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error(err?.message || 'Không thể thêm sản phẩm vào giỏ');
    } finally {
      setAddingToCartId(null);
    }
  };

  // Toggle Audio Mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium">Đang vào phòng Live...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center overflow-hidden select-none">
      {/* Hidden audio element for LiveKit remote host track */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Main Container: Mobile fullscreen, Desktop stylized framed stage */}
      <div className="relative w-full h-full max-w-md md:max-w-lg lg:max-w-xl mx-auto flex flex-col bg-zinc-950 overflow-hidden md:border-x md:border-zinc-800 shadow-2xl">
        {/* WebRTC Video Stream Player */}
        <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Placeholder if host hasn't turned on camera yet */}
          {!hasHostVideo && !isStreamEnded && (
            <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/30">
                <span className="w-4 h-4 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <h3 className="text-lg font-bold">Đang kết nối tín hiệu từ Host...</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Âm thanh và hình ảnh siêu nét WebRTC đang được đồng bộ
              </p>
            </div>
          )}

          {/* Stream Ended Overlay */}
          {isStreamEnded && (
            <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-zinc-800 text-zinc-400 flex items-center justify-center mb-4 text-2xl">
                📺
              </div>
              <h2 className="text-2xl font-bold">Phiên Livestream Đã Kết Thúc</h2>
              <p className="text-xs text-zinc-400 mt-2 max-w-sm">
                Cảm ơn bạn đã theo dõi! Hãy dạo thăm gian hàng của Shop để không bỏ lỡ các ưu đãi khác nhé.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => navigate('/live')}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition-all"
                >
                  Xem các Live khác
                </button>
                {streamInfo?.shopId && (
                  <Link
                    to={`/shop/${streamInfo.shopId}`}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
                  >
                    Xem Shop
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Floating Hearts Animation overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {floatingHearts.map((h) => (
              <div
                key={h.id}
                style={{
                  left: `${h.x}%`,
                  color: h.color,
                }}
                className="absolute bottom-20 text-3xl animate-floating-heart"
              >
                ❤️
              </div>
            ))}
          </div>

          {/* TOP OVERLAY BAR */}
          <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
            {/* Shop badge & Follow */}
            <div className="flex items-center gap-2 p-1 pr-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 max-w-[65%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {streamInfo?.shopName?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate leading-tight">{streamInfo?.shopName}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Trực tiếp</span>
                </div>
              </div>
              {streamInfo?.shopId && (
                <Link
                  to={`/shop/${streamInfo.shopId}`}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shrink-0 hover:bg-rose-700 transition-colors"
                >
                  Shop
                </Link>
              )}
            </div>

            {/* Right Controls: Viewers, Audio Mute & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold">
                <HiOutlineEye className="w-3.5 h-3.5 text-rose-400" />
                <span>{viewerCount}</span>
              </div>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <HiOutlineVolumeOff className="w-4 h-4 text-rose-400" /> : <HiOutlineVolumeUp className="w-4 h-4" />}
              </button>

              <button
                onClick={() => navigate('/live')}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white"
                title="Rời phòng"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FLOATING PINNED PRODUCT BANNER (Shopee Style) */}
          {pinnedProduct && !isStreamEnded && (
            <div className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up">
              <div className="p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-rose-500/50 shadow-2xl flex items-center justify-between gap-3">
                <img
                  src={pinnedProduct.imageUrl || 'https://placehold.co/100x100?text=SP'}
                  alt={pinnedProduct.name}
                  className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500 text-white tracking-wider">
                      ĐANG GHIM
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate leading-snug">{pinnedProduct.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-rose-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        pinnedProduct.livePrice || pinnedProduct.basePrice || 0
                      )}
                    </span>
                    {pinnedProduct.basePrice && pinnedProduct.livePrice < pinnedProduct.basePrice && (
                      <span className="text-[10px] text-zinc-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          pinnedProduct.basePrice
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleBuyNow(pinnedProduct)}
                  disabled={addingToCartId === (pinnedProduct.productId || pinnedProduct.id)}
                  className="px-4 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/30 shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {addingToCartId === (pinnedProduct.productId || pinnedProduct.id) ? 'Đang thêm...' : 'MUA NGAY'}
                </button>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES STREAM OVERLAY */}
          <div className="absolute bottom-20 left-3 z-10 w-64 sm:w-72 max-h-52 flex flex-col justify-end pointer-events-none">
            <div className="overflow-y-auto space-y-1.5 p-1 pointer-events-auto max-h-48 scrollbar-none">
              {messages.slice(-15).map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'px-2.5 py-1.5 rounded-2xl text-[11px] max-w-[95%] backdrop-blur-md shadow-md animate-fade-in break-words',
                    m.isHost
                      ? 'bg-rose-600/90 text-white font-semibold border border-rose-400/40'
                      : m.isSystem
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'bg-black/55 text-zinc-100 border border-white/10'
                  )}
                >
                  <span
                    className={cn(
                      'font-bold mr-1',
                      m.isHost ? 'text-amber-300' : m.isSystem ? 'text-amber-400' : 'text-rose-300'
                    )}
                  >
                    {m.sender}:
                  </span>
                  <span>{m.text}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="h-16 bg-zinc-950/95 border-t border-zinc-800/80 px-3 flex items-center justify-between gap-2 z-30">
          {/* Shopping Bag Button */}
          <button
            onClick={() => setShowProductBag(true)}
            className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 shrink-0 active:scale-90 transition-transform"
            title="Túi sản phẩm Live"
          >
            <HiOutlineShoppingBag className="w-5 h-5" />
            {streamInfo?.products?.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border-2 border-zinc-950 text-[10px] font-black flex items-center justify-center">
                {streamInfo.products.length}
              </span>
            )}
          </button>

          {/* Chat input */}
          <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              placeholder={isAuthenticated ? 'Bình luận trên Live...' : 'Nhập bình luận...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors shrink-0"
            >
              <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
            </button>
          </form>

          {/* Like Heart Button */}
          <button
            onClick={handleLike}
            className="relative p-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 border border-rose-500/40 shrink-0 active:scale-125 transition-transform"
            title="Thả tim"
          >
            <HiOutlineHeart className="w-5 h-5 fill-rose-500 text-rose-500" />
            <span className="absolute -top-1 -right-1 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold">
              {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
            </span>
          </button>
        </div>

        {/* SHOPPING BAG DRAWER MODAL */}
        {showProductBag && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 max-h-[75vh] flex flex-col p-4 shadow-2xl animate-slide-up">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <HiOutlineShoppingBag className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-bold">Danh sách sản phẩm Live ({streamInfo?.products?.length || 0})</h3>
                </div>
                <button
                  onClick={() => setShowProductBag(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {streamInfo?.products?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500">Chưa có sản phẩm nào</div>
                ) : (
                  streamInfo?.products?.map((item) => {
                    const isCurrentPinned = pinnedProduct?.id === item.productId || pinnedProduct?.productId === item.productId;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3 rounded-2xl border transition-all flex items-center justify-between gap-3',
                          isCurrentPinned
                            ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/30'
                            : 'bg-zinc-800/60 border-zinc-700/40'
                        )}
                      >
                        <img
                          src={item.imageUrl || 'https://placehold.co/100x100?text=SP'}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          {isCurrentPinned && (
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block mb-0.5">
                              Đang phát sóng
                            </span>
                          )}
                          <p className="text-xs font-bold truncate text-white">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-black text-rose-400">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                item.livePrice || item.basePrice || 0
                              )}
                            </span>
                            {item.basePrice && item.livePrice < item.basePrice && (
                              <span className="text-[10px] text-zinc-400 line-through">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                  item.basePrice
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuyNow(item)}
                          disabled={addingToCartId === (item.productId || item.id)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <HiOutlineShoppingCart className="w-4 h-4" />
                          <span>Mua</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
