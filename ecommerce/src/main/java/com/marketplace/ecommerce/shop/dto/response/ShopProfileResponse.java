package com.marketplace.ecommerce.shop.dto.response;

import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
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
public class ShopProfileResponse {
    private UUID id;
    private String name;
    private String description;
    private String logoUrl;
    private String coverImageUrl;
    private String phoneNumber;
    private String address;
    private String pickupAddress;
    private String returnAddress;
    private Integer districtId;
    private String wardCode;
    private ShopStatus status;
    private SellerType sellerType;
    private BusinessType businessType;
    private String businessName;
    private Float averageRating;
    private Long reviewCount;
    private Long followerCount;
    private String responseRate;
    private Long productCount;
    private UUID ownerAccountId;
    private LocalDateTime createdAt;

    public static ShopProfileResponse from(Shop shop, Long productCount) {
        return from(shop, productCount, 0L, 0L, null, "100%");
    }

    public static ShopProfileResponse from(Shop shop, Long productCount, Long followerCount, Long reviewCount, Float averageRating, String responseRate) {
        if (shop == null) return null;
        Float finalRating = averageRating != null
                ? averageRating
                : (shop.getAverageRating() != null && shop.getAverageRating() > 0 ? shop.getAverageRating() : null);

        UUID ownerAccountId = (shop.getUser() != null && shop.getUser().getAccount() != null)
                ? shop.getUser().getAccount().getId()
                : null;

        return ShopProfileResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .coverImageUrl(shop.getCoverImageUrl())
                .phoneNumber(shop.getPhoneNumber())
                .address(shop.getAddress())
                .pickupAddress(shop.getPickupAddress())
                .returnAddress(shop.getReturnAddress())
                .districtId(shop.getDistrictId())
                .wardCode(shop.getWardCode())
                .status(shop.getStatus())
                .sellerType(shop.getSellerType())
                .businessType(shop.getBusinessType())
                .businessName(shop.getBusinessName())
                .averageRating(finalRating)
                .reviewCount(reviewCount != null ? reviewCount : 0L)
                .followerCount(followerCount != null ? followerCount : 0L)
                .responseRate(responseRate != null ? responseRate : "100%")
                .productCount(productCount != null ? productCount : 0L)
                .ownerAccountId(ownerAccountId)
                .createdAt(shop.getCreatedAt())
                .build();
    }
}
