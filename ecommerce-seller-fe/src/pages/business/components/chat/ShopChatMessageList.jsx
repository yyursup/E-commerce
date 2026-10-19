import {
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiCheck,
  HiX,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

export default function ShopChatMessageList({
  messages,
  loadingMessages,
  currentUser,
  selectedThread,
  isThreadClosed,
  messagesContainerRef,
  hoveredMsgId,
  setHoveredMsgId,
  activeMenuMsgId,
  setActiveMenuMsgId,
  editingMsgId,
  editingContent,
  setEditingContent,
  editInputRef,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteMessage,
  partnerTyping,
  setPreviewMedia,
  isDark,
}) {
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
    >
      {loadingMessages ? (
        <div className="p-8 text-center text-xs opacity-60">Đang tải tin nhắn...</div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-xs opacity-60 leading-relaxed max-w-sm mx-auto">
          Chưa có tin nhắn nào trong phòng chat này. Hãy gửi lời chào đến khách hàng để bắt đầu tư vấn!
        </div>
      ) : (
        messages.map((m) => {
          const isMe =
            (currentUser?.id && String(m.senderId).toLowerCase() === String(currentUser.id).toLowerCase()) ||
            m.senderRole === 'BUSINESS' ||
            m.senderRole === 'ADMIN'
          const isEditing = editingMsgId === String(m.id)
          const isHovered = hoveredMsgId === String(m.id)

          return (
            <div
              key={m.id || m.createdAt}
              className={cn('flex flex-col relative', isMe ? 'items-end' : 'items-start')}
              onMouseEnter={() => setHoveredMsgId(String(m.id))}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              <span className="text-[10px] mb-0.5 px-1 opacity-60">
                {isMe ? 'Bạn (Chủ shop)' : (m.senderName || 'Khách hàng')} • {formatTime(m.createdAt)}
                {m.editedAt && ' (đã sửa)'}
              </span>

              {isEditing ? (
                <div className="flex w-full max-w-[85%] sm:max-w-[60%] gap-1.5">
                  <input
                    ref={editInputRef}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/30',
                      isDark ? 'border-slate-600 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                    )}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                    title="Lưu"
                  >
                    <HiCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl border',
                      isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-stone-300 hover:bg-stone-100'
                    )}
                    title="Hủy"
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-1.5 max-w-[85%] sm:max-w-[65%]',
                    isMe ? 'flex-row' : 'flex-row-reverse'
                  )}
                >
                  {/* Messenger-style 3-dots action menu for seller */}
                  {isMe && !m.isDeleted && !isThreadClosed && selectedThread?.type !== 'DISPUTE' && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuMsgId(activeMenuMsgId === String(m.id) ? null : String(m.id))
                        }}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full transition',
                          activeMenuMsgId === String(m.id)
                            ? isDark ? 'bg-slate-700 text-white' : 'bg-stone-200 text-stone-800'
                            : isHovered ? 'opacity-100' : 'opacity-0'
                        )}
                        title="Tùy chọn tin nhắn"
                      >
                        <HiOutlineDotsVertical className="h-4 w-4" />
                      </button>

                      {activeMenuMsgId === String(m.id) && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'absolute bottom-full right-0 mb-1 z-30 w-32 rounded-xl border p-1 shadow-lg backdrop-blur-md',
                            isDark
                              ? 'border-slate-700 bg-slate-800/95 text-slate-100 shadow-black/50'
                              : 'border-stone-200 bg-white/95 text-stone-800 shadow-stone-300/50'
                          )}
                        >
                          {m.messageType === 'TEXT' && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(m)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                              )}
                            >
                              <HiOutlinePencil className="h-3.5 w-3.5 text-amber-500" />
                              Chỉnh sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition',
                              isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                            )}
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Xóa tin nhắn
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'rounded-2xl text-xs break-words shadow-xs overflow-hidden',
                      isMe
                        ? 'bg-amber-500 text-white rounded-tr-none'
                        : isDark
                          ? 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                          : 'bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200/80',
                      m.messageType === 'IMAGE' || m.messageType === 'VIDEO' ? 'p-1' : 'px-3.5 py-2.5'
                    )}
                  >
                    {m.isDeleted ? (
                      <span className="italic opacity-60 flex items-center gap-1">
                        <HiOutlineTrash className="h-3.5 w-3.5" />
                        Tin nhắn đã bị thu hồi
                      </span>
                    ) : m.messageType === 'IMAGE' && m.imageUrl ? (
                      <div
                        className="cursor-pointer group relative overflow-hidden rounded-xl max-w-xs"
                        onClick={() => setPreviewMedia({ url: m.imageUrl, type: 'image' })}
                      >
                        <img
                          src={m.imageUrl}
                          alt="Ảnh gửi"
                          className="max-h-64 rounded-xl object-cover transition duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                          Bấm để phóng to
                        </div>
                      </div>
                    ) : m.messageType === 'VIDEO' && m.videoUrl ? (
                      <div className="max-w-xs overflow-hidden rounded-xl">
                        <video
                          src={m.videoUrl}
                          controls
                          className="max-h-64 rounded-xl object-cover bg-black"
                        />
                      </div>
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {partnerTyping && (
        <div className="flex items-center gap-2 text-xs opacity-60">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-100" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce delay-200" />
          </span>
          <span>Khách hàng đang gõ...</span>
        </div>
      )}
    </div>
  )
}
