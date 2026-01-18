package com.marketplace.ecommerce.common;

import java.time.Instant;

public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp
) {
}
