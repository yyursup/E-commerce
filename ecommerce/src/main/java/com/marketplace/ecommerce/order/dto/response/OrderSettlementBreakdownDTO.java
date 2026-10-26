package com.marketplace.ecommerce.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Bảng Kê Đối Soát Chi Tiết Dòng Tiền Đơn Hàng (Order Settlement Breakdown)
 * Phục vụ nghiệp vụ hạch toán kế toán cho cả 3 bên: Người mua, Người bán và Ban Quản Trị Sàn.
 *
 * Phương trình cân đối dòng tiền kế toán e-Commerce:
 * Tổng Khách Thanh Toán = Tiền Cước GHN + Thực Nhận Của Shop + Doanh Thu Thuần Của Sàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSettlementBreakdownDTO {

    // 1. Cấu phần Khách Hàng thanh toán
    private BigDecimal merchandiseSubtotal; // Tiền hàng niêm yết (Subtotal)
    private BigDecimal shippingFee;          // Cước vận chuyển GHN Express
    private BigDecimal shopDiscount;         // Giảm giá do Shop tự tài trợ
    private BigDecimal platformDiscount;     // Giảm giá trợ giá do Sàn tài trợ
    private BigDecimal buyerTotalPaid;       // Tổng số tiền Người mua thực tế thanh toán

    // 2. Cấu phần phân bổ cho Người Bán (Shop Payout)
    private BigDecimal commissionBaseAmount; // Doanh thu hàng hóa chịu phí hoa hồng (= Subtotal - ShopDiscount)
    private BigDecimal platformCommissionFee;// Phí hoa hồng sàn thu
    private Double commissionRate;           // Tỷ lệ hoa hồng (%)
    private BigDecimal sellerNetIncome;      // Số tiền thực nhận vào Ví của Shop

    // 3. Cấu phần phân bổ cho Nền Tảng (Platform Revenue)
    private BigDecimal platformGrossFee;     // Tổng phí dịch vụ sàn thu từ Shop (= platformCommissionFee)
    private BigDecimal platformSubsidyCost;  // Chi phí Sàn bỏ ra trợ giá voucher (= platformDiscount)
    private BigDecimal platformNetRevenue;   // Doanh thu thuần sàn thực nhận (= Hoa hồng - Trợ giá Voucher)

    // 4. Cấu phần đơn vị vận chuyển
    private BigDecimal carrierSettlement;    // Cước vận chuyển thanh toán cho GHN Express

    // 5. Trạng thái kế toán & đối soát Ký Quỹ Escrow
    private String settlementStatus;         // PENDING_ESCROW | IN_EXPERIENCE_WINDOW | DISPUTE_FROZEN | SETTLED | REFUNDED | CANCELLED
    private String settlementStatusLabel;    // Nhãn hiển thị tiếng Việt
    private String payoutNote;               // Ghi chú hạch toán dòng tiền
}
