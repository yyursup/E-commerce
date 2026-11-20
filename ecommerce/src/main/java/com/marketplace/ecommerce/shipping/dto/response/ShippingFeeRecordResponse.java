package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Một lần giao hàng qua GHN để admin theo dõi phí vận chuyển:
 * OUTBOUND = shop tạo đơn GHN giao đến người mua, RETURN = người mua tạo đơn trả hàng về shop.
 */
@Data
@Builder
public class ShippingFeeRecordResponse {
    private String direction;            // OUTBOUND | RETURN
    private UUID orderId;
    private String orderNumber;
    private String shopName;
    private String buyerName;
    private String createdBy;            // SHOP | BUYER (bên tạo đơn GHN)
    private String carrier;
    private String trackingCode;         // Mã vận đơn GHN
    private BigDecimal fee;              // Phí vận chuyển của lần giao
    private String status;               // Trạng thái đơn (chiều đi) hoặc trạng thái trả hàng (chiều về)
    private String payer;                // BUYER (phí khách đã trả) | SHOP_FUND (trích quỹ ký quỹ shop)
    private boolean deductedFromShopFund; // Chiều về: đã trích quỹ ký quỹ shop chưa
    private LocalDateTime createdAt;
}
