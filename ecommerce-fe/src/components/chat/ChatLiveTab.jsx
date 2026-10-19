import { useState, useRef, useEffect } from 'react'
import { HiOutlineUserGroup, HiX } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useChatStore } from '../../store/useChatStore'
import chatService from '../../services/chatService'
import { sendWebSocketMessage } from '../../services/websocketService'
import toast from 'react-hot-toast'

// Sub-components
import ChatLiveMessageList from './ChatLiveMessageList'
import ChatLiveInputBar from './ChatLiveInputBar'

function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

export default function ChatLiveTab({
  token,
  user,
  activeShop,
  activeProduct,
  supportThread,
  liveMessages,
  setLiveMessages,
  liveLoading,
  adminTyping,
  isLiveClosed,
  liveCloseReason,
  initLiveChat,
  setPreviewMedia,
  scrollToBottom,
  closeChat,
  liveContainerRef,
  isDark,
}) {
  const [liveInputValue, setLiveInputValue] = useState('')
  const [liveSending, setLiveSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMediaPopover, setShowMediaPopover] = useState(false)

  const [editingMsgId, setEditingMsgId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [hoveredMsgId, setHoveredMsgId] = useState(null)
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)

  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const liveInputRef = useRef(null)
  const editInputRef = useRef(null)

  // Click outside to close message options menu
  useEffect(() => {
    const handleDocClick = () => {
      setActiveMenuMsgId(null)
    }
    if (activeMenuMsgId) {
      document.addEventListener('click', handleDocClick)
      return () => document.removeEventListener('click', handleDocClick)
    }
  }, [activeMenuMsgId])

  // Handle Send Live Chat message
  const handleLiveSend = async (e) => {
    e?.preventDefault()
    const content = liveInputValue.trim()
    const threadId = supportThread?.id
    if (!content || liveSending || isLiveClosed) return

    if (!threadId) {
      toast.error('Đang kết nối lại phòng chat, vui lòng thử lại sau giây lát...')
      initLiveChat?.()
      return
    }

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      threadId: threadId,
      senderId: user?.id,
      senderName: user?.username || user?.email || 'Khách hàng',
      senderRole: 'CUSTOMER',
      content,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    }

    try {
      setLiveSending(true)
      setLiveMessages((prev) => [...prev, optimisticMsg])
      setLiveInputValue('')

      const sentViaWs = sendWebSocketMessage('CHAT_SEND', {
        threadId: threadId,
        content,
      })

      if (!sentViaWs) {
        const newMsg = await chatService.sendMessage(threadId, content)
        setLiveMessages((prev) => {
          const next = prev.filter((m) => m.id !== tempId)
          return [...next, newMsg]
        })
      }

      sendWebSocketMessage('CHAT_TYPING', {
        threadId: threadId,
        isTyping: false,
      })
    } catch (err) {
      console.error('Lỗi gửi tin nhắn live chat:', err)
      setLiveMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setLiveSending(false)
    }
  }

  const handleLiveInputChange = (e) => {
    const val = e.target.value
    setLiveInputValue(val)
    const threadId = supportThread?.id
    if (threadId) {
      sendWebSocketMessage('CHAT_TYPING', {
        threadId,
        isTyping: val.length > 0,
      })
    }
  }

  // Handle Live Chat Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    const threadId = supportThread?.id
    if (!file || liveSending || isLiveClosed) return
    if (!threadId) {
      toast.error('Đang kết nối lại phòng chat, vui lòng thử lại sau...')
      initLiveChat?.()
      return
    }
    try {
      setLiveSending(true)
      const newMsg = await chatService.sendImage(threadId, file)
      setLiveMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.imageUrl && prev.some((m) => m.imageUrl === newMsg.imageUrl)) return prev
        return [...prev, newMsg]
      })
    } catch (err) {
      console.error('Lỗi tải ảnh:', err)
    } finally {
      setLiveSending(false)
    }
  }

  // Handle Live Chat Video Upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (videoInputRef.current) videoInputRef.current.value = ''
    const threadId = supportThread?.id
    if (!file || liveSending || isLiveClosed) return
    if (!threadId) {
      toast.error('Đang kết nối lại phòng chat, vui lòng thử lại sau...')
      initLiveChat?.()
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Video tối đa 50MB')
      return
    }
    try {
      setLiveSending(true)
      const newMsg = await chatService.sendVideo(threadId, file)
      setLiveMessages((prev) => {
        if (!newMsg) return prev
        if (prev.some((m) => String(m.id).toLowerCase() === String(newMsg.id).toLowerCase())) return prev
        if (newMsg.videoUrl && prev.some((m) => m.videoUrl === newMsg.videoUrl)) return prev
        return [...prev, newMsg]
      })
    } catch (err) {
      console.error('Lỗi tải video:', err)
    } finally {
      setLiveSending(false)
    }
  }

  // Handle select emoji
  const handleSelectEmoji = (emoji) => {
    const input = liveInputRef.current
    if (input) {
      const start = input.selectionStart ?? liveInputValue.length
      const end = input.selectionEnd ?? liveInputValue.length
      const nextVal = liveInputValue.substring(0, start) + emoji + liveInputValue.substring(end)
      setLiveInputValue(nextVal)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setLiveInputValue((prev) => prev + emoji)
    }
  }

  // Handle send product card info to chat
  const handleSendProductCard = async () => {
    if (!activeProduct) return
    const threadId = supportThread?.id
    if (liveSending) return
    if (!threadId) {
      toast.error('Đang kết nối lại phòng chat, vui lòng thử lại sau...')
      initLiveChat?.()
      return
    }

    const productMsg = `[Sản phẩm #${activeProduct.id}] ${activeProduct.name}\nGiá: ${formatPrice(activeProduct.price)}\nXem tại: ${window.location.origin}/products/${activeProduct.id}`

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      threadId: threadId,
      senderId: user?.id,
      senderName: user?.username || user?.email || 'Khách hàng',
      senderRole: 'CUSTOMER',
      content: productMsg,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    }

    try {
      setLiveSending(true)
      setLiveMessages((prev) => [...prev, optimisticMsg])

      const sentViaWs = sendWebSocketMessage('CHAT_SEND', {
        threadId: threadId,
        content: productMsg,
      })

      if (!sentViaWs) {
        const newMsg = await chatService.sendMessage(threadId, productMsg)
        setLiveMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)))
      }

      useChatStore.getState().openShopChat(activeShop, null)
    } catch (err) {
      console.error('Lỗi gửi thông tin sản phẩm:', err)
      setLiveMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setLiveSending(false)
    }
  }

  // Handle Edit Message
  const handleStartEdit = (m) => {
    setEditingMsgId(String(m.id))
    setEditingContent(m.content)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const handleSaveEdit = async () => {
    if (!editingMsgId || !editingContent.trim()) return
    try {
      const updated = await chatService.editMessage(editingMsgId, editingContent.trim())
      setLiveMessages((prev) => prev.map((m) => String(m.id) === editingMsgId ? updated : m))
    } catch (err) {
      console.error('Lỗi sửa tin nhắn:', err)
    } finally {
      setEditingMsgId(null)
      setEditingContent('')
    }
  }

  const handleCancelEdit = () => {
    setEditingMsgId(null)
    setEditingContent('')
  }

  // Handle Delete Message
  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return
    try {
      await chatService.deleteMessage(msgId)
      setLiveMessages((prev) =>
        prev.map((m) => String(m.id) === String(msgId) ? { ...m, isDeleted: true, content: '[Tin nhắn đã bị xóa]' } : m)
      )
    } catch (err) {
      console.error('Lỗi xóa tin nhắn:', err)
    }
  }

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-3">
          <HiOutlineUserGroup className="h-7 w-7" />
        </div>
        <h4 className="font-bold text-sm">Yêu cầu đăng nhập</h4>
        <p className="mt-1 text-xs opacity-70 leading-relaxed max-w-xs">
          Vui lòng đăng nhập vào tài khoản để trò chuyện trực tiếp với nhân viên hỗ trợ và lưu lịch sử cuộc hội thoại.
        </p>
        <Link
          to="/login"
          onClick={closeChat}
          className="mt-4 inline-flex rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Live messages container */}
      <ChatLiveMessageList
        liveMessages={liveMessages}
        liveLoading={liveLoading}
        user={user}
        activeShop={activeShop}
        adminTyping={adminTyping}
        editingMsgId={editingMsgId}
        editingContent={editingContent}
        setEditingContent={setEditingContent}
        editInputRef={editInputRef}
        hoveredMsgId={hoveredMsgId}
        setHoveredMsgId={setHoveredMsgId}
        activeMenuMsgId={activeMenuMsgId}
        setActiveMenuMsgId={setActiveMenuMsgId}
        handleStartEdit={handleStartEdit}
        handleSaveEdit={handleSaveEdit}
        handleCancelEdit={handleCancelEdit}
        handleDeleteMsg={handleDeleteMsg}
        setPreviewMedia={setPreviewMedia}
        scrollToBottom={scrollToBottom}
        liveContainerRef={liveContainerRef}
        isDark={isDark}
      />

      {/* Active Product Bar (TikTok Shop style context) */}
      {activeProduct && (
        <div
          className={cn(
            'flex items-center gap-2.5 border-t px-3 py-2 text-xs transition-colors shrink-0',
            isDark ? 'border-slate-800 bg-slate-800/90' : 'border-amber-200/60 bg-amber-50/90'
          )}
        >
          {activeProduct.image && (
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="h-10 w-10 rounded-lg object-cover border border-amber-500/30 shrink-0 shadow-xs"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold truncate leading-tight', isDark ? 'text-slate-100' : 'text-stone-900')}>
              {activeProduct.name}
            </p>
            <p className="mt-0.5 text-amber-600 dark:text-amber-400 font-bold">
              {formatPrice(activeProduct.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendProductCard}
            disabled={liveSending}
            className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition active:scale-95 disabled:opacity-50"
          >
            Gửi sản phẩm
          </button>
          <button
            type="button"
            onClick={() => useChatStore.getState().openShopChat(activeShop, null)}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-200/50 hover:text-stone-600 dark:hover:bg-slate-700 dark:hover:text-white transition"
            title="Bỏ qua sản phẩm"
          >
            <HiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Live input bar with Media Popover and Emoji Picker */}
      <ChatLiveInputBar
        isLiveClosed={isLiveClosed}
        liveCloseReason={liveCloseReason}
        activeShop={activeShop}
        liveInputValue={liveInputValue}
        handleLiveInputChange={handleLiveInputChange}
        handleLiveSend={handleLiveSend}
        liveSending={liveSending}
        fileInputRef={fileInputRef}
        videoInputRef={videoInputRef}
        liveInputRef={liveInputRef}
        handleImageUpload={handleImageUpload}
        handleVideoUpload={handleVideoUpload}
        showMediaPopover={showMediaPopover}
        setShowMediaPopover={setShowMediaPopover}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        handleSelectEmoji={handleSelectEmoji}
        isDark={isDark}
      />
    </>
  )
}
