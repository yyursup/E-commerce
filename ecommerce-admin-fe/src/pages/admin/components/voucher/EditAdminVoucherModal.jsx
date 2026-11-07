import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlinePencilAlt,
  HiOutlineX,
  HiOutlineExclamationCircle,
  HiOutlineLockClosed,
  HiOutlineGlobe,
  HiOutlineChevronDown,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../../../services/voucher'
import { cn } from '../../../../lib/cn'

const formatDateTimeForInput = (dateVal) => {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

const formatDateTimeForPayload = (dtStr) => {
  if (!dtStr) return null
  if (dtStr.length === 16) {
    return `${dtStr}:00`
  }
  return dtStr
}

export default function EditAdminVoucherModal({ isOpen, onClose, onSuccess, voucher, isDark }) {
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    voucherType: 'FREE_SHIPPING',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderValue: '0',
    usageLimit: '',
    userUsageLimit: '1',
    startDate: '',
    endDate: '',
    isFirstOrderOnly: false,
  })

  useEffect(() => {
    if (voucher && isOpen) {
      setFormData({
        title: voucher.title || '',
        description: voucher.description || '',
        voucherType: voucher.voucherType || 'FREE_SHIPPING',
        discountValue: voucher.discountValue != null ? String(voucher.discountValue) : '',
        maxDiscountAmount: voucher.maxDiscountAmount != null ? String(voucher.maxDiscountAmount) : '',
        minOrderValue: voucher.minOrderValue != null ? String(voucher.minOrderValue) : '0',
        usageLimit: voucher.usageLimit != null ? String(voucher.usageLimit) : '',
        userUsageLimit: voucher.userUsageLimit != null ? String(voucher.userUsageLimit) : '1',
        startDate: formatDateTimeForInput(voucher.startDate),
        endDate: formatDateTimeForInput(voucher.endDate),
        isFirstOrderOnly: Boolean(voucher.isFirstOrderOnly),
      })
    }
  }, [voucher, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!voucher || !voucher.id) {
      toast.error('Không tìm thấy thông tin voucher cần sửa')
      return
    }

    // 1. Validate title
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch ưu đãi')
      return
    }

    // 2. Validate discountValue
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Vui lòng nhập mức giảm hợp lệ lớn hơn 0')
      return
    }

    const discountNum = Number(formData.discountValue)
    if (formData.voucherType === 'PERCENTAGE') {
      if (discountNum < 1 || discountNum > 100) {
        toast.error('Mức giảm theo phần trăm phải nằm trong khoảng từ 1% đến 100%')
        return
      }
    } else if (formData.voucherType === 'FIXED_AMOUNT') {
      if (discountNum > 500000000) {
        toast.error('Số tiền giảm không được vượt quá 500.000.000đ')
        return
      }
    } else if (formData.voucherType === 'FREE_SHIPPING') {
      if (discountNum > 50000000) {
        toast.error('Mức trợ phí ship tối đa không được vượt quá 50.000.000đ')
        return
      }
    }

    if (formData.maxDiscountAmount && Number(formData.maxDiscountAmount) > 500000000) {
      toast.error('Mức giảm tối đa không được vượt quá 500.000.000đ')
      return
    }

    // 3. Validate minOrderValue
    if (formData.minOrderValue && Number(formData.minOrderValue) < 0) {
      toast.error('Giá trị đơn hàng tối thiểu không được âm')
      return
    }
    if (formData.minOrderValue && Number(formData.minOrderValue) > 9999999999) {
      toast.error('Giá trị đơn tối thiểu vượt quá giới hạn hệ thống cho phép')
      return
    }

    // 4. Validate usageLimit vs usedCount
    const usedCount = Number(voucher.usedCount || 0)
    if (formData.usageLimit !== '') {
      const usageLimitNum = Number(formData.usageLimit)
      if (usageLimitNum < usedCount) {
        toast.error(`Số lượng phát hành không được nhỏ hơn số lượt đã dùng (${usedCount} lượt)`)
        return
      }
      if (usageLimitNum > 10000000) {
        toast.error('Tổng lượt sử dụng không được vượt quá 10.000.000 lượt')
        return
      }
    }

    // 5. Validate userUsageLimit
    if (formData.userUsageLimit !== '') {
      const uul = Number(formData.userUsageLimit)
      if (uul < 1 || uul > 100) {
        toast.error('Lượt dùng mỗi tài khoản phải từ 1 đến 100 lượt')
        return
      }
    }

    const now = new Date()

    // 6. Validate startDate (bắt buộc phải sau thời điểm hiện tại)
    if (!formData.startDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu chiến dịch')
      return
    }
    const newStart = new Date(formData.startDate)
    if (isNaN(newStart.getTime()) || newStart <= now) {
      toast.error('Thời gian bắt đầu mới phải sau thời điểm hiện tại')
      return
    }

    // 7. Validate endDate (nếu có, phải sau thời điểm hiện tại và sau startDate)
    if (formData.endDate) {
      const newEnd = new Date(formData.endDate)
      if (isNaN(newEnd.getTime()) || newEnd <= now) {
        toast.error('Thời gian kết thúc mới phải sau thời điểm hiện tại')
        return
      }
      if (newEnd <= newStart) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
        return
      }
    }

    try {
      setUpdating(true)

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        voucherType: formData.voucherType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount:
          formData.voucherType === 'PERCENTAGE' && formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : null,
        minOrderValue: Number(formData.minOrderValue || 0),
        usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
        userUsageLimit: formData.userUsageLimit !== '' ? Number(formData.userUsageLimit) : 1,
        startDate: formatDateTimeForPayload(formData.startDate),
        endDate: formatDateTimeForPayload(formData.endDate),
        isFirstOrderOnly: Boolean(formData.isFirstOrderOnly),
      }

      await voucherService.updateVoucher(voucher.id, payload)
      toast.success(`Cập nhật voucher sàn ${voucher.code} thành công!`)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      console.error('Update platform voucher error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Cập nhật voucher sàn thất bại')
    } finally {
      setUpdating(false)
    }
  }

  if (!isOpen || !voucher) return null

  const usedCount = Number(voucher.usedCount || 0)
  const isUsageLimitEqualUsed =
    formData.usageLimit !== '' &&
    Number(formData.usageLimit) === usedCount &&
    usedCount > 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'w-full max-w-2xl rounded-3xl border p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col',
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between pb-4 border-b shrink-0", isDark ? "border-slate-800" : "border-stone-100")}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white font-bold shrink-0">
                <HiOutlinePencilAlt className="h-5 w-5" />
              </span>
              <div>
                <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Chỉnh Sửa Voucher Toàn Sàn
                </h3>
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                  Chỉ áp dụng khi chiến dịch chưa đến ngày phát hành
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={updating}
              className={cn("p-1 rounded-full transition-colors", isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-stone-100 text-stone-400 hover:text-stone-600")}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="py-4 overflow-y-auto space-y-4 flex-1 text-xs px-1.5">
            {/* Voucher Code & Scope (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className={cn("block font-bold mb-1 flex items-center gap-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  <HiOutlineLockClosed className="h-3.5 w-3.5 text-stone-400" />
                  Mã Voucher Sàn <span className="text-[11px] font-normal text-stone-400">(Không thể sửa)</span>
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={voucher.code || ''}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 uppercase font-mono font-bold tracking-wider cursor-not-allowed opacity-80',
                    isDark ? 'border-slate-700 bg-slate-800/60 text-blue-400' : 'border-stone-200 bg-stone-100 text-blue-700'
                  )}
                />
              </div>

              <div className="min-w-0">
                <label className={cn("block font-bold mb-1 flex items-center gap-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  <HiOutlineGlobe className="h-3.5 w-3.5 text-blue-500" />
                  Phạm Vi Tài Trợ
                </label>
                <div className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 font-bold flex items-center gap-2',
                  isDark ? 'border-slate-700 bg-slate-800/40 text-blue-400' : 'border-stone-200 bg-blue-50/60 text-blue-700'
                )}>
                  <span>Toàn Sàn (PLATFORM)</span>
                </div>
              </div>
            </div>

            {/* Campaign Title */}
            <div>
              <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                Tên Chiến Dịch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="VD: Trợ Giá Vận Chuyển GHN Toàn Sàn"
                value={formData.title}
                onChange={handleInputChange}
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                Mô Tả & Điều Kiện Áp Dụng
              </label>
              <textarea
                name="description"
                rows="2"
                placeholder="Mô tả điều kiện tham gia chiến dịch..."
                value={formData.description}
                onChange={handleInputChange}
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 resize-none',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                )}
              />
            </div>

            {/* Voucher Type & Discount Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Loại Khuyến Mãi
                </label>
                <div className="relative">
                  <select
                    name="voucherType"
                    value={formData.voucherType}
                    onChange={handleInputChange}
                    className={cn(
                      'w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer',
                      isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                    )}
                  >
                    <option value="FREE_SHIPPING">Miễn Phí Vận Chuyển (GHN Express)</option>
                    <option value="PERCENTAGE">Giảm Theo Phần Trăm Toàn Sàn (%)</option>
                    <option value="FIXED_AMOUNT">Giảm Số Tiền Cố Định (VNĐ)</option>
                  </select>
                  <HiOutlineChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-slate-400" />
                </div>
              </div>

              <div className="min-w-0">
                <label className={cn("block font-bold mb-1 truncate", isDark ? "text-slate-200" : "text-stone-700")} title={
                  formData.voucherType === 'PERCENTAGE'
                    ? 'Tỷ Lệ Giảm (%)'
                    : formData.voucherType === 'FREE_SHIPPING'
                    ? 'Mức Trợ Phí Ship Tối Đa (VNĐ)'
                    : 'Số Tiền Giảm (VNĐ)'
                }>
                  {formData.voucherType === 'PERCENTAGE'
                    ? 'Tỷ Lệ Giảm (%)'
                    : formData.voucherType === 'FREE_SHIPPING'
                    ? 'Mức Trợ Phí Ship Tối Đa (VNĐ)'
                    : 'Số Tiền Giảm (VNĐ)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="discountValue"
                  required
                  min="1"
                  max={formData.voucherType === 'PERCENTAGE' ? '100' : formData.voucherType === 'FREE_SHIPPING' ? '50000000' : '500000000'}
                  placeholder={formData.voucherType === 'PERCENTAGE' ? 'VD: 15' : 'VD: 50000'}
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className={cn("grid gap-4", formData.voucherType === 'PERCENTAGE' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              <div className="min-w-0">
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Giá Trị Đơn Tối Thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  min="0"
                  max="9999999999"
                  placeholder="VD: 250000"
                  value={formData.minOrderValue}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              {formData.voucherType === 'PERCENTAGE' && (
                <div className="min-w-0">
                  <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                    Mức Giảm Tối Đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    min="1"
                    max="500000000"
                    placeholder="VD: 100000"
                    value={formData.maxDiscountAmount}
                    onChange={handleInputChange}
                    className={cn(
                      'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                      isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                    )}
                  />
                </div>
              )}
            </div>

            {/* Usage Limit & User Usage Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <label className={cn("font-bold", isDark ? "text-slate-200" : "text-stone-700")}>
                    Tổng Lượt Sử Dụng
                  </label>
                  {usedCount > 0 && (
                    <span className="text-[11px] text-amber-500 font-semibold">
                      Đã dùng: {usedCount} lượt
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="usageLimit"
                  min={usedCount || 0}
                  max="10000000"
                  placeholder="Để trống nếu không giới hạn"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div className="min-w-0">
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Lượt Dùng Mỗi Tài Khoản
                </label>
                <input
                  type="number"
                  name="userUsageLimit"
                  min="1"
                  max="100"
                  placeholder="Mặc định: 1"
                  value={formData.userUsageLimit}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>
            </div>

            {/* Cảnh báo khi usageLimit == usedCount */}
            {isUsageLimitEqualUsed && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Lưu ý:</strong> Giới hạn lượt sử dụng mới ({formData.usageLimit}) bằng đúng số lượt đã dùng ({usedCount}). Voucher sẽ tự động chuyển sang trạng thái <strong>Hết lượt (EXHAUSTED)</strong> sau khi cập nhật.
                </p>
              </div>
            )}

            {/* Start & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Ngày Bắt Đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div className="min-w-0">
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Ngày Kết Thúc (HSD)
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>
            </div>

            {/* isFirstOrderOnly Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isFirstOrderOnly"
                  checked={formData.isFirstOrderOnly}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                />
                <span className={cn("font-medium", isDark ? "text-slate-300" : "text-stone-700")}>
                  Chỉ áp dụng cho đơn hàng đầu tiên (Khách hàng mới trên sàn)
                </span>
              </label>
            </div>

            {/* Actions Footer */}
            <div className={cn("pt-4 border-t flex justify-end gap-3", isDark ? "border-slate-800" : "border-stone-100")}>
              <button
                type="button"
                onClick={onClose}
                disabled={updating}
                className={cn("px-4 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50", isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-100")}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {updating && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
