package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.shipping.valueObjects.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private UUID id;
    private String orderNumber;
    private UUID userId;
    private String userName;
    private UUID shopId;
    private String shopName;
    private OrderStatus status;
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String shippingCity;
    private String shippingDistrict;
    private String shippingWard;
    private Integer shippingDistrictId;
    private String shippingWardCode;
    private String notes;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String ghnOrderCode;  // Mã vận đơn GHN (nếu có)
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
