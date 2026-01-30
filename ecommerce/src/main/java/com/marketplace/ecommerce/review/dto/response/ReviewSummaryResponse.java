package com.marketplace.ecommerce.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReviewSummaryResponse {
    private double averageRating;
    private long totalReviews;
}
