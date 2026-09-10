package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.product.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
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

        if (orderItem.getProduct() != null && orderItem.getProduct().getImages() != null && !orderItem.getProduct().getImages().isEmpty()) {
            imageUrl = orderItem.getProduct().getImages().stream()
                    .filter(img -> img.getImageUrl() != null && !img.getImageUrl().isBlank())
                    .sorted(Comparator
                            .comparing(ProductImage::getIsThumbnail, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(ProductImage::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                    )
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
        }

        return OrderItemResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct() != null ? orderItem.getProduct().getId() : null)
                .productName(orderItem.getProduct() != null ? orderItem.getProduct().getName() : null)
                .productImageUrl(imageUrl)
                .quantity(orderItem.getQuantity())
                .unitPrice(orderItem.getUnitPrice())
                .totalPrice(orderItem.getTotalPrice())
                .build();
    }
}

