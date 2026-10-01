package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;

import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
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
        private String userEmail;
        private String userPhone;
        private UUID shopId;
        private String shopName;
        private String shopPhone;
        private String shopAddress;
        private String shopOwnerName;
        private String shopOwnerPhone;
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
        private BigDecimal platformCommission;
        private Double commissionRate;
        private String ghnOrderCode;
        private String paymentMethod;
        private List<OrderItemResponse> items;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean hasActiveDispute;
        private String disputeStatus;
        private String disputeReason;
        private OrderReturnResponse returnInfo;

        public static OrderResponse from(Order order) {
                List<OrderItemResponse> items = order.getItems().stream()
                                .map(OrderItemResponse::fromOrderItem)
                                .toList();

                BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
                BigDecimal shopDiscount = order.getShopDiscountAmount() != null ? order.getShopDiscountAmount()
                                : BigDecimal.ZERO;
                BigDecimal platformDiscount = order.getPlatformDiscountAmount() != null
                                ? order.getPlatformDiscountAmount()
                                : BigDecimal.ZERO;
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

                String userEmail = null;
                String userPhone = null;
                if (order.getUser() != null) {
                        userPhone = order.getUser().getPhoneNumber();
                        if (order.getUser().getEmail() != null && !order.getUser().getEmail().isBlank()) {
                                userEmail = order.getUser().getEmail();
                        } else if (order.getUser().getAccount() != null) {
                                userEmail = order.getUser().getAccount().getEmail();
                        }
                }

                String shopPhone = null;
                String shopAddress = null;
                String shopOwnerName = null;
                String shopOwnerPhone = null;
                if (order.getShop() != null) {
                        shopPhone = order.getShop().getPhoneNumber();
                        shopAddress = order.getShop().getAddress() != null ? order.getShop().getAddress() : order.getShop().getPickupAddress();
                        if (order.getShop().getUser() != null) {
                                shopOwnerName = order.getShop().getUser().getFullName();
                                shopOwnerPhone = order.getShop().getUser().getPhoneNumber();
                                if (shopPhone == null || shopPhone.isBlank()) {
                                        shopPhone = shopOwnerPhone;
                                }
                        }
                }

                return OrderResponse.builder()
                                .id(order.getId())
                                .orderNumber(order.getOrderNumber())
                                .userId(order.getUser() != null ? order.getUser().getId() : null)
                                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                                .userEmail(userEmail)
                                .userPhone(userPhone)
                                .shopId(order.getShop() != null ? order.getShop().getId() : null)
                                .shopName(order.getShop() != null ? order.getShop().getName() : null)
                                .shopPhone(shopPhone)
                                .shopAddress(shopAddress)
                                .shopOwnerName(shopOwnerName)
                                .shopOwnerPhone(shopOwnerPhone)
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
                                .platformCommission(
                                                order.getPlatformCommission() != null ? order.getPlatformCommission()
                                                                : BigDecimal.ZERO)
                                .commissionRate(order.getCommissionRate())
                                .ghnOrderCode(order.getGhnOrderCode())
                                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name()
                                                : "COD")
                                .items(items)
                                .createdAt(order.getCreatedAt())
                                .updatedAt(order.getUpdatedAt())
                                .hasActiveDispute(false)
                                .disputeStatus("NONE")
                                .build();
        }

        public static OrderResponse from(Order order, OrderDisputeResponse disputeInfo) {
                OrderResponse res = from(order);
                if (disputeInfo != null) {
                        res.setHasActiveDispute(disputeInfo.isHasActiveDispute());
                        res.setDisputeStatus(disputeInfo.getDisputeStatus());
                        res.setDisputeReason(disputeInfo.getDisputeReason());
                }
                return res;
        }

        public static OrderResponse from(Order order, OrderDisputeResponse disputeInfo, OrderReturnResponse returnInfo) {
                OrderResponse res = from(order, disputeInfo);
                res.setReturnInfo(returnInfo);
                return res;
        }
}
