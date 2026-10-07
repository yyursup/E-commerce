import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineX,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import AdminEscrowOrderSection from './AdminEscrowOrderSection'
import AdminEscrowReturnSection from './AdminEscrowReturnSection'
import AdminEscrowSettlementCard from './AdminEscrowSettlementCard'

export default function AdminEscrowDetailModal({
  escrowDetailModal,
  setEscrowDetailModal,
  isDark,
  formatVND,
  copyToClipboard,
  setActionModal,
}) {
  const [previewImage, setPreviewImage] = useState(null)

  const { isOpen, loading, item, order, returnDetails } = escrowDetailModal
  if (!isOpen) return null

  const isReturnDisputed = returnDetails && returnDetails.status === 'DISPUTED'
  const isReturnActiveNotDisputed =
    returnDetails &&
    returnDetails.status !== 'DISPUTED' &&
    returnDetails.status !== 'COMPLETED' &&
    returnDetails.status !== 'CANCELLED'
  const isReturnEnded =
    returnDetails && (returnDetails.status === 'COMPLETED' || returnDetails.status === 'CANCELLED')
  const hasNoReturn = !returnDetails

  // Dữ liệu dòng tiền & Settlement
  const totalAmount = Number(item?.amount || order?.total || 0)
  const commission = Number(item?.commissionFee || totalAmount * 0.05)
  const netSeller = Number(item?.netAmount || totalAmount - commission)

  const settlement =
    item?.settlement ||
    item?.settlementInfo ||
    returnDetails?.settlement ||
    order?.returnInfo?.settlement
  const hasSettlement = settlement && settlement.settlementType

  // Kiểm tra đơn đã hoàn tiền (Refunded) hoặc đã giải ngân (Released)
  const isRefunded =
    item?.status === 'REFUNDED' ||
    order?.status === 'REFUNDED' ||
    (returnDetails?.status === 'COMPLETED' &&
      (!hasSettlement || settlement?.settlementType === 'FULL_REFUND'))
  const isReleased =
    item?.status === 'RELEASED' ||
    (returnDetails?.status === 'COMPLETED' && settlement?.settlementType === 'FULL_RELEASE')

  const effectiveCommission = hasSettlement
    ? Number(settlement.commissionAmount || 0)
    : isRefunded
      ? 0
      : commission
  const effectiveBuyerRefund = hasSettlement
    ? Number(settlement.buyerRefundAmount || 0)
    : isRefunded
      ? totalAmount
      : 0
  const effectiveSellerRelease = hasSettlement
    ? Number(settlement.sellerReleaseAmount || 0)
    : isRefunded
      ? 0
      : netSeller
  const effectiveBuyerPct = hasSettlement
    ? settlement.buyerPercentage || 0
    : isRefunded
      ? 100
      : 0
  const effectiveSellerPct = hasSettlement
    ? settlement.sellerPercentage || 0
    : isRefunded
      ? 0
      : totalAmount > 0
        ? Math.round((netSeller / totalAmount) * 100)
        : 95

  let settlementHeaderTitle = ''
  if (settlement?.settlementType === 'PARTIAL_SPLIT') {
    settlementHeaderTitle = `Phân Xử Chia Tiền: Khách ${effectiveBuyerPct}% — Shop ${effectiveSellerPct}%`
  } else if (isRefunded || settlement?.settlementType === 'FULL_REFUND') {
    settlementHeaderTitle = `Đã Hoàn Tiền Cho Người Mua (${formatVND(effectiveBuyerRefund)})`
  } else if (isReleased || settlement?.settlementType === 'FULL_RELEASE') {
    settlementHeaderTitle = `Đã Giải Ngân Cho Shop (${formatVND(effectiveSellerRelease)})`
  } else if (item?.status === 'DISPUTED') {
    settlementHeaderTitle = 'Đang Tranh Chấp Ký Quỹ (Disputed)'
  } else {
    settlementHeaderTitle = 'Đang Ký Quỹ Tạm Giữ (Held)'
  }

  // Admin chỉ được xử lý ký quỹ trực tiếp khi Return đang DISPUTED
  const canAdminSettle = (item?.status === 'HELD' || item?.status === 'DISPUTED') && isReturnDisputed

  let settlementBlockReason = ''
  if (item?.status !== 'HELD' && item?.status !== 'DISPUTED') {
    settlementBlockReason = isRefunded
      ? `Khoản tiền ${formatVND(effectiveBuyerRefund)} đã được hoàn trả thành công về ví Người mua.`
      : `Khoản ký quỹ ${formatVND(effectiveSellerRelease)} đã được giải ngân thành công cho gian hàng.`
  } else if (hasNoReturn) {
    settlementBlockReason =
      'Đơn hàng chưa phát sinh kiện hoàn trả. Nếu đây là Báo cáo vi phạm (Report), Admin vui lòng duyệt tại tab "Báo cáo vi phạm" để kích hoạt thời hạn 72h cho Shop kháng cáo trước khi hệ thống tự động hoàn tiền.'
  } else if (isReturnActiveNotDisputed) {
    settlementBlockReason = `Kiện hàng hoàn đang trong tiến trình xử lý (${
      returnDetails.status === 'WAITING_FOR_SHIPMENT'
        ? 'Chờ khách gửi'
        : returnDetails.status === 'SHIPPED'
          ? 'Đang giao'
          : 'Đang trong 72h Shop kiểm hàng'
    }). Admin chỉ can thiệp ký quỹ khi Shop khiếu nại kiện hoàn (DISPUTED).`
  } else if (isReturnEnded) {
    settlementBlockReason = isRefunded
      ? `Quy trình trả hàng đã hoàn tất: Toàn bộ ${formatVND(effectiveBuyerRefund)} đã được hoàn về ví Người mua.`
      : 'Quy trình hoàn hàng đã kết thúc. Không thể thao tác lại ký quỹ.'
  }

  const isVideoUrl = (url) => {
    if (!url) return false
    return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col',
            isDark
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-white border-stone-200 text-stone-900',
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between dark:border-slate-800 border-stone-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                <HiOutlineCash className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base">Hồ Sơ Ký Quỹ & Đối Soát Đơn Hàng</h3>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                      isRefunded
                        ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                        : isReleased
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : item?.status === 'DISPUTED'
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                    )}
                  >
                    {settlementHeaderTitle}
                  </span>
                </div>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Mã giao dịch ký quỹ:{' '}
                  <span className="font-mono font-semibold">{item?.escrowId}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setEscrowDetailModal({
                  isOpen: false,
                  item: null,
                  order: null,
                  returnDetails: null,
                })
              }
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                <p className="text-xs text-stone-400">Đang nạp hồ sơ đối soát ký quỹ...</p>
              </div>
            ) : (
              <>
                {/* Banner Cảnh Báo Quy Chuẩn Ký Quỹ */}
                {!canAdminSettle && (
                  <div
                    className={cn(
                      'p-4 rounded-2xl border flex items-start gap-3 shadow-sm',
                      isDark
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-900',
                    )}
                  >
                    <HiOutlineExclamationCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-xs">
                        {isReturnDisputed
                          ? 'Đã đủ điều kiện xử lý ký quỹ'
                          : isRefunded || isReleased
                            ? 'Khoản ký quỹ đã hoàn tất giải quyết'
                            : 'Ký quỹ chưa ở trạng thái tranh chấp kiện hoàn (DISPUTED)'}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {settlementBlockReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. DÒNG TIỀN KÝ QUỸ ESCROW (Hiển thị ai được nhận, ai được hoàn bao nhiêu) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <HiOutlineCash className="h-4 w-4" />
                    Dòng Tiền Ký Quỹ Escrow
                    {hasSettlement && (
                      <span className="ml-1 text-[10px] font-normal text-stone-400">
                        (Đã có phán quyết)
                      </span>
                    )}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Tổng tiền ký quỹ */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl border',
                        isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-stone-50 border-stone-200',
                      )}
                    >
                      <span className={cn('block text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        Tổng tiền ký quỹ (100%):
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5 block">
                        {formatVND(totalAmount)}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">Tiền đơn hàng trong Escrow</p>
                    </div>

                    {/* Card 2: Phí hoa hồng sàn */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl border',
                        isDark ? 'bg-indigo-500/10 border-indigo-500/25' : 'bg-indigo-50 border-indigo-200',
                      )}
                    >
                      <span className="block text-[11px] text-indigo-400">
                        Phí hoa hồng sàn (
                        {totalAmount > 0
                          ? Math.round((effectiveCommission / totalAmount) * 100)
                          : 0}
                        %):
                      </span>
                      <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                        {formatVND(effectiveCommission)}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {effectiveCommission > 0 ? 'Thu về doanh thu sàn' : 'Không thu phí sàn'}
                      </p>
                    </div>

                    {/* Card 3: Thực nhận Người bán */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl border',
                        isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
                      )}
                    >
                      <span className="block text-[11px] text-emerald-500 font-medium">
                        Shop nhận ({effectiveSellerPct}%):
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {formatVND(effectiveSellerRelease)}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {effectiveSellerRelease > 0
                          ? hasSettlement || isReleased
                            ? 'Đã cộng vào ví Shop'
                            : 'Cộng vào ví Shop khi giải ngân'
                          : 'Không giải ngân cho Shop'}
                      </p>
                    </div>

                    {/* Card 4: Hoàn tiền cho Người mua */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl border',
                        isDark ? 'bg-blue-500/10 border-blue-500/25' : 'bg-blue-50 border-blue-200',
                      )}
                    >
                      <span className="block text-[11px] text-blue-500 font-medium">
                        Hoàn cho Khách ({effectiveBuyerPct}%):
                      </span>
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5 block">
                        {formatVND(effectiveBuyerRefund)}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {effectiveBuyerRefund > 0
                          ? 'Đã hoàn trả vào ví Người mua'
                          : 'Không hoàn tiền cho Khách'}
                      </p>
                    </div>
                  </div>

                  {/* Ghi chú phán quyết phân xử nếu có */}
                  {settlement?.settlementNote && (
                    <div
                      className={cn(
                        'p-3 rounded-xl border text-xs italic',
                        isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                          : 'bg-stone-50 border-stone-200 text-stone-600',
                      )}
                    >
                      Ghi chú phân xử: &ldquo;{settlement.settlementNote}&rdquo;
                    </div>
                  )}
                </div>

                {/* 2. Sub-component: Đơn hàng gốc & Thông tin các bên Người mua / Người bán / Sản phẩm */}
                <AdminEscrowOrderSection
                  order={order}
                  isDark={isDark}
                  formatVND={formatVND}
                  copyToClipboard={copyToClipboard}
                />

                {/* 3. Sub-component: Kiện hàng hoàn trả */}
                <AdminEscrowReturnSection
                  returnDetails={returnDetails}
                  isDark={isDark}
                  onPreviewMedia={(media) => setPreviewImage(media)}
                />

                {/* 4. Sub-component: Chi tiết Settlement (nếu có dữ liệu settlement) */}
                {settlement && (
                  <AdminEscrowSettlementCard
                    settlement={settlement}
                    isDark={isDark}
                    formatVND={formatVND}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer Hành Động */}
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800 border-stone-200 shrink-0">
            <span className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {canAdminSettle
                ? 'Đơn hàng đang có tranh chấp kiện hoàn (DISPUTED). Admin có toàn quyền can thiệp phân xử.'
                : 'Các nút hành động chỉ kích hoạt khi kiện hoàn đang tranh chấp (DISPUTED).'}
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={!canAdminSettle}
                onClick={() => {
                  setActionModal({
                    isOpen: true,
                    action: 'split_escrow',
                    title: 'Phân Chia Tiền Ký Quỹ Theo Tỷ Lệ %',
                    description: `Đơn hàng #${item?.orderNumber || ''} - Tiền Escrow: ${formatVND(
                      item?.amount,
                    )}`,
                    item,
                    type: 'escrow',
                  })
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Phân chia (%)
              </button>

              <button
                type="button"
                disabled={!canAdminSettle}
                onClick={() => {
                  setActionModal({
                    isOpen: true,
                    action: 'release_escrow',
                    title: 'Giải Ngân Toàn Bộ Cho Shop',
                    description: `Xác nhận giải ngân ${formatVND(item?.amount)} cho Shop #${
                      item?.shopName || ''
                    }. Khấu trừ 5% hoa hồng sàn.`,
                    item,
                    type: 'escrow',
                  })
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Giải ngân Shop
              </button>

              <button
                type="button"
                disabled={!canAdminSettle}
                onClick={() => {
                  setActionModal({
                    isOpen: true,
                    action: 'refund_escrow',
                    title: 'Hoàn Tiền Toàn Bộ Cho Người Mua',
                    description: `Xác nhận hoàn 100% số tiền ${formatVND(
                      item?.amount,
                    )} từ quỹ Escrow về ví của Khách hàng.`,
                    item,
                    type: 'escrow',
                  })
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Hoàn tiền Khách
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Phóng To Xem Ảnh / Video */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {previewImage.isVideo ? (
              <video
                src={previewImage.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            ) : (
              <img
                src={previewImage.url}
                alt="Bằng chứng phóng to"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            )}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
