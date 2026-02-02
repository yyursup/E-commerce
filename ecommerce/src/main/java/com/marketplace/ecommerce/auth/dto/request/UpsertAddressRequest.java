package com.marketplace.ecommerce.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertAddressRequest {

    @NotBlank(message = "receiverName is required")
    @Size(max = 100, message = "receiverName max 100 chars")
    private String receiverName;

    @NotBlank(message = "receiverPhone is required")
    @Size(max = 20, message = "receiverPhone max 20 chars")
    @Pattern(
            regexp = "^(\\+84|0)(3|5|7|8|9)\\d{8}$",
            message = "receiverPhone invalid"
    )
    private String receiverPhone;

    @NotBlank(message = "addressLine is required")
    @Size(max = 255, message = "addressLine max 255 chars")
    private String addressLine;

    @Size(max = 100, message = "city max 100 chars")
    private String city;

    @Size(max = 100, message = "district max 100 chars")
    private String district;

    @Size(max = 100, message = "ward max 100 chars")
    private String ward;

    @NotNull(message = "districtId is required")
    private Integer districtId;

    @NotBlank(message = "wardCode is required")
    @Size(max = 50, message = "wardCode max 50 chars")
    private String wardCode;

    private Boolean isDefault;
}
