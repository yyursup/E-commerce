package com.marketplace.ecommerce.platform.policy.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;
import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import com.marketplace.ecommerce.platform.policy.repository.PlatformPolicyRepository;
import com.marketplace.ecommerce.platform.policy.service.PlatformPolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformPolicyServiceImpl implements PlatformPolicyService {

    private final PlatformPolicyRepository platformPolicyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PlatformPolicyResponse> getActivePolicies(String audience, String category) {
        List<PlatformPolicy> policies;

        if (category != null && !category.isBlank()) {
            policies = platformPolicyRepository.findByIsActiveTrueAndCategoryIgnoreCaseOrderByDisplayOrderAscCreatedAtDesc(category.trim());
        } else if (audience != null && !audience.isBlank() && !"ALL".equalsIgnoreCase(audience)) {
            String normAudience = audience.trim().toUpperCase();
            policies = platformPolicyRepository.findByIsActiveTrueAndTargetAudienceInOrderByDisplayOrderAscCreatedAtDesc(
                    List.of("ALL", normAudience));
        } else {
            policies = platformPolicyRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
        }

        return policies.stream().map(PlatformPolicyResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformPolicyResponse getPolicyByKey(String policyKey) {
        if (policyKey == null || policyKey.isBlank()) {
            throw new CustomException("Mã chính sách không được để trống");
        }
        PlatformPolicy policy = platformPolicyRepository.findByPolicyKey(policyKey.trim().toUpperCase())
                .orElseThrow(() -> new CustomException("Không tìm thấy chính sách: " + policyKey));
        return PlatformPolicyResponse.from(policy);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlatformPolicyResponse> getAllPoliciesAdmin() {
        return platformPolicyRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
                .map(PlatformPolicyResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public PlatformPolicyResponse createPolicy(PlatformPolicyRequest req, String adminEmail) {
        String key = req.getPolicyKey().trim().toUpperCase();
        if (platformPolicyRepository.existsByPolicyKey(key)) {
            throw new CustomException("Mã định danh chính sách đã tồn tại: " + key);
        }

        PlatformPolicy policy = PlatformPolicy.builder()
                .policyKey(key)
                .title(req.getTitle().trim())
                .summary(req.getSummary() != null ? req.getSummary().trim() : null)
                .content(req.getContent())
                .category(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim().toUpperCase() : "GENERAL")
                .targetAudience(req.getTargetAudience() != null && !req.getTargetAudience().isBlank() ? req.getTargetAudience().trim().toUpperCase() : "ALL")
                .version(req.getVersion() != null && !req.getVersion().isBlank() ? req.getVersion().trim() : "1.0")
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .effectiveDate(req.getEffectiveDate() != null ? req.getEffectiveDate() : LocalDateTime.now())
                .updatedBy(adminEmail)
                .build();

        PlatformPolicy saved = platformPolicyRepository.save(policy);
        log.info("Admin {} created new platform policy: {}", adminEmail, key);
        return PlatformPolicyResponse.from(saved);
    }

    @Override
    @Transactional
    public PlatformPolicyResponse updatePolicy(UUID id, PlatformPolicyRequest req, String adminEmail) {
        PlatformPolicy policy = platformPolicyRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy chính sách với ID: " + id));

        String key = req.getPolicyKey().trim().toUpperCase();
        if (!policy.getPolicyKey().equalsIgnoreCase(key) && platformPolicyRepository.existsByPolicyKey(key)) {
            throw new CustomException("Mã định danh chính sách đã được sử dụng: " + key);
        }

        policy.setPolicyKey(key);
        policy.setTitle(req.getTitle().trim());
        if (req.getSummary() != null) policy.setSummary(req.getSummary().trim());
        policy.setContent(req.getContent());
        if (req.getCategory() != null) policy.setCategory(req.getCategory().trim().toUpperCase());
        if (req.getTargetAudience() != null) policy.setTargetAudience(req.getTargetAudience().trim().toUpperCase());
        if (req.getVersion() != null) policy.setVersion(req.getVersion().trim());
        if (req.getDisplayOrder() != null) policy.setDisplayOrder(req.getDisplayOrder());
        if (req.getIsActive() != null) policy.setIsActive(req.getIsActive());
        if (req.getEffectiveDate() != null) policy.setEffectiveDate(req.getEffectiveDate());
        policy.setUpdatedBy(adminEmail);

        PlatformPolicy saved = platformPolicyRepository.save(policy);
        log.info("Admin {} updated platform policy: {}", adminEmail, key);
        return PlatformPolicyResponse.from(saved);
    }

    @Override
    @Transactional
    public void deletePolicy(UUID id) {
        PlatformPolicy policy = platformPolicyRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy chính sách với ID: " + id));
        platformPolicyRepository.delete(policy);
        log.info("Deleted platform policy: {}", policy.getPolicyKey());
    }

    // === Validation for Dispute Resolution ===

    @Override
    @Transactional(readOnly = true)
    public PlatformPolicyResponse validateDisputeClause(
            String clauseCode,
            String decision,
            boolean isSellerReturnDispute) {
        if (clauseCode == null || clauseCode.trim().isEmpty()) {
            throw new CustomException(
                    "Phán quyết tranh chấp đơn hàng bắt buộc phải gắn với một Chính sách nền tảng (Platform Policy).");
        }
        String key = clauseCode.trim();
        PlatformPolicy policy = platformPolicyRepository.findByPolicyKey(key)
                .orElseThrow(() -> new CustomException("Chính sách nền tảng không hợp lệ hoặc không tồn tại: " + key));

        if (!Boolean.TRUE.equals(policy.getIsActive())) {
            throw new CustomException("Chính sách nền tảng đã bị vô hiệu hóa hoặc không còn hiệu lực: " + key);
        }

        return PlatformPolicyResponse.from(policy);
    }
}
