package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID accountId, UUID productId, CreateReviewRequest request);

    Page<ReviewResponse> getProductReviews(UUID productId, int page, int size, Integer rating, Boolean hasImages, String sortBy);

    ReviewResponse updateReview(UUID accountId, UUID reviewId, UpdateReviewRequest request);

    void deleteReview(UUID accountId, UUID reviewId);

    ReviewResponse getReviewById(UUID reviewId);

    Double getAverageRating(UUID productId);

    long getTotalReviews(UUID productId);
}
