package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.response.ReviewStatsResponse;

import java.util.UUID;

public interface ReviewQueryService {

    ReviewStatsResponse getProductReviewStats(UUID productId);
}
