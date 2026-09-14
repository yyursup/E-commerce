import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineTicket, HiOutlineX } from 'react-icons/hi'
import toast from 'react-hot-toast'
import voucherService from '../../../../services/voucher'
import { cn } from '../../../../lib/cn'

export default function CreateVoucherModal({ isOpen, onClose, onSuccess, isDark }) {
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    voucherType: 'PERCENTAGE', // 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
    discountValue: '',
    maxDiscountAmount: '',
    minOrderValue: '0',
    usageLimit: '100',
    userUsageLimit: '1',
    startDate: '',
    endDate: '',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().trim() : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã voucher')
      return
    }
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên chương trình ưu đãi')
      return
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Vui lòng nhập mức giảm hợp lệ')
      return
    }

    try {
      setCreating(true)
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        voucherType: formData.voucherType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        minOrderValue: Number(formData.minOrderValue || 0),
        usageLimit: Number(formData.usageLimit || 100),
        userUsageLimit: Number(formData.userUsageLimit || 1),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      }

      await voucherService.createVoucher(payload)
      toast.success(`Đã tạo mã giảm giá ${payload.code} thành công!`)
      onSuccess()
      onClose()
      setFormData({
        code: '',
        title: '',
        description: '',
        voucherType: 'PERCENTAGE',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderValue: '0',
        usageLimit: '100',
        userUsageLimit: '1',
        startDate: '',
        endDate: '',
      })
    } catch (err) {
      console.error('Create voucher error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Tạo voucher thất bại')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col',
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
          )}
        >
          <div className={cn("flex items-center justify-between pb-4 border-b", isDark ? "border-slate-800" : "border-stone-100")}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                <HiOutlineTicket className="h-5 w-5" />
              </span>
              <div>
                <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Tạo Voucher Giảm Giá Shop
                </h3>
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-stone-500")}>Chi phí giảm giá do Shop tự tài trợ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn("p-1 rounded-full transition-colors", isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-stone-100 text-stone-400 hover:text-stone-600")}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="py-4 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Voucher Code & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Mã Voucher <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="VD: SHOP20K"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 uppercase font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Tên Chương Trình <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="VD: Tri Ân Khách Hàng Mới"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>
            </div>

            {/* Voucher Type & Discount Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Loại Giảm Giá
                </label>
                <select
                  name="voucherType"
                  value={formData.voucherType}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                >
                  <option value="PERCENTAGE">Theo Phần Trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số Tiền Cố Định (VNĐ)</option>
                  <option value="FREE_SHIPPING">Hỗ Trợ Phí Vận Chuyển</option>
                </select>
              </div>

              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
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
                  placeholder={formData.voucherType === 'PERCENTAGE' ? 'VD: 15 (%)' : 'VD: 30000 (VNĐ)'}
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
            <div className={cn("grid gap-4", formData.voucherType === 'PERCENTAGE' ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Đơn Hàng Tối Thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  placeholder="VD: 150000"
                  value={formData.minOrderValue}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              {formData.voucherType === 'PERCENTAGE' && (
                <div>
                  <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                    Mức Giảm Tối Đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
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

            {/* Usage Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Tổng Số Lượt Phát Hành
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  placeholder="VD: 100"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Lượt Dùng Mỗi Khách Hàng
                </label>
                <input
                  type="number"
                  name="userUsageLimit"
                  placeholder="VD: 1"
                  value={formData.userUsageLimit}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>
            </div>

            {/* Start & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn("block font-bold mb-1", isDark ? "text-slate-200" : "text-stone-700")}>
                  Ngày Bắt Đầu
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500',
                    isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'
                  )}
                />
              </div>

              <div>
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

            <div className={cn("pt-4 border-t flex justify-end gap-3", isDark ? "border-slate-800" : "border-stone-100")}>
            <button
              type="button"
              onClick={onClose}
              className={cn("px-4 py-2.5 rounded-xl font-bold transition-colors", isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-100")}
            >
              Hủy
            </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 transition-all"
              >
                {creating ? 'Đang tạo...' : 'Tạo Voucher'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
