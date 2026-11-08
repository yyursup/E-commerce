import { useState } from 'react'
import {
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineX,
  HiOutlineInformationCircle,
  HiOutlineCog,
} from 'react-icons/hi'
import { NavLink } from 'react-router-dom'
import { cn } from '../../../lib/cn'

const formatVND = (val) => {
  if (val === null || val === undefined) return '0 ₫'
  return Number(val).toLocaleString('vi-VN') + ' ₫'
}

export default function SellerRevenueTab({
  wallet,
  walletLoading,
  withdrawals,
  withdrawalsLoading,
  withdrawalPage,
  withdrawalTotalPages,
  onPageChange,
  onRefresh,
  onOpenWithdrawModal,
  onCancelWithdrawal,
  cancellingWithdrawalId,
  user,
  isDark,
}) {
  const available = wallet?.availableBalance || 0
  const locked = wallet?.lockedBalance || 0

  return (
    <div className="space-y-6">
      {/* Linked Bank Account Banner */}
      <div
        className={cn(
          'rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="flex items-center gap-3.5">
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            isDark ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600'
          )}>
            <HiOutlineCreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Tài khoản ngân hàng nhận doanh thu
              </span>
              {user?.bankAccountNumber ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  <HiOutlineCheckCircle className="h-3 w-3" /> Đã liên kết
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                  Chưa liên kết
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap text-sm">
              <span className="font-bold text-stone-900 dark:text-white">
                {user?.bankName || 'Chưa thiết lập ngân hàng'}
              </span>
              {user?.bankAccountNumber && (
                <>
                  <span className="text-stone-300 dark:text-slate-600">&bull;</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {user.bankAccountNumber}
                  </span>
                  <span className="text-stone-300 dark:text-slate-600">&bull;</span>
                  <span className="font-semibold uppercase text-stone-600 dark:text-slate-300">
                    {user?.bankAccountName || user?.fullName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineCog className="h-4 w-4" />
            Đổi thông tin ngân hàng
          </NavLink>
          <button
            type="button"
            onClick={onOpenWithdrawModal}
            disabled={available < 100000 || !user?.bankAccountNumber}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm',
              available >= 100000 && user?.bankAccountNumber
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 active:scale-95 cursor-pointer'
                : 'bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-500 cursor-not-allowed opacity-60'
            )}
            title={
              !user?.bankAccountNumber
                ? 'Vui lòng cài đặt tài khoản ngân hàng trước khi rút'
                : available < 100000
                ? 'Số dư khả dụng tối thiểu để rút là 100.000 VNĐ'
                : 'Rút tiền về tài khoản ngân hàng'
            }
          >
            <HiOutlineCash className="h-4 w-4" />
            Rút tiền về ngân hàng
          </button>
        </div>
      </div>

      {/* Withdrawal Request History Table */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <HiOutlineCash className="h-5 w-5 text-amber-500" />
              Lịch sử yêu cầu rút tiền doanh thu
            </h2>
            <p className={cn('text-xs mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Các yêu cầu giải ngân số dư ví về tài khoản ngân hàng của gian hàng
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={withdrawalsLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineRefresh className={cn('h-3.5 w-3.5', withdrawalsLoading && 'animate-spin')} />
            Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={cn('uppercase font-semibold', isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600')}>
              <tr>
                <th className="px-6 py-3.5">Mã giao dịch</th>
                <th className="px-6 py-3.5">Thời gian</th>
                <th className="px-6 py-3.5">Số tiền rút</th>
                <th className="px-6 py-3.5">Tài khoản nhận</th>
                <th className="px-6 py-3.5">Ghi chú</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
              {withdrawalsLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    <HiOutlineRefresh className="mx-auto h-5 w-5 animate-spin text-amber-500 mb-1" />
                    Đang tải lịch sử rút tiền...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    Chưa có yêu cầu rút tiền nào từ gian hàng.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-stone-900 dark:text-white">
                      {w.txRef || w.id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-stone-500 dark:text-slate-400">
                      {w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-sm text-stone-900 dark:text-white">
                      {formatVND(w.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-800 dark:text-slate-200">{w.bankName}</div>
                      <div className="font-mono text-[11px] text-stone-500 dark:text-slate-400">
                        {w.bankAccountNumber} - {w.bankAccountName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 dark:text-slate-400 max-w-xs truncate" title={w.adminNote || w.userNote}>
                      {w.adminNote ? (
                        <span className="text-rose-500 font-medium">Lý do: {w.adminNote}</span>
                      ) : (
                        w.userNote || '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {w.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                          <HiOutlineClock className="h-3.5 w-3.5 animate-spin" /> Chờ Admin duyệt
                        </span>
                      )}
                      {w.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                          <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Thành công
                        </span>
                      )}
                      {w.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-500 border border-rose-500/20" title={w.adminNote || 'Bị từ chối'}>
                          <HiOutlineXCircle className="h-3.5 w-3.5" /> Bị từ chối
                        </span>
                      )}
                      {w.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
                          <HiOutlineBan className="h-3.5 w-3.5" /> Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'PENDING' ? (
                        <button
                          type="button"
                          disabled={cancellingWithdrawalId === w.id}
                          onClick={() => onCancelWithdrawal(w.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer disabled:opacity-50"
                        >
                          {cancellingWithdrawalId === w.id ? (
                            <HiOutlineRefresh className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <HiOutlineX className="h-3.5 w-3.5" />
                          )}
                          Hủy yêu cầu
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {withdrawalTotalPages > 1 && (
          <div className="p-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-slate-400">
              Trang {withdrawalPage + 1} / {withdrawalTotalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={withdrawalPage === 0 || withdrawalsLoading}
                onClick={() => onPageChange(Math.max(0, withdrawalPage - 1))}
                className="rounded-lg px-3 py-1.5 border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                disabled={withdrawalPage >= withdrawalTotalPages - 1 || withdrawalsLoading}
                onClick={() => onPageChange(withdrawalPage + 1)}
                className="rounded-lg px-3 py-1.5 border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

