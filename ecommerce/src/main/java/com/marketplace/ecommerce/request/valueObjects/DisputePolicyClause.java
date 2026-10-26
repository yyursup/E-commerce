package com.marketplace.ecommerce.request.valueObjects;

import lombok.Getter;

@Getter
public enum DisputePolicyClause {
    // === NHÓM 1: LỖI NGƯỜI BÁN / BẢO VỆ NGƯỜI MUA (SELLER_FAULT) ===
    CLAUSE_8_2_FAKE_PRODUCT(
            "CLAUSE_8_2_FAKE_PRODUCT",
            "Điều khoản 8.2: Hàng giả, hàng nhái hoặc vi phạm bản quyền",
            "Sản phẩm bị khiếu nại được xác định là hàng giả, hàng nhái hoặc vi phạm quyền sở hữu trí tuệ, vi phạm nghiêm trọng tiêu chuẩn hàng hóa.",
            "SELLER_FAULT"
    ),
    CLAUSE_9_1_HARDWARE_FAULT(
            "CLAUSE_9_1_HARDWARE_FAULT",
            "Điều khoản 9.1: Lỗi kỹ thuật hoặc hỏng hóc chức năng",
            "Sản phẩm bị lỗi kỹ thuật từ nhà sản xuất hoặc hỏng hóc chức năng ngay khi nhận hàng, không thể sử dụng bình thường.",
            "SELLER_FAULT"
    ),
    CLAUSE_9_2_MISMATCH_SPECS(
            "CLAUSE_9_2_MISMATCH_SPECS",
            "Điều khoản 9.2: Giao sai mẫu mã, chủng loại hoặc mô tả",
            "Sản phẩm giao thực tế sai khác so với thông số, phân loại, màu sắc hoặc mô tả mà Người bán đã công bố.",
            "SELLER_FAULT"
    ),
    CLAUSE_9_3_MISSING_ACCESSORIES(
            "CLAUSE_9_3_MISSING_ACCESSORIES",
            "Điều khoản 9.3: Thiếu phụ kiện, bộ phận hoặc quà tặng kèm",
            "Đơn hàng thiếu linh kiện, phụ kiện hoặc quà tặng bắt buộc đi kèm theo quy chuẩn đóng gói của sản phẩm.",
            "SELLER_FAULT"
    ),
    CLAUSE_10_2_SELLER_UNRESPONSIVE(
            "CLAUSE_10_2_SELLER_UNRESPONSIVE",
            "Điều khoản 10.2: Người bán bất hợp tác hoặc quá hạn phản hồi",
            "Người bán không phản hồi khiếu nại trong thời hạn quy định hoặc từ chối hợp tác xử lý thỏa đáng cho Người mua.",
            "SELLER_FAULT"
    ),

    // === NHÓM 2: BẢO VỆ NGƯỜI BÁN / BÁC BỎ KHIẾU NẠI NGƯỜI MUA (BUYER_FAULT) ===
    CLAUSE_14_1_INSUFFICIENT_EVIDENCE(
            "CLAUSE_14_1_INSUFFICIENT_EVIDENCE",
            "Điều khoản 14.1: Bằng chứng khiếu nại không đầy đủ hoặc thiếu căn cứ",
            "Người mua không cung cấp được video mở hộp, hình ảnh đối soát rõ ràng hoặc bằng chứng không đủ cơ sở để quy kết lỗi cho Người bán.",
            "BUYER_FAULT"
    ),
    CLAUSE_14_2_BUYER_DAMAGE(
            "CLAUSE_14_2_BUYER_DAMAGE",
            "Điều khoản 14.2: Hư hỏng phát sinh do quá trình Người mua sử dụng",
            "Sản phẩm bị rách tem niêm phong, rơi vỡ, chập cháy hoặc hư hại do Người mua sử dụng không đúng hướng dẫn.",
            "BUYER_FAULT"
    ),
    CLAUSE_14_3_EXPIRED_WINDOW(
            "CLAUSE_14_3_EXPIRED_WINDOW",
            "Điều khoản 14.3: Quá thời hạn khiếu nại theo quy chế sàn",
            "Yêu cầu khiếu nại được gửi khi đã vượt quá thời hạn bảo vệ quyền lợi sau khi nhận hàng quy định trên Sàn TMĐT.",
            "BUYER_FAULT"
    ),
    CLAUSE_14_4_BUYER_ABUSE(
            "CLAUSE_14_4_BUYER_ABUSE",
            "Điều khoản 14.4: Lạm dụng chính sách khiếu nại hoặc từ chối hợp tác",
            "Người mua từ chối cung cấp thông tin đối soát hoặc có dấu hiệu trục lợi chính sách bảo vệ người tiêu dùng.",
            "BUYER_FAULT"
    ),

    // === NHÓM 3: TRANH CHẤP KIỆN HÀNG HOÀN TRẢ TỪ NGƯỜI BÁN (RETURN_DISPUTE) ===
    CLAUSE_15_1_RETURN_EMPTY_PARCEL(
            "CLAUSE_15_1_RETURN_EMPTY_PARCEL",
            "Điều khoản 15.1: Kiện hàng hoàn trả rỗng hoặc mất cắp ruột",
            "Gói hàng hoàn trả khi Shop nhận lại hoàn toàn trống rỗng hoặc bị rạch mất ruột sản phẩm bên trong.",
            "RETURN_DISPUTE"
    ),
    CLAUSE_15_2_RETURN_WRONG_ITEM(
            "CLAUSE_15_2_RETURN_WRONG_ITEM",
            "Điều khoản 15.2: Kiện hàng hoàn trả bị tráo đổi sang sản phẩm khác",
            "Sản phẩm Người mua gửi trả về không phải là sản phẩm Shop đã giao, có dấu hiệu đánh tráo hàng hóa.",
            "RETURN_DISPUTE"
    ),
    CLAUSE_15_3_RETURN_DAMAGED(
            "CLAUSE_15_3_RETURN_DAMAGED",
            "Điều khoản 15.3: Hàng hoàn trả bị biến dạng, hư hỏng nặng khi bưu tá giao",
            "Sản phẩm hoàn về bị vỡ hỏng, trầy xước nặng, không còn nguyên vẹn tem bảo hành hoặc phụ kiện gốc.",
            "RETURN_DISPUTE"
    );

    private final String code;
    private final String title;
    private final String description;
    private final String category; // SELLER_FAULT, BUYER_FAULT, RETURN_DISPUTE

    DisputePolicyClause(String code, String title, String description, String category) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.category = category;
    }

    public static DisputePolicyClause fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        for (DisputePolicyClause clause : values()) {
            if (clause.code.equalsIgnoreCase(code.trim()) || clause.name().equalsIgnoreCase(code.trim())) {
                return clause;
            }
        }
        return null;
    }
}
