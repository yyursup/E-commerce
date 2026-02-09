package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.dto.response.ReviewStatsResponse;
import com.marketplace.ecommerce.review.service.ReviewQueryService;
import com.marketplace.ecommerce.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/review")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final ReviewQueryService reviewQueryService;

    @GetMapping("/products/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable UUID productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean hasImages,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, rating, hasImages, pageable));
    }

    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID productId,
            @Valid @ModelAttribute CreateReviewRequest request
    ) {
        ReviewResponse res = reviewService.createReview(u.getAccountId(), productId, request);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId,
            @Valid @ModelAttribute UpdateReviewRequest request
    ) {
        return ResponseEntity.ok(reviewService.updateReview(u.getAccountId(), reviewId, request));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId
    ) {
        reviewService.deleteReview(u.getAccountId(), reviewId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reviews/me")
    public ResponseEntity<ReviewResponse> getMyReview(
            @CurrentUser CurrentUserInfo u,
            @RequestParam UUID productId,
            @RequestParam UUID subOrderId
    ) {
        return ResponseEntity.ok(reviewService.getMyReview(u.getAccountId(), productId, subOrderId));
    }

    @GetMapping("/products/{productId}/reviews/stats")
    public ResponseEntity<ReviewStatsResponse> getStats(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewQueryService.getProductReviewStats(productId));
    }

}
