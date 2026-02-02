package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<EscrowAdminResponse>> adminList(
            @RequestParam(value = "status", required = false) EscrowStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(escrowService.adminList(status, pageable));
    }


    @PostMapping("/orders/{orderId}/release")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> releaseByOrder(
            @PathVariable UUID orderId
    ) {
        escrowService.releaseByOrder(orderId);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Escrow released",
                "orderId", orderId
        ));
    }
}
