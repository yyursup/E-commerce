package com.marketplace.ecommerce.request.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
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
            @Valid @RequestBody CreateReportRequest request
    ) {
        return reportService.createReport(u.getAccountId(), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{requestId}/handle")
    public ResponseEntity<Void> handleReport(
            @CurrentUser CurrentUserInfo admin,
            @PathVariable UUID requestId,
            @RequestBody @Valid HandleReportRequest request
    ) {
        reportService.handleReport(admin.getAccountId(), requestId, request);
        return ResponseEntity.noContent().build();
    }


}
