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
    private Long productCount;
    private LocalDateTime createdAt;

    public static ShopProfileResponse from(Shop shop, Long productCount) {
        if (shop == null) return null;
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
                .averageRating(shop.getAverageRating() != null ? shop.getAverageRating() : 5.0f)
                .productCount(productCount != null ? productCount : 0L)
                .createdAt(shop.getCreatedAt())
                .build();
    }
}
