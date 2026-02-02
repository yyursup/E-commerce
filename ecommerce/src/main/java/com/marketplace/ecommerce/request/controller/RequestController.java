package com.marketplace.ecommerce.request.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.service.RegisterSellerService;
import com.marketplace.ecommerce.request.service.ReportService;
import com.marketplace.ecommerce.request.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/request")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;
    private final ReportService reportService;
    private final RegisterSellerService registerSellerService;

    @PostMapping("regis-seller")
    public CreateRequestResponse register(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody RegisterSellerRequest request) {
        return registerSellerService.createSellerRegistration(u.getAccountId(), request);
    }

    @PostMapping("report")
    public CreateRequestResponse report(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody CreateReportRequest request
    ) {
        return reportService.createReport(u.getAccountId(), request);
    }

    @PutMapping("reject")
    @PreAuthorize("hasRole('ADMIN')")
    public RequestResponse reject(
            @CurrentUser CurrentUserInfo u,
            @RequestParam UUID requestId,
            @RequestParam String response
    ) {
        return requestService.rejectRequest(u.getAccountId(), requestId, response);
    }

    @PutMapping("approve")
    @PreAuthorize("hasRole('ADMIN')")
    public RequestResponse approve(
            @CurrentUser CurrentUserInfo u,
            @RequestParam UUID requestId,
            @RequestParam String response
    ) {
        return requestService.approveSellerRegistration(requestId, u.getAccountId(), response);
    }

    @GetMapping
    public Page<CreateRequestResponse> getRequests(
            @CurrentUser CurrentUserInfo u,
            Pageable pageable
    ) {
        return requestService.getRequests(u.getAccountId(), pageable);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<CreateRequestResponse> getAllRequests(Pageable pageable) {
        return requestService.getAllRequests(pageable);
    }

    @GetMapping("/{id}")
    public RequestDetailsResponse getDetails(
            @PathVariable UUID id,
            @CurrentUser CurrentUserInfo u
    ) {
        return requestService.getDetails(id);
    }

}
