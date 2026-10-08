package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.dto.SettlementInfo;
import com.marketplace.ecommerce.payment.dto.request.EscrowSplitSettlementRequest;
import com.marketplace.ecommerce.payment.policy.EscrowPolicy;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/escrow")
@RequiredArgsConstructor
public class EscrowController {

    private final EscrowService escrowService;
    private final EscrowPolicy escrowPolicy;
    private final OrderReturnService orderReturnService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EscrowAdminResponse>> adminList(
            @RequestParam(value = "status", required = false) EscrowStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(escrowService.adminList(status, pageable));
    }

    @PostMapping("/orders/{orderId}/release")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> releaseByOrder(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String reason
    ) {
        escrowPolicy.validateSettlementPreconditions(orderId);
        escrowService.releaseByOrder(orderId);
        String finalNote = (reason != null && !reason.isBlank())
                ? "Ban Quản Trị giải ngân ký quỹ cho Shop: " + reason
                : "Ban Quản Trị giải ngân ký quỹ cho Shop";
        orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.CANCELLED, finalNote);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Escrow released",
                "orderId", orderId
        ));
    }

    @PostMapping("/orders/{orderId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> refundByOrder(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String reason
    ) {
        escrowPolicy.validateSettlementPreconditions(orderId);
        escrowService.refundByOrder(orderId, reason);
        orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED,
                "Ban Quản Trị hoàn tiền ký quỹ cho Người mua: " + (reason != null ? reason : ""));

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Escrow refunded to buyer wallet",
                "orderId", orderId
        ));
    }

    @PostMapping("/orders/{orderId}/split-settle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> splitSettleByOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody EscrowSplitSettlementRequest request
    ) {
        escrowPolicy.validateSettlementPreconditions(orderId);
        escrowService.splitSettleByOrder(
                orderId,
                request.getBuyerPercentage(),
                request.getSellerPercentage(),
                request.getNote()
        );
        orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED,
                String.format("Admin phân chia ký quỹ: Người mua %d%%, Người bán %d%%. %s",
                        request.getBuyerPercentage(), request.getSellerPercentage(),
                        (request.getNote() != null ? request.getNote() : "")));

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Escrow split settlement completed",
                "orderId", orderId
        ));
    }

    @GetMapping("/orders/{orderId}/settlement")
    public ResponseEntity<SettlementInfo> getSettlementByOrderId(@PathVariable UUID orderId) {
        return ResponseEntity.ok(escrowService.getSettlementByOrderId(orderId));
    }
}
