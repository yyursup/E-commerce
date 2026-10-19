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
  const [activeTab, setActiveTab] = useState('seller')

  const tabs = [
    { id: 'seller', label: 'Quy Chế Người Bán', icon: HiOutlineCash },
    { id: 'escrow', label: 'Ký Quỹ Escrow', icon: HiOutlineShieldCheck },
    { id: 'returns', label: 'Khiếu Nại & Đổi Trả', icon: HiOutlineTruck },
    { id: 'general', label: 'Điều Khoản Chung', icon: HiOutlineScale },
    { id: 'privacy', label: 'Bảo Mật Dữ Liệu', icon: HiOutlineLockClosed },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quy Chế Hoạt Động & Điều Khoản Kênh Người Bán OmniMarket"
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
          {activeTab === 'seller' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4">
                <h4 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <HiOutlineCash className="h-5 w-5" /> 1. Quy Định Mở Gian Hàng & Định Danh eKYC
                </h4>
                <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                  Người bán bắt buộc phải hoàn thành quy trình định danh điện tử VNPT eKYC (CCCD/CMND + Nhận diện khuôn mặt sinh trắc học) trước khi được duyệt đăng bán sản phẩm.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">2. Quỹ Ký Quỹ Gian Hàng (ShopEscrowFund)</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600 dark:text-slate-400">
                <li>Người bán bắt buộc ký quỹ bảo chứng tối thiểu từ 2.000.000đ đến 10.000.000đ tùy theo Cấp độ uy tín sao.</li>
                <li>Quỹ này dùng để bảo đảm thực hiện hợp đồng, bồi thường cho Người mua khi có phán quyết vi phạm chính sách hoặc khấu trừ cước vận chuyển kiện hàng hoàn trả.</li>
                <li>Trường hợp Quỹ bị âm hoặc dưới mức tối thiểu (Deficit), Shop có 48 giờ để nạp bổ sung. Quá hạn 48h hệ thống sẽ tạm khóa tính năng đăng bán sản phẩm mới.</li>
              </ul>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">3. Thang Phạt Vi Phạm (Strikes Discipline Ladder)</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Hệ thống áp dụng cơ chế cộng dồn vi phạm tự động: 3 vi phạm (Cảnh cáo WARNED) → 5 vi phạm (Đình chỉ 14 ngày SUSPENDED) → 7 vi phạm (Khóa vĩnh viễn BANNED và chấm dứt tư cách người bán). Sau 30 ngày hoạt động chuẩn mực không phát sinh vi phạm, hệ thống tự động xóa 1 điểm phạt.
              </p>
            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <HiOutlineShieldCheck className="h-5 w-5" /> Cơ Chế Thanh Toán Ký Quỹ Escrow
                </h4>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Tiền hàng của Người mua được tạm giữ trong tài khoản Escrow. Người bán sẽ nhận được giải ngân vào Ví Shop sau khi Người mua xác nhận nhận hàng hoặc sau 72 giờ kể từ khi giao hàng thành công mà không có khiếu nại.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Khấu Trừ Hoa Hồng Sàn</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Khi giải ngân đơn hàng, hệ thống tự động khấu trừ tỷ lệ hoa hồng sàn theo từng ngành hàng (từ 5% - 10%). Người bán có thâm niên trên 6 tháng hoặc 12 tháng với tỷ lệ hủy đơn thấp sẽ được hưởng chính sách giảm trừ hoa hồng ưu đãi.
              </p>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4">
                <h4 className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2">
                  <HiOutlineTruck className="h-5 w-5" /> Trách Nhiệm Phản Hồi Khiếu Nại (SLA 48 Giờ)
                </h4>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  Khi Người mua khiếu nại đơn hàng, Người bán có thời hạn tối đa 48 giờ để phản hồi thương lượng 1:1. Quá hạn 48 giờ không phản hồi, hệ thống sẽ tự động chuyển vụ việc lên Ban Quản Trị sàn xử lý theo diện bất hợp tác.
                </p>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white">Quyền Khiếu Nại Kiện Hàng Hoàn Trả (Seller Return Dispute)</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Khi nhận lại kiện hàng đổi trả từ bưu tá GHN, Người bán có 72 giờ để kiểm tra sản phẩm. Nếu kiện hàng bị rỗng, tráo đổi hàng hoặc hư hỏng nặng do lỗi người mua, Người bán có quyền khiếu nại kiện hàng hoàn lên Ban Quản Trị sàn kèm video unbox rõ nét để được bảo vệ quyền lợi giải ngân.
              </p>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-base text-stone-900 dark:text-white">Quy Định Đăng Bán Hàng Hóa</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Nghiêm cấm tuyệt đối hành vi đăng bán hàng giả, hàng nhái, hàng vi phạm bản quyền thương hiệu, vũ khí, chất kích thích, thuốc lá điện tử, hàng cấm theo quy định của pháp luật Việt Nam. Vi phạm sẽ bị gỡ sản phẩm lập tức, phạt điểm gậy và trừ Quỹ ký quỹ gian hàng.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="font-bold text-base text-stone-900 dark:text-white">Bảo Mật & Tuân Thủ Pháp Luật</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                Người bán cam kết bảo mật thông tin khách hàng nhận được từ đơn hàng, chỉ sử dụng để đóng gói và gửi hàng, tuyệt đối không tiết lộ, mua bán hoặc sử dụng trái phép dữ liệu khách hàng theo quy định tại Nghị định 13/2023/NĐ-CP.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-stone-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-stone-50 dark:bg-slate-900 shrink-0">
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Bằng việc tiếp tục, bạn xác nhận đã đồng ý với toàn bộ Quy chế Người bán.
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
