import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiOutlineTruck,
  HiOutlineExclamation,
  HiOutlinePlay,
  HiOutlineVideoCamera,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import { isVideoUrl } from '../../../../lib/mediaUtils'

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
  const orderReturn = detailModal.data?.detail?.orderReturn

  const parseUrls = (str) => {
    if (!str || typeof str !== 'string') return []
    return str.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const returnImgs = parseUrls(orderReturn?.sellerEvidenceUrls)
  const isReturnDisputed = orderReturn?.status === 'DISPUTED' || Boolean(orderReturn?.conditionStatus)

  const translateConditionStatus = (status) => {
    switch (status) {
      case 'DAMAGED':
        return 'Hàng bị hư hỏng / bể vỡ / trầy xước nặng'
      case 'WRONG_ITEM':
        return 'Gửi sai sản phẩm / tráo hàng khác'
      case 'INCOMPLETE':
        return 'Thiếu phụ kiện / quà tặng kèm theo'
      case 'NOT_RETURNED':
        return 'Hộp rỗng / không có sản phẩm bên trong'
      default:
        return status || 'Hàng hoàn có vấn đề'
    }
  }

  const renderMediaItem = (url, idx, labelPrefix, borderThemeClass = 'border-stone-200 dark:border-slate-800') => {
    const isVid = isVideoUrl(url)
    return (
      <div
        key={idx}
        onClick={() => setPreviewImage(url)}
        className={cn(
          'relative group aspect-square rounded-xl overflow-hidden border bg-stone-900/10 cursor-pointer shadow-xs',
          borderThemeClass,
        )}
        title={isVid ? 'Nhấn để phát video' : 'Nhấn để xem phóng to'}
      >
        {isVid ? (
          <>
            <video src={url} className="h-full w-full object-cover" muted />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-rose-600 text-white tracking-wider shadow-sm flex items-center gap-1 z-10">
              <HiOutlineVideoCamera className="h-3 w-3" />
              Video
            </div>
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
              <div className="p-2 rounded-full bg-white/90 text-stone-900 shadow-md group-hover:scale-110 transition-transform">
                <HiOutlinePlay className="h-4 w-4 fill-current ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <>
            <img
              src={url}
              alt={`${labelPrefix} ${idx + 1}`}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <HiOutlineEye className="h-5 w-5 text-white" />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
                1. Phía Người Mua Khiếu Nại (Giai đoạn 1)
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
                Bằng chứng vi phạm / mở hộp ({evImgs.length} tệp):
              </span>
            </div>

            {evImgs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {evImgs.map((url, idx) =>
                  renderMediaItem(url, idx, 'Bằng chứng Buyer', 'border-rose-200 dark:border-rose-800/80')
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-2">
                Người mua không đính kèm tệp bằng chứng.
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

            {/* Quyết định ban đầu của Shop */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                Phản hồi ban đầu của Shop (Giai đoạn 1):
              </span>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border',
                    sellerAction === 'REJECT_AND_ESCALATE' || sellerAction === 'DISPUTE'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : sellerAction === 'ACCEPT_REFUND'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  )}
                >
                  {sellerAction === 'ACCEPT_REFUND' && 'Đồng ý hoàn tiền ngay'}
                  {sellerAction === 'ACCEPT_RETURN' && 'Đồng ý nhận lại hàng đổi trả'}
                  {(sellerAction === 'REJECT_AND_ESCALATE' || sellerAction === 'DISPUTE') && 'Từ chối & Chuyển BQT phân xử'}
                  {!sellerAction && 'Chưa có phản hồi ban đầu'}
                </span>
              </div>
            </div>

            {/* Lời giải trình ban đầu của Shop */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                Giải trình ban đầu từ Shop:
              </span>
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line',
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                    : 'border-sky-100 bg-white text-stone-800',
                )}
              >
                {sellerResponse || 'Shop chưa để lại lời giải trình chi tiết'}
              </div>
            </div>
          </div>

          {/* Bằng chứng ban đầu từ Shop */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                Ảnh đối soát ban đầu của Shop ({sellerImgs.length} tệp):
              </span>
            </div>

            {sellerImgs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sellerImgs.map((url, idx) =>
                  renderMediaItem(url, idx, 'Chứng cứ Shop', 'border-sky-200 dark:border-sky-800/80')
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-1">
                Shop không tải lên tệp bằng chứng đối soát ban đầu.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KHỐI RIÊNG BIỆT: GIAI ĐOẠN 2 - KHIẾU NẠI KIỆN HÀNG HOÀN TRẢ (NẾU CÓ) */}
      {isReturnDisputed && (
        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 space-y-3.5 shadow-sm',
            isDark
              ? 'border-rose-500/30 bg-rose-500/10 text-white'
              : 'border-rose-200 bg-rose-50/60 text-stone-900',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-rose-200 dark:border-rose-900/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-500">
                <HiOutlineExclamation className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Giai Đoạn 2: Khiếu Nại Kiện Hàng Hoàn Trả Từ Phía Shop
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Phát sinh sau khi Buyer gửi hàng hoàn về kho và Shop kiểm tra kiện hàng.
                </p>
              </div>
            </div>

            {orderReturn?.returnTrackingCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 border-stone-300 dark:border-slate-700 font-mono">
                <HiOutlineTruck className="h-3.5 w-3.5 text-amber-500" />
                Vận đơn hoàn: {orderReturn.returnTrackingCode}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                  Tình trạng kiện hàng do Shop ghi nhận:
                </span>
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-bold border bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30">
                    {translateConditionStatus(orderReturn?.conditionStatus)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                  Chi tiết khiếu nại & mô tả thiệt hại từ Shop:
                </span>
                <div
                  className={cn(
                    'mt-1 p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-line',
                    isDark
                      ? 'border-slate-800 bg-slate-900/90 text-slate-100'
                      : 'border-rose-100 bg-white text-stone-800',
                  )}
                >
                  {orderReturn?.conditionNote || 'Shop chưa cung cấp mô tả chi tiết'}
                </div>
              </div>
            </div>

            {/* Bằng chứng khi nhận kiện hoàn */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Ảnh / Video bằng chứng khui kiện hoàn ({returnImgs.length} tệp):
              </span>

              {returnImgs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {returnImgs.map((url, idx) =>
                    renderMediaItem(url, idx, 'Bằng chứng kiện hoàn', 'border-rose-300 dark:border-rose-800')
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic py-2">
                  Shop không đính kèm tệp bằng chứng kiện hoàn.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
