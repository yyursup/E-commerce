import { HiOutlineLockClosed, HiPlus, HiOutlineEmojiHappy, HiOutlinePaperAirplane } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import EmojiPickerPopover from '../../../../components/EmojiPickerPopover'
import MediaUploadPopover from '../../../../components/MediaUploadPopover'

export default function ShopChatInputBar({
  isThreadClosed,
  closeReasonText,
  selectedThread,
  replyText,
  handleInputChange,
  handleSend,
  sending,
  fileInputRef,
  videoInputRef,
  textInputRef,
  handleImageUpload,
  handleVideoUpload,
  showMediaPopover,
  setShowMediaPopover,
  showEmojiPicker,
  setShowEmojiPicker,
  handleSelectEmoji,
  isDark,
}) {
  return (
    <div className="relative">
      {/* Media Popover (+ button) */}
      <MediaUploadPopover
        isOpen={showMediaPopover}
        onClose={() => setShowMediaPopover(false)}
        onPickImage={() => {
          setShowMediaPopover(false)
          fileInputRef.current?.click()
        }}
        onPickVideo={() => {
          setShowMediaPopover(false)
          videoInputRef.current?.click()
        }}
        align="left"
      />

      {/* Emoji Popover */}
      <EmojiPickerPopover
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
        align="left"
      />

      {/* Footer Input Bar hoặc Banner Đóng Phòng */}
      {isThreadClosed ? (
        <div
          className={cn(
            'p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 select-none animate-in fade-in duration-150',
            isDark
              ? 'border-slate-850 bg-slate-900/95 text-slate-300'
              : 'border-stone-200 bg-stone-100/90 text-stone-700'
          )}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300 shadow-xs">
              <HiOutlineLockClosed className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold flex items-center gap-2 text-stone-900 dark:text-white">
                <span>{selectedThread?.type === 'DISPUTE' ? 'Phòng thương lượng tranh chấp đã đóng' : 'Cuộc hội thoại đã đóng'}</span>
                <span className="rounded-md bg-stone-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-slate-400 border border-stone-300/60 dark:border-slate-700">
                  Chỉ đọc (Read-only)
                </span>
              </p>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                Lý do: {closeReasonText}.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-stone-400 dark:text-slate-500 italic shrink-0 self-end sm:self-center">
            Không thể gửi thêm tin nhắn
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className={cn(
            'flex items-center gap-2 border-t p-3',
            isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50'
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />

          {/* Plus (+) Button for Media Options (Ảnh / Video) */}
          <button
            type="button"
            onClick={() => {
              setShowMediaPopover((prev) => !prev)
              setShowEmojiPicker(false)
            }}
            disabled={sending}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
              showMediaPopover
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            )}
            title="Đính kèm ảnh hoặc video"
          >
            <HiPlus className={cn('h-5 w-5 transition-transform duration-200', showMediaPopover && 'rotate-45')} />
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev)
              setShowMediaPopover(false)
            }}
            disabled={sending}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
              showEmojiPicker
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            )}
            title="Chèn biểu cảm Emoji"
          >
            <HiOutlineEmojiHappy className="h-5 w-5" />
          </button>

          <input
            ref={textInputRef}
            type="text"
            value={replyText}
            onChange={handleInputChange}
            placeholder="Nhập câu trả lời tư vấn cho khách hàng..."
            disabled={sending}
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50'
            )}
          />

          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
            title="Gửi câu trả lời"
          >
            <HiOutlinePaperAirplane className="h-5 w-5" />
          </button>
        </form>
      )}
    </div>
  )
}
