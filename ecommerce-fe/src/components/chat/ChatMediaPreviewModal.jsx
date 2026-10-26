import { HiX } from 'react-icons/hi'

export default function ChatMediaPreviewModal({ previewMedia, onClose }) {
  if (!previewMedia) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
    >
      <div className="relative max-h-[90vh] max-w-[90vw]">
        {previewMedia.type === 'video' ? (
          <video
            src={previewMedia.url}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={previewMedia.url}
            alt="Xem ảnh"
            className="max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 shadow hover:bg-stone-200"
        >
          <HiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
