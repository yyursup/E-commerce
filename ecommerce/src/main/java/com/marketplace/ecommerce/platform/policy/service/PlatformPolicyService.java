package com.marketplace.ecommerce.platform.policy.service;

import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseRequest;
import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseResponse;
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

    // === Dispute Policy Clauses ===
    List<DisputePolicyClauseResponse> getActiveDisputeClauses(String category);

    List<DisputePolicyClauseResponse> getAllDisputeClausesAdmin();

    DisputePolicyClauseResponse createDisputeClause(DisputePolicyClauseRequest req);

    DisputePolicyClauseResponse updateDisputeClause(UUID id, DisputePolicyClauseRequest req);

    void deleteDisputeClause(UUID id);
}
