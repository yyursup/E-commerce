package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID accountId, UUID productId, CreateReviewRequest request);

    ReviewResponse updateReview(UUID accountId, UUID reviewId, UpdateReviewRequest request);

    void deleteReview(UUID accountId, UUID reviewId);

    Page<ReviewResponse> getProductReviews(UUID productId,  Integer rating,  Boolean hasImages, Pageable pageable);

    ReviewResponse getMyReview(UUID accountId, UUID productId, UUID subOrderId);
}
