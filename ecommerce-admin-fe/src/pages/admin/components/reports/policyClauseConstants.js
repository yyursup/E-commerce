/**
 * Danh mục 12 Căn cứ Điều khoản Quy chế Sàn TMĐT chuẩn hóa
 * Sử dụng làm fallback dự phòng khi dữ liệu API chưa tải kịp
 */
export const FALLBACK_CLAUSES = [
  {
    code: 'CLAUSE_8_2_FAKE_PRODUCT',
    title: 'Điều khoản 8.2: Hàng giả, hàng nhái hoặc vi phạm bản quyền',
    description:
      'Sản phẩm bị khiếu nại được xác định là hàng giả, hàng nhái hoặc vi phạm quyền sở hữu trí tuệ, vi phạm nghiêm trọng tiêu chuẩn hàng hóa.',
    category: 'SELLER_FAULT',
  },
  {
    code: 'CLAUSE_9_1_HARDWARE_FAULT',
    title: 'Điều khoản 9.1: Lỗi kỹ thuật hoặc hỏng hóc chức năng',
    description:
      'Sản phẩm bị lỗi kỹ thuật từ nhà sản xuất hoặc hỏng hóc chức năng ngay khi nhận hàng, không thể sử dụng bình thường.',
    category: 'SELLER_FAULT',
  },
  {
    code: 'CLAUSE_9_2_MISMATCH_SPECS',
    title: 'Điều khoản 9.2: Giao sai mẫu mã, chủng loại hoặc mô tả',
    description:
      'Sản phẩm giao thực tế sai khác so với thông số, phân loại, màu sắc hoặc mô tả mà Người bán đã công bố.',
    category: 'SELLER_FAULT',
  },
  {
    code: 'CLAUSE_9_3_MISSING_ACCESSORIES',
    title: 'Điều khoản 9.3: Thiếu phụ kiện, bộ phận hoặc quà tặng kèm',
    description:
      'Đơn hàng thiếu linh kiện, phụ kiện hoặc quà tặng bắt buộc đi kèm theo quy chuẩn đóng gói của sản phẩm.',
    category: 'SELLER_FAULT',
  },
  {
    code: 'CLAUSE_10_2_SELLER_UNRESPONSIVE',
    title: 'Điều khoản 10.2: Người bán bất hợp tác hoặc quá hạn phản hồi',
    description:
      'Người bán không phản hồi khiếu nại trong thời hạn quy định hoặc từ chối hợp tác xử lý thỏa đáng cho Người mua.',
    category: 'SELLER_FAULT',
  },
  {
    code: 'CLAUSE_14_1_INSUFFICIENT_EVIDENCE',
    title: 'Điều khoản 14.1: Bằng chứng khiếu nại không đầy đủ hoặc thiếu căn cứ',
    description:
      'Người mua không cung cấp được video mở hộp, hình ảnh đối soát rõ ràng hoặc bằng chứng không đủ cơ sở để quy kết lỗi cho Người bán.',
    category: 'BUYER_FAULT',
  },
  {
    code: 'CLAUSE_14_2_BUYER_DAMAGE',
    title: 'Điều khoản 14.2: Hư hỏng phát sinh do quá trình Người mua sử dụng',
    description:
      'Sản phẩm bị rách tem niêm phong, rơi vỡ, chập cháy hoặc hư hại do Người mua sử dụng không đúng hướng dẫn.',
    category: 'BUYER_FAULT',
  },
  {
    code: 'CLAUSE_14_3_EXPIRED_WINDOW',
    title: 'Điều khoản 14.3: Quá thời hạn khiếu nại theo quy chế sàn',
    description:
      'Yêu cầu khiếu nại được gửi khi đã vượt quá thời hạn bảo vệ quyền lợi sau khi nhận hàng quy định trên Sàn TMĐT.',
    category: 'BUYER_FAULT',
  },
  {
    code: 'CLAUSE_14_4_BUYER_ABUSE',
    title: 'Điều khoản 14.4: Lạm dụng chính sách khiếu nại hoặc từ chối hợp tác',
    description:
      'Người mua từ chối cung cấp thông tin đối soát hoặc có dấu hiệu trục lợi chính sách bảo vệ người tiêu dùng.',
    category: 'BUYER_FAULT',
  },
  {
    code: 'CLAUSE_15_1_RETURN_EMPTY_PARCEL',
    title: 'Điều khoản 15.1: Kiện hàng hoàn trả rỗng hoặc mất cắp ruột',
    description:
      'Gói hàng hoàn trả khi Shop nhận lại hoàn toàn trống rỗng hoặc bị rạch mất ruột sản phẩm bên trong.',
    category: 'RETURN_DISPUTE',
  },
  {
    code: 'CLAUSE_15_2_RETURN_WRONG_ITEM',
    title: 'Điều khoản 15.2: Kiện hàng hoàn trả bị tráo đổi sang sản phẩm khác',
    description:
      'Sản phẩm Người mua gửi trả về không phải là sản phẩm Shop đã giao, có dấu hiệu đánh tráo hàng hóa.',
    category: 'RETURN_DISPUTE',
  },
  {
    code: 'CLAUSE_15_3_RETURN_DAMAGED',
    title: 'Điều khoản 15.3: Hàng hoàn trả bị biến dạng, hư hỏng nặng khi bưu tá giao',
    description:
      'Sản phẩm hoàn về bị vỡ hỏng, trầy xước nặng, không còn nguyên vẹn tem bảo hành hoặc phụ kiện gốc.',
    category: 'RETURN_DISPUTE',
  },
]
