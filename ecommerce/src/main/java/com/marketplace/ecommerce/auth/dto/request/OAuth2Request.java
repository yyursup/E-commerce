package com.marketplace.ecommerce.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuth2Request {
    @NotBlank
    private String token;
}
