package com.marketplace.ecommerce.platform.policy.controller;

import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;
import com.marketplace.ecommerce.platform.policy.service.PlatformPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1")
@RequiredArgsConstructor
public class PlatformPolicyController {

    private final PlatformPolicyService platformPolicyService;

    // =========================================================================
    // PUBLIC APIS (Khách hàng, Người bán, Khách vãng lai, Toàn bộ người dùng)
    // Resolves to: /api/v1/policies/**
    // =========================================================================

    @GetMapping("/policies")
    public ResponseEntity<List<PlatformPolicyResponse>> getActivePolicies(
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(platformPolicyService.getActivePolicies(audience, category));
    }

    @GetMapping("/policies/{policyKey}")
    public ResponseEntity<PlatformPolicyResponse> getPolicyByKey(@PathVariable String policyKey) {
        return ResponseEntity.ok(platformPolicyService.getPolicyByKey(policyKey));
    }

    // =========================================================================
    // ADMIN MANAGEMENT APIS (Dành riêng cho Quản trị viên sàn)
    // Resolves to: /api/v1/admin/policies/**
    // =========================================================================

    @GetMapping("/admin/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlatformPolicyResponse>> getAllPoliciesAdmin() {
        return ResponseEntity.ok(platformPolicyService.getAllPoliciesAdmin());
    }

    @PostMapping("/admin/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlatformPolicyResponse> createPolicy(
            @Valid @RequestBody PlatformPolicyRequest request,
            Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "ADMIN";
        return ResponseEntity.status(HttpStatus.CREATED).body(platformPolicyService.createPolicy(request, adminEmail));
    }

    @PutMapping("/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlatformPolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody PlatformPolicyRequest request,
            Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "ADMIN";
        return ResponseEntity.ok(platformPolicyService.updatePolicy(id, request, adminEmail));
    }

    @DeleteMapping("/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePolicy(@PathVariable UUID id) {
        platformPolicyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}
