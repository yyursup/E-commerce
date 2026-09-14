import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineOfficeBuilding,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineExternalLink,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import LicenseImageModal from './LicenseImageModal'
import { buildSellerInfoSections } from './requestHelpers'

export default function AdminRequestActionCard({
  detail,
  detailEntries = [],
  isDark,
  responseText,
  setResponseText,
  requestType,
  isPending,
  actionLoading,
  onApprove,
  onReject,
}) {
  const [showLicenseModal, setShowLicenseModal] = useState(false)

  const sellerSections =
    requestType === 'SELLER_REGISTRATION' && detail?.detail
      ? buildSellerInfoSections(detail.detail)
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className={cn(
        'rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-6',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Thông tin chi tiết</h2>
          {sellerSections && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                sellerSections.isBusiness
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
              )}
            >
              {sellerSections.isBusiness ? (
                <>
                  <HiOutlineOfficeBuilding className="h-3.5 w-3.5" /> Doanh nghiệp / Hộ KD
                </>
              ) : (
                <>
                  <HiOutlineUser className="h-3.5 w-3.5" /> Cá nhân
                </>
              )}
            </span>
          )}
        </div>

        {/* 1. HIỂN THỊ CHI TIẾT ĐĂNG KÝ SELLER */}
        {sellerSections && (
          <div className="space-y-5 text-sm">
            {/* Nhóm 1: Thông tin Shop */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500 text-xs uppercase tracking-wider">
                <HiOutlineUser className="h-4 w-4" /> Hồ sơ gian hàng
              </div>
              <div className={cn('rounded-xl p-3 space-y-2 text-xs', isDark ? 'bg-slate-800/60' : 'bg-stone-50')}>
                {sellerSections.shopInfo.map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>{item.label}:</span>
                    <span className="font-medium text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nhóm 2: Pháp lý & Doanh nghiệp */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500 text-xs uppercase tracking-wider">
                <HiOutlineDocumentText className="h-4 w-4" /> Định danh & Pháp lý
              </div>
              <div className={cn('rounded-xl p-3 space-y-2 text-xs', isDark ? 'bg-slate-800/60' : 'bg-stone-50')}>
                {sellerSections.legalInfo.map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>{item.label}:</span>
                    <span className="font-medium text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KHU VỰC GIẤY PHÉP KINH DOANH (GPKD) */}
            {sellerSections.isBusiness && (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-500 text-xs uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineDocumentText className="h-4 w-4" /> Giấy phép kinh doanh (GPKD)
                  </span>
                  {sellerSections.businessLicenseUrl && (
                    <span className="text-[11px] text-emerald-500 font-medium lowercase">✓ Đã đính kèm</span>
                  )}
                </div>

                {sellerSections.businessLicenseUrl ? (
                  <div
                    className={cn(
                      'overflow-hidden rounded-xl border p-3 transition',
                      isDark ? 'border-slate-700 bg-slate-800/80' : 'border-stone-200 bg-white shadow-sm',
                    )}
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-black/5 dark:bg-black/30 group">
                      <img
                        src={sellerSections.businessLicenseUrl}
                        alt="Giấy phép kinh doanh"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setShowLicenseModal(true)}
                          className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition hover:bg-amber-600"
                        >
                          <HiOutlineEye className="h-4 w-4" /> Phóng to kiểm tra
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLicenseModal(true)}
                        className={cn(
                          'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition',
                          isDark ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
                        )}
                      >
                        <HiOutlineEye className="h-4 w-4" /> Soi chi tiết GPKD
                      </button>
                      <a
                        href={sellerSections.businessLicenseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg p-2 text-xs font-medium transition',
                          isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                        )}
                        title="Mở tab mới"
                      >
                        <HiOutlineExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <HiOutlineExclamation className="h-5 w-5 shrink-0" />
                    <span>Hồ sơ Doanh nghiệp nhưng người đăng ký chưa đính kèm ảnh Giấy phép kinh doanh!</span>
                  </div>
                )}
              </div>
            )}

            {/* Nhóm 3: Địa chỉ lấy / trả hàng */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500 text-xs uppercase tracking-wider">
                <HiOutlineTruck className="h-4 w-4" /> Vận chuyển & Giao nhận
              </div>
              <div className={cn('rounded-xl p-3 space-y-2 text-xs', isDark ? 'bg-slate-800/60' : 'bg-stone-50')}>
                {sellerSections.logisticsInfo.map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <span className={cn('block', isDark ? 'text-slate-400' : 'text-stone-500')}>{item.label}:</span>
                    <span className="font-medium block break-words">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nhóm 4: Tài khoản ngân hàng */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500 text-xs uppercase tracking-wider">
                <HiOutlineCreditCard className="h-4 w-4" /> Tài khoản ngân hàng thụ hưởng
              </div>
              <div className={cn('rounded-xl p-3 space-y-2 text-xs', isDark ? 'bg-slate-800/60' : 'bg-stone-50')}>
                {sellerSections.bankInfo.map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className={cn(isDark ? 'text-slate-400' : 'text-stone-500')}>{item.label}:</span>
                    <span className="font-medium text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. HIỂN THỊ DẠNG DANH SÁCH CHO CÁC LOẠI YÊU CẦU KHÁC (VD: REPORT) */}
        {!sellerSections && (
          <div className="space-y-3 text-sm">
            {detailEntries.length === 0 && (
              <p className="text-stone-500 dark:text-slate-400">Không có dữ liệu chi tiết.</p>
            )}
            {detailEntries.map(([label, value]) => (
              <div key={label} className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">{label}</p>
                {label === 'Evidence' || label === 'Bằng chứng vi phạm' ? (
                  value ? (
                    <a
                      href={value}
                      className={cn('text-sm font-semibold underline break-all', isDark ? 'text-amber-300' : 'text-amber-700')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem bằng chứng đính kèm
                    </a>
                  ) : (
                    '-'
                  )
                ) : (
                  <p className="text-sm break-all font-medium">{value || '-'}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KHỐI HÀNH ĐỘNG CỦA ADMIN (APPROVE / REJECT) */}
      <div className="border-t border-stone-200 pt-5 text-sm dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide font-semibold text-stone-500 dark:text-slate-400">
            Hành động phê duyệt
          </p>
          {detail?.status && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md',
                detail.status === 'APPROVED'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : detail.status === 'REJECTED'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              )}
            >
              {detail.status === 'APPROVED' && <HiOutlineCheckCircle className="h-3.5 w-3.5" />}
              {detail.status === 'REJECTED' && <HiOutlineXCircle className="h-3.5 w-3.5" />}
              {detail.status === 'APPROVED' ? 'Đã duyệt' : detail.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
            </span>
          )}
        </div>

        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder={
            requestType === 'REPORT'
              ? 'Nhập ghi chú xử lý vi phạm (tùy chọn)...'
              : isPending
                ? 'Nhập lý do hoặc phản hồi cho người đăng ký (bắt buộc khi từ chối)...'
                : 'Đơn này đã được xử lý.'
          }
          rows={3}
          disabled={!isPending || actionLoading}
          className={cn(
            'w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:opacity-60',
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
              : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
            (!isPending || actionLoading) && 'opacity-60 cursor-not-allowed',
          )}
        />

        {isPending ? (
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onApprove}
              disabled={actionLoading}
              className={cn(
                'flex-1 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98]',
                actionLoading
                  ? 'cursor-not-allowed opacity-50 bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-600/25',
              )}
            >
              {actionLoading ? 'Đang xử lý...' : '✓ Phê duyệt đơn'}
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={actionLoading}
              className={cn(
                'flex-1 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98]',
                actionLoading
                  ? 'cursor-not-allowed opacity-50 bg-red-600'
                  : 'bg-red-600 hover:bg-red-500 hover:shadow-red-600/25',
              )}
            >
              {actionLoading ? 'Đang xử lý...' : '✕ Từ chối đơn'}
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-xl p-3 text-xs leading-relaxed',
              isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-stone-100 text-stone-600',
            )}
          >
            Yêu cầu này đã được đánh giá trước đó. Bạn không thể thực hiện thêm thao tác phê duyệt hoặc từ chối.
          </div>
        )}
      </div>

      {/* MODAL SOI ẢNH GPKD */}
      {sellerSections?.businessLicenseUrl && (
        <LicenseImageModal
          isOpen={showLicenseModal}
          onClose={() => setShowLicenseModal(false)}
          imageUrl={sellerSections.businessLicenseUrl}
          title={`GPKD: ${sellerSections?.shopInfo?.[0]?.value || 'Doanh nghiệp'}`}
        />
      )}
    </motion.div>
  )
}