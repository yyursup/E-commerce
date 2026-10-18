package com.marketplace.ecommerce.request.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.EscalateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.request.SellerDisputeRespondRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.ReportDetailsResponse;
import com.marketplace.ecommerce.request.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/report")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public CreateRequestResponse report(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody CreateReportRequest request) {
        return reportService.createReport(u.getAccountId(), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{requestId}/handle")
    public ResponseEntity<Void> handleReport(
            @CurrentUser CurrentUserInfo admin,
            @PathVariable UUID requestId,
            @RequestBody @Valid HandleReportRequest request) {
        reportService.handleReport(admin.getAccountId(), requestId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{reportId}/cancel")
    public ResponseEntity<Void> cancelReport(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reportId) {
        reportService.cancelReport(u.getAccountId(), reportId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @PostMapping("/{reportId}/seller-respond")
    public ResponseEntity<Void> sellerRespond(
            @CurrentUser CurrentUserInfo seller,
            @PathVariable UUID reportId,
            @RequestBody @Valid SellerDisputeRespondRequest request) {
        reportService.sellerRespond(seller.getAccountId(), reportId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reportId}/escalate")
    public ResponseEntity<Void> escalateReport(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reportId,
            @RequestBody(required = false) @Valid EscalateReportRequest request) {
        reportService.escalateReport(u.getAccountId(), reportId,
                request != null ? request : new EscalateReportRequest());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-order/{orderId}")
    public ResponseEntity<ReportDetailsResponse> getReportByOrder(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID orderId) {
        ReportDetailsResponse report = reportService.getReportByOrderId(u.getAccountId(), orderId);
        if (report == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(report);
    }

    @GetMapping("/policy-clauses")
    public ResponseEntity<java.util.List<com.marketplace.ecommerce.request.dto.response.DisputePolicyClauseResponse>> getPolicyClauses() {
        return ResponseEntity.ok(reportService.getDisputePolicyClauses());
    }
}
