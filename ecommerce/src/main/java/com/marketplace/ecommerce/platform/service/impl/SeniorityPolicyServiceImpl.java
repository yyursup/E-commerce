package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.dto.request.SeniorityPolicyRequest;
import com.marketplace.ecommerce.platform.dto.response.SeniorityPolicyResponse;
import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import com.marketplace.ecommerce.platform.repository.SeniorityPolicyConfigRepository;
import com.marketplace.ecommerce.platform.service.SeniorityPolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeniorityPolicyServiceImpl implements SeniorityPolicyService {

    private final SeniorityPolicyConfigRepository seniorityPolicyConfigRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SeniorityPolicyResponse> getAllPolicies() {
        return seniorityPolicyConfigRepository.findAllByOrderByMinMonthsAsc().stream()
                .map(SeniorityPolicyResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeniorityPolicyResponse> getActivePolicies() {
        return seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc().stream()
                .map(SeniorityPolicyResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public SeniorityPolicyResponse updatePolicy(UUID id, SeniorityPolicyRequest request) {
        SeniorityPolicyConfig policy = seniorityPolicyConfigRepository.findById(id)
                .orElseThrow(() -> new CustomException("Không tìm thấy chính sách thâm niên: " + id));

        // Nếu thay đổi minMonths, kiểm tra trùng lặp
        if (!policy.getMinMonths().equals(request.getMinMonths())) {
            seniorityPolicyConfigRepository.findByMinMonths(request.getMinMonths())
                    .ifPresent(existing -> {
                        throw new CustomException("Đã tồn tại chính sách cho mốc " + request.getMinMonths() + " tháng");
                    });
            policy.setMinMonths(request.getMinMonths());
        }

        policy.setDiscountRate(request.getDiscountRate());
        policy.setTierName(request.getTierName().trim());
        policy.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            policy.setIsActive(request.getIsActive());
        }
        policy.setUpdatedAt(LocalDateTime.now());

        SeniorityPolicyConfig saved = seniorityPolicyConfigRepository.save(policy);
        log.info("Cập nhật chính sách thâm niên {}: minMonths={}, discountRate={}%",
                id, saved.getMinMonths(), saved.getDiscountRate());
        return SeniorityPolicyResponse.from(saved);
    }

    @Override
    @Transactional
    public SeniorityPolicyResponse createPolicy(SeniorityPolicyRequest request) {
        seniorityPolicyConfigRepository.findByMinMonths(request.getMinMonths())
                .ifPresent(existing -> {
                    throw new CustomException("Đã tồn tại chính sách cho mốc " + request.getMinMonths() + " tháng");
                });

        SeniorityPolicyConfig policy = SeniorityPolicyConfig.builder()
                .minMonths(request.getMinMonths())
                .discountRate(request.getDiscountRate())
                .tierName(request.getTierName().trim())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        SeniorityPolicyConfig saved = seniorityPolicyConfigRepository.save(policy);
        log.info("Tạo mới chính sách thâm niên: minMonths={}, discountRate={}%",
                saved.getMinMonths(), saved.getDiscountRate());
        return SeniorityPolicyResponse.from(saved);
    }
}
