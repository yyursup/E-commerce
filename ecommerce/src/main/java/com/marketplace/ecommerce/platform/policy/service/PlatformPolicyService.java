package com.marketplace.ecommerce.platform.policy.service;

import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;

import java.util.List;
import java.util.UUID;

public interface PlatformPolicyService {

    // === Public Policies (Customer / Seller / Guest) ===
    List<PlatformPolicyResponse> getActivePolicies(String audience, String category);

    PlatformPolicyResponse getPolicyByKey(String policyKey);

    // === Admin Management Policies ===
    List<PlatformPolicyResponse> getAllPoliciesAdmin();

    PlatformPolicyResponse createPolicy(PlatformPolicyRequest req, String adminEmail);

    PlatformPolicyResponse updatePolicy(UUID id, PlatformPolicyRequest req, String adminEmail);

    void deletePolicy(UUID id);

    // === Validation for Dispute Resolution ===
    PlatformPolicyResponse validateDisputeClause(String clauseCode, String decision, boolean isSellerReturnDispute);
}
