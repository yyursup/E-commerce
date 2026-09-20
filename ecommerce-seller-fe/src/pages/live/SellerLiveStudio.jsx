import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  HiOutlineMicrophone,
  HiOutlineVideoCamera,
  HiOutlinePhoneMissedCall,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineVolumeUp,
  HiOutlineVolumeOff,
  HiOutlineStar,
} from 'react-icons/hi';
import liveStreamService from '../../services/liveStreamService';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/cn';
import toast from 'react-hot-toast';

export default function SellerLiveStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const { user } = useAuthStore();

  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);

  // Audio / Video states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Stats
  const [viewerCount, setViewerCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [duration, setDuration] = useState(0);

  // Pinned Product & Drawer
  const [pinnedProduct, setPinnedProduct] = useState(null);
  const [showProductDrawer, setShowProductDrawer] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef(null);

  // Video Ref
  const videoRef = useRef(null);

  // Floating hearts
  const [hearts, setHearts] = useState([]);

  // Fetch initial stream info
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const detail = await liveStreamService.getStreamDetail(id);
        setStreamInfo(detail);
        setPinnedProduct(detail.pinnedProduct || null);
        setLikesCount(detail.totalLikes || 0);
      } catch (err) {
        console.error('Fetch live stream detail error:', err);
        toast.error('Không tìm thấy phiên livestream');
        navigate('/live');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  // Connect to LiveKit Room as Host (Publisher)
  useEffect(() => {
    let active = true;
    let currentRoom = null;
    let timerInterval = null;

    const initLiveKit = async () => {
      try {
        // Request token from backend (seller starts stream)
        const tokenData = await liveStreamService.startLiveStream(id);
        if (!active) return;
        const token = tokenData?.token;
        const liveKitUrl =
          tokenData?.liveKitUrl ||
          tokenData?.livekitUrl ||
          'wss://project-e-commerce-eqw785us.livekit.cloud';

        // Create Room instance
        const r = new Room({
          adaptiveStream: false,
          dynacast: false,
        });
        currentRoom = r;

        // Room event listeners
        r.on(RoomEvent.Connected, () => {
          setConnected(true);
          setViewerCount(r.remoteParticipants.size + 1);
          toast.success('Đã kết nối phòng LiveKit thành công!');
        });

        r.on(RoomEvent.Disconnected, (reason) => {
          console.warn('Host room disconnected:', reason);
          setConnected(false);
        });

        r.on(RoomEvent.Reconnected, () => {
          console.log('Host room reconnected!');
          setConnected(true);
        });

        r.on(RoomEvent.ParticipantConnected, () => {
          setViewerCount(r.remoteParticipants.size + 1);
        });

        r.on(RoomEvent.ParticipantDisconnected, () => {
          setViewerCount(r.remoteParticipants.size + 1);
        });

        // Listen for Realtime Data Channels (Chat, Likes, Pin)
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
            } else if (data.type === 'UNPIN_PRODUCT') {
              setPinnedProduct(null);
            }
          } catch (e) {
            console.error('Error parsing livekit data channel message:', e);
          }
        });

        // Connect room
        await r.connect(liveKitUrl, token);
        if (!active) {
          r.disconnect();
          return;
        }
        setRoom(r);

        // Enable Camera & Microphone
        await r.localParticipant.enableCameraAndMicrophone();

        // Attach local camera video to preview
        const cameraPub = r.localParticipant.getTrackPublication(Track.Source.Camera);
        if (cameraPub && cameraPub.videoTrack && videoRef.current) {
          cameraPub.videoTrack.attach(videoRef.current);
        }

        // Timer counter
        timerInterval = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

      } catch (err) {
        if (!active) return;
        console.error('Failed to connect to LiveKit:', err);
        toast.error('Lỗi khi phát sóng camera: ' + (err?.message || 'Kiểm tra quyền Camera/Mic'));
      }
    };

    if (id) {
      initLiveKit();
    }

    return () => {
      active = false;
      if (timerInterval) clearInterval(timerInterval);
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [id]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Spawn floating heart
  const spawnHeart = () => {
    const heartId = Date.now() + Math.random();
    const xPos = Math.floor(Math.random() * 80) + 10; // 10% to 90%
    setHearts((prev) => [...prev, { id: heartId, x: xPos }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 2000);
  };

  // Toggle Mic
  const toggleMute = async () => {
    if (!room) return;
    const nextState = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!nextState);
    setIsMuted(nextState);
    toast.success(nextState ? 'Đã tắt micro' : 'Đã bật micro');
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!room) return;
    const nextState = !isCameraOff;
    await room.localParticipant.setCameraEnabled(!nextState);
    setIsCameraOff(nextState);
    toast.success(nextState ? 'Đã tắt camera' : 'Đã bật camera');
  };

  // Broadcast data channel message
  const broadcastData = (dataObj) => {
    if (!room) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify(dataObj));
      room.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.error('Failed to broadcast live data:', err);
    }
  };

  // Pin a product
  const handlePinProduct = async (prod) => {
    try {
      await liveStreamService.pinProduct(id, prod.productId || prod.id);
      setPinnedProduct(prod);
      broadcastData({ type: 'PIN_PRODUCT', product: prod });
      toast.success(`Đã ghim: ${prod.name}`);
    } catch (err) {
      console.error('Pin product error:', err);
      toast.error('Không thể ghim sản phẩm');
    }
  };

  // Unpin product
  const handleUnpinProduct = async () => {
    try {
      await liveStreamService.unpinProduct(id);
      setPinnedProduct(null);
      broadcastData({ type: 'UNPIN_PRODUCT' });
      toast.success('Đã bỏ ghim sản phẩm');
    } catch (err) {
      console.error('Unpin product error:', err);
      toast.error('Không thể bỏ ghim');
    }
  };

  // Send Host comment
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !room) return;

    const hostName = user?.shopName || '👑 Chủ Shop (Host)';
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const msgObj = {
      id: msgId,
      type: 'CHAT',
      sender: hostName,
      text: inputMessage.trim(),
      isHost: true,
    };

    broadcastData(msgObj);
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [
        ...prev,
        {
          id: msgId,
          sender: hostName,
          text: inputMessage.trim(),
          isHost: true,
          time: Date.now(),
        },
      ];
    });
    setInputMessage('');
  };

  // End Live Stream
  const handleEndStream = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc phiên phát trực tiếp này?')) {
      return;
    }

    try {
      await liveStreamService.endLiveStream(id);
      if (room) {
        room.disconnect();
      }
      toast.success('Đã kết thúc phiên livestream!');
      navigate('/live');
    } catch (err) {
      console.error('End stream error:', err);
      toast.error('Lỗi khi kết thúc live');
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium">Đang chuẩn bị phòng phát sóng LiveKit Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-5rem)] bg-zinc-950 text-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-zinc-800">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        {/* Stream Status & Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-lg shadow-rose-600/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE
          </div>
          <span className="text-xs font-mono font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {formatTimer(duration)}
          </span>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold truncate max-w-xs md:max-w-md">{streamInfo?.title}</h2>
          </div>
        </div>

        {/* Live Stats: Viewers & Likes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <HiOutlineEye className="w-4 h-4 text-rose-400" />
            <span>{viewerCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <HiOutlineHeart className="w-4 h-4 text-pink-400" />
            <span>{likesCount}</span>
          </div>

          <button
            onClick={handleEndStream}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/40 active:scale-95"
          >
            <HiOutlinePhoneMissedCall className="w-4 h-4" />
            Kết thúc Live
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="relative flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* Camera Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Camera off placeholder */}
        {isCameraOff && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
            <HiOutlineVideoCamera className="w-16 h-16 mb-2 opacity-40" />
            <p className="text-sm font-medium">Camera đang tắt</p>
          </div>
        )}

        {/* Floating Heart Animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {hearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.x}%` }}
              className="absolute bottom-20 text-rose-500 animate-bounce duration-1000 transition-all scale-150"
            >
              ❤️
            </div>
          ))}
        </div>

        {/* Bottom Left Pinned Product Banner */}
        {pinnedProduct && (
          <div className="absolute bottom-20 left-4 z-20 max-w-sm w-full animate-slide-up">
            <div className="p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-rose-500/50 shadow-2xl flex items-center justify-between gap-3">
              <img
                src={pinnedProduct.imageUrl || 'https://placehold.co/100x100?text=SP'}
                alt={pinnedProduct.name}
                className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    ĐANG GHIM
                  </span>
                </div>
                <p className="text-xs font-semibold truncate">{pinnedProduct.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-extrabold text-rose-400">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      pinnedProduct.livePrice || pinnedProduct.basePrice || 0
                    )}
                  </span>
                  {pinnedProduct.basePrice && pinnedProduct.livePrice < pinnedProduct.basePrice && (
                    <span className="text-[11px] text-zinc-400 line-through">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        pinnedProduct.basePrice
                      )}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleUnpinProduct}
                title="Bỏ ghim sản phẩm"
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Chat Overlay (Bottom Right) */}
        <div className="absolute bottom-20 right-4 z-20 w-80 max-h-72 flex flex-col justify-end pointer-events-none">
          <div className="overflow-y-auto space-y-2 p-2 pointer-events-auto max-h-60 scrollbar-none">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'px-3 py-1.5 rounded-2xl text-xs max-w-[90%] backdrop-blur-md shadow-md animate-fade-in break-words',
                  m.isHost
                    ? 'bg-rose-600/90 text-white font-semibold self-end ml-auto border border-rose-400/30'
                    : 'bg-black/60 text-zinc-100 border border-white/10'
                )}
              >
                <span className={cn('font-bold mr-1.5', m.isHost ? 'text-amber-300' : 'text-zinc-400')}>
                  {m.sender}:
                </span>
                <span>{m.text}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-16 bg-zinc-950/90 border-t border-zinc-800 px-4 flex items-center justify-between z-30">
        {/* Left: Device Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={cn(
              'p-2.5 rounded-xl text-sm font-semibold transition-all',
              isMuted ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
            title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isMuted ? <HiOutlineVolumeOff className="w-5 h-5" /> : <HiOutlineMicrophone className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCamera}
            className={cn(
              'p-2.5 rounded-xl text-sm font-semibold transition-all',
              isCameraOff ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
            title={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}
          >
            <HiOutlineVideoCamera className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowProductDrawer(!showProductDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
          >
            <HiOutlineShoppingBag className="w-4 h-4" />
            <span>Sản phẩm ({streamInfo?.products?.length || 0})</span>
          </button>
        </div>

        {/* Center/Right: Chat input */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-sm flex-1 ml-4">
          <input
            type="text"
            placeholder="Nhắn tin với khán giả..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
          </button>
        </form>
      </div>

      {/* Product Drawer (Slide-over) */}
      {showProductDrawer && (
        <div className="absolute inset-y-0 right-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 z-40 p-4 flex flex-col shadow-2xl animate-slide-left">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <HiOutlineShoppingBag className="w-5 h-5 text-rose-500" />
              Sản phẩm trong phiên Live
            </h3>
            <button
              onClick={() => setShowProductDrawer(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {streamInfo?.products?.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">Chưa có sản phẩm nào</div>
            ) : (
              streamInfo?.products?.map((item) => {
                const isCurrentPinned = pinnedProduct?.id === item.productId || pinnedProduct?.productId === item.productId;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-xl border transition-all flex flex-col gap-2',
                      isCurrentPinned
                        ? 'bg-rose-950/40 border-rose-500/60'
                        : 'bg-zinc-800/60 border-zinc-700/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl || 'https://placehold.co/100x100?text=SP'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-rose-400 font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            item.livePrice || item.basePrice || 0
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1 border-t border-zinc-700/30">
                      {isCurrentPinned ? (
                        <button
                          onClick={handleUnpinProduct}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
                        >
                          Bỏ ghim
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePinProduct(item)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                        >
                          Ghim lên Live
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
