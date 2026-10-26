package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.dto.request.SeniorityPolicyRequest;
import com.marketplace.ecommerce.platform.dto.response.SeniorityPolicyResponse;
import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import com.marketplace.ecommerce.platform.repository.SeniorityPolicyConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeniorityPolicyServiceImplTest {

    @Mock
    private SeniorityPolicyConfigRepository repository;

    @InjectMocks
    private SeniorityPolicyServiceImpl seniorityPolicyService;

    private UUID policyId;
    private SeniorityPolicyConfig policy;

    @BeforeEach
    void setUp() {
        policyId = UUID.randomUUID();
        policy = SeniorityPolicyConfig.builder()
                .id(policyId)
                .tierName("Gold Seller")
                .minMonths(12)
                .discountRate(new BigDecimal("0.50"))
                .description("Giảm 0.5% hoa hồng cho seller trên 1 năm")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getAllPolicies và getActivePolicies trả về danh sách chính sách thâm niên")
    void testGetPolicies() {
        when(repository.findAllByOrderByMinMonthsAsc()).thenReturn(List.of(policy));
        List<SeniorityPolicyResponse> all = seniorityPolicyService.getAllPolicies();
        assertEquals(1, all.size());
        assertEquals("Gold Seller", all.get(0).getTierName());

        when(repository.findAllByIsActiveTrueOrderByMinMonthsDesc()).thenReturn(List.of(policy));
        List<SeniorityPolicyResponse> active = seniorityPolicyService.getActivePolicies();
        assertEquals(1, active.size());
    }

    @Test
    @DisplayName("updatePolicy cập nhật chính sách thành công")
    void testUpdatePolicy_Success() {
        when(repository.findById(policyId)).thenReturn(Optional.of(policy));
        when(repository.save(any(SeniorityPolicyConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        SeniorityPolicyRequest req = new SeniorityPolicyRequest();
        req.setTierName("Platinum Seller");
        req.setMinMonths(12); // Không đổi mốc tháng
        req.setDiscountRate(new BigDecimal("0.80"));
        req.setDescription("Giảm 0.8%");
        req.setIsActive(true);

        SeniorityPolicyResponse res = seniorityPolicyService.updatePolicy(policyId, req);
        assertNotNull(res);
        assertEquals("Platinum Seller", res.getTierName());
        assertEquals(new BigDecimal("0.80"), res.getDiscountRate());
    }

    @Test
    @DisplayName("updatePolicy ném ngoại lệ khi trùng mốc tháng đã có")
    void testUpdatePolicy_DuplicateMinMonths() {
        when(repository.findById(policyId)).thenReturn(Optional.of(policy));

        SeniorityPolicyConfig existingOther = SeniorityPolicyConfig.builder().id(UUID.randomUUID()).minMonths(24).build();
        when(repository.findByMinMonths(24)).thenReturn(Optional.of(existingOther));

        SeniorityPolicyRequest req = new SeniorityPolicyRequest();
        req.setTierName("Platinum");
        req.setMinMonths(24);

        assertThrows(CustomException.class, () -> seniorityPolicyService.updatePolicy(policyId, req));
    }

    @Test
    @DisplayName("updatePolicy ném ngoại lệ khi không tìm thấy policy")
    void testUpdatePolicy_NotFound() {
        when(repository.findById(policyId)).thenReturn(Optional.empty());
        SeniorityPolicyRequest req = new SeniorityPolicyRequest();
        assertThrows(CustomException.class, () -> seniorityPolicyService.updatePolicy(policyId, req));
    }

    @Test
    @DisplayName("createPolicy tạo chính sách thành công và trường hợp trùng minMonths")
    void testCreatePolicy_SuccessAndDuplicate() {
        // Trùng minMonths
        when(repository.findByMinMonths(6)).thenReturn(Optional.of(policy));
        SeniorityPolicyRequest reqDup = new SeniorityPolicyRequest();
        reqDup.setMinMonths(6);
        assertThrows(CustomException.class, () -> seniorityPolicyService.createPolicy(reqDup));

        // Thành công (isActive = null -> default true)
        when(repository.findByMinMonths(3)).thenReturn(Optional.empty());
        when(repository.save(any(SeniorityPolicyConfig.class))).thenAnswer(inv -> {
            SeniorityPolicyConfig c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        SeniorityPolicyRequest reqNew = new SeniorityPolicyRequest();
        reqNew.setMinMonths(3);
        reqNew.setDiscountRate(new BigDecimal("0.20"));
        reqNew.setTierName("Silver Seller");
        reqNew.setDescription("Giảm 0.2% cho seller 3 tháng");
        reqNew.setIsActive(null);

        SeniorityPolicyResponse res = seniorityPolicyService.createPolicy(reqNew);
        assertNotNull(res);
        assertEquals("Silver Seller", res.getTierName());
        assertEquals(3, res.getMinMonths());
        assertTrue(res.getIsActive());
    }

}
