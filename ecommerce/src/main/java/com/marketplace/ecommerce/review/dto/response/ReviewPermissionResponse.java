package com.marketplace.ecommerce.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReviewPermissionResponse {
    private boolean allowed;
    private boolean warning;
    private String message;
}

