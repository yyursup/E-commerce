package com.marketplace.ecommerce.order.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.order.dto.request.AdminResolveReturnDisputeRequest;
import com.marketplace.ecommerce.order.dto.request.SellerCompleteReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SellerDisputeReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SubmitReturnTrackingRequest;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/returns")
@RequiredArgsConstructor
public class OrderReturnController {

    private final OrderReturnService orderReturnService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrderReturnResponse> getReturnByOrderId(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderReturnService.getReturnByOrderId(orderId));
    }

    @PostMapping("/batch")
    public ResponseEntity<Map<UUID, OrderReturnResponse>> getReturnInfoBatch(@RequestBody List<UUID> orderIds) {
        return ResponseEntity.ok(orderReturnService.getReturnInfoBatch(orderIds));
    }

    @GetMapping("/{returnId}")
    public ResponseEntity<OrderReturnResponse> getReturnDetails(@PathVariable UUID returnId) {
        return ResponseEntity.ok(orderReturnService.getReturnDetails(returnId));
    }

    @PostMapping("/{returnId}/tracking")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'BUSINESS')")
    public ResponseEntity<OrderReturnResponse> submitTracking(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId,
            @RequestBody @Valid SubmitReturnTrackingRequest request
    ) {
        return ResponseEntity.ok(orderReturnService.submitTracking(c.getAccountId(), returnId, request));
    }

    @PostMapping("/{returnId}/confirm-delivered")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'BUSINESS', 'ADMIN')")
    public ResponseEntity<OrderReturnResponse> confirmDelivered(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId
    ) {
        return ResponseEntity.ok(orderReturnService.confirmDelivered(c.getAccountId(), returnId));
    }

    @PostMapping("/{returnId}/confirm-returned")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'BUSINESS')")
    public ResponseEntity<OrderReturnResponse> confirmReturned(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId
    ) {
        return ResponseEntity.ok(orderReturnService.confirmReturned(c.getAccountId(), returnId));
    }

    @PostMapping("/{returnId}/complete")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<OrderReturnResponse> completeReturn(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId,
            @RequestBody @Valid SellerCompleteReturnRequest request
    ) {
        return ResponseEntity.ok(orderReturnService.completeReturn(c.getAccountId(), returnId, request));
    }

    @PostMapping("/{returnId}/dispute")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<OrderReturnResponse> disputeReturn(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId,
            @RequestBody @Valid SellerDisputeReturnRequest request
    ) {
        return ResponseEntity.ok(orderReturnService.disputeReturn(c.getAccountId(), returnId, request));
    }

    @PostMapping("/{returnId}/resolve-dispute")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderReturnResponse> resolveDispute(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID returnId,
            @RequestBody @Valid AdminResolveReturnDisputeRequest request
    ) {
        return ResponseEntity.ok(orderReturnService.resolveDispute(c.getAccountId(), returnId, request));
    }
}
