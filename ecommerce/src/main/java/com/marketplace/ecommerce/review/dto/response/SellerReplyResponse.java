package com.marketplace.ecommerce.review.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SellerReplyResponse {
    private String reply;
    private LocalDateTime repliedAt;
    private Boolean editable;
}
