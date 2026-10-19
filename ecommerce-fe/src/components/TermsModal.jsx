import { useState } from 'react'
import Modal from './Modal'
import {
  HiOutlineShieldCheck,
  HiOutlineScale,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function TermsModal({ open, onClose, onAccept }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'Điều Khoản Chung', icon: HiOutlineScale },
    { id: 'escrow', label: 'Ký Quỹ Escrow', icon: HiOutlineShieldCheck },
    { id: 'returns', label: 'Khiếu Nại & Đổi Trả', icon: HiOutlineTruck },
    { id: 'seller', label: 'Quy Chế Người Bán', icon: HiOutlineCash },
    { id: 'privacy', label: 'Bảo Mật Dữ Liệu', icon: HiOutlineLockClosed },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Điều Khoản Dịch Vụ & Chính Sách Vận Hành Sàn OmniMarket"
      size="2xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 px-6 py-3 overflow-x-auto shrink-0 bg-stone-50/50 dark:bg-slate-900/50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-stone-700 dark:text-slate-300 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <HiOutlineScale className="h-5 w-5" /> 1. Chấp Thuận Điều Khoản Dịch Vụ
                </h4>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Chào mừng bạn đến với Sàn Thương Mại Điện Tử OmniMarket. Khi tạo tài khoản hoặc sử dụng dịch vụ trên hệ thống, bạn cam kết rằng đã đọc, hiểu và đồng ý hoàn toàn với toàn bộ quy chế và điều khoản hoạt động của chúng tôi.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">2. Quyền và Nghĩa vụ của Người dùng</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600 dark:text-slate-400">
                <li>Người dùng phải cung cấp thông tin cá nhân chính xác, đầy đủ và duy nhất (Email, SĐT, Tên đăng nhập).</li>
                <li>Có trách nhiệm tự bảo mật mật khẩu tài khoản và mã xác thực OTP gửi về thiết bị cá nhân.</li>
                <li>Tuyệt đối không sử dụng tài khoản để phát tán mã độc, lừa đảo, giả mạo danh tính cá nhân/tổ chức khác hoặc thực hiện các hành vi rửa tiền.</li>
                <li>Mỗi cá nhân chỉ được đăng ký một tài khoản chính thức để mua sắm hoặc nâng cấp mở gian hàng kinh doanh.</li>
              </ul>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">3. Giới hạn Trách nhiệm của Sàn</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                OmniMarket hoạt động với tư cách là sàn giao dịch TMĐT trung gian, cung cấp hạ tầng kết nối kỹ thuật, cổng thanh toán ký quỹ Escrow bảo vệ và giải quyết khiếu nại. Sàn không trực tiếp sở hữu hoặc phân phối hàng hóa của người bán ngoại trừ các gian hàng Official Mall do đối tác ủy quyền chính thức.
              </p>
            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <HiOutlineShieldCheck className="h-5 w-5" /> Cơ Chế Bảo Vệ Thanh Toán Ký Quỹ Escrow 100%
                </h4>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Toàn bộ tiền thanh toán đơn hàng của Người mua được tạm giữ an toàn trong tài khoản trung gian ký quỹ (Escrow) của Sàn và chỉ giải ngân cho Người bán khi đơn hàng được giao thành công và không phát sinh khiếu nại.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Vòng Đời Trạng Thái Ký Quỹ</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40">
                  <span className="font-bold text-amber-500">HELD (Đang tạm giữ)</span>
                  <p className="text-stone-500 dark:text-slate-400 mt-1">Tiền được giữ an toàn trong suốt thời gian Người bán chuẩn bị hàng và GHN giao hàng.</p>
                </div>
                <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40">
                  <span className="font-bold text-rose-500">DISPUTED (Đóng băng tranh chấp)</span>
                  <p className="text-stone-500 dark:text-slate-400 mt-1">Khi có khiếu nại từ Người mua, tiền bị đóng băng ngay lập tức, ngăn chặn mọi lệnh giải ngân.</p>
                </div>
                <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40">
                  <span className="font-bold text-emerald-500">RELEASED (Đã giải ngân)</span>
                  <p className="text-stone-500 dark:text-slate-400 mt-1">Tiền được chuyển vào ví Người bán sau khi trừ hoa hồng sàn khi Người mua bấm nhận hoặc hết hạn 72h.</p>
                </div>
                <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40">
                  <span className="font-bold text-blue-500">REFUNDED (Đã hoàn tiền)</span>
                  <p className="text-stone-500 dark:text-slate-400 mt-1">Hoàn trả 100% tiền thanh toán cho Người mua khi hủy đơn hoặc khiếu nại thành công.</p>
                </div>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Thời Hạn Kiểm Hàng 72 Giờ</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Người mua có 72 giờ kể từ khi bưu tá GHN giao hàng thành công để kiểm tra tính năng sản phẩm. Nếu không có phản hồi khiếu nại trong thời hạn này, hệ thống tự động hoàn tất đơn hàng và giải ngân tiền cho Người bán.
              </p>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4">
                <h4 className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2">
                  <HiOutlineTruck className="h-5 w-5" /> Quy Trình 4 Bước Khiếu Nại & Đổi Trả Chuẩn Mực
                </h4>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  Mọi tranh chấp được giải quyết minh bạch, công bằng qua 4 bước: B1 (Phân loại & Đóng băng) → B2 (Thương lượng 1:1 trong 48h) → B3 (BQT Phân xử căn cứ 10 điều khoản) → B4 (Thực thi chế tài & Khấu trừ).
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">10 Căn Cứ Điều Khoản Phán Quyết Bắt Buộc</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-slate-800">
                  <strong className="text-rose-600 dark:text-rose-400">Lỗi Người Bán (Bồi thường / Hoàn tiền cho Người mua):</strong>
                  <p className="text-stone-600 dark:text-slate-400 mt-1">
                    Điều khoản 8.2 (Hàng giả, hàng nhái); Điều khoản 9.1 (Lỗi kỹ thuật, hỏng hóc chức năng); Điều khoản 9.2 (Giao sai mẫu mã, chủng loại); Điều khoản 9.3 (Thiếu phụ kiện kèm theo); Điều khoản 10.2 (Người bán bất hợp tác hoặc quá hạn 48h SLA).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-slate-800">
                  <strong className="text-amber-600 dark:text-amber-400">Lỗi Người Mua (Bác bỏ khiếu nại / Giải ngân cho Shop):</strong>
                  <p className="text-stone-600 dark:text-slate-400 mt-1">
                    Điều khoản 14.1 (Thiếu video unbox / Bằng chứng không có căn cứ); Điều khoản 14.2 (Hư hỏng do người mua sử dụng); Điều khoản 14.3 (Quá thời hạn khiếu nại 72h); Điều khoản 14.4 (Trục lợi chính sách).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-slate-800">
                  <strong className="text-purple-600 dark:text-purple-400">Tranh Chấp Kiện Hàng Hoàn Trả (Shop khiếu nại hàng hoàn):</strong>
                  <p className="text-stone-600 dark:text-slate-400 mt-1">
                    Điều khoản 15.1 (Kiện hàng hoàn rỗng hoặc mất ruột); Điều khoản 15.2 (Hàng hoàn bị tráo đổi sang sản phẩm khác); Điều khoản 15.3 (Hàng hoàn bị vỡ hỏng nặng do bọc hàng ẩu).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seller' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4">
                <h4 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <HiOutlineCash className="h-5 w-5" /> Quy Chế Hoạt Động Kênh Người Bán (Merchant Rules)
                </h4>
                <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                  Quy định bắt buộc về eKYC định danh thương nhân, duy trì Quỹ Ký Quỹ Gian Hàng (ShopEscrowFund), quản lý tồn kho và chính sách hoa hồng sàn.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Quỹ Ký Quỹ Gian Hàng (ShopEscrowFund)</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600 dark:text-slate-400">
                <li>Người bán bắt buộc ký quỹ bảo chứng tối thiểu từ 2.000.000đ đến 10.000.000đ tùy theo cấp độ sao uy tín gian hàng.</li>
                <li>Quỹ được dùng để tự động bồi thường cho Người mua khi có phán quyết vi phạm hoặc cấn trừ cước vận chuyển hàng hoàn trả.</li>
                <li>Khi quỹ bị hụt dưới mức tối thiểu (Deficit), Shop có 48 giờ để nạp bổ sung. Quá hạn 48h hệ thống tự động khóa quyền đăng bán sản phẩm mới.</li>
              </ul>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Thang Phạt Điểm Gậy Vi Phạm</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Hệ thống áp dụng cơ chế cộng dồn vi phạm: 3 vi phạm (Cảnh cáo WARNED) → 5 vi phạm (Đình chỉ 14 ngày SUSPENDED) → 7 vi phạm (Khóa vĩnh viễn BANNED và tịch thu quỹ bồi thường). Sau 30 ngày hoạt động chuẩn mực không có vi phạm mới, hệ thống tự động xóa 1 điểm gậy.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <HiOutlineLockClosed className="h-5 w-5" /> Chính Sách Bảo Mật Dữ Liệu Cá Nhân
                </h4>
                <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                  Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân và Tiêu chuẩn An toàn Thông tin Quốc gia.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Thu Thập và Sử Dụng Dữ Liệu</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600 dark:text-slate-400">
                <li>Mật khẩu người dùng được băm mã hóa một chiều bất biến bằng thuật toán BCrypt.</li>
                <li>Dữ liệu giấy tờ tùy thân eKYC được lưu trữ an toàn trong Private Bucket với chữ ký số bảo mật, không công khai ra bên ngoài.</li>
                <li>Sàn chỉ chia sẻ địa chỉ và số điện thoại người nhận cho đối tác vận chuyển GHN Express để phục vụ mục đích giao hàng tận nơi.</li>
                <li>Người dùng có quyền tra cứu, chỉnh sửa thông tin cá nhân hoặc yêu cầu khóa vĩnh viễn tài khoản trong trang Quản lý Hồ sơ.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-stone-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-stone-50 dark:bg-slate-900 shrink-0">
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Bằng việc tiếp tục, bạn xác nhận đã đồng ý với tất cả điều khoản trên.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition"
            >
              Đóng
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept()
                  onClose()
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                Đồng Ý & Tiếp Tục
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
