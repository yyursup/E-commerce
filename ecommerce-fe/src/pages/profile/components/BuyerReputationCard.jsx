import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineInformationCircle,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import authService from '../../../services/auth'
import { useAuthStore } from '../../../store/useAuthStore'
import toast from 'react-hot-toast'

export default function BuyerReputationCard({ user, isDark }) {
  const { updateUser } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [showPolicyDetails, setShowPolicyDetails] = useState(false)

  const strikes = user?.violationCount ?? 0
  const score = user?.reputationScore ?? Math.max(0, 100 - strikes * 15)
  const disciplineLevel = user?.disciplineLevel ?? 'NONE'
  const lastViolationAt = user?.lastViolationAt

  // Calculate tier config
  const getTier = () => {
    if (score >= 100 && strikes === 0) {
      return {
        badge: 'Chuẩn Mực (Diamond Trust)',
        theme: 'emerald',
        badgeClass: isDark
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        progressBarClass: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        scoreTextClass: 'text-emerald-500 dark:text-emerald-400',
        cardBg: isDark
          ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900'
          : 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white',
        statusDesc: 'Tài khoản tuyệt đối tuân thủ quy tắc ứng xử sàn SEB. Không có vi phạm nào được ghi nhận.',
        benefits: 'Ưu tiên duyệt khiếu nại trong 24h, mở toàn quyền thanh toán COD & hoàn tiền tự động.',
      }
    }
    if (score >= 70) {
      return {
        badge: 'Uy Tín Tốt (Good Standing)',
        theme: 'blue',
        badgeClass: isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200',
        progressBarClass: 'bg-gradient-to-r from-blue-500 to-cyan-400',
        scoreTextClass: 'text-blue-500 dark:text-blue-400',
        cardBg: isDark
          ? 'border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-900'
          : 'border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white',
        statusDesc: `Tài khoản ghi nhận ${strikes} gậy cảnh cáo nhẹ nhưng vẫn đảm bảo độ tin cậy giao dịch cao.`,
        benefits: 'Hưởng đầy đủ đặc quyền bảo vệ người mua SEB và chính sách đổi trả tiêu chuẩn.',
      }
    }
    if (score >= 40) {
      return {
        badge: 'Cảnh Báo (Warned)',
        theme: 'amber',
        badgeClass: isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-800 border-amber-200',
        progressBarClass: 'bg-gradient-to-r from-amber-500 to-orange-400',
        scoreTextClass: 'text-amber-500 dark:text-amber-400',
        cardBg: isDark
          ? 'border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900'
          : 'border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-white',
        statusDesc: `Tài khoản đã tích lũy ${strikes} gậy vi phạm. Các hành vi tiếp theo sẽ bị hệ thống xem xét hạn chế quyền lợi.`,
        benefits: 'Các yêu cầu hoàn trả & khiếu nại sẽ được chuyển sang hội đồng kiểm duyệt chi tiết.',
      }
    }
    if (score > 0) {
      return {
        badge: 'Tạm Ngưng Quyền Lợi (Suspended)',
        theme: 'orange',
        badgeClass: isDark
          ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
          : 'bg-orange-50 text-orange-800 border-orange-200',
        progressBarClass: 'bg-gradient-to-r from-orange-500 to-rose-500',
        scoreTextClass: 'text-orange-500 dark:text-orange-400',
        cardBg: isDark
          ? 'border-orange-500/20 bg-gradient-to-br from-orange-950/20 via-slate-900 to-slate-900'
          : 'border-orange-200/80 bg-gradient-to-br from-orange-50/50 via-white to-white',
        statusDesc: `Tài khoản có ${strikes} gậy vi phạm. Bị tạm khóa phương thức thanh toán nhận hàng trả tiền (COD).`,
        benefits: 'Cần duy trì hành vi chuẩn mực để kích hoạt cơ chế xóa gậy 30 ngày.',
      }
    }
    return {
      badge: 'Vô Hiệu Hóa (Banned)',
      theme: 'rose',
      badgeClass: isDark
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : 'bg-rose-50 text-rose-800 border-rose-200',
      progressBarClass: 'bg-rose-600',
      scoreTextClass: 'text-rose-500 dark:text-rose-400',
      cardBg: isDark
        ? 'border-rose-500/20 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900'
        : 'border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-white',
      statusDesc: 'Tài khoản chạm mốc 7 gậy vi phạm. Toàn bộ tính năng mua sắm và thanh toán đã bị khóa.',
      benefits: 'Vui lòng liên hệ bộ phận hỗ trợ khách hàng SEB (1900 1234) nếu cần hỗ trợ.',
    }
  }

  const tier = getTier()

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const freshProfile = await authService.getUserProfile()
      if (freshProfile) {
        updateUser({
          violationCount: freshProfile.violationCount ?? 0,
          reputationScore: freshProfile.reputationScore ?? 100,
          disciplineLevel: freshProfile.disciplineLevel ?? 'NONE',
          lastViolationAt: freshProfile.lastViolationAt || null,
          bannedUntil: freshProfile.bannedUntil || null,
        })
        toast.success('Đã làm mới điểm uy tín người mua!')
      }
    } catch (e) {
      toast.error('Không thể làm mới điểm uy tín.')
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate days since last violation for decay estimation
  const getDecayCountdown = () => {
    if (!lastViolationAt || strikes === 0) return null
    try {
      const lastDate = new Date(lastViolationAt)
      const now = new Date()
      const diffMs = now.getTime() - lastDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const remainingDays = Math.max(0, 30 - (diffDays % 30))
      return remainingDays
    } catch {
      return null
    }
  }

  const daysToNextDecay = getDecayCountdown()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border p-5 sm:p-7 shadow-xs transition-all mb-8',
        tier.cardBg
      )}
    >
      {/* Decorative top-right accent */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-stone-200/70 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 shrink-0">
            <HiOutlineShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Điểm Uy Tín Người Mua
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  tier.badgeClass
                )}
              >
                <HiOutlineSparkles className="h-3 w-3" />
                {tier.badge}
              </span>
            </div>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hệ thống đánh giá độ tin cậy 100 điểm & kỷ luật tài khoản SEB Trust & Safety
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn(
            'self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
            isDark
              ? 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 shadow-2xs'
          )}
        >
          <HiOutlineRefresh className={cn('h-3.5 w-3.5', refreshing && 'animate-spin text-amber-500')} />
          <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-5 items-center">
        {/* Left: Big Score Meter */}
        <div className="md:col-span-5 flex items-center gap-5">
          <div className="relative flex flex-col items-center justify-center">
            <div className="flex items-baseline">
              <span className={cn('text-4xl sm:text-5xl font-black tracking-tight', tier.scoreTextClass)}>
                {score}
              </span>
              <span className={cn('text-base font-bold ml-1', isDark ? 'text-slate-500' : 'text-stone-400')}>
                /100
              </span>
            </div>
            <span className={cn('text-[11px] font-semibold uppercase tracking-wider mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Điểm Uy Tín
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className={isDark ? 'text-slate-300' : 'text-stone-700'}>Mức độ chuẩn mực</span>
              <span className={tier.scoreTextClass}>{score}%</span>
            </div>
            {/* Progress Track */}
            <div className={cn('h-3 w-full rounded-full overflow-hidden p-0.5 border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-100 border-stone-200')}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, score)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full shadow-xs', tier.progressBarClass)}
              />
            </div>
            <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {tier.statusDesc}
            </p>
          </div>
        </div>

        {/* Right: Strike Meter & Benefits */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3.5 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-stone-200/80 dark:border-slate-800">
          {/* Strikes breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <HiOutlineExclamationCircle className={cn('h-4 w-4', strikes > 0 ? 'text-rose-500' : 'text-emerald-500')} />
                <span className={isDark ? 'text-slate-200' : 'text-stone-800'}>
                  Số gậy vi phạm tích lũy:
                </span>
                <span className={cn('font-mono font-bold text-sm ml-1', strikes > 0 ? 'text-rose-500' : 'text-emerald-500')}>
                  {strikes} / 7 gậy
                </span>
              </div>
              <span className={cn('text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                (-15 điểm / gậy)
              </span>
            </div>

            {/* 7 Strike Segments Visual */}
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isHit = num <= strikes
                const isWarn = num >= 3 && num <= 4
                const isSevere = num >= 5
                return (
                  <div key={num} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'h-2.5 w-full rounded-md transition-all',
                        isHit
                          ? isSevere
                            ? 'bg-rose-500 shadow-sm shadow-rose-500/30'
                            : isWarn
                            ? 'bg-amber-500 shadow-sm shadow-amber-500/30'
                            : 'bg-orange-500'
                          : isDark
                          ? 'bg-slate-800'
                          : 'bg-stone-200'
                      )}
                    />
                    <span className={cn('text-[9px] font-mono font-medium', isDark ? 'text-slate-500' : 'text-stone-400')}>
                      #{num}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Privileges / Next Decay notification */}
          <div
            className={cn(
              'p-3 rounded-2xl border flex items-start gap-2.5 text-xs',
              isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-stone-50 border-stone-200/80'
            )}
          >
            <HiOutlineSparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                Đặc quyền hiện tại:
              </p>
              <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-500')}>
                {tier.benefits}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Monthly Decay Footer & Policy Accordion */}
      <div className="pt-4 border-t border-stone-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400">
          <HiOutlineClock className="h-4 w-4 text-amber-500 shrink-0" />
          <span>
            {strikes > 0 ? (
              <>
                Cơ chế phục hồi điểm:{' '}
                <strong className={isDark ? 'text-slate-200' : 'text-stone-800'}>
                  {daysToNextDecay !== null ? `Còn khoảng ${daysToNextDecay} ngày` : '30 ngày'}
                </strong>{' '}
                liên tục chuẩn mực để được xóa 1 gậy (+15 điểm uy tín).
              </>
            ) : (
              'Tài khoản đang ở mức chuẩn mực tối đa (+100đ). Duy trì phong độ để giữ vững ưu đãi.'
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPolicyDetails((prev) => !prev)}
          className={cn(
            'self-start sm:self-auto flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer'
          )}
        >
          <HiOutlineInformationCircle className="h-3.5 w-3.5" />
          <span>{showPolicyDetails ? 'Thu gọn chính sách' : 'Chi tiết thang điểm & gậy'}</span>
          {showPolicyDetails ? <HiOutlineChevronUp className="h-3 w-3" /> : <HiOutlineChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Collapsible Policy Table */}
      <AnimatePresence>
        {showPolicyDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'mt-4 p-4 rounded-2xl border text-xs space-y-3',
                isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700'
              )}
            >
              <h4 className="font-bold text-amber-600 dark:text-amber-400">
                Chính sách Thang Điểm Uy Tín Người Mua (SEB Buyer Credibility Policy)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-slate-700 font-bold">
                      <th className="py-1.5 pr-3">Điểm Uy Tín</th>
                      <th className="py-1.5 px-3">Gậy Vi Phạm</th>
                      <th className="py-1.5 px-3">Xếp Hạng</th>
                      <th className="py-1.5 pl-3">Tác Động & Chế Tài</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-slate-700/50">
                    <tr>
                      <td className="py-1.5 pr-3 font-bold text-emerald-500">100 điểm</td>
                      <td className="py-1.5 px-3 font-mono">0 gậy</td>
                      <td className="py-1.5 px-3 font-semibold text-emerald-500">Chuẩn mực</td>
                      <td className="py-1.5 pl-3">Hưởng toàn bộ quyền lợi, ưu tiên duyệt đổi trả nhanh.</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-bold text-blue-500">70 - 85 điểm</td>
                      <td className="py-1.5 px-3 font-mono">1 - 2 gậy</td>
                      <td className="py-1.5 px-3 font-semibold text-blue-500">Uy tín tốt</td>
                      <td className="py-1.5 pl-3">Giao dịch bình thường, có lưu ý lịch sử khiếu nại.</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-bold text-amber-500">40 - 55 điểm</td>
                      <td className="py-1.5 px-3 font-mono">3 - 4 gậy</td>
                      <td className="py-1.5 px-3 font-semibold text-amber-500">Cảnh báo</td>
                      <td className="py-1.5 pl-3">Cần gửi bằng chứng chi tiết khi tạo khiếu nại.</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-bold text-orange-500">15 - 25 điểm</td>
                      <td className="py-1.5 px-3 font-mono">5 - 6 gậy</td>
                      <td className="py-1.5 px-3 font-semibold text-orange-500">Rủi ro cao</td>
                      <td className="py-1.5 pl-3">Khóa thanh toán COD, yêu cầu thanh toán trước.</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-bold text-rose-500">0 điểm</td>
                      <td className="py-1.5 px-3 font-mono">≥ 7 gậy</td>
                      <td className="py-1.5 px-3 font-semibold text-rose-500">Khóa tài khoản</td>
                      <td className="py-1.5 pl-3">Vô hiệu hóa tài khoản người mua vĩnh viễn trên sàn.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-slate-400 italic">
                * Sau mỗi 30 ngày liên tục người mua không phát sinh thêm gậy vi phạm mới, hệ thống tự động trừ 1 gậy (-1 strike) và hoàn trả +15 điểm uy tín cho đến khi đạt tối đa 100 điểm.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
