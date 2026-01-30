package com.marketplace.ecommerce.review.dto.response;

import com.marketplace.ecommerce.review.valueObjects.ReviewReportReason;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ReviewReportItemResponse {

    private UUID reportId;
    private ReviewReportReason reason;
    private String note;
    private String reporterEmail;
    private LocalDateTime createdAt;
}
