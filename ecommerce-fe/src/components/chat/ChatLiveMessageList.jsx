import {
  HiDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiCheck,
  HiX,
  HiOutlineShoppingBag,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'

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

export default function ChatLiveMessageList({
  liveMessages,
  liveLoading,
  user,
  activeShop,
  adminTyping,
  editingMsgId,
  editingContent,
  setEditingContent,
  editInputRef,
  hoveredMsgId,
  setHoveredMsgId,
  activeMenuMsgId,
  setActiveMenuMsgId,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteMsg,
  setPreviewMedia,
  scrollToBottom,
  liveContainerRef,
  isDark,
}) {
  return (
    <div ref={liveContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {liveLoading ? (
        <div className="p-8 text-center text-xs opacity-60">Đang tải lịch sử hỗ trợ...</div>
      ) : liveMessages.length === 0 ? (
        <div className="p-6 text-center text-xs opacity-60 leading-relaxed">
          Chào {user?.username || user?.email || 'bạn'}! Bạn đang kết nối với kênh hỗ trợ trực tuyến. Hãy gửi tin nhắn hoặc hình ảnh, nhân viên sẽ phản hồi bạn ngay.
        </div>
      ) : (
        liveMessages.map((m) => {
          const isMe = user?.id && String(m.senderId).toLowerCase() === String(user.id).toLowerCase()
          const senderDisplayName = isMe ? 'Bạn' : (activeShop?.name || m.senderName || 'Người bán')
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
                {senderDisplayName} • {formatTime(m.createdAt)}{m.editedAt && ' (đã sửa)'}
              </span>

              {isEditing ? (
                <div className="flex w-full max-w-[85%] gap-1">
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
                  >
                    <HiCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl border',
                      isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-stone-300 hover:bg-stone-100'
                    )}
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className={cn('flex items-center gap-1.5 max-w-[85%]', isMe ? 'flex-row' : 'flex-row-reverse')}>
                  {/* Messenger 3-dots action button */}
                  {isMe && !m.isDeleted && (
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
                            ? (isDark ? 'bg-slate-700 text-white' : 'bg-stone-200 text-stone-800')
                            : (isHovered ? 'opacity-100' : 'opacity-0'),
                          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-stone-200 text-stone-500'
                        )}
                        title="Tùy chọn tin nhắn"
                      >
                        <HiDotsVertical className="h-4 w-4" />
                      </button>

                      {/* Popover menu */}
                      {activeMenuMsgId === String(m.id) && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'absolute bottom-full mb-1.5 z-40 min-w-[130px] rounded-xl border p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95',
                            isMe ? 'right-0' : 'left-0',
                            isDark
                              ? 'border-slate-700 bg-slate-800/95 text-slate-200 shadow-black/40'
                              : 'border-stone-200 bg-white/95 text-stone-800 shadow-stone-400/25'
                          )}
                        >
                          {m.messageType === 'TEXT' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuMsgId(null)
                                handleStartEdit(m)
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left',
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                              )}
                            >
                              <HiOutlinePencil className="h-3.5 w-3.5" />
                              <span>Chỉnh sửa</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuMsgId(null)
                              handleDeleteMsg(m.id)
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left text-rose-600 dark:text-rose-400',
                              isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                            )}
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            <span>Xóa tin nhắn</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      isMe
                        ? 'rounded-tr-xs bg-amber-500 text-white'
                        : isDark
                          ? 'rounded-tl-xs bg-slate-800 text-slate-100 border border-slate-700'
                          : 'rounded-tl-xs bg-stone-100 text-stone-900 border border-stone-200',
                      (m.messageType === 'IMAGE' || m.messageType === 'VIDEO') && 'p-1.5 overflow-hidden',
                      m.isDeleted && 'opacity-50 italic',
                    )}
                  >
                    {m.messageType === 'IMAGE' ? (
                      <div className="space-y-1">
                        <img
                          src={m.imageUrl}
                          alt="Ảnh"
                          onLoad={() => scrollToBottom?.(false)}
                          onClick={() => setPreviewMedia({ url: m.imageUrl, type: 'image' })}
                          className="max-h-44 max-w-full rounded-xl object-contain cursor-pointer transition hover:opacity-90 shadow-sm"
                        />
                        {m.content && m.content !== '[Hình ảnh]' && (
                          <p className="px-2 py-1 text-xs whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                    ) : m.messageType === 'VIDEO' ? (
                      <video
                        src={m.videoUrl}
                        controls
                        onLoadedData={() => scrollToBottom?.(false)}
                        className="max-h-44 max-w-full rounded-xl object-contain shadow-sm"
                      />
                    ) : m.content && m.content.startsWith('[Sản phẩm #') ? (
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-90">
                          <HiOutlineShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                          <span>Thông tin sản phẩm</span>
                        </div>
                        <div
                          className={cn(
                            'rounded-xl p-2.5 border text-xs',
                            isDark
                              ? 'border-slate-700 bg-slate-900/60 text-slate-100'
                              : 'border-stone-200 bg-white/90 text-stone-900'
                          )}
                        >
                          <p className="font-semibold line-clamp-2 leading-tight">
                            {m.content.split('\n')[0].replace(/^\[Sản phẩm #\d+\]\s*/, '')}
                          </p>
                          {m.content.includes('Giá:') && (
                            <p className="mt-1 font-bold text-amber-500">
                              {m.content.split('Giá:')[1]?.split('\n')[0]?.trim()}
                            </p>
                          )}
                          {m.content.includes('Xem tại:') && (
                            <a
                              href={m.content.split('Xem tại:')[1]?.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:underline"
                            >
                              <span>Xem chi tiết sản phẩm</span>
                              <HiOutlineExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {adminTyping && (
        <div className="flex items-center gap-1.5 text-xs opacity-60 px-2 py-1">
          <span className="animate-bounce">●</span>
          <span className="animate-bounce [animation-delay:0.2s]">●</span>
          <span className="animate-bounce [animation-delay:0.4s]">●</span>
          <span>Nhân viên hỗ trợ đang soạn tin...</span>
        </div>
      )}
    </div>
  )
}
