package com.marketplace.ecommerce.review.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SellerReplyRequest {
    @NotBlank
    @Size(max = 1000)
    private String reply;
}
