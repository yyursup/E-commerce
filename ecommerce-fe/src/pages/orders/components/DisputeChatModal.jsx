import { useState, useEffect, useRef } from 'react'
import {
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlinePaperAirplane,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import { isVideoUrl } from '../../../lib/mediaUtils'
import toast from 'react-hot-toast'
import chatService from '../../../services/chatService'
import { addWebSocketListener } from '../../../services/websocketService'

export default function DisputeChatModal({
  isOpen,
  onClose,
  orderId,
  requestId,
  orderNumber,
  isDark = false,
}) {
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [previewMedia, setPreviewMedia] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    loadThread()
  }, [isOpen, orderId, requestId])

  const loadThread = async () => {
    try {
      setLoading(true)
      let currentThread = null
      if (requestId) {
        currentThread = await chatService.getDisputeThreadByRequestId(requestId)
      } else if (orderId) {
        currentThread = await chatService.getDisputeThreadByOrderId(orderId)
      }

      setThread(currentThread)
      if (currentThread?.id) {
        const msgPage = await chatService.getMessages(currentThread.id, 0, 50)
        // getMessages trả về trang sắp xếp giảm dần theo createdAt -> đảo ngược để hiển thị dòng thời gian
        const content = msgPage?.content || []
        setMessages([...content].reverse())
        chatService.markRead(currentThread.id).catch(() => {})
      }
    } catch (err) {
      console.warn('Lỗi khi tải phòng chat khiếu nại:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải phòng chat khiếu nại')
    } finally {
      setLoading(false)
    }
  }

  // Lắng nghe WebSocket
  useEffect(() => {
    if (!isOpen || !thread?.id) return

    const unsubMsg = addWebSocketListener('CHAT_MESSAGE', (newMsg) => {
      if (newMsg?.threadId === thread.id || newMsg?.thread?.id === thread.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        chatService.markRead(thread.id).catch(() => {})
      }
    })

    const unsubClose = addWebSocketListener('CHAT_THREAD_CLOSED', (event) => {
      if (event?.threadId === thread.id) {
        setThread((prev) => (prev ? { ...prev, status: 'CLOSED', isLocked: true, closeReason: event.closeReason } : prev))
        toast('Phòng chat khiếu nại đã đóng và lưu trữ đối soát.', { icon: '🔒' })
      }
    })

    return () => {
      unsubMsg()
      unsubClose()
    }
  }, [isOpen, thread?.id])

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendText = async (e) => {
    e?.preventDefault()
    if (!text.trim() || !thread?.id || sending || uploadingImage || uploadingVideo || thread.isLocked) return

    const content = text.trim()
    setText('')
    try {
      setSending(true)
      const sent = await chatService.sendMessage(thread.id, content)
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev
        return [...prev, sent]
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gửi tin nhắn')
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const handleSelectImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !thread?.id || thread.isLocked) return

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp định dạng hình ảnh')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB')
      return
    }

    try {
      setUploadingImage(true)
      const sent = await chatService.sendImage(thread.id, file)
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev
        return [...prev, sent]
      })
      toast.success('Đã gửi ảnh bằng chứng')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tải ảnh lên')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSelectVideo = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !thread?.id || thread.isLocked) return

    if (!file.type.startsWith('video/')) {
      toast.error('Chỉ hỗ trợ tệp định dạng video (MP4, WebM, QuickTime)')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Kích thước video tối đa là 100MB')
      return
    }

    try {
      setUploadingVideo(true)
      const sent = await chatService.sendVideo(thread.id, file)
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev
        return [...prev, sent]
      })
      toast.success('Đã gửi video bằng chứng')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể tải video lên')
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  const isClosed =
    thread?.status === 'CLOSED' ||
    thread?.isLocked ||
    thread?.locked ||
    messages.some(
      (m) =>
        m.senderRole === 'SYSTEM' &&
        (m.content?.includes('Phòng trao đổi thương lượng đã đóng') ||
          m.content?.includes('Phòng chat đã đóng'))
    )

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div
        className={cn(
          'flex flex-col w-full max-w-2xl h-[92vh] max-h-[720px] rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150',
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 border-b shrink-0',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-stone-50/90'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <HiOutlineShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold truncate">
                  {thread?.title || `Thương lượng khiếu nại #${orderNumber || orderId?.toString().substring(0, 8)}`}
                </h3>
                {isClosed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300">
                    <HiOutlineLockClosed className="h-3 w-3" /> Đã đóng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang mở thương lượng
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Đối thoại trực tiếp giữa Người mua và {thread?.shopName || 'Gian hàng'} (Admin giám sát đối soát)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors text-stone-500"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Thông báo Data Retention / Khóa bất biến */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-2 shrink-0">
          <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Hồ sơ trao đổi & bằng chứng (ảnh, video) được lưu trữ bất biến phục vụ Quản trị viên phân xử khiếu nại.
          </span>
        </div>

        {/* Danh sách tin nhắn */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-4 space-y-3.5',
            isDark ? 'bg-slate-950/40' : 'bg-stone-50/50'
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-stone-400 space-y-2">
              <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải lịch sử trao đổi...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-stone-400 space-y-2 p-6 text-center">
              <HiOutlineShieldCheck className="h-10 w-10 text-stone-300 dark:text-slate-700" />
              <p className="font-semibold">Chưa có tin nhắn nào trong phòng thương lượng.</p>
              <p className="text-[11px] max-w-sm opacity-80">
                Hãy trao đổi với Shop về tình trạng đơn hàng, kèm hình ảnh hoặc video bằng chứng rõ ràng để đạt thỏa thuận nhanh nhất.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.messageType === 'SYSTEM' || msg.senderRole === 'SYSTEM'
              const isMine = msg.senderId === thread?.customerId

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-md rounded-xl bg-stone-200/80 dark:bg-slate-800/80 border border-stone-300/50 dark:border-slate-700 px-3.5 py-2 text-center text-xs text-stone-700 dark:text-slate-300 space-y-1 shadow-xs">
                      <p className="font-semibold flex items-center justify-center gap-1.5 text-stone-800 dark:text-slate-200">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <span>{msg.senderName || 'Hệ Thống Tranh Chấp'}</span>
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-95">{msg.content}</p>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col max-w-[82%]', isMine ? 'ml-auto items-end' : 'mr-auto items-start')}
                >
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 mb-1 px-1">
                    {msg.senderName || (isMine ? 'Bạn' : 'Người bán')} • {msg.senderRole === 'ADMIN' ? 'Admin' : ''}
                  </span>

                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words shadow-xs space-y-1.5',
                      isMine
                        ? 'bg-orange-600 text-white rounded-tr-xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs'
                        : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                    )}
                  >
                    {/* Hình ảnh */}
                    {msg.messageType === 'IMAGE' && msg.imageUrl ? (
                      <div>
                        <img
                          src={msg.imageUrl}
                          alt="Bằng chứng tranh chấp"
                          onClick={() => setPreviewMedia(msg.imageUrl)}
                          className="max-h-56 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10"
                        />
                        {msg.content && msg.content !== '[Hình ảnh]' && (
                          <p className="pt-1">{msg.content}</p>
                        )}
                      </div>
                    ) : msg.messageType === 'VIDEO' && msg.videoUrl ? (
                      /* Video */
                      <div className="space-y-1">
                        <div className="relative rounded-xl overflow-hidden bg-black/90 max-w-sm border border-black/10">
                          <video
                            src={msg.videoUrl}
                            controls
                            preload="metadata"
                            playsInline
                            className="max-h-56 w-full rounded-xl object-contain"
                          />
                        </div>
                        {msg.content && msg.content !== '[Video]' && (
                          <p className="pt-1">{msg.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  <span className="text-[9px] text-stone-400 mt-0.5 px-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer input hoặc banner đóng phòng */}
        {isClosed ? (
          <div className="p-4 border-t border-stone-200 dark:border-slate-800 bg-stone-100/80 dark:bg-slate-800/50 text-center text-xs text-stone-600 dark:text-slate-400 space-y-1">
            <p className="font-bold flex items-center justify-center gap-1.5 text-stone-800 dark:text-slate-200">
              <HiOutlineLockClosed className="h-4 w-4 text-stone-500" />
              <span>Phòng thương lượng tranh chấp đã đóng</span>
            </p>
            <p className="text-[11px]">
              Lý do: {thread?.closeReason || 'Vụ việc đã được hoàn tất và tiền ký quỹ đã quyết toán'}.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSendText}
            className={cn(
              'p-3 border-t flex items-center gap-2 shrink-0',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
            )}
          >
            {/* Input chọn ảnh */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSelectImage}
              accept="image/*"
              className="hidden"
            />

            {/* Input chọn video */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleSelectVideo}
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
            />

            {/* Nút gửi ảnh */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || uploadingVideo || sending}
              title="Đính kèm ảnh bằng chứng (<10MB)"
              className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors shrink-0"
            >
              {uploadingImage ? (
                <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlinePhotograph className="h-5 w-5 text-orange-500" />
              )}
            </button>

            {/* Nút gửi video */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingImage || uploadingVideo || sending}
              title="Đính kèm video bằng chứng unboxing/lỗi (<100MB)"
              className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors shrink-0"
            >
              {uploadingVideo ? (
                <div className="h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlineVideoCamera className="h-5 w-5 text-rose-500" />
              )}
            </button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập nội dung trao đổi thương lượng với Shop..."
              disabled={sending || uploadingImage || uploadingVideo}
              className={cn(
                'flex-1 rounded-xl border px-3.5 py-2.5 text-xs outline-hidden transition-all',
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-orange-500'
              )}
            />

            <button
              type="submit"
              disabled={!text.trim() || sending || uploadingImage || uploadingVideo}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white transition-all shrink-0 shadow-xs"
            >
              <HiOutlinePaperAirplane className="h-5 w-5 rotate-90" />
            </button>
          </form>
        )}
      </div>

      {/* Lightbox xem phóng to Ảnh hoặc Video */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {isVideoUrl(previewMedia) ? (
              <video
                src={previewMedia}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={previewMedia}
                alt="Phóng to"
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <HiOutlineX className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
