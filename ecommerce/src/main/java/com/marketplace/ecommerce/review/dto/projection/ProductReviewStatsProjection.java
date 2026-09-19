package com.marketplace.ecommerce.review.dto.projection;

import java.util.UUID;

public interface ProductReviewStatsProjection {
    UUID getProductId();
    Double getAvgRating();
    Long getTotalReviews();
}
