package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.review.dto.request.ReportReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReportReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReportedReviewResponse;
import com.marketplace.ecommerce.review.dto.response.ReviewReportItemResponse;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.ReviewReport;
import com.marketplace.ecommerce.review.repository.ReviewReportRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReviewReportService;
import com.marketplace.ecommerce.review.valueObjects.ReviewReportReason;
import com.marketplace.ecommerce.review.valueObjects.ReviewReportStatus;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewReportServiceImpl implements ReviewReportService {

    private final ReviewRepository reviewRepository;
    private final ReviewReportRepository reportRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void reportReview(UUID reviewId, UUID accountId, String ip, ReportReviewRequest request) {
        User reporter = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (request.getReason() == ReviewReportReason.OTHER &&
                (request.getNote() == null || request.getNote().isBlank())) {
            throw new CustomException("Please provide report details");
        }

        if (reportRepository.existsByReviewIdAndReporterId(reviewId, reporter.getId())) {
            throw new CustomException("You already reported this review");
        }

        if (review.getStatus() == ReviewStatus.DISABLED) {
            throw new CustomException("Review is disabled and cannot be reported");
        }

        ReviewReport report = new ReviewReport();
        report.setReview(review);
        report.setReporter(reporter);
        report.setReporterIp(ip);
        report.setReason(request.getReason());
        report.setNote(request.getNote());

        reportRepository.save(report);

        long count = reportRepository.countByReviewId(reviewId);
        review.setReportCount((int) count);
        review.setFlagged(true);
        reviewRepository.save(review);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingReportedReviews() {
        return reportRepository.countDistinctReviewByStatus(ReviewReportStatus.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportedReviewResponse> getPendingReportedReviews() {
        List<Object[]> rows = reportRepository.findReportedReviewsGrouped(ReviewReportStatus.PENDING);

        return rows.stream().map(row -> {
            UUID reviewId = (UUID) row[0];
            List<ReviewReportItemResponse> items = reportRepository.findReportsByReviewId(
                            reviewId,
                            ReviewReportStatus.PENDING
                    )
                    .stream()
                    .map(rr -> new ReviewReportItemResponse(
                            rr.getId(),
                            rr.getReason(),
                            rr.getNote(),
                            rr.getReporter() != null ? rr.getReporter().getEmail() : null,
                            rr.getCreatedAt()
                    ))
                    .toList();

            return new ReportedReviewResponse(
                    reviewId,
                    (String) row[1],
                    (String) row[2],
                    (Long) row[3],
                    (LocalDateTime) row[4],
                    items
            );
        }).toList();
    }

    @Override
    @Transactional
    public void updateReport(UUID reviewId, UUID accountId, UpdateReportReviewRequest request) {
        User reporter = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        ReviewReport report = reportRepository
                .findByReviewIdAndReporterId(reviewId, reporter.getId())
                .orElseThrow(() -> new CustomException("Report not found"));

        if (report.getStatus() != ReviewReportStatus.PENDING) {
            throw new CustomException("Report already processed");
        }

        if (request.getReason() == ReviewReportReason.OTHER &&
                (request.getNote() == null || request.getNote().isBlank())) {
            throw new CustomException("Please provide report details");
        }

        report.setReason(request.getReason());
        report.setNote(request.getNote());

        reportRepository.save(report);
    }

    @Override
    @Transactional
    public void hideReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        reportRepository.updateStatusByReviewId(reviewId, ReviewReportStatus.REVIEWED);

        review.setFlagged(true);

        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        UUID reviewOwnerId = review.getUser().getId();
        long flagsIn6Months = reportRepository.countReviewedReportsByUserInPeriod(reviewOwnerId, sixMonthsAgo);

        if (flagsIn6Months >= 5) {
            review.setStatus(ReviewStatus.DISABLED);
        } else {
            review.setStatus(ReviewStatus.HIDDEN);
        }

        reviewRepository.save(review);
    }

    @Override
    @Transactional
    public void ignoreReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        reportRepository.updateStatusByReviewId(reviewId, ReviewReportStatus.REJECTED);
    }
}
