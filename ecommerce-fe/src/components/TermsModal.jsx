import { useState, useEffect, useMemo } from 'react'
import Modal from './Modal'
import {
  HiOutlineShieldCheck,
  HiOutlineScale,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExternalLink,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineDocumentText,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import policyService from '../services/policy'

// Metadata map for policies
const POLICY_META_MAP = {
  PLATFORM_OPERATING_REGULATIONS: {
    label: 'Quy Chế Hoạt Động',
    icon: HiOutlineScale,
    aliases: ['TERMS_OF_SERVICE', 'GENERAL_TERMS'],
  },
  ESCROW_PAYMENT_PROTECTION: {
    label: 'Ký Quỹ Escrow (72h)',
    icon: HiOutlineShieldCheck,
    aliases: ['ESCROW'],
  },
  RETURN_REFUND_COMPLAINT_POLICY: {
    label: 'Khiếu Nại & Đổi Trả',
    icon: HiOutlineTruck,
    aliases: ['RETURN_REFUND_POLICY', 'RETURNS'],
  },
  PRODUCT_LISTING_AND_CONDITION_STANDARDS: {
    label: 'Tiêu Chuẩn Đăng Bán',
    icon: HiOutlineTag,
    aliases: ['CONDITION_GRADE', 'SECOND_HAND_GRADING'],
  },
  SHIPPING_AND_CO_INSPECTION_POLICY: {
    label: 'Vận Chuyển & Đồng Kiểm',
    icon: HiOutlineTruck,
    aliases: ['SHIPPING_AND_DELIVERY', 'SHIPPING'],
  },
  SELLER_OPERATING_POLICY: {
    label: 'Quy Chế Người Bán & eKYC',
    icon: HiOutlineCash,
    aliases: ['SELLER_OPERATING_REGULATIONS', 'SELLER_POLICY'],
  },
  DISCIPLINE_AND_REPUTATION_SYSTEM: {
    label: 'Kỷ Luật & Uy Tín',
    icon: HiOutlineCheckCircle,
    aliases: ['DISCIPLINE'],
  },
  PRIVACY_AND_DATA_PROTECTION: {
    label: 'Bảo Mật Dữ Liệu',
    icon: HiOutlineLockClosed,
    aliases: ['PRIVACY_POLICY', 'PRIVACY'],
  },
}

// Built-in fallback policies in case backend is offline or delayed
const FALLBACK_POLICIES = [
  {
    policyKey: 'PLATFORM_OPERATING_REGULATIONS',
    title: 'Quy Chế Hoạt Động Chung Sàn TMĐT E-commerce',
    version: '2.0',
    summary: 'Quy chế hoạt động sàn giao dịch thương mại điện tử ban hành căn cứ theo Nghị định số 52/2013/NĐ-CP, Nghị định số 85/2021/NĐ-CP và Luật Bảo vệ quyền lợi người tiêu dùng.',
    content: `### 1. NGUYÊN TẮC CHUNG VÀ ĐỊNH NGHĨA
- **Sàn Giao Dịch TMĐT E-commerce**: Nền tảng thương mại điện tử chuyên sâu ngành hàng thiết bị điện tử, công nghệ thông minh, tích hợp mô hình B2C và C2C, cổng thanh toán ký quỹ Escrow, vận chuyển tự động và cơ chế giải quyết tranh chấp độc lập.
- **Người Mua (Buyer / Customer)**: Tổ chức, cá nhân đăng ký tài khoản hợp lệ để mua sắm thiết bị công nghệ.
- **Người Bán (Seller / Merchant)**: Thương nhân, tổ chức, hộ kinh doanh hoặc cá nhân đã hoàn thành thủ tục đăng ký gian hàng và xác thực định danh điện tử (VNPT eKYC).
- **Ban Quản Trị (BQT / Platform Admin)**: Đơn vị quản lý, giám sát vận hành, kiểm duyệt nội dung, điều phối tài chính và phán quyết tranh chấp độc lập.

### 2. QUYỀN VÀ TRÁCH NHIỆM CỦA CÁC BÊN
- Người mua có quyền được cung cấp thông tin trung thực về sản phẩm, bảo vệ dòng tiền thanh toán qua Escrow và quyền khiếu nại đổi trả.
- Người bán có nghĩa vụ cung cấp hàng hóa đúng cam kết, xuất hóa đơn VAT theo quy định, đóng gói chống sốc an toàn và bảo hành tối thiểu 7 ngày.
- Sàn E-commerce cam kết vận hành hạ tầng công nghệ ổn định, minh bạch số liệu giao dịch, bảo vệ thông tin người dùng và phân xử tranh chấp công bằng.`,
  },
  {
    policyKey: 'ESCROW_PAYMENT_PROTECTION',
    title: 'Cơ Chế Ký Quỹ Thanh Toán Bảo Vệ Người Mua (Escrow 72h)',
    version: '2.0',
    summary: 'Bảo vệ 100% dòng tiền giao dịch, giữ tiền an toàn tại tài khoản ký quỹ trung gian trong thời hạn 72 giờ trải nghiệm sau khi giao hàng.',
    content: `### 1. NGUYÊN TẮC HOẠT ĐỘNG CỐT LÕI (BR-ESC-01)
- Toàn bộ số tiền thanh toán của Người mua (qua cổng thanh toán VNPay hoặc Ví điện tử sàn) không chuyển ngay cho Người bán mà được lưu giữ bất biến tại **Tài Khoản Ký Quỹ Escrow** (\`status = HELD\`).
- Người bán chỉ nhận được doanh thu sau khi giao dịch thỏa mãn đầy đủ các điều kiện nghiệm thu theo quy chế sàn.

### 2. THỜI HẠN 72 GIỜ KIỂM TRA HÀNG (BR-ESC-02)
- Kể từ thời điểm bưu tá Giao Hàng Nhanh (GHN) cập nhật trạng thái **Đã Giao Hàng (\`DELIVERED\`)**, hệ thống kích hoạt đồng hồ đếm ngược **72 giờ bảo vệ quyền lợi người mua**.
- **Trường hợp 1 - Xác nhận hài lòng**: Người mua bấm *"Đã nhận hàng"*, hệ thống lập tức giải ngân (\`RELEASED\`) tiền hàng vào ví Người bán sau khi khấu trừ biểu phí hoa hồng sàn.
- **Trường hợp 2 - Tự động nghiệm thu**: Nếu quá 72 giờ Người mua không phát sinh bất kỳ yêu cầu khiếu nại hay trả hàng nào, hệ thống tự động hoàn tất đơn (\`COMPLETED\`) và giải ngân thanh toán cho gian hàng.
- **Trường hợp 3 - Đóng băng tranh chấp (BR-ESC-03)**: Trong vòng 72 giờ, nếu Người mua gửi yêu cầu khiếu nại (Report), trạng thái ký quỹ lập tức chuyển sang \`DISPUTED\` và toàn bộ số tiền bị khóa chặt cho đến khi có phán quyết cuối cùng từ Ban Quản Trị.

### 3. QUY TRÌNH GIẢI NGÂN & BỒI HOÀN
- Khi Người mua thắng tranh chấp: Hoàn tiền 100% về Ví người mua hoặc phương thức thanh toán gốc trong vòng 24 giờ làm việc.
- Khi Người bán thắng tranh chấp: Tiền hàng được mở khóa giải ngân ngay lập tức kèm phục hồi điểm uy tín nếu có.`,
  },
  {
    policyKey: 'RETURN_REFUND_COMPLAINT_POLICY',
    title: 'Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền',
    version: '2.0',
    summary: 'Quy định chuẩn hóa 4 bước tiếp nhận, thương lượng 1:1 trong 48h, phán quyết căn cứ theo điều khoản pháp lý và thực thi chế tài tối cao.',
    content: `### 1. QUY TRÌNH 4 BƯỚC PHÂN XỬ CHUẨN HÓA
\`\`\`
[Bước 1: Tiếp nhận & Đóng băng Ký quỹ]
                ↓
[Bước 2: Thương lượng trực tiếp 1:1 trong 48h]
                ↓
[Bước 3: Ban Quản Trị Sàn Phán Quyết theo Điều Khoản]
                ↓
[Bước 4: Thực thi Chế tài, Trừ Quỹ Ký Quỹ & Phạt Gậy]
\`\`\`

### 2. BƯỚC 2: THƯƠNG LƯỢNG TRỰC TIẾP 1:1 (SLA 48 GIỜ)
Người bán có tối đa 48 giờ để đưa ra một trong ba phản hồi:
1. **ACCEPT_REFUND**: Chấp thuận hoàn tiền 100% cho Người mua giữ lại sản phẩm.
2. **ACCEPT_RETURN**: Chấp thuận nhận lại hàng đổi trả, hệ thống cấp mã gửi hàng hoàn GHN miễn phí cho Người mua.
3. **REJECT_AND_ESCALATE**: Từ chối yêu cầu, gửi kèm bằng chứng phản hồi lên Ban Quản Trị.
*Lưu ý: Quá 48 giờ Người bán không phản hồi, hệ thống coi là hành vi bất hợp tác và tự động xử phạt Người bán thua kiện.*

### 3. CĂN CỨ PHÁN QUYẾT BẮT BUỘC THEO ĐIỀU KHOẢN PHÁP LÝ (BƯỚC 3)
Mọi quyết định của Quản trị viên bắt buộc phải đính kèm Mã Điều Khoản:
- **Lỗi Người Bán (SELLER_FAULT)**:
  - *Điều khoản 8.2*: Hàng giả, hàng nhái, vi phạm quyền sở hữu trí tuệ.
  - *Điều khoản 9.1*: Hỏng hóc chức năng, lỗi kỹ thuật từ nhà sản xuất.
  - *Điều khoản 9.2*: Giao sai thông số, màu sắc, phân loại hoặc sai mô tả.
  - *Điều khoản 9.3*: Thiếu linh kiện, phụ kiện hoặc quà tặng bắt buộc.
  - *Điều khoản 10.2*: Người bán bất hợp tác hoặc quá hạn SLA 48h.
- **Lỗi Người Mua (BUYER_FAULT)**:
  - *Điều khoản 14.1*: Không cung cấp video unbox hoặc bằng chứng thiếu căn cứ.
  - *Điều khoản 14.2*: Hư hại do Người mua sử dụng sai quy cách kỹ thuật.
  - *Điều khoản 14.3*: Quá hạn bảo vệ 72 giờ theo quy chế sàn.
  - *Điều khoản 14.4*: Lạm dụng khiếu nại nhằm trục lợi bất chính.
- **Tranh Chấp Kiện Hoàn (RETURN_DISPUTE)**:
  - *Điều khoản 15.1*: Kiện hàng hoàn rỗng hoặc mất cắp ruột sản phẩm.
  - *Điều khoản 15.2*: Kiện hàng hoàn bị tráo đổi sang sản phẩm khác.
  - *Điều khoản 15.3*: Hàng hoàn bị va đập, nứt vỡ nặng do đóng gói ẩu.`,
  },
  {
    policyKey: 'PRODUCT_LISTING_AND_CONDITION_STANDARDS',
    title: 'Tiêu Chuẩn Đăng Bán, Phân Hạng Tình Trạng Like New 99% & Hàng Cấm',
    version: '2.0',
    summary: 'Quy chuẩn 6 cấp bậc tình trạng thiết bị công nghệ (Brand New đến As-Is), quy định bắt buộc về Serial Number/IMEI và danh mục hàng hóa cấm kinh doanh.',
    content: `### 1. TIÊU CHUẨN 6 CẤP BẬC TÌNH TRẠNG THIẾT BỊ ĐIỆN TỬ
Đặc thù ngành thiết bị số đòi hỏi minh bạch tuyệt đối tình trạng máy:
- **BRAND_NEW (Mới nguyên seal 100%)**: Còn nguyên seal nhà sản xuất, chưa kích hoạt bảo hành điện tử hoặc mới active dưới 7 ngày, đầy đủ hóa đơn/tem ủy quyền chính hãng.
- **GRADE_LIKE_NEW (Như mới 99%)**: Mở hộp trải nghiệm lướt, không trầy xước mắt thường thấy, pin từ 95% - 100%, đủ phụ kiện zin theo máy.
- **GRADE_VERY_GOOD (Rất tốt 95%)**: Ngoại hình phẩy nhẹ không đáng kể ở viền/góc, màn hình sáng đẹp không ám ố, chức năng phần cứng (Face ID, vân tay, camera, loa) hoàn hảo 100%, pin từ 88% - 94%.
- **GRADE_GOOD (Tốt 90%)**: Thân máy có trầy xước dăm theo thời gian, nội thất nguyên bản chưa qua sửa chữa bo mạch, pin từ 80% - 87%.
- **GRADE_FAIR (Khá 80%)**: Ngoại hình trầy xước rõ, pin có dấu hiệu chai, các chức năng cơ bản vận hành ổn định.
- **GRADE_AS_IS (Xác máy / Bán linh kiện)**: Có lỗi chức năng cụ thể (sọc màn, mất nguồn, lỗi cảm biến), Người bán bắt buộc phải ghi chú công khai mọi lỗi hỏng trong mô tả.

### 2. QUY ĐỊNH BẮT BUỘC VỀ SERIAL NUMBER & BẢO HÀNH
- **Bắt buộc số định danh**: Với Điện thoại, Laptop, Tablet, Máy ảnh giá trị cao, Người bán phải ghi rõ Serial/IMEI trên phiếu gửi hàng hoặc video đóng gói.
- **Nghiêm cấm tuyệt đối**: Hàng dính iCloud/Knox ẩn, máy khóa mạng (lock) câu SIM ghép trá hình bản quốc tế, hàng dựng vỏ thay ruột lừa đảo người tiêu dùng.
- **Bao test tối thiểu 7 ngày**: Mọi sản phẩm công nghệ (kể cả hàng cũ Like New) bắt buộc bảo hành bao test tối thiểu 7 ngày lỗi 1 đổi 1.`,
  },
  {
    policyKey: 'SHIPPING_AND_CO_INSPECTION_POLICY',
    title: 'Chính Sách Vận Chuyển GHN Express & Quy Chuẩn Đồng Kiểm',
    version: '2.0',
    summary: 'Tích hợp tự động cước phí vận chuyển GHN API, quy chuẩn đóng gói chống va đập và quyền đồng kiểm ngoại quan khi nhận kiện hàng.',
    content: `### 1. TỰ ĐỘNG HÓA VẬN CHUYỂN GHN EXPRESS (BR-SHP-01)
- Cước phí vận chuyển được tính toán tự động qua API Giao Hàng Nhanh dựa trên tọa độ địa lý thực tế từ Kho Người Bán đến Địa chỉ Người Mua.
- **Tách đơn đa Shop (BR-SHP-02)**: Giỏ hàng gồm sản phẩm từ nhiều Shop khác nhau sẽ được tự động tách thành các Sub-Order độc lập với mã vận đơn GHN riêng biệt.

### 2. TRÁCH NHIỆM ĐÓNG GÓI CHỐNG SỐC (BR-SHP-03)
- Thiết bị điện tử bắt buộc bọc xốp bóng khí chống sốc tối thiểu 3 lớp.
- Dán tem cảnh báo *"Hàng dễ vỡ - Không đè nén"*, niêm phong bằng băng keo bảo mật có chữ ký hoặc logo của Shop.
- Người bán có trách nhiệm quay video đóng gói ghi rõ nhãn vận đơn và số Serial/IMEI thiết bị.

### 3. QUY ĐỊNH ĐỒNG KIỂM & VIDEO UNBOX (BR-SHP-04)
- Người mua có quyền đồng kiểm ngoại quan kiện hàng cùng bưu tá GHN (tình trạng hộp ngoài, tem niêm phong không bị rách thủng).
- **Bắt buộc quay Video mở hộp (Unbox Video)**: Video quay liên tục 6 mặt kiện hàng, rõ mã vận đơn và không cắt ghép là bằng chứng quyết định bảo vệ Người mua khi xảy ra khiếu nại.`,
  },
  {
    policyKey: 'SELLER_OPERATING_POLICY',
    title: 'Quy Chế Hoạt Động Gian Hàng: Định Danh eKYC, Quỹ Ký Quỹ & Phí Sàn',
    version: '2.0',
    summary: 'Điều kiện mở gian hàng, bắt buộc xác thực VNPT eKYC 2 mặt CCCD, cơ chế duy trì Quỹ Ký Quỹ Shop Escrow Fund và biểu phí hoa hồng sàn.',
    content: `### 1. TIÊU CHUẨN ĐỊNH DANH GIAN HÀNG VNPT EKYC (BR-MCH-01)
- Người bán muốn mở gian hàng bắt buộc phải hoàn thành quy trình định danh điện tử:
  1. Chụp ảnh 2 mặt CCCD gắn chip / Hộ chiếu còn hạn sử dụng.
  2. Quét khuôn mặt sống (Liveness Detection) chống giả mạo Deepfake.
  3. Đối với Doanh nghiệp: Cung cấp Giấy phép ĐKKD và Mã số thuế hợp lệ.
- Địa chỉ kho hàng và kho nhận hoàn phải chuẩn hóa theo địa giới hành chính của bưu cục GHN.

### 2. QUYỀN KÝ QUỸ BẢO CHỨNG GIAN HÀNG (SHOP ESCROW FUND)
Mỗi gian hàng duy trì hạn mức Quỹ ký quỹ bảo chứng dựa theo Cấp bậc sao uy tín:
- **Hạng 1 sao (Cơ bản)**: Tối thiểu 1.000.000 VNĐ.
- **Hạng 2 sao (Tiềm năng)**: Tối thiểu 5.000.000 VNĐ (Giảm 0.2% hoa hồng sàn).
- **Hạng 3 sao (Uy tín Tiêu chuẩn)**: Tối thiểu 20.000.000 VNĐ (Giảm 0.5% hoa hồng sàn, ưu tiên tìm kiếm).
- **Hạng 4 sao (Đối tác Vàng)**: Tối thiểu 50.000.000 VNĐ (Giảm 1.0% hoa hồng sàn, huy hiệu vàng).
- **Hạng 5 sao (Kim Cương)**: Trên 50.000.000 VNĐ (Giảm 1.5% hoa hồng sàn, cam kết bảo chứng tối đa).
- **Bù quỹ hụt trong 48h**: Khi quỹ bị trừ do bồi thường khiếu nại, Người bán có 48 giờ để nạp bù đủ số dư. Quá hạn hệ thống sẽ tạm khóa tính năng đăng bán và cố định lệnh rút tiền.`,
  },
  {
    policyKey: 'DISCIPLINE_AND_REPUTATION_SYSTEM',
    title: 'Thang Phạt Kỷ Luật Lũy Tiến 1-7 Gậy & Điểm Uy Tín Người Mua 100',
    version: '2.0',
    summary: 'Hệ thống Trust & Safety 2 chiều: Thang kỷ luật 7 gậy đóng băng gian hàng và Thang điểm uy tín người mua 100 điểm với cơ chế hồi phục 30 ngày.',
    content: `### 1. THANG KỶ LUẬT 7 GẬY GIAN HÀNG (SHOP PENALTY STRIKES)
- **1 - 2 vi phạm**: Cảnh báo nhắc nhở In-App, trừ 10 điểm uy tín gian hàng.
- **3 vi phạm (WARNED)**: Gắn nhãn cảnh báo vàng trên hồ sơ Shop, giảm 30% thứ hạng hiển thị tìm kiếm.
- **5 vi phạm (SUSPENDED)**: Đình chỉ hoạt động 14 ngày, ẩn toàn bộ sản phẩm khỏi sàn, tạm khóa tính năng rút tiền.
- **7 vi phạm (BANNED)**: **Khóa vĩnh viễn gian hàng**, chấm dứt hợp đồng, tịch thu số dư Quỹ ký quỹ bồi thường cho người tiêu dùng và chuyển hồ sơ sang cơ quan điều tra nếu có dấu hiệu lừa đảo.

### 2. THANG ĐIỂM UY TÍN NGƯỜI MUA (BUYER CREDIBILITY SCORE)
Điểm uy tín tính theo công thức: \`reputationScore = max(0, 100 - violationCount * 15)\`
- **100 điểm (Diamond Trust - 0 gậy)**: Mở toàn bộ phương thức thanh toán COD, ưu tiên xử lý hoàn tiền trong 24h.
- **70 - 85 điểm (Good Standing - 1-2 gậy)**: Giao dịch tiêu chuẩn, ghi nhận cảnh cáo nhẹ.
- **40 - 55 điểm (Warned - 3-4 gậy)**: Diện giám sát giao dịch, bắt buộc cung cấp video unbox khi khiếu nại.
- **15 - 25 điểm (Suspended - 5-6 gậy)**: Khóa phương thức thanh toán COD, bắt buộc thanh toán trả trước qua VNPay.
- **0 điểm (Banned - ≥ 7 gậy)**: **Khóa tài khoản vĩnh viễn**, chặn đăng ký tài khoản mới bằng cùng số điện thoại/CCCD/Email.`,
  },
  {
    policyKey: 'PRIVACY_AND_DATA_PROTECTION',
    title: 'Chính Sách Bảo Mật Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)',
    version: '2.0',
    summary: 'Cam kết bảo vệ quyền riêng tư, mã hóa mật khẩu một chiều BCrypt, lưu trữ CCCD trong Private MinIO Bucket và không chia sẻ dữ liệu cho bên thứ ba.',
    content: `### 1. THU THẬP THÔNG TIN CÁ NHÂN TỐI THIỂU
- Hệ thống chỉ thu thập các dữ liệu cá nhân tối thiểu cần thiết để thực hiện giao dịch: Họ tên, Số điện thoại, Email, Địa chỉ nhận hàng, Tọa độ GHN, và Dữ liệu giấy tờ tùy thân eKYC đối với Người bán.

### 2. MÃ HÓA & TIÊU CHUẨN AN TOÀN DỮ LIỆU
- Mật khẩu tài khoản được mã hóa một chiều bất khả đảo ngược bằng thuật toán BCrypt với salt ngẫu nhiên.
- Hình ảnh thẻ Căn cước công dân và Giấy phép kinh doanh của Người bán được lưu trữ trong **Private Storage Bucket** với đường link ký số (Presigned URL) có thời hạn truy cập nghiêm ngặt.

### 3. CAM KẾT KHÔNG CHIA SẺ BÊN THỨ BA
- Nền tảng cam kết không bán, trao đổi hoặc cung cấp dữ liệu cá nhân người dùng cho bất kỳ bên thứ ba thương mại nào ngoài cơ quan thực thi pháp luật khi có yêu cầu bằng văn bản.`,
  },
]

export default function TermsModal({ open, onClose, onAccept }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [policies, setPolicies] = useState([])
  const [activeKey, setActiveKey] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch dynamic policies when modal opens
  useEffect(() => {
    if (!open) return
    let isMounted = true

    const loadPolicies = async () => {
      try {
        setLoading(true)
        const data = await policyService.getActivePolicies()
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPolicies(data)
          if (!activeKey) {
            setActiveKey(data[0].policyKey)
          }
        } else if (isMounted) {
          setPolicies(FALLBACK_POLICIES)
          if (!activeKey) {
            setActiveKey(FALLBACK_POLICIES[0].policyKey)
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chính sách động cho TermsModal, dùng dữ liệu chuẩn bị sẵn:', err)
        if (isMounted) {
          setPolicies(FALLBACK_POLICIES)
          if (!activeKey) {
            setActiveKey(FALLBACK_POLICIES[0].policyKey)
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPolicies()
    return () => {
      isMounted = false
    }
  }, [open])

  // Resolve metadata for any policy key
  const getPolicyMeta = (key) => {
    if (POLICY_META_MAP[key]) return POLICY_META_MAP[key]
    for (const [pKey, meta] of Object.entries(POLICY_META_MAP)) {
      if (meta.aliases?.includes(key)) {
        return meta
      }
    }
    return {
      label: key.replace(/_/g, ' '),
      icon: HiOutlineDocumentText,
    }
  }

  // Active policy list (using API data or Fallback)
  const displayPolicies = useMemo(() => {
    return policies.length > 0 ? policies : FALLBACK_POLICIES
  }, [policies])

  // Dynamic Tabs list
  const tabs = useMemo(() => {
    return displayPolicies.map((p) => {
      const meta = getPolicyMeta(p.policyKey)
      return {
        key: p.policyKey,
        label: meta.label || p.title,
        icon: meta.icon,
        policy: p,
      }
    })
  }, [displayPolicies])

  // Current active policy
  const currentPolicy = useMemo(() => {
    if (!activeKey) return displayPolicies[0] || null
    return (
      displayPolicies.find((p) => p.policyKey === activeKey) ||
      displayPolicies.find((p) => {
        const meta = getPolicyMeta(p.policyKey)
        return meta.aliases?.includes(activeKey)
      }) ||
      displayPolicies[0] ||
      null
    )
  }, [displayPolicies, activeKey])

  // Ensure activeKey is valid
  useEffect(() => {
    if (displayPolicies.length > 0 && !activeKey) {
      setActiveKey(displayPolicies[0].policyKey)
    }
  }, [displayPolicies, activeKey])

  // Parse inline formatting: **bold**, `code`
  const formatInlineText = (text) => {
    if (!text) return null
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-stone-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="rounded bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-stone-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  // Markdown renderer with strong Light/Dark theme contrast
  const renderContent = (content) => {
    if (!content) return null

    const lines = content.split('\n')
    const elements = []
    let inCodeBlock = false
    let codeBuffer = []

    lines.forEach((line, idx) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${idx}`}
              className="my-3 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-100/90 dark:bg-slate-950 font-mono text-[11px] text-stone-800 dark:text-slate-200 overflow-x-auto whitespace-pre leading-relaxed"
            >
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          )
          codeBuffer = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBuffer.push(line)
        return
      }

      if (!trimmed) {
        elements.push(<div key={`gap-${idx}`} className="h-2" />)
        return
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h3 key={`h1-${idx}`} className="mt-4 mb-2 text-base font-extrabold text-amber-700 dark:text-amber-400">
            {trimmed.replace('# ', '')}
          </h3>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h4 key={`h2-${idx}`} className="mt-3.5 mb-1.5 text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            {trimmed.replace('## ', '')}
          </h4>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h5 key={`h3-${idx}`} className="mt-3 mb-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            {trimmed.replace('### ', '')}
          </h5>
        )
        return
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="my-2.5 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2 rounded-r-xl text-xs font-medium text-amber-950 dark:text-amber-200"
          >
            {formatInlineText(trimmed.replace('> ', ''))}
          </blockquote>
        )
        return
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${idx}`} className="ml-4 list-disc text-xs leading-relaxed text-stone-800 dark:text-slate-200 my-0.5">
            {formatInlineText(trimmed.slice(2))}
          </li>
        )
        return
      }

      if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={`num-${idx}`} className="ml-4 list-decimal text-xs leading-relaxed text-stone-800 dark:text-slate-200 my-0.5">
            {formatInlineText(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        )
        return
      }

      elements.push(
        <p key={`p-${idx}`} className="my-1.5 text-xs text-stone-800 dark:text-slate-200 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      )
    })

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <pre
          key="code-final"
          className="my-3 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-100/90 dark:bg-slate-950 font-mono text-[11px] text-stone-800 dark:text-slate-200 overflow-x-auto whitespace-pre leading-relaxed"
        >
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      )
    }

    return elements
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Điều Khoản Dịch Vụ & Chính Sách Vận Hành Sàn E-commerce"
      size="2xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Navigation Tabs - Horizontal Scrollable with Clean Contrast */}
        <div className="flex items-center gap-1.5 border-b border-stone-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 overflow-x-auto shrink-0 bg-stone-100/70 dark:bg-slate-900/80 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = (currentPolicy?.policyKey === tab.key) || (activeKey === tab.key)
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveKey(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none',
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 font-bold'
                    : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-stone-500 dark:text-slate-400')} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Body (Scrollable, High Contrast in Both Modes) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-stone-800 dark:text-slate-200 space-y-4">
          {loading && displayPolicies.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 dark:text-slate-400">
              Đang tải dữ liệu chính sách từ hệ thống...
            </div>
          ) : currentPolicy ? (
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    {currentPolicy.title}
                  </h3>
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                    {currentPolicy.policyKey}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-stone-100 dark:bg-slate-800 px-2 py-0.5 font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                    Phiên bản {currentPolicy.version || '2.0'}
                  </span>
                  {currentPolicy.effectiveDate && (
                    <span className="flex items-center gap-1 text-stone-500 dark:text-slate-400">
                      <HiOutlineCalendar className="h-3 w-3" />
                      {new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {currentPolicy.summary && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 text-xs text-stone-800 dark:text-amber-200">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <HiOutlineTag className="h-3.5 w-3.5" /> Tóm tắt điều khoản:
                  </span>
                  {currentPolicy.summary}
                </div>
              )}

              {/* Content Body */}
              <div className="text-xs leading-relaxed space-y-1">
                {renderContent(currentPolicy.content)}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
              <h4 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <HiOutlineScale className="h-5 w-5" /> Điều Khoản Sàn Thương Mại Điện Tử
              </h4>
              <p className="mt-1 text-xs text-stone-800 dark:text-amber-200">
                Chào mừng bạn đến với Sàn Thương Mại Điện Tử Chuyên Ngành Đồ Điện Tử & Thiết Bị Công Nghệ E-commerce. Khi sử dụng dịch vụ trên hệ thống, bạn cam kết tuân thủ toàn bộ quy chế và chính sách vận hành của nền tảng.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-stone-100/70 dark:bg-slate-900/80">
          <Link
            to="/policy"
            onClick={onClose}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <HiOutlineExternalLink className="h-4 w-4" />
            Xem toàn bộ trung tâm chính sách nền tảng
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition"
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
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                Tôi đã đọc & đồng ý
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
