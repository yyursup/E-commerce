package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import com.marketplace.ecommerce.payment.dto.SettlementInfo;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
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
public class OrderReturnResponse {

    private UUID id;
    private UUID orderId;
    private String orderNumber;
    private UUID reportId;
    private ReturnStatus status;
    private String returnAddress;
    private String returnRecipientName;
    private String returnRecipientPhone;
    private String returnTrackingCode;
    private String carrierName;
    private BigDecimal shippingFee;
    private String buyerEvidenceUrls;
    private LocalDateTime buyerShippedAt;
    private LocalDateTime buyerShipmentDeadline;
    private LocalDateTime sellerReceivedAt;
    private LocalDateTime sellerInspectionDeadline;
    private ReturnConditionStatus conditionStatus;
    private String conditionNote;
    private String sellerEvidenceUrls;
    private Boolean isRestocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Settlement breakdown (from Transaction records, null if not yet settled)
    private SettlementInfo settlement;

    public static OrderReturnResponse from(OrderReturn r) {
        return from(r, null);
    }

    public static OrderReturnResponse from(OrderReturn r, SettlementInfo settlement) {
        if (r == null) {
            return null;
        }
        return OrderReturnResponse.builder()
                .id(r.getId())
                .orderId(r.getOrder() != null ? r.getOrder().getId() : null)
                .orderNumber(r.getOrder() != null ? r.getOrder().getOrderNumber() : null)
                .reportId(r.getReport() != null ? r.getReport().getId() : null)
                .status(r.getStatus())
                .returnAddress(r.getReturnAddress())
                .returnRecipientName(r.getReturnRecipientName())
                .returnRecipientPhone(r.getReturnRecipientPhone())
                .returnTrackingCode(r.getReturnTrackingCode())
                .carrierName(r.getCarrierName())
                .shippingFee(r.getShippingFee())
                .buyerEvidenceUrls(r.getBuyerEvidenceUrls())
                .buyerShippedAt(r.getBuyerShippedAt())
                .buyerShipmentDeadline(r.getBuyerShipmentDeadline())
                .sellerReceivedAt(r.getSellerReceivedAt())
                .sellerInspectionDeadline(r.getSellerInspectionDeadline())
                .conditionStatus(r.getConditionStatus())
                .conditionNote(r.getConditionNote())
                .sellerEvidenceUrls(r.getSellerEvidenceUrls())
                .isRestocked(r.getIsRestocked())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .settlement(settlement)
                .build();
    }
}
