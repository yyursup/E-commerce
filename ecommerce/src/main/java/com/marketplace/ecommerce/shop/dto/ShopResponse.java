package com.marketplace.ecommerce.shop.dto;

import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopResponse {

    private UUID id;
    private String name;
    private String description;
    private String logoUrl;
    private String coverImageUrl;
    private String phoneNumber;
    private String address;
    private ShopStatus status;
    private Float averageRating;
    private LocalDateTime createdAt;

    public static ShopResponse from(Shop s) {
        if (s == null) return null;
        return ShopResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .logoUrl(s.getLogoUrl())
                .coverImageUrl(s.getCoverImageUrl())
                .phoneNumber(s.getPhoneNumber())
                .address(s.getAddress())
                .status(s.getStatus())
                .averageRating(s.getAverageRating() != null ? s.getAverageRating() : 5.0f)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
