package com.marketplace.ecommerce.statistics.dto.response;

import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShopPerformanceDTO {
    private UUID shopId;
    private String shopName;
    private String logoUrl;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private Integer trustLevel;
    private Boolean isKycVerified;
    private ShopStatus shopStatus;
    private LocalDateTime createdAt;

    // Financial & Order KPIs in selected period
    private BigDecimal totalGmv;            // Tổng doanh số (đơn giao/hoàn tất trong kỳ)
    private BigDecimal settledNetIncome;    // Doanh thu thực nhận sau hoa hồng
    private BigDecimal platformCommission;  // Hoa hồng sàn đóng góp
    private Long completedOrders;           // Số đơn hoàn thành trong kỳ
    private Long totalOrders;               // Tổng số đơn phát sinh trong kỳ
    private Long returnedOrders;            // Số đơn hoàn trả trong kỳ
    private Long cancelledOrders;           // Số đơn hủy trong kỳ
    private Double returnRate;              // Tỷ lệ hoàn trả %

    // Escrow Fund info (Quỹ bảo chứng Shop)
    private UUID fundId;
    private BigDecimal escrowFundBalance;     // Số dư Quỹ ký quỹ sàn
    private BigDecimal requiredEscrowDeposit; // Mức cọc yêu cầu theo bậc sao
    private Boolean isDeficit;                // Quỹ có đang bị thiếu hụt không
    private BigDecimal deficitAmount;         // Số tiền thiếu hụt
    private LocalDateTime deficitDeadline;    // Hạn bù tiền ký quỹ
    private EscrowFundStatus fundStatus;      // ACTIVE, DEFICIT, REFUND_PENDING, REFUNDED
    private BigDecimal pendingEscrowRevenue;  // Tiền ký quỹ đơn hàng đang giam giữ (active escrows)
}
