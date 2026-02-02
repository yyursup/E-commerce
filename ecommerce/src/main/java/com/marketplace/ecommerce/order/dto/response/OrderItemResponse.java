package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.cart.dto.response.CartItemResponse;
import com.marketplace.ecommerce.order.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String productImageUrl;
    private boolean isReviewed;

    public static OrderItemResponse fromOrderItem(OrderItem orderItem) {
        String imageUrl = null;

        if (orderItem.getProduct().getImages() != null && !orderItem.getProduct().getImages().isEmpty()) {
            imageUrl = orderItem.getProduct()
                    .getImages()
                    .iterator()
                    .next()
                    .getImageUrl();
        }

        return OrderItemResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct().getId())
                .productName(orderItem.getProduct().getName())
                .productImageUrl(imageUrl)
                .quantity(orderItem.getQuantity())
                .unitPrice(orderItem.getUnitPrice())
                .totalPrice(orderItem.getTotalPrice())
                .build();
    }
}

