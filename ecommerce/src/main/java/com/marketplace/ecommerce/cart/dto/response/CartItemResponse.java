package com.marketplace.ecommerce.cart.dto.response;

import com.marketplace.ecommerce.cart.entity.CartItem;
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
public class CartItemResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UUID shopId;
    private String shopName;

    public static CartItemResponse fromCartItem(CartItem cartItem) {
        String imageUrl = null;

        if (cartItem.getProduct() != null && cartItem.getProduct().getImages() != null && !cartItem.getProduct().getImages().isEmpty()) {
            imageUrl = cartItem.getProduct().getImages().stream()
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
        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct() != null ? cartItem.getProduct().getId() : null)
                .productName(cartItem.getProduct() != null ? cartItem.getProduct().getName() : null)
                .productImageUrl(imageUrl)
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPrice())
                .totalPrice(cartItem.getTotalPrice())
                .createdAt(cartItem.getCreatedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .shopId(cartItem.getProduct() != null && cartItem.getProduct().getShop() != null ? cartItem.getProduct().getShop().getId() : null)
                .shopName(cartItem.getProduct() != null && cartItem.getProduct().getShop() != null ? cartItem.getProduct().getShop().getName() : null)
                .build();
    }
}
