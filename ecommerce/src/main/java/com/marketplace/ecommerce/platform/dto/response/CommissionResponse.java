package com.marketplace.ecommerce.platform.dto.response;

import com.marketplace.ecommerce.platform.entity.Commission;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CommissionResponse {

    private UUID orderId;
    private UUID sellerId;
    private String sellerName;
    private BigDecimal orderAmount;
    private BigDecimal commissionAmount;
    /** Tỷ lệ hoa hồng tại thời điểm đơn (%), lấy từ item đầu tiên. */
    private BigDecimal commissionRate;
    private LocalDateTime createdAt;

    public static CommissionResponse from(Commission commission, String sellerName) {
        BigDecimal rate = (commission.getItems() != null && !commission.getItems().isEmpty())
                ? commission.getItems().get(0).getCommissionRate()
                : null;
        return CommissionResponse.builder()
                .orderId(commission.getOrderId())
                .sellerId(commission.getSellerId())
                .sellerName(sellerName)
                .orderAmount(commission.getOrderAmount())
                .commissionAmount(commission.getTotalCommission())
                .commissionRate(rate)
                .createdAt(commission.getCreatedAt())
                .build();
    }
}
