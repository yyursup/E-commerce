import {
  HiOutlineLockClosed,
  HiPlus,
  HiOutlineEmojiHappy,
  HiOutlinePaperAirplane,
} from 'react-icons/hi'
import { cn } from '../../lib/cn'
import EmojiPickerPopover from '../EmojiPickerPopover'
import MediaUploadPopover from '../MediaUploadPopover'

export default function ChatLiveInputBar({
  isLiveClosed,
  liveCloseReason,
  activeShop,
  liveInputValue,
  handleLiveInputChange,
  handleLiveSend,
  liveSending,
  fileInputRef,
  videoInputRef,
  liveInputRef,
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
    <div className="relative shrink-0">
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

      <EmojiPickerPopover
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
        align="left"
      />

      {/* Footer Input Bar hoặc Banner Đóng Phòng */}
      {isLiveClosed ? (
        <div
          className={cn(
            'p-3 border-t flex items-center justify-between gap-2 text-xs select-none',
            isDark ? 'border-slate-800 bg-slate-850 text-slate-300' : 'border-stone-200 bg-stone-100 text-stone-700'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <HiOutlineLockClosed className="h-4 w-4 text-stone-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-[11px] truncate">Cuộc hội thoại đã đóng</p>
              <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                Lý do: {liveCloseReason}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-stone-400 dark:text-slate-500 italic shrink-0">Chỉ đọc</span>
        </div>
      ) : (
        <form
          onSubmit={handleLiveSend}
          className={cn(
            'flex items-center gap-2 border-t p-2.5',
            isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50',
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            className="hidden"
          />

          {/* Plus (+) Button for Media Options (Ảnh / Video) */}
          <button
            type="button"
            onClick={() => {
              setShowMediaPopover((prev) => !prev)
              setShowEmojiPicker(false)
            }}
            disabled={liveSending}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
              showMediaPopover
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100',
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
            disabled={liveSending}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95',
              showEmojiPicker
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100',
            )}
            title="Chèn biểu cảm Emoji"
          >
            <HiOutlineEmojiHappy className="h-5 w-5" />
          </button>

          <input
            ref={liveInputRef}
            type="text"
            value={liveInputValue}
            onChange={handleLiveInputChange}
            placeholder={activeShop ? `Gửi tin nhắn...` : 'Nhắn tin cho nhân viên...'}
            disabled={liveSending}
            className={cn(
              'flex-1 rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50',
            )}
          />

          <button
            type="submit"
            disabled={!liveInputValue.trim() || liveSending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
            title="Gửi"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  )
}
