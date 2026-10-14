import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineExternalLink } from 'react-icons/hi'

export default function AdminReportImageLightbox({
  previewImage,
  setPreviewImage,
}) {
  return (
    <AnimatePresence>
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[88vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex flex-col"
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all inline-flex items-center gap-1"
                title="Mở tab mới"
              >
                <HiOutlineExternalLink className="h-4 w-4" />
                Mở ảnh gốc
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm transition-all"
                title="Đóng xem ảnh"
              >
                <HiOutlineX className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Phóng to ảnh bằng chứng"
              className="max-h-[82vh] max-w-full object-contain mx-auto"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
