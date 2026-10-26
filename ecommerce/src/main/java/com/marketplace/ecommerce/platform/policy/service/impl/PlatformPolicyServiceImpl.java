package com.marketplace.ecommerce.platform.policy.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseRequest;
import com.marketplace.ecommerce.platform.policy.dto.DisputePolicyClauseResponse;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;
import com.marketplace.ecommerce.platform.policy.entity.DisputePolicyClauseEntity;
import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import com.marketplace.ecommerce.platform.policy.repository.DisputePolicyClauseRepository;
import com.marketplace.ecommerce.platform.policy.repository.PlatformPolicyRepository;
import com.marketplace.ecommerce.platform.policy.service.PlatformPolicyService;
import com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause;
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
    private final DisputePolicyClauseRepository disputePolicyClauseRepository;

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

    // === Dispute Policy Clauses ===

    @Override
    @Transactional(readOnly = true)
    public List<DisputePolicyClauseResponse> getActiveDisputeClauses(String category) {
        List<DisputePolicyClauseEntity> list;
        if (category != null && !category.isBlank()) {
            list = disputePolicyClauseRepository.findByIsActiveTrueAndCategoryIgnoreCaseOrderByDisplayOrderAscCreatedAtAsc(category.trim());
        } else {
            list = disputePolicyClauseRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc();
        }

        if (list.isEmpty()) {
            // Fallback to Enum DisputePolicyClause values if table has not been seeded yet
            return Arrays.stream(DisputePolicyClause.values())
                    .filter(c -> category == null || category.isBlank() || c.getCategory().equalsIgnoreCase(category.trim()))
                    .map(DisputePolicyClauseResponse::fromEnum)
                    .toList();
        }

        return list.stream().map(DisputePolicyClauseResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputePolicyClauseResponse> getAllDisputeClausesAdmin() {
        List<DisputePolicyClauseEntity> list = disputePolicyClauseRepository.findAllByOrderByDisplayOrderAscCreatedAtAsc();
        if (list.isEmpty()) {
            return Arrays.stream(DisputePolicyClause.values())
                    .map(DisputePolicyClauseResponse::fromEnum)
                    .toList();
        }
        return list.stream().map(DisputePolicyClauseResponse::from).toList();
    }

    @Override
    @Transactional
    public DisputePolicyClauseResponse createDisputeClause(DisputePolicyClauseRequest req) {
        String code = req.getCode().trim().toUpperCase();
        if (disputePolicyClauseRepository.existsByCode(code)) {
            throw new CustomException("Mã điều khoản phân xử đã tồn tại: " + code);
        }

        DisputePolicyClauseEntity entity = DisputePolicyClauseEntity.builder()
                .code(code)
                .title(req.getTitle().trim())
                .description(req.getDescription().trim())
                .category(req.getCategory().trim().toUpperCase())
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        DisputePolicyClauseEntity saved = disputePolicyClauseRepository.save(entity);
        log.info("Created new dispute policy clause: {}", code);
        return DisputePolicyClauseResponse.from(saved);
    }

    @Override
    @Transactional
    public DisputePolicyClauseResponse updateDisputeClause(UUID id, DisputePolicyClauseRequest req) {
        DisputePolicyClauseEntity entity = disputePolicyClauseRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy điều khoản phân xử với ID: " + id));

        String code = req.getCode().trim().toUpperCase();
        if (!entity.getCode().equalsIgnoreCase(code) && disputePolicyClauseRepository.existsByCode(code)) {
            throw new CustomException("Mã điều khoản phân xử đã được sử dụng: " + code);
        }

        entity.setCode(code);
        entity.setTitle(req.getTitle().trim());
        entity.setDescription(req.getDescription().trim());
        entity.setCategory(req.getCategory().trim().toUpperCase());
        if (req.getDisplayOrder() != null) entity.setDisplayOrder(req.getDisplayOrder());
        if (req.getIsActive() != null) entity.setIsActive(req.getIsActive());

        DisputePolicyClauseEntity saved = disputePolicyClauseRepository.save(entity);
        log.info("Updated dispute policy clause: {}", code);
        return DisputePolicyClauseResponse.from(saved);
    }

    @Override
    @Transactional
    public void deleteDisputeClause(UUID id) {
        DisputePolicyClauseEntity entity = disputePolicyClauseRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy điều khoản phân xử với ID: " + id));
        disputePolicyClauseRepository.delete(entity);
        log.info("Deleted dispute policy clause: {}", entity.getCode());
    }
}
