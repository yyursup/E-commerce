package com.marketplace.ecommerce.request.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterSellerRequest {

    @Size(max = 5000)
    private String description;

    @Size(max = 255)
    private String coverImageUrl;

    @NotBlank
    @Size(max = 150)
    private String shopName;

    @Size(max = 50)
    private String taxCode;

    @NotBlank
    @Size(max = 2000)
    private String address;

    @Size(max = 20)
    private String shopPhone;

    @Size(max = 120)
    private String shopEmail;
}
