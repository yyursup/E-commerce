/**
 * Danh mục Căn cứ Chính Sách & Quy Định Nền Tảng (Dynamic Platform Policies) chuẩn hóa
 * Tương thích trực tiếp với thực thể PlatformPolicy (bảng platform_policies).
 * Sử dụng làm fallback dự phòng khi dữ liệu API chưa tải kịp.
 */
export const FALLBACK_CLAUSES = [
  {
    code: 'CLAUSE_9_PRODUCT_QUALITY_AND_SPEC_DISPUTE',
    policyKey: 'CLAUSE_9_PRODUCT_QUALITY_AND_SPEC_DISPUTE',
    title: 'Chính Sách Xử Lý Lỗi Kỹ Thuật, Sai Lệch Mô Tả & Thiếu Phụ Kiện (Điều Khoản 9)',
    summary:
      'Gộp các căn cứ giải quyết khiếu nại: Lỗi kỹ thuật chức năng (9.1), sai lệch mô tả / màu sắc / phân loại (9.2), và thiếu phụ kiện / quà tặng cam kết (9.3).',
    description:
      'Gộp các căn cứ giải quyết khiếu nại: Lỗi kỹ thuật chức năng (9.1), sai lệch mô tả / màu sắc / phân loại (9.2), và thiếu phụ kiện / quà tặng cam kết (9.3).',
    category: 'RETURN_REFUND',
  },
  {
    code: 'CLAUSE_8_COUNTERFEIT_AND_PROHIBITED_GOODS',
    policyKey: 'CLAUSE_8_COUNTERFEIT_AND_PROHIBITED_GOODS',
    title: 'Chính Sách Chế Tài Hàng Giả, Hàng Nhái & Hàng Cấm Kinh Doanh (Điều Khoản 8)',
    summary:
      'Căn cứ xử lý vi phạm nghiêm trọng về hàng giả, hàng nhái nhãn hiệu, vi phạm quyền sở hữu trí tuệ hoặc hàng thuộc danh mục cấm kinh doanh trên sàn (Điều 8.2).',
    description:
      'Căn cứ xử lý vi phạm nghiêm trọng về hàng giả, hàng nhái nhãn hiệu, vi phạm quyền sở hữu trí tuệ hoặc hàng thuộc danh mục cấm kinh doanh trên sàn (Điều 8.2).',
    category: 'RETURN_REFUND',
  },
  {
    code: 'CLAUSE_10_SELLER_UNRESPONSIVE_AND_SLA_BREACH',
    policyKey: 'CLAUSE_10_SELLER_UNRESPONSIVE_AND_SLA_BREACH',
    title: 'Quy Định Thời Hạn Thương Lượng 48h & Chế Tài Người Bán Bất Hợp Tác (Điều Khoản 10)',
    summary:
      'Căn cứ phán quyết Người bán thua kiện khi quá hạn SLA 48h không phản hồi khiếu nại hoặc từ chối hợp tác đối soát thỏa đáng cho Người mua (Điều 10.2).',
    description:
      'Căn cứ phán quyết Người bán thua kiện khi quá hạn SLA 48h không phản hồi khiếu nại hoặc từ chối hợp tác đối soát thỏa đáng cho Người mua (Điều 10.2).',
    category: 'SELLER_RULES',
  },
  {
    code: 'CLAUSE_14_BUYER_DISPUTE_REJECTION_STANDARDS',
    policyKey: 'CLAUSE_14_BUYER_DISPUTE_REJECTION_STANDARDS',
    title: 'Quy Chuẩn Bác Bỏ Khiếu Nại & Bảo Vệ Quyền Lợi Người Bán (Điều Khoản 14)',
    summary:
      'Gộp các căn cứ bác khiếu nại: Thiếu video unbox / bằng chứng đối soát (14.1), Hư hỏng do người mua (14.2), Quá hạn bảo vệ 72h (14.3), Lạm dụng chính sách trả hàng (14.4).',
    description:
      'Gộp các căn cứ bác khiếu nại: Thiếu video unbox / bằng chứng đối soát (14.1), Hư hỏng do người mua (14.2), Quá hạn bảo vệ 72h (14.3), Lạm dụng chính sách trả hàng (14.4).',
    category: 'DISCIPLINE',
  },
  {
    code: 'CLAUSE_15_RETURN_PACKAGE_DISPUTE_STANDARDS',
    policyKey: 'CLAUSE_15_RETURN_PACKAGE_DISPUTE_STANDARDS',
    title: 'Quy Chuẩn Phán Quyết Tranh Chấp Kiện Hàng Hoàn Trả (Điều Khoản 15)',
    summary:
      'Gộp các căn cứ bảo vệ Người bán khi nhận kiện hoàn: Kiện hàng hoàn rỗng (15.1), Bị tráo đổi thiết bị / IMEI (15.2), Biến dạng hư hỏng nặng khi giao hoàn (15.3).',
    description:
      'Gộp các căn cứ bảo vệ Người bán khi nhận kiện hoàn: Kiện hàng hoàn rỗng (15.1), Bị tráo đổi thiết bị / IMEI (15.2), Biến dạng hư hỏng nặng khi giao hoàn (15.3).',
    category: 'RETURN_REFUND',
  },
  {
    code: 'RETURN_REFUND_COMPLAINT_POLICY',
    policyKey: 'RETURN_REFUND_COMPLAINT_POLICY',
    title: 'Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền',
    summary:
      'Quy chuẩn khung 4 bước tiếp nhận, thương lượng 48h, phán quyết căn cứ theo điều khoản pháp lý và thực thi chế tài tối cao.',
    description:
      'Quy chuẩn khung 4 bước tiếp nhận, thương lượng 48h, phán quyết căn cứ theo điều khoản pháp lý và thực thi chế tài tối cao.',
    category: 'RETURN_REFUND',
  },
  {
    code: 'PRODUCT_LISTING_AND_CONDITION_STANDARDS',
    policyKey: 'PRODUCT_LISTING_AND_CONDITION_STANDARDS',
    title: 'Tiêu Chuẩn Đăng Bán, Phân Hạng Tình Trạng Like New 99% & Hàng Cấm',
    summary:
      'Quy chuẩn 6 cấp bậc tình trạng thiết bị công nghệ (Brand New đến As-Is), quy định bắt buộc về Serial Number/IMEI và danh mục hàng hóa cấm kinh doanh.',
    description:
      'Quy chuẩn 6 cấp bậc tình trạng thiết bị công nghệ (Brand New đến As-Is), quy định bắt buộc về Serial Number/IMEI và danh mục hàng hóa cấm kinh doanh.',
    category: 'CONDITION_GRADE',
  },
  {
    code: 'ESCROW_PAYMENT_PROTECTION',
    policyKey: 'ESCROW_PAYMENT_PROTECTION',
    title: 'Cơ Chế Ký Quỹ Thanh Toán Bảo Vệ Người Mua (Escrow 72h)',
    summary:
      'Bảo vệ 100% dòng tiền giao dịch, giữ tiền an toàn tại tài khoản ký quỹ trung gian trong thời hạn 72 giờ trải nghiệm sau khi giao hàng.',
    description:
      'Bảo vệ 100% dòng tiền giao dịch, giữ tiền an toàn tại tài khoản ký quỹ trung gian trong thời hạn 72 giờ trải nghiệm sau khi giao hàng.',
    category: 'ESCROW',
  },
  {
    code: 'SHIPPING_AND_CO_INSPECTION_POLICY',
    policyKey: 'SHIPPING_AND_CO_INSPECTION_POLICY',
    title: 'Chính Sách Vận Chuyển GHN Express & Quy Chuẩn Đồng Kiểm',
    summary:
      'Tích hợp tự động cước phí vận chuyển GHN API, quy chuẩn đóng gói chống va đập và quyền đồng kiểm ngoại quan khi nhận kiện hàng.',
    description:
      'Tích hợp tự động cước phí vận chuyển GHN API, quy chuẩn đóng gói chống va đập và quyền đồng kiểm ngoại quan khi nhận kiện hàng.',
    category: 'SHIPPING',
  },
  {
    code: 'SELLER_OPERATING_POLICY',
    policyKey: 'SELLER_OPERATING_POLICY',
    title: 'Quy Chế Hoạt Động Gian Hàng: Định Danh eKYC, Quỹ Ký Quỹ & Phí Sàn',
    summary:
      'Điều kiện mở gian hàng, bắt buộc xác thực VNPT eKYC 2 mặt CCCD, cơ chế duy trì Quỹ Ký Quỹ Shop Escrow Fund và biểu phí hoa hồng sàn.',
    description:
      'Điều kiện mở gian hàng, bắt buộc xác thực VNPT eKYC 2 mặt CCCD, cơ chế duy trì Quỹ Ký Quỹ Shop Escrow Fund và biểu phí hoa hồng sàn.',
    category: 'SELLER_RULES',
  },
  {
    code: 'DISCIPLINE_AND_REPUTATION_SYSTEM',
    policyKey: 'DISCIPLINE_AND_REPUTATION_SYSTEM',
    title: 'Thang Phạt Kỷ Luật Lũy Tiến 1-7 Gậy & Điểm Uy Tín Người Mua 100',
    summary:
      'Hệ thống Trust & Safety 2 chiều: Thang kỷ luật 7 gậy đóng băng gian hàng và Thang điểm uy tín người mua 100 điểm với cơ chế hồi phục 30 ngày.',
    description:
      'Hệ thống Trust & Safety 2 chiều: Thang kỷ luật 7 gậy đóng băng gian hàng và Thang điểm uy tín người mua 100 điểm với cơ chế hồi phục 30 ngày.',
    category: 'DISCIPLINE',
  },
  {
    code: 'PLATFORM_OPERATING_REGULATIONS',
    policyKey: 'PLATFORM_OPERATING_REGULATIONS',
    title: 'Quy Chế Hoạt Động Chung Sàn TMĐT E-commerce',
    summary:
      'Quy chế hoạt động sàn giao dịch thương mại điện tử ban hành căn cứ theo Nghị định số 52/2013/NĐ-CP và Nghị định số 85/2021/NĐ-CP.',
    description:
      'Quy chế hoạt động sàn giao dịch thương mại điện tử ban hành căn cứ theo Nghị định số 52/2013/NĐ-CP và Nghị định số 85/2021/NĐ-CP.',
    category: 'GENERAL',
  },
  {
    code: 'PRIVACY_AND_DATA_PROTECTION',
    policyKey: 'PRIVACY_AND_DATA_PROTECTION',
    title: 'Chính Sách Bảo Mật Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)',
    summary:
      'Cam kết bảo vệ quyền riêng tư, mã hóa mật khẩu một chiều BCrypt, lưu trữ CCCD trong Private MinIO Bucket và không chia sẻ cho bên thứ ba.',
    description:
      'Cam kết bảo vệ quyền riêng tư, mã hóa mật khẩu một chiều BCrypt, lưu trữ CCCD trong Private MinIO Bucket và không chia sẻ cho bên thứ ba.',
    category: 'PRIVACY',
  },
]
