package com.marketplace.ecommerce.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ReportedReviewResponse {

    private UUID reviewId;
    private String reviewContent;
    private String reviewOwnerEmail;
    private long reportCount;
    private LocalDateTime lastReportedAt;
    private List<ReviewReportItemResponse> reports;
}
