package com.marketplace.ecommerce.auth.dto.response;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserAddressResponse {
    private UUID id;
    private String receiverName;
    private String receiverPhone;
    private String addressLine;
    private String city;
    private String district;
    private String ward;
    private Integer districtId;
    private String wardCode;
    private Boolean isDefault;
    private Instant lastUsedAt;

    public static UserAddressResponse from(UserAddress address) {

        return UserAddressResponse.builder()
                .id(address.getId())
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())
                .addressLine(address.getAddressLine())
                .city(address.getCity())
                .district(address.getDistrict())
                .ward(address.getWard())
                .districtId(address.getDistrictId())
                .wardCode(address.getWardCode())
                .isDefault(address.getIsDefault())
                .lastUsedAt(address.getLastUsedAt())
                .build();
    }
}
