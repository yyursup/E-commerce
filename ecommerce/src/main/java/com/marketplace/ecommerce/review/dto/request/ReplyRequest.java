package com.marketplace.ecommerce.review.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReplyRequest {
    @NotNull(message = "Review Id cannot be null")
    private UUID reviewId;
    @NotNull(message = "Reply cannot be null")
    private String reply;
}
