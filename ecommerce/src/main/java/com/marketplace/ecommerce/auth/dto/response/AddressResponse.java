package com.marketplace.ecommerce.auth.dto.response;

import com.marketplace.ecommerce.auth.entity.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {
    private UUID id;
    private String receiverName;
    private String receiverPhone;
    private String addressLine;
    private String city;
    private String district;
    private String ward;
    private Integer districtId;
    private String wardCode;

    public static AddressResponse from(UserAddress a) {
        return AddressResponse.builder()
                .id(a.getId())
                .receiverName(a.getReceiverName())
                .receiverPhone(a.getReceiverPhone())
                .addressLine(a.getAddressLine())
                .city(a.getCity())
                .district(a.getDistrict())
                .ward(a.getWard())
                .districtId(a.getDistrictId())
                .wardCode(a.getWardCode())
                .build();
    }
}
