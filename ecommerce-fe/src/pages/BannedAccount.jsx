import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineLogout,
  HiOutlineDocumentText,
  HiOutlineShieldExclamation,
  HiOutlineRefresh,
} from 'react-icons/hi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/useAuthStore'
import requestService from '../services/request'

export default function BannedAccount() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusData, setStatusData] = useState(null)

  // Form state
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const data = await requestService.getBanReviewStatus()
      setStatusData(data)
    } catch (error) {
      console.error('Lỗi nạp trạng thái ban review:', error)
      toast.error(error?.message || 'Không thể tải thông tin trạng thái tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = 4 - selectedFiles.length
    if (remainingSlots <= 0) {
      toast.error('Bạn chỉ có thể chọn tối đa 4 ảnh minh chứng.')
      return
    }

    for (const file of filesToAdd) {
      const isJpgOrPng =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        /\.(jpe?g|png)$/i.test(file.name)
      if (!isJpgOrPng) {
        toast.error(`Tệp ${file.name} không đúng định dạng. Chỉ chấp nhận ảnh JPG, JPEG hoặc PNG.`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Tệp ${file.name} vượt quá dung lượng tối đa 10MB.`)
        return
      }
    }

    const newEntries = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setSelectedFiles((prev) => [...prev, ...newEntries])
    e.target.value = ''
  }

  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles((prev) => {
      const target = prev[indexToRemove]
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Vui lòng nhập nội dung giải trình chi tiết (tối thiểu 10 ký tự).')
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('description', description.trim())
      selectedFiles.forEach((item) => {
        formData.append('files', item.file)
      })

      await requestService.submitBanReview(formData)
      toast.success('Gửi đơn xem xét kỷ luật thành công! Vui lòng chờ Ban Quản Trị phản hồi.')
      setDescription('')
      selectedFiles.forEach((item) => {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      setSelectedFiles([])
      await fetchStatus()
    } catch (err) {
      console.error('Lỗi nộp đơn:', err)
      toast.error(err?.message || 'Không thể gửi đơn xem xét. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
        <p className="text-slate-600 text-sm font-medium">Đang kiểm tra tình trạng tài khoản...</p>
      </div>
    )
  }

  const isPermanentlyRejected = statusData?.blockReason === 'PERMANENTLY_BLOCKED_REJECTED'
  const isPending = statusData?.blockReason === 'PENDING_REVIEW'
  const canSubmit = statusData?.canSubmit
  const latestAppeal = statusData?.latestAppeal
  const currentStrikes = statusData?.violationCount ?? user?.violationCount ?? 7

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Thông Báo Ban */}
        <div className="bg-rose-600 px-6 py-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-700/60 rounded-xl">
              <HiOutlineShieldExclamation className="w-8 h-8 text-rose-100" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tài Khoản Đã Bị Khóa Vĩnh Viễn</h1>
              <p className="text-rose-100 text-sm mt-0.5">
                Tài khoản: <span className="font-mono font-medium">{statusData?.username || user?.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3.5 py-2 border border-rose-400/80 rounded-lg text-sm font-medium text-white hover:bg-rose-700/80 transition-colors"
          >
            <HiOutlineLogout className="w-4 h-4 mr-1.5" />
            Đăng xuất
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Card Thống kê Vi Phạm */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 flex items-start space-x-4">
            <HiOutlineExclamationCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900 space-y-1">
              <div className="font-semibold text-base text-rose-950">
                Ghi nhận vi phạm: {currentStrikes} gậy kỷ luật
              </div>
              <p className="text-rose-800 leading-relaxed">
                Tài khoản của bạn đã đạt ngưỡng xử phạt tối đa. Mọi quyền truy cập mua sắm, bán hàng, đánh giá và giao dịch trên sàn đã bị tạm ngừng hoàn toàn.
              </p>
            </div>
          </div>

          {/* Trường Hợp 1: Có đơn trước đó APPROVED nhưng vẫn >= 7 gậy */}
          {latestAppeal?.status === 'APPROVED' && currentStrikes >= 7 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start space-x-4">
              <HiOutlineCheckCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950">
                  Kết quả đơn xem xét gần nhất: ĐÃ ĐƯỢC CHẤP THUẬN GIẢM 1 GẬY
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Đơn khiếu nại mã <span className="font-mono font-semibold">{latestAppeal.displayCode}</span> của bạn đã được Admin chấp thuận giảm 1 gậy (từ {latestAppeal.oldViolationCount ?? currentStrikes + 1} xuống {latestAppeal.newViolationCount ?? currentStrikes} gậy).
                </p>
                <p className="text-amber-800 text-xs mt-1">
                  Phản hồi từ Admin: "{latestAppeal.response || 'Đã giảm 1 gậy kỷ luật.'}"
                </p>
                <p className="text-amber-900 font-medium text-xs pt-1">
                  Do số gậy hiện tại vẫn còn {currentStrikes} gậy (≥ 7 gậy), tài khoản tiếp tục ở trạng thái khóa. Bạn có thể gửi thêm đơn xem xét tiếp theo dưới đây.
                </p>
              </div>
            </div>
          )}

          {/* Trường Hợp 2: Đã từng bị REJECTED -> Khóa vĩnh viễn không được gửi thêm */}
          {isPermanentlyRejected && (
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 text-center space-y-3">
              <HiOutlineXCircle className="w-12 h-12 text-rose-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                Quyết Định Khóa Vĩnh Viễn Không Thể Khiếu Nại
              </h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Đơn xem xét kỷ luật trước đó của bạn đã bị Quản trị viên từ chối sau khi thẩm tra toàn diện. Theo quy chế của sàn, phán quyết này là chung cuộc và không được phép gửi thêm bất kỳ đơn khiếu nại nào trong tương lai.
              </p>
              {latestAppeal?.response && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 max-w-md mx-auto italic">
                  Lý do từ chối: "{latestAppeal.response}"
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                >
                  <HiOutlineLogout className="w-4 h-4 mr-2" />
                  Đăng xuất khỏi hệ thống
                </button>
              </div>
            </div>
          )}

          {/* Trường Hợp 3: Đang có đơn PENDING */}
          {isPending && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 text-center space-y-4">
              <HiOutlineClock className="w-12 h-12 text-sky-600 mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-sky-950">
                  Đơn Xem Xét Đang Chờ Xử Lý
                </h3>
                <p className="text-sm text-sky-800 mt-1 max-w-lg mx-auto">
                  Bạn đã gửi đơn xem xét kỷ luật mã <span className="font-mono font-semibold">{latestAppeal?.displayCode}</span>. Ban Quản Trị đang tiến hành rà soát dữ liệu và sẽ phản hồi sớm nhất.
                </p>
              </div>

              {latestAppeal && (
                <div className="bg-white border border-sky-100 rounded-lg p-4 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Thời gian nộp:</span>
                    <span>{new Date(latestAppeal.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Nội dung giải trình:</span>
                    <p className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      {latestAppeal.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={fetchStatus}
                  className="inline-flex items-center px-3.5 py-2 border border-sky-300 text-sky-700 bg-white rounded-lg text-sm font-medium hover:bg-sky-50 transition-colors"
                >
                  <HiOutlineRefresh className="w-4 h-4 mr-1.5" />
                  Cập nhật trạng thái
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3.5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                >
                  <HiOutlineLogout className="w-4 h-4 mr-1.5" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          {/* Trường Hợp 4: Được phép nộp đơn mới (canSubmit) */}
          {canSubmit && (
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center">
                  <HiOutlineDocumentText className="w-5 h-5 mr-2 text-rose-600" />
                  Gửi Đơn Xem Xét Kỷ Luật Tài Khoản
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng trình bày rõ nguyên nhân vi phạm, các biện pháp khắc phục và kèm theo hình ảnh đối soát hợp lệ (nếu có). Nếu được chấp thuận, tài khoản sẽ được giảm đúng 1 gậy vi phạm.
                </p>
              </div>

              {/* Textarea Giải trình */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nội dung giải trình <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết nguyên nhân, cam kết tuân thủ và giải trình lý do xin giảm gậy vi phạm..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all text-slate-800"
                  required
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Độ dài tối thiểu: 10 ký tự. Hiện tại: {description.trim().length} ký tự.
                </span>
              </div>

              {/* Upload ảnh bằng chứng: Responsive grid 4 cột chuẩn Master Guidelines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Ảnh minh chứng (Tối đa 4 ảnh JPG/PNG, tối đa 10MB/ảnh)
                  </label>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedFiles.length} / 4 ảnh
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedFiles.map((item, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-24 sm:h-28">
                      <img
                        src={item.previewUrl}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full opacity-90 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Nút Chọn Ảnh - Vô hiệu hóa và làm mờ khi đủ 4/4 ảnh hoặc khi đang submit */}
                  {selectedFiles.length < 4 && (
                    <label
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-24 sm:h-28 transition-all ${submitting
                        ? 'border-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
                        : 'border-slate-300 hover:border-rose-400 bg-slate-50/50 hover:bg-rose-50/30 cursor-pointer'
                        }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        disabled={submitting}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <HiOutlineUpload className="w-6 h-6 text-slate-400 group-hover:text-rose-500 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">
                        Thêm ảnh
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Nút submit */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                  >
                    {submitting ? 'Đang gửi...' : 'Nộp Đơn Xem Xét'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
