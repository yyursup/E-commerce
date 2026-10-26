package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.platform.policy.entity.DisputePolicyClauseEntity;
import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import com.marketplace.ecommerce.platform.policy.repository.DisputePolicyClauseRepository;
import com.marketplace.ecommerce.platform.policy.repository.PlatformPolicyRepository;
import com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PolicySeeder {

    private final PlatformPolicyRepository platformPolicyRepository;
    private final DisputePolicyClauseRepository disputePolicyClauseRepository;

    public void seed() {
        log.info("Starting Platform Policies & Dispute Clauses Seeding...");

        // 1. Seed Dynamic Dispute Policy Clauses
        seedDisputePolicyClauses();

        // 2. Seed Dynamic Platform Policies
        seedPlatformPolicies();

        log.info("Platform Policies & Dispute Clauses Seeding Completed Successfully.");
    }

    private void seedDisputePolicyClauses() {
        for (DisputePolicyClause clause : DisputePolicyClause.values()) {
            if (!disputePolicyClauseRepository.existsByCode(clause.getCode())) {
                DisputePolicyClauseEntity entity = DisputePolicyClauseEntity.builder()
                        .code(clause.getCode())
                        .title(clause.getTitle())
                        .description(clause.getDescription())
                        .category(clause.getCategory())
                        .displayOrder(getClauseDisplayOrder(clause.getCode()))
                        .isActive(true)
                        .build();
                disputePolicyClauseRepository.save(entity);
            }
        }
        log.info("Seeded dispute policy clauses (Total: {})", disputePolicyClauseRepository.count());
    }

    private int getClauseDisplayOrder(String code) {
        return switch (code) {
            case "CLAUSE_8_2_FAKE_PRODUCT" -> 1;
            case "CLAUSE_9_1_HARDWARE_FAULT" -> 2;
            case "CLAUSE_9_2_MISMATCH_SPECS" -> 3;
            case "CLAUSE_9_3_MISSING_ACCESSORIES" -> 4;
            case "CLAUSE_10_2_SELLER_UNRESPONSIVE" -> 5;
            case "CLAUSE_14_1_INSUFFICIENT_EVIDENCE" -> 6;
            case "CLAUSE_14_2_BUYER_DAMAGE" -> 7;
            case "CLAUSE_14_3_EXPIRED_WINDOW" -> 8;
            case "CLAUSE_14_4_BUYER_ABUSE" -> 9;
            case "CLAUSE_15_1_RETURN_EMPTY_PARCEL" -> 10;
            case "CLAUSE_15_2_RETURN_WRONG_ITEM" -> 11;
            case "CLAUSE_15_3_RETURN_DAMAGED" -> 12;
            default -> 99;
        };
    }

    private void seedPlatformPolicies() {
        // Policy 1: Escrow
        initializePolicy(
                "ESCROW_PAYMENT_PROTECTION",
                "Cơ Chế Ký Quỹ Thanh Toán Bảo Vệ Người Mua (Escrow 72h)",
                "Bảo vệ 100% dòng tiền giao dịch, giữ tiền an toàn tại tài khoản ký quỹ trung gian trong thời hạn 72 giờ trải nghiệm sau khi giao hàng.",
                """
                ### 1. NGUYÊN TẮC HOẠT ĐỘNG CỐT LÕI (BR-ESC-01)
                - Toàn bộ số tiền thanh toán của Người mua (qua cổng thanh toán VNPay hoặc Ví điện tử sàn) không chuyển ngay cho Người bán mà được lưu giữ bất biến tại **Tài Khoản Ký Quỹ Escrow** (`status = HELD`).
                - Người bán chỉ nhận được doanh thu sau khi giao dịch thỏa mãn đầy đủ các điều kiện nghiệm thu theo quy chế sàn.

                ### 2. THỜI HẠN 72 GIỜ KIỂM TRA HÀNG (BR-ESC-02)
                - Kể từ thời điểm bưu tá Giao Hàng Nhanh (GHN) cập nhật trạng thái **Đã Giao Hàng (`DELIVERED`)**, hệ thống kích hoạt đồng hồ đếm ngược **72 giờ bảo vệ quyền lợi người mua**.
                - **Trường hợp 1 - Xác nhận hài lòng**: Người mua bấm *"Đã nhận hàng"*, hệ thống lập tức giải ngân (`RELEASED`) tiền hàng vào ví Người bán sau khi khấu trừ biểu phí hoa hồng sàn.
                - **Trường hợp 2 - Tự động nghiệm thu**: Nếu quá 72 giờ Người mua không phát sinh bất kỳ yêu cầu khiếu nại hay trả hàng nào, hệ thống tự động hoàn tất đơn (`COMPLETED`) và giải ngân thanh toán cho gian hàng.
                - **Trường hợp 3 - Đóng băng tranh chấp (BR-ESC-03)**: Trong vòng 72 giờ, nếu Người mua gửi yêu cầu khiếu nại (Report), trạng thái ký quỹ lập tức chuyển sang `DISPUTED` và toàn bộ số tiền bị khóa chặt cho đến khi có phán quyết cuối cùng từ Ban Quản Trị.

                ### 3. QUY TRÌNH GIẢI NGÂN & BỒI HOÀN
                - Khi Người mua thắng tranh chấp: Hoàn tiền 100% về Ví người mua hoặc phương thức thanh toán gốc trong vòng 24 giờ làm việc.
                - Khi Người bán thắng tranh chấp: Tiền hàng được mở khóa giải ngân ngay lập tức kèm phục hồi điểm uy tín nếu có.
                """,
                "ESCROW",
                "ALL",
                "2.0",
                1
        );

        // Policy 2: Return, Refund & Dispute
        initializePolicy(
                "RETURN_REFUND_COMPLAINT_POLICY",
                "Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền",
                "Quy định chuẩn hóa 4 bước tiếp nhận, thương lượng 1:1 trong 48h, phán quyết căn cứ theo điều khoản pháp lý và thực thi chế tài tối cao.",
                """
                ### 1. QUY TRÌNH 4 BƯỚC PHÂN XỬ CHUẨN HÓA
                ```
                [Bước 1: Tiếp nhận & Đóng băng Ký quỹ]
                                ↓
                [Bước 2: Thương lượng trực tiếp 1:1 trong 48h]
                                ↓
                [Bước 3: Ban Quản Trị Sàn Phán Quyết theo Điều Khoản]
                                ↓
                [Bước 4: Thực thi Chế tài, Trừ Quỹ Ký Quỹ & Phạt Gậy]
                ```

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
                  - *Điều khoản 15.3*: Hàng hoàn bị va đập, nứt vỡ nặng do đóng gói ẩu.

                ### 4. TÍNH CHẤT PHÁN QUYẾT CUỐI CÙNG & MIỄN TRỪ KHÁNG CÁO (BƯỚC 4)
                - Phán quyết của Ban Quản Trị là phán quyết tối cao và có hiệu lực thi hành ngay lập tức.
                - Không áp dụng cơ chế kháng cáo hành chính sau khi phán quyết đã ban hành nhằm đảm bảo tính nghiêm minh và bảo vệ toàn diện hệ sinh thái giao dịch.
                """,
                "RETURN_REFUND",
                "ALL",
                "2.0",
                2
        );

        // Policy 3: Condition Grading Standards
        initializePolicy(
                "PRODUCT_LISTING_AND_CONDITION_STANDARDS",
                "Tiêu Chuẩn Đăng Bán, Phân Hạng Tình Trạng Like New 99% & Hàng Cấm",
                "Quy chuẩn 6 cấp bậc tình trạng thiết bị công nghệ (Brand New đến As-Is), quy định bắt buộc về Serial Number/IMEI và danh mục hàng hóa cấm kinh doanh.",
                """
                ### 1. TIÊU CHUẨN 6 CẤP BẬC TÌNH TRẠNG THIẾT BỊ ĐIỆN TỬ
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
                - **Bao test tối thiểu 7 ngày**: Mọi sản phẩm công nghệ (kể cả hàng cũ Like New) bắt buộc bảo hành bao test tối thiểu 7 ngày lỗi 1 đổi 1.

                ### 3. DANH MỤC HÀNG CẤM KINH DOANH TUYỆT ĐỐI
                - Vũ khí, súng đạn, công cụ hỗ trợ, chất kích thích, thuốc lá điện tử, hàng giả, hàng vi phạm sở hữu trí tuệ, phần mềm bẻ khóa, thiết bị phá sóng gian lận.
                """,
                "CONDITION_GRADE",
                "ALL",
                "2.0",
                3
        );

        // Policy 4: Shipping
        initializePolicy(
                "SHIPPING_AND_CO_INSPECTION_POLICY",
                "Chính Sách Vận Chuyển GHN Express & Quy Chuẩn Đồng Kiểm",
                "Tích hợp tự động cước phí vận chuyển GHN API, quy chuẩn đóng gói chống va đập và quyền đồng kiểm ngoại quan khi nhận kiện hàng.",
                """
                ### 1. TỰ ĐỘNG HÓA VẬN CHUYỂN GHN EXPRESS (BR-SHP-01)
                - Cước phí vận chuyển được tính toán tự động qua API Giao Hàng Nhanh dựa trên tọa độ địa lý thực tế từ Kho Người Bán đến Địa chỉ Người Mua.
                - **Tách đơn đa Shop (BR-SHP-02)**: Giỏ hàng gồm sản phẩm từ nhiều Shop khác nhau sẽ được tự động tách thành các Sub-Order độc lập với mã vận đơn GHN riêng biệt.

                ### 2. TRÁCH NHIỆM ĐÓNG GÓI CHỐNG SỐC (BR-SHP-03)
                - Thiết bị điện tử bắt buộc bọc xốp bóng khí chống sốc tối thiểu 3 lớp.
                - Dán tem cảnh báo *"Hàng dễ vỡ - Không đè nén"*, niêm phong bằng băng keo bảo mật có chữ ký hoặc logo của Shop.
                - Người bán có trách nhiệm quay video đóng gói ghi rõ nhãn vận đơn và số Serial/IMEI thiết bị.

                ### 3. QUY ĐỊNH ĐỒNG KIỂM & VIDEO UNBOX (BR-SHP-04)
                - Người mua có quyền đồng kiểm ngoại quan kiện hàng cùng bưu tá GHN (tình trạng hộp ngoài, tem niêm phong không bị rách thủng).
                - **Bắt buộc quay Video mở hộp (Unbox Video)**: Video quay liên tục 6 mặt kiện hàng, rõ mã vận đơn và không cắt ghép là bằng chứng quyết định bảo vệ Người mua khi xảy ra khiếu nại.
                """,
                "SHIPPING",
                "ALL",
                "2.0",
                4
        );

        // Policy 5: Seller Policy
        initializePolicy(
                "SELLER_OPERATING_POLICY",
                "Quy Chế Hoạt Động Gian Hàng: Định Danh eKYC, Quỹ Ký Quỹ & Phí Sàn",
                "Điều kiện mở gian hàng, bắt buộc xác thực VNPT eKYC 2 mặt CCCD, cơ chế duy trì Quỹ Ký Quỹ Shop Escrow Fund và biểu phí hoa hồng sàn.",
                """
                ### 1. TIÊU CHUẨN ĐỊNH DANH GIAN HÀNG VNPT EKYC (BR-MCH-01)
                - Người bán muốn mở gian hàng bắt buộc phải hoàn thành quy trình định danh điện tử:
                  1. Chụp ảnh 2 mặt CCCD gắn chip / Hộ chiếu còn hạn sử dụng.
                  2. Quét khuôn mặt sống (Liveness Detection) chống giả mạo Deepfake.
                  3. Đối với Doanh nghiệp: Cung cấp Giấy phép ĐKKD và Mã số thuế hợp lệ.
                - Địa chỉ kho hàng và kho nhận hoàn phải chuẩn hóa theo địa giới hành chính của bưu cục GHN.

                ### 2. QUỸ KÝ QUỸ BẢO CHỨNG GIAN HÀNG (SHOP ESCROW FUND)
                Mỗi gian hàng duy trì hạn mức Quỹ ký quỹ bảo chứng dựa theo Cấp bậc sao uy tín:
                - **Hạng 1 sao (Cơ bản)**: Tối thiểu 1.000.000 VNĐ.
                - **Hạng 2 sao (Tiềm năng)**: Tối thiểu 5.000.000 VNĐ (Giảm 0.2% hoa hồng sàn).
                - **Hạng 3 sao (Uy tín Tiêu chuẩn)**: Tối thiểu 20.000.000 VNĐ (Giảm 0.5% hoa hồng sàn, ưu tiên tìm kiếm).
                - **Hạng 4 sao (Đối tác Vàng)**: Tối thiểu 50.000.000 VNĐ (Giảm 1.0% hoa hồng sàn, huy hiệu vàng).
                - **Hạng 5 sao (Kim Cương)**: Trên 50.000.000 VNĐ (Giảm 1.5% hoa hồng sàn, cam kết bảo chứng tối đa).
                - **Bù quỹ hụt trong 48h**: Khi quỹ bị trừ do bồi thường khiếu nại, Người bán có 48 giờ để nạp bù đủ số dư. Quá hạn hệ thống sẽ tạm khóa tính năng đăng bán và cố định lệnh rút tiền.

                ### 3. BIỂU PHÍ HOA HỒNG & CHIẾT KHẤU THÂM NIÊN (SENIORITY POLICY)
                - Phí hoa hồng sàn tiêu chuẩn: Dao động từ 5% đến 10% theo từng nhóm ngành hàng thiết bị công nghệ.
                - Ưu đãi thâm niên hoạt động: Giảm thêm từ 0.2% đến 1.0% hoa hồng cho gian hàng hoạt động liên tục 3, 6, 12 tháng không vi phạm.
                """,
                "SELLER_RULES",
                "SELLER",
                "2.0",
                5
        );

        // Policy 6: Discipline & Reputation System
        initializePolicy(
                "DISCIPLINE_AND_REPUTATION_SYSTEM",
                "Thang Phạt Kỷ Luật Lũy Tiến 1-7 Gậy & Điểm Uy Tín Người Mua 100",
                "Hệ thống Trust & Safety 2 chiều: Thang kỷ luật 7 gậy đóng băng gian hàng và Thang điểm uy tín người mua 100 điểm với cơ chế hồi phục 30 ngày.",
                """
                ### 1. THANG KỶ LUẬT 7 GẬY GIAN HÀNG (SHOP PENALTY STRIKES)
                - **1 - 2 vi phạm**: Cảnh báo nhắc nhở In-App, trừ 10 điểm uy tín gian hàng.
                - **3 vi phạm (WARNED)**: Gắn nhãn cảnh báo vàng trên hồ sơ Shop, giảm 30% thứ hạng hiển thị tìm kiếm.
                - **5 vi phạm (SUSPENDED)**: Đình chỉ hoạt động 14 ngày, ẩn toàn bộ sản phẩm khỏi sàn, tạm khóa tính năng rút tiền.
                - **7 vi phạm (BANNED)**: **Khóa vĩnh viễn gian hàng**, chấm dứt hợp đồng, tịch thu số dư Quỹ ký quỹ bồi thường cho người tiêu dùng và chuyển hồ sơ sang cơ quan điều tra nếu có dấu hiệu lừa đảo.

                ### 2. THANG ĐIỂM UY TÍN NGƯỜI MUA (BUYER CREDIBILITY SCORE)
                Điểm uy tín tính theo công thức: `reputationScore = max(0, 100 - violationCount * 15)`
                - **100 điểm (Diamond Trust - 0 gậy)**: Mở toàn bộ phương thức thanh toán COD, ưu tiên xử lý hoàn tiền trong 24h.
                - **70 - 85 điểm (Good Standing - 1-2 gậy)**: Giao dịch tiêu chuẩn, ghi nhận cảnh cáo nhẹ.
                - **40 - 55 điểm (Warned - 3-4 gậy)**: Diện giám sát giao dịch, bắt buộc cung cấp video unbox khi khiếu nại.
                - **15 - 25 điểm (Suspended - 5-6 gậy)**: Khóa phương thức thanh toán COD, bắt buộc thanh toán trả trước qua VNPay.
                - **0 điểm (Banned - ≥ 7 gậy)**: **Khóa tài khoản vĩnh viễn**, chặn đăng ký tài khoản mới bằng cùng số điện thoại/CCCD/Email.

                ### 3. CƠ CHẾ TỰ ĐỘNG HỒI PHỤC (MONTHLY DECAY RULE)
                - Sau **30 ngày liên tục** hoạt động chuẩn mực không phát sinh bất kỳ vi phạm mới nào, hệ thống tự động **xóa 1 điểm gậy (-1 strike)** và hồi phục **+15 điểm uy tín** cho đến khi đạt mức tối đa 100 điểm.
                - Đây là cơ chế duy nhất để phục hồi điểm uy tín và xóa gậy vi phạm.
                """,
                "DISCIPLINE",
                "ALL",
                "2.0",
                6
        );

        // Policy 7: Platform Operating Regulations
        initializePolicy(
                "PLATFORM_OPERATING_REGULATIONS",
                "Quy Chế Hoạt Động Chung Sàn TMĐT E-commerce",
                "Quy chế hoạt động sàn giao dịch thương mại điện tử ban hành căn cứ theo Nghị định số 52/2013/NĐ-CP, Nghị định số 85/2021/NĐ-CP và Luật Bảo vệ quyền lợi người tiêu dùng.",
                """
                ### 1. NGUYÊN TẮC CHUNG VÀ ĐỊNH NGHĨA
                - **Sàn Giao Dịch TMĐT E-commerce**: Nền tảng thương mại điện tử chuyên sâu ngành hàng thiết bị điện tử, công nghệ thông minh, tích hợp mô hình B2C và C2C, cổng thanh toán ký quỹ Escrow, vận chuyển tự động và cơ chế giải quyết tranh chấp độc lập.
                - **Người Mua (Buyer / Customer)**: Tổ chức, cá nhân đăng ký tài khoản hợp lệ để mua sắm thiết bị công nghệ.
                - **Người Bán (Seller / Merchant)**: Thương nhân, tổ chức, hộ kinh doanh hoặc cá nhân đã hoàn thành thủ tục đăng ký gian hàng và xác thực định danh điện tử (VNPT eKYC).
                - **Ban Quản Trị (BQT / Platform Admin)**: Đơn vị quản lý, giám sát vận hành, kiểm duyệt nội dung, điều phối tài chính và phán quyết tranh chấp độc lập.

                ### 2. QUYỀN VÀ TRÁCH NHIỆM CỦA CÁC BÊN
                - Người mua có quyền được cung cấp thông tin trung thực về sản phẩm, bảo vệ dòng tiền thanh toán qua Escrow và quyền khiếu nại đổi trả.
                - Người bán có nghĩa vụ cung cấp hàng hóa đúng cam kết, xuất hóa đơn VAT theo quy định, đóng gói chống sốc an toàn và bảo hành tối thiểu 7 ngày.
                - Sàn E-commerce cam kết vận hành hạ tầng công nghệ ổn định, minh bạch số liệu giao dịch, bảo vệ thông tin người dùng và phân xử tranh chấp công bằng.
                """,
                "GENERAL",
                "ALL",
                "2.0",
                7
        );

        // Policy 8: Privacy
        initializePolicy(
                "PRIVACY_AND_DATA_PROTECTION",
                "Chính Sách Bảo Mật Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)",
                "Cam kết bảo vệ quyền riêng tư, mã hóa mật khẩu một chiều BCrypt, lưu trữ CCCD trong Private MinIO Bucket và không chia sẻ dữ liệu cho bên thứ ba.",
                """
                ### 1. THU THẬP THÔNG TIN CÁ NHÂN TỐI THIỂU
                - Hệ thống chỉ thu thập các dữ liệu cá nhân tối thiểu cần thiết để thực hiện giao dịch: Họ tên, Số điện thoại, Email, Địa chỉ nhận hàng, Tọa độ GHN, và Dữ liệu giấy tờ tùy thân eKYC đối với Người bán.

                ### 2. MÃ HÓA & TIÊU CHUẨN AN TOÀN DỮ LIỆU
                - Mật khẩu tài khoản được mã hóa một chiều bất khả đảo ngược bằng thuật toán BCrypt với salt ngẫu nhiên.
                - Hình ảnh thẻ Căn cước công dân và Giấy phép kinh doanh của Người bán được lưu trữ trong **Private Storage Bucket** với đường link ký số (Presigned URL) có thời hạn truy cập nghiêm ngặt.

                ### 3. CAM KẾT KHÔNG CHIA SẺ BÊN THỨ BA
                - Sàn tuyệt đối không bán, cho thuê hoặc chia sẻ dữ liệu người dùng cho bất kỳ bên thứ ba nào ngoại trừ đối tác vận chuyển (GHN) và cổng thanh toán (VNPay) nhằm thực thi hợp đồng mua bán, hoặc theo yêu cầu bằng văn bản từ cơ quan pháp luật có thẩm quyền.

                ### 4. QUYỀN CỦA CHỦ THỂ DỮ LIỆU
                - Người dùng có quyền truy cập, tra soát, chỉnh sửa thông tin cá nhân hoặc yêu cầu khóa / xóa vĩnh viễn tài khoản bất kỳ lúc nào bằng cách gửi yêu cầu tới Ban Quản Trị sàn.
                """,
                "PRIVACY",
                "ALL",
                "2.0",
                8
        );

        log.info("Seeded platform policies (Total: {})", platformPolicyRepository.count());
    }

    private void initializePolicy(String key, String title, String summary, String content,
                                  String category, String audience, String version, int order) {
        platformPolicyRepository.findByPolicyKey(key)
                .map(existing -> {
                    // Update content if changed
                    existing.setTitle(title);
                    existing.setSummary(summary);
                    existing.setContent(content.trim());
                    existing.setCategory(category);
                    existing.setTargetAudience(audience);
                    existing.setVersion(version);
                    existing.setDisplayOrder(order);
                    existing.setIsActive(true);
                    return platformPolicyRepository.save(existing);
                })
                .orElseGet(() -> {
                    PlatformPolicy policy = PlatformPolicy.builder()
                            .policyKey(key)
                            .title(title)
                            .summary(summary)
                            .content(content.trim())
                            .category(category)
                            .targetAudience(audience)
                            .version(version)
                            .displayOrder(order)
                            .isActive(true)
                            .effectiveDate(LocalDateTime.now())
                            .updatedBy("SYSTEM_SEEDER")
                            .build();
                    return platformPolicyRepository.save(policy);
                });
    }
}
