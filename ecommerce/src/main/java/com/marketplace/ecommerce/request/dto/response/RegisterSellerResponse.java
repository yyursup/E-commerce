package com.marketplace.ecommerce.request.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterSellerResponse {
    private String shopName;
    private String taxCode;
    private String address;
    private String shopPhone;
    private String shopEmail;
}
