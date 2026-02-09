package com.marketplace.ecommerce.review.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ReviewStatsResponse {
    private double avgRating;
    private long totalReviews;
    private long withImages;
    private long withComments;

    private Map<Integer, Long> starsCount;
    private Map<Integer, Double> starsPercent;
}
