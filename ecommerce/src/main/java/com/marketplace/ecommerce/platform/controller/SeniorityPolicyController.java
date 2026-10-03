package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.platform.dto.request.SeniorityPolicyRequest;
import com.marketplace.ecommerce.platform.dto.response.SeniorityPolicyResponse;
import com.marketplace.ecommerce.platform.service.SeniorityPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/platform/seniority-policies")
@RequiredArgsConstructor
public class SeniorityPolicyController {

    private final SeniorityPolicyService seniorityPolicyService;

    @GetMapping
    public ResponseEntity<List<SeniorityPolicyResponse>> getActivePolicies() {
        return ResponseEntity.ok(seniorityPolicyService.getActivePolicies());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SeniorityPolicyResponse>> getAllPoliciesForAdmin() {
        return ResponseEntity.ok(seniorityPolicyService.getAllPolicies());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeniorityPolicyResponse> createPolicy(@Valid @RequestBody SeniorityPolicyRequest request) {
        return ResponseEntity.ok(seniorityPolicyService.createPolicy(request));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeniorityPolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody SeniorityPolicyRequest request) {
        return ResponseEntity.ok(seniorityPolicyService.updatePolicy(id, request));
    }
}
