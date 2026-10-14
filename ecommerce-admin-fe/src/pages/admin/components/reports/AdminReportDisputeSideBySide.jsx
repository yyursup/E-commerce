import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineEye,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'

export default function AdminReportDisputeSideBySide({
  detailModal,
  evImgs = [],
  sellerImgs = [],
  isDark,
  setPreviewImage,
}) {
  const sellerAction = detailModal.data?.detail?.sellerAction
  const sellerResponse = detailModal.data?.detail?.sellerResponse
  const buyerDesc = detailModal.data?.description || detailModal.rawItem?.description || 'Không có mô tả chi tiết'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 flex items-center gap-1.5">
          <HiOutlineShieldCheck className="h-4 w-4 text-amber-500" />
          Hồ sơ đối chất 2 phía (Thương lượng & Bằng chứng):
        </label>
        <span className="text-[11px] text-stone-400">
          BQT đối soát chéo bằng chứng trước khi phán quyết
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CỘT 1: PHÍA NGƯỜI MUA (BUYER) */}
        <div
          className={cn(
            'rounded-2xl border p-4 flex flex-col justify-between space-y-3',
            isDark
              ? 'border-rose-500/20 bg-rose-500/5'
              : 'border-rose-200 bg-rose-50/50',
          )}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-rose-200/60 dark:border-rose-900/60">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <HiOutlineExclamationCircle className="h-4 w-4" />
                1. Phía Người Mua Khiếu Nại
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                Người tố cáo
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                Lý do & Mô tả vi phạm:
              </span>
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs leading-relaxed max-h-36 overflow-y-auto',
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                    : 'border-rose-100 bg-white text-stone-800',
                )}
              >
                {buyerDesc}
              </div>
            </div>
          </div>

          {/* Bằng chứng vi phạm từ Buyer */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Bằng chứng vi phạm / mở hộp ({evImgs.length}/4 tệp):
              </span>
            </div>

            {evImgs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {evImgs.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(imgUrl)}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800/80 bg-stone-900/10 cursor-pointer shadow-xs"
                    title="Nhấn để xem phóng to"
                  >
                    <img
                      src={imgUrl}
                      alt={`Bằng chứng Buyer ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <HiOutlineEye className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-2">
                Người mua không đính kèm ảnh bằng chứng.
              </p>
            )}
          </div>
        </div>

        {/* CỘT 2: PHÍA NGƯỜI BÁN (SELLER) */}
        <div
          className={cn(
            'rounded-2xl border p-4 flex flex-col justify-between space-y-3',
            isDark
              ? 'border-sky-500/20 bg-sky-500/5'
              : 'border-sky-200 bg-sky-50/50',
          )}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-sky-200/60 dark:border-sky-900/60">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <HiOutlineShoppingBag className="h-4 w-4" />
                2. Phía Người Bán (Shop)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                Bị tố cáo
              </span>
            </div>

            {/* Quyết định/Hành động của Shop */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                Hành động của Shop:
              </span>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border',
                    sellerAction === 'REJECT_AND_ESCALATE'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : sellerAction === 'ACCEPT_REFUND'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  )}
                >
                  {sellerAction === 'ACCEPT_REFUND' && 'Đồng ý hoàn tiền'}
                  {sellerAction === 'ACCEPT_RETURN' && 'Đồng ý nhận lại hàng đổi trả'}
                  {sellerAction === 'REJECT_AND_ESCALATE' && 'Từ chối & Khiếu nại lên BQT'}
                  {!sellerAction && 'Chưa có phản hồi'}
                </span>
              </div>
            </div>

            {/* Lời trần tình của Shop */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                Giải trình từ Shop:
              </span>
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line',
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                    : 'border-sky-100 bg-white text-stone-800',
                )}
              >
                {sellerResponse || 'Shop chưa để lại lời giải trình chi tiết'}
              </div>
            </div>
          </div>

          {/* Bằng chứng đóng gói / test seal từ Shop */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                Ảnh đóng gói / test do Shop cung cấp ({sellerImgs.length}/4 tệp):
              </span>
            </div>

            {sellerImgs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sellerImgs.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(imgUrl)}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-sky-200 dark:border-sky-800/80 bg-stone-900/10 cursor-pointer shadow-xs"
                    title="Nhấn để xem phóng to"
                  >
                    <img
                      src={imgUrl}
                      alt={`Chứng cứ Shop ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <HiOutlineEye className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-2">
                Shop không tải lên ảnh bằng chứng đối soát.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
