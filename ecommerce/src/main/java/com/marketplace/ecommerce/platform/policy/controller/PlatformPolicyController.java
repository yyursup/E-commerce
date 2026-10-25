package com.marketplace.ecommerce.platform.policy.controller;

import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseRequest;
import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseResponse;
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
@RequiredArgsConstructor
public class PlatformPolicyController {

    private final PlatformPolicyService platformPolicyService;

    // =========================================================================
    // PUBLIC APIS (Khách hàng, Người bán, Khách vãng lai, Toàn bộ người dùng)
    // =========================================================================

    @GetMapping("/api/v1/policies")
    public ResponseEntity<List<PlatformPolicyResponse>> getActivePolicies(
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(platformPolicyService.getActivePolicies(audience, category));
    }

    @GetMapping("/api/v1/policies/{policyKey}")
    public ResponseEntity<PlatformPolicyResponse> getPolicyByKey(@PathVariable String policyKey) {
        return ResponseEntity.ok(platformPolicyService.getPolicyByKey(policyKey));
    }

    @GetMapping("/api/v1/policies/dispute-clauses")
    public ResponseEntity<List<DisputePolicyClauseResponse>> getActiveDisputeClauses(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(platformPolicyService.getActiveDisputeClauses(category));
    }

    // =========================================================================
    // ADMIN MANAGEMENT APIS (Dành riêng cho Quản trị viên sàn)
    // =========================================================================

    @GetMapping("/api/v1/admin/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlatformPolicyResponse>> getAllPoliciesAdmin() {
        return ResponseEntity.ok(platformPolicyService.getAllPoliciesAdmin());
    }

    @PostMapping("/api/v1/admin/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlatformPolicyResponse> createPolicy(
            @Valid @RequestBody PlatformPolicyRequest request,
            Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "ADMIN";
        return ResponseEntity.status(HttpStatus.CREATED).body(platformPolicyService.createPolicy(request, adminEmail));
    }

    @PutMapping("/api/v1/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlatformPolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody PlatformPolicyRequest request,
            Authentication authentication) {
        String adminEmail = authentication != null ? authentication.getName() : "ADMIN";
        return ResponseEntity.ok(platformPolicyService.updatePolicy(id, request, adminEmail));
    }

    @DeleteMapping("/api/v1/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePolicy(@PathVariable UUID id) {
        platformPolicyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }

    // --- Admin Dispute Clauses Management ---

    @GetMapping("/api/v1/admin/policies/dispute-clauses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DisputePolicyClauseResponse>> getAllDisputeClausesAdmin() {
        return ResponseEntity.ok(platformPolicyService.getAllDisputeClausesAdmin());
    }

    @PostMapping("/api/v1/admin/policies/dispute-clauses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DisputePolicyClauseResponse> createDisputeClause(
            @Valid @RequestBody DisputePolicyClauseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformPolicyService.createDisputeClause(request));
    }

    @PutMapping("/api/v1/admin/policies/dispute-clauses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DisputePolicyClauseResponse> updateDisputeClause(
            @PathVariable UUID id,
            @Valid @RequestBody DisputePolicyClauseRequest request) {
        return ResponseEntity.ok(platformPolicyService.updateDisputeClause(id, request));
    }

    @DeleteMapping("/api/v1/admin/policies/dispute-clauses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDisputeClause(@PathVariable UUID id) {
        platformPolicyService.deleteDisputeClause(id);
        return ResponseEntity.noContent().build();
    }
}
