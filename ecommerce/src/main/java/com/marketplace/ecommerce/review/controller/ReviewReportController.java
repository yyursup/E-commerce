package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.review.dto.request.ReportReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReportReviewRequest;
import com.marketplace.ecommerce.review.service.ReviewReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/reviews")
@RequiredArgsConstructor
public class ReviewReportController {

    private final ReviewReportService reportService;

    @PostMapping("/{reviewId}/report")
    @PreAuthorize("hasRole('CUSTOMER')")
    public void reportReview(
            @PathVariable UUID reviewId,
            @Valid @RequestBody ReportReviewRequest request,
            @CurrentUser CurrentUserInfo u,
            HttpServletRequest httpRequest
    ) {
        reportService.reportReview(reviewId, u.getAccountId(), httpRequest.getRemoteAddr(), request);
    }

    @PutMapping("/{reviewId}/report")
    @PreAuthorize("hasRole('CUSTOMER')")
    public void updateReport(
            @PathVariable UUID reviewId,
            @Valid @RequestBody UpdateReportReviewRequest request,
            @CurrentUser CurrentUserInfo u
    ) {
        reportService.updateReport(reviewId, u.getAccountId(), request);
    }
}
