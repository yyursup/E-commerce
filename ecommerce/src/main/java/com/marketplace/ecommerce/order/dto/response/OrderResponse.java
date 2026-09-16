package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
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
    private String voucherCode;
    private String shopVoucherCode;
    private BigDecimal shopDiscountAmount;
    private String platformVoucherCode;
    private BigDecimal platformDiscountAmount;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String ghnOrderCode;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponse from(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(OrderItemResponse::fromOrderItem)
                .toList();

        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal shopDiscount = order.getShopDiscountAmount() != null ? order.getShopDiscountAmount() : BigDecimal.ZERO;
        BigDecimal platformDiscount = order.getPlatformDiscountAmount() != null ? order.getPlatformDiscountAmount() : BigDecimal.ZERO;
        BigDecimal sumDiscounts = shopDiscount.add(platformDiscount);
        BigDecimal discountAmount = sumDiscounts.compareTo(BigDecimal.ZERO) > 0
                ? sumDiscounts
                : (order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);

        BigDecimal subtotal = order.getSubtotal() != null
                ? order.getSubtotal()
                : items.stream()
                .map(OrderItemResponse::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = order.getTotal() != null
                ? order.getTotal()
                : subtotal.add(shippingFee).subtract(discountAmount);

        String shopVoucherCode = order.getShopVoucherCode() != null
                ? order.getShopVoucherCode()
                : (order.getShopVoucher() != null ? order.getShopVoucher().getCode() : null);

        String platformVoucherCode = order.getPlatformVoucherCode() != null
                ? order.getPlatformVoucherCode()
                : (order.getPlatformVoucher() != null ? order.getPlatformVoucher().getCode() : null);

        String voucherCode = order.getVoucherCode() != null
                ? order.getVoucherCode()
                : (order.getVoucher() != null ? order.getVoucher().getCode() : null);

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                .shopId(order.getShop() != null ? order.getShop().getId() : null)
                .shopName(order.getShop() != null ? order.getShop().getName() : null)
                .status(order.getStatus())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingAddress(order.getShippingAddress())
                .shippingCity(order.getShippingCity())
                .shippingDistrict(order.getShippingDistrict())
                .shippingWard(order.getShippingWard())
                .shippingDistrictId(order.getShippingDistrictId())
                .shippingWardCode(order.getShippingWardCode())
                .notes(order.getNotes())
                .voucherCode(voucherCode)
                .shopVoucherCode(shopVoucherCode)
                .shopDiscountAmount(shopDiscount)
                .platformVoucherCode(platformVoucherCode)
                .platformDiscountAmount(platformDiscount)
                .discountAmount(discountAmount)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .total(total)
                .ghnOrderCode(order.getGhnOrderCode())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

}
