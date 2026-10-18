import { HiOutlineX, HiOutlineUpload, HiOutlineCheck } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { isVideoUrl } from '../../../../lib/mediaUtils'

export default function SellerDisputeActionModal({
  activeModal,
  onClose,
  isDark,
  responseNote,
  setResponseNote,
  evidenceUrls,
  removeEvidence,
  handleFileSelect,
  uploadingImage,
  fileInputRef,
  submitting,
  onSubmit,
}) {
  if (!activeModal) return null

  const imageCount = evidenceUrls.filter((u) => !isVideoUrl(u)).length
  const videoCount = evidenceUrls.filter((u) => isVideoUrl(u)).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto',
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900'
        )}
      >
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
          <h4 className="text-base font-bold">
            {activeModal === 'REFUND' && 'Xác Nhận Đồng Ý Hoàn Tiền'}
            {activeModal === 'RETURN' && 'Xác Nhận Nhận Lại Hàng Đổi Trả'}
            {activeModal === 'REJECT' && 'Từ Chối & Chuyển Ban Quản Trị Sàn'}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-white"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          {activeModal === 'REFUND' && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300">
              <p className="font-bold">Lợi ích thương lượng thành công:</p>
              <p className="mt-1">
                Hệ thống sẽ hoàn 100% tiền ký quỹ về ví của Người mua. <strong>Shop KHÔNG bị trừ điểm uy tín</strong> và không bị ghi nhận vi phạm gian hàng.
              </p>
            </div>
          )}

          {activeModal === 'RETURN' && (
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-sky-800 dark:text-sky-300">
              <p className="font-bold">Quy trình đổi trả hàng:</p>
              <p className="mt-1">
                Yêu cầu trả hàng sẽ được khởi tạo. Khách hàng có 3 ngày để nộp mã vận đơn gửi hàng về kho của bạn. Tiền ký quỹ tiếp tục được bảo lưu an toàn.
              </p>
            </div>
          )}

          {activeModal === 'REJECT' && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-800 dark:text-rose-300">
              <p className="font-bold">Chuyển phán quyết lên Ban Quản Trị sàn:</p>
              <p className="mt-1">
                Admin sẽ căn cứ vào mô tả của khách hàng và bằng chứng đối soát do Shop cung cấp bên dưới để đưa ra phán quyết cuối cùng.
              </p>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-stone-700 dark:text-slate-300">
              {activeModal === 'REJECT' ? 'Lý do từ chối (Bắt buộc):' : 'Ghi chú gửi Người mua (Tùy chọn):'}
            </label>
            <textarea
              rows={3}
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={
                activeModal === 'REJECT'
                  ? 'Ví dụ: Shop đã kiểm tra camera đóng hàng tem seal nguyên vẹn, sản phẩm giao đúng mã...'
                  : 'Nhập lời nhắn gửi khách hàng...'
              }
              className={cn(
                'w-full rounded-xl border p-3 text-xs outline-hidden focus:ring-2 focus:ring-amber-500',
                isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
              )}
            />
          </div>

          {/* Upload Bằng Chứng (Đặc biệt quan trọng khi Từ Chối) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700 dark:text-slate-300">
                Tệp bằng chứng của Shop ({imageCount}/4 ảnh • {videoCount}/1 video):
              </span>
              {(imageCount < 4 || videoCount < 1) && (
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700"
                >
                  <HiOutlineUpload className="h-3.5 w-3.5" />
                  <span>{uploadingImage ? 'Đang tải...' : 'Tải ảnh seal / video đóng gói'}</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />

            {evidenceUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {evidenceUrls.map((url, idx) => {
                  const isVid = isVideoUrl(url)
                  return (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 bg-black">
                      {isVid ? (
                        <>
                          <video src={url} className="h-full w-full object-cover" muted />
                          <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-rose-600 text-white uppercase pointer-events-none">
                            Video
                          </span>
                        </>
                      ) : (
                        <img src={url} alt={`Chứng cứ ${idx + 1}`} className="h-full w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeEvidence(idx)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-600 transition z-10"
                      >
                        <HiOutlineX className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3 border-stone-100 dark:border-slate-800">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={submitting || (activeModal === 'REJECT' && !responseNote.trim())}
            onClick={() => {
              if (activeModal === 'REFUND') onSubmit('ACCEPT_REFUND')
              else if (activeModal === 'RETURN') onSubmit('ACCEPT_RETURN')
              else if (activeModal === 'REJECT') onSubmit('REJECT_AND_ESCALATE')
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition-all',
              activeModal === 'REFUND'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : activeModal === 'RETURN'
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : 'bg-rose-600 hover:bg-rose-700',
              (submitting || (activeModal === 'REJECT' && !responseNote.trim())) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <HiOutlineCheck className="h-4 w-4" />
            <span>{submitting ? 'Đang gửi...' : 'Xác Nhận'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
