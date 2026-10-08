import { cn } from '../../../../lib/cn'

export default function AdminActionQuickTags({
  actionType,
  targetType,
  currentNote,
  onSelectTag,
  isDark,
  targetTypeLabel,
}) {
  const getReportApproveTags = (type) => {
    switch (type) {
      case 'USER':
        return [
          'Tài khoản có hành vi lừa đảo / gian lận người dùng khác',
          'Quấy rối, đe dọa hoặc dùng từ ngữ xúc phạm',
          'Giả mạo quản trị viên sàn / lừa lấy mã OTP',
          'Tạo tài khoản ảo spam quấy phá cộng đồng',
          'Lạm dụng chính sách mua hàng / bom hàng có chủ đích',
        ]
      case 'REVIEW':
        return [
          'Đánh giá giả mạo / spam review không trung thực',
          'Sử dụng ngôn từ thô tục, xúc phạm hoặc bôi nhọ danh dự',
          'Cố tình đánh giá xấu vô căn cứ phá hoại uy tín shop',
          'Nội dung đánh giá không liên quan đến sản phẩm',
          'Đính kèm hình ảnh phản cảm, vi phạm thuần phong mỹ tục',
        ]
      case 'PRODUCT':
        return [
          'Kinh doanh hàng giả, hàng nhái, vi phạm nhãn hiệu',
          'Mô tả sản phẩm sai sự thật, gian lận thông số kỹ thuật',
          'Hàng hóa thuộc danh mục cấm kinh doanh trên sàn',
          'Hình ảnh sản phẩm phản cảm, vi phạm chính sách hiển thị',
          'Sản phẩm không có nguồn gốc xuất xứ rõ ràng',
        ]
      case 'SHOP':
        return [
          'Gian hàng có dấu hiệu lừa đảo người mua quy mô lớn',
          'Kinh doanh hàng cấm / hàng giả nhiều lần',
          'Thái độ xúc phạm hoặc quấy rối khách hàng',
          'Gian lận đơn hàng / Lập đơn ảo trục lợi chính sách sàn',
          'Vi phạm nghiêm trọng quy chế hoạt động sàn thương mại',
        ]
      case 'ORDER':
      default:
        return [
          'Shop giao sai / thiếu sản phẩm so với đơn đặt',
          'Sản phẩm bị lỗi, hư hỏng không đúng cam kết ban đầu',
          'Shop từ chối hỗ trợ bảo hành / đổi trả theo quy định',
          'Gian hàng có dấu hiệu lừa đảo người mua',
          'Gian lận đơn hàng / Lập đơn ảo trục lợi sàn',
          'Thái độ xúc phạm hoặc quấy rối khách hàng',
        ]
    }
  }

  const renderTagButtons = (tags, activeColorClass = 'bg-rose-600 border-rose-600') => (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelectTag(tag)}
          className={cn(
            'text-[10px] font-medium px-2 py-1 rounded-lg border transition active:scale-95 text-left',
            currentNote === tag
              ? `${activeColorClass} text-white font-bold`
              : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
                : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200',
          )}
        >
          + {tag}
        </button>
      ))}
    </div>
  )

  if (actionType === 'REPORT_APPROVE') {
    return (
      <div className="mb-3">
        <span className="text-[11px] font-bold text-amber-500 block mb-1.5">
          Gợi ý lý do vi phạm ({targetTypeLabel || 'chung'}):
        </span>
        {renderTagButtons(getReportApproveTags(targetType), 'bg-rose-600 border-rose-600')}
      </div>
    )
  }

  if (actionType === 'REPORT_REJECT') {
    const rejectTags = [
      'Không đủ bằng chứng xác thực hành vi vi phạm',
      'Nội dung thuộc tranh chấp bảo hành / khiếu nại thông thường',
      'Hình ảnh đính kèm không liên quan đến đối tượng bị báo cáo',
      'Báo cáo không có căn cứ thực tế',
    ]
    return (
      <div className="mb-3">
        <span className="text-[11px] font-bold text-stone-400 block mb-1.5">Gợi ý lý do bác đơn nhanh:</span>
        {renderTagButtons(rejectTags, 'bg-stone-600 border-stone-600')}
      </div>
    )
  }

  if (actionType === 'APPEAL_APPROVE') {
    const appealApproveTags = [
      'Chấp thuận: Giấy tờ chứng từ hóa đơn hợp lệ và rõ ràng',
      'Chấp thuận: Xác nhận nhầm lẫn trong quá trình kiểm duyệt',
      'Chấp thuận: Đã cung cấp đầy đủ căn cứ giải trình minh oan',
    ]
    return (
      <div className="mb-3">
        <span className="text-[11px] font-bold text-emerald-500 block mb-1.5">Gợi ý lý do chấp thuận nhanh:</span>
        {renderTagButtons(appealApproveTags, 'bg-emerald-600 border-emerald-600')}
      </div>
    )
  }

  if (actionType === 'APPEAL_REJECT') {
    const appealRejectTags = [
      'Từ chối: Hóa đơn chứng từ không có giá trị pháp lý / mờ không rõ',
      'Từ chối: Bằng chứng giải trình không làm rõ được vi phạm',
      'Từ chối: Không cung cấp được ủy quyền phân phối chính hãng',
    ]
    return (
      <div className="mb-3">
        <span className="text-[11px] font-bold text-rose-400 block mb-1.5">Gợi ý lý do từ chối nhanh:</span>
        {renderTagButtons(appealRejectTags, 'bg-rose-600 border-rose-600')}
      </div>
    )
  }

  return null
}
