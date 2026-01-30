package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.review.dto.response.ReportedReviewResponse;
import com.marketplace.ecommerce.review.service.ReviewReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewReportController {

    private final ReviewReportService reportService;

    @GetMapping("/reports")
    public List<ReportedReviewResponse> listReportedReviews() {
        return reportService.getPendingReportedReviews();
    }

    @PostMapping("/{reviewId}/hide")
    public void hideReview(@PathVariable UUID reviewId) {
        reportService.hideReview(reviewId);
    }

    @PostMapping("/{reviewId}/ignore")
    public void ignoreReview(@PathVariable UUID reviewId) {
        reportService.ignoreReview(reviewId);
    }
}
