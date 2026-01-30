package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.dto.response.ReviewSummaryResponse;
import com.marketplace.ecommerce.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping(value = "/product/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID productId,
            @Valid @ModelAttribute CreateReviewRequest request
    ) {
        ReviewResponse created = reviewService.createReview(u.getAccountId(), productId, request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/product/{productId}")
    public Page<ReviewResponse> getProductReviews(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean hasImages,
            @RequestParam(required = false) String sortBy
    ) {
        return reviewService.getProductReviews(productId, page, size, rating, hasImages, sortBy);
    }

    @GetMapping("/product/{productId}/summary")
    public ReviewSummaryResponse getProductReviewSummary(@PathVariable UUID productId) {
        Double avg = reviewService.getAverageRating(productId);
        long total = reviewService.getTotalReviews(productId);
        return new ReviewSummaryResponse(avg == null ? 0.0 : avg, total);
    }

    @GetMapping("/{reviewId}")
    public ReviewResponse getReviewById(@PathVariable UUID reviewId) {
        return reviewService.getReviewById(reviewId);
    }

    @PutMapping(value = "/{reviewId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> updateReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId,
            @Valid @ModelAttribute UpdateReviewRequest request
    ) {
        ReviewResponse updated = reviewService.updateReview(u.getAccountId(), reviewId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> deleteReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId
    ) {
        reviewService.deleteReview(u.getAccountId(), reviewId);
        return ResponseEntity.noContent().build();
    }
}
