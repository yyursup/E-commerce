package com.marketplace.ecommerce.platform.service;

import com.marketplace.ecommerce.platform.dto.request.SeniorityPolicyRequest;
import com.marketplace.ecommerce.platform.dto.response.SeniorityPolicyResponse;

import java.util.List;
import java.util.UUID;

public interface SeniorityPolicyService {

    List<SeniorityPolicyResponse> getAllPolicies();

    List<SeniorityPolicyResponse> getActivePolicies();

    SeniorityPolicyResponse updatePolicy(UUID id, SeniorityPolicyRequest request);

    SeniorityPolicyResponse createPolicy(SeniorityPolicyRequest request);
}
