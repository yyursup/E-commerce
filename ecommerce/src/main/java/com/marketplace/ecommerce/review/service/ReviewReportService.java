package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.request.ReportReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReportReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReportedReviewResponse;

import java.util.List;
import java.util.UUID;

public interface ReviewReportService {

    void reportReview(UUID reviewId, UUID accountId, String ip, ReportReviewRequest request);

    long countPendingReportedReviews();

    List<ReportedReviewResponse> getPendingReportedReviews();

    void updateReport(UUID reviewId, UUID accountId, UpdateReportReviewRequest request);

    void hideReview(UUID reviewId);

    void ignoreReview(UUID reviewId);
}
