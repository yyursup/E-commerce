package com.marketplace.ecommerce.platform.policy.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;
import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import com.marketplace.ecommerce.platform.policy.repository.PlatformPolicyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformPolicyServiceImplTest {

    @Mock
    private PlatformPolicyRepository platformPolicyRepository;

    @InjectMocks
    private PlatformPolicyServiceImpl platformPolicyService;

    @Test
    @DisplayName("validateDisputeClause: Chặn phán quyết khi thiếu mã chính sách nền tảng")
    void validateDisputeClause_ThrowsException_WhenCodeNullOrBlank() {
        CustomException exNull = assertThrows(CustomException.class, () ->
                platformPolicyService.validateDisputeClause(null, "APPROVE", false));
        assertTrue(exNull.getMessage().contains("Phán quyết tranh chấp đơn hàng bắt buộc phải gắn với một Chính sách nền tảng"));

        CustomException exBlank = assertThrows(CustomException.class, () ->
                platformPolicyService.validateDisputeClause("   ", "APPROVE", false));
        assertTrue(exBlank.getMessage().contains("Phán quyết tranh chấp đơn hàng bắt buộc phải gắn với một Chính sách nền tảng"));

        verifyNoInteractions(platformPolicyRepository);
    }

    @Test
    @DisplayName("validateDisputeClause: Chặn phán quyết khi chính sách không tồn tại trong hệ thống")
    void validateDisputeClause_ThrowsException_WhenNotFound() {
        when(platformPolicyRepository.findByPolicyKey("NON_EXISTING")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                platformPolicyService.validateDisputeClause("NON_EXISTING", "APPROVE", false));
        assertTrue(ex.getMessage().contains("không hợp lệ hoặc không tồn tại"));
        verify(platformPolicyRepository).findByPolicyKey("NON_EXISTING");
    }

    @Test
    @DisplayName("validateDisputeClause: Chặn phán quyết khi chính sách tồn tại nhưng isActive = false")
    void validateDisputeClause_ThrowsException_WhenInactive() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("INACTIVE_POLICY")
                .title("Chính sách tạm ẩn")
                .isActive(false)
                .build();
        when(platformPolicyRepository.findByPolicyKey("INACTIVE_POLICY")).thenReturn(Optional.of(policy));

        CustomException ex = assertThrows(CustomException.class, () ->
                platformPolicyService.validateDisputeClause("INACTIVE_POLICY", "APPROVE", false));
        assertTrue(ex.getMessage().contains("vô hiệu hóa hoặc không còn hiệu lực"));
    }

    @Test
    @DisplayName("validateDisputeClause: Chấp thuận căn cứ chính sách hợp lệ khi active trong Database")
    void validateDisputeClause_Passes_WhenActive() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("RETURN_REFUND_COMPLAINT_POLICY")
                .title("Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền")
                .summary("Quy chuẩn căn cứ phán quyết tranh chấp đơn hàng")
                .category("RETURN_REFUND")
                .isActive(true)
                .version("2.0")
                .build();
        when(platformPolicyRepository.findByPolicyKey("RETURN_REFUND_COMPLAINT_POLICY")).thenReturn(Optional.of(policy));

        PlatformPolicyResponse res = platformPolicyService.validateDisputeClause("  RETURN_REFUND_COMPLAINT_POLICY  ", "APPROVE", false);
        assertNotNull(res);
        assertEquals("RETURN_REFUND_COMPLAINT_POLICY", res.getPolicyKey());
        assertEquals("Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền", res.getTitle());
        assertEquals("RETURN_REFUND", res.getCategory());
        assertTrue(res.getIsActive());
    }

    @Test
    @DisplayName("validateDisputeClause: Chấp thuận căn cứ chính sách cho tranh chấp kiện hoàn của Người bán")
    void validateDisputeClause_SellerReturnDispute_Passes_WhenActive() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("RETURN_REFUND_COMPLAINT_POLICY")
                .title("Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền")
                .category("RETURN_REFUND")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByPolicyKey("RETURN_REFUND_COMPLAINT_POLICY")).thenReturn(Optional.of(policy));

        PlatformPolicyResponse res = platformPolicyService.validateDisputeClause("RETURN_REFUND_COMPLAINT_POLICY", "APPROVE", true);
        assertNotNull(res);
        assertEquals("RETURN_REFUND_COMPLAINT_POLICY", res.getPolicyKey());
    }

    @Test
    @DisplayName("getActivePolicies: Lọc theo category khi category có giá trị")
    void getActivePolicies_WithCategory() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("RETURN_POLICY")
                .category("RETURN_REFUND")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByIsActiveTrueAndCategoryIgnoreCaseOrderByDisplayOrderAscCreatedAtDesc("RETURN_REFUND"))
                .thenReturn(List.of(policy));

        List<PlatformPolicyResponse> list = platformPolicyService.getActivePolicies(null, " RETURN_REFUND ");
        assertEquals(1, list.size());
        assertEquals("RETURN_POLICY", list.get(0).getPolicyKey());
    }

    @Test
    @DisplayName("getActivePolicies: Lọc theo targetAudience khi audience không phải ALL")
    void getActivePolicies_WithAudienceNotAll() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("SELLER_POLICY")
                .targetAudience("SELLER")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByIsActiveTrueAndTargetAudienceInOrderByDisplayOrderAscCreatedAtDesc(List.of("ALL", "SELLER")))
                .thenReturn(List.of(policy));

        List<PlatformPolicyResponse> list = platformPolicyService.getActivePolicies(" seller ", null);
        assertEquals(1, list.size());
        assertEquals("SELLER_POLICY", list.get(0).getPolicyKey());
    }

    @Test
    @DisplayName("getActivePolicies: Mặc định trả về tất cả khi audience là ALL hoặc rỗng")
    void getActivePolicies_DefaultFallback() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("GENERAL_POLICY")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc())
                .thenReturn(List.of(policy));

        List<PlatformPolicyResponse> list1 = platformPolicyService.getActivePolicies("ALL", "   ");
        assertEquals(1, list1.size());

        List<PlatformPolicyResponse> list2 = platformPolicyService.getActivePolicies(null, null);
        assertEquals(1, list2.size());
    }

    @Test
    @DisplayName("getPolicyByKey: Ném ngoại lệ khi key null hoặc blank")
    void getPolicyByKey_Throws_WhenBlank() {
        CustomException ex1 = assertThrows(CustomException.class, () -> platformPolicyService.getPolicyByKey(null));
        assertTrue(ex1.getMessage().contains("không được để trống"));

        CustomException ex2 = assertThrows(CustomException.class, () -> platformPolicyService.getPolicyByKey("   "));
        assertTrue(ex2.getMessage().contains("không được để trống"));
    }

    @Test
    @DisplayName("getPolicyByKey: Trả về chính sách hoặc ném ngoại lệ khi không tìm thấy")
    void getPolicyByKey_Success_And_NotFound() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("TEST_KEY")
                .title("Chính sách test")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByPolicyKey("TEST_KEY")).thenReturn(Optional.of(policy));

        PlatformPolicyResponse res = platformPolicyService.getPolicyByKey(" test_key ");
        assertNotNull(res);
        assertEquals("TEST_KEY", res.getPolicyKey());

        when(platformPolicyRepository.findByPolicyKey("UNKNOWN_KEY")).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> platformPolicyService.getPolicyByKey("UNKNOWN_KEY"));
    }

    @Test
    @DisplayName("getAllPoliciesAdmin: Trả về toàn bộ chính sách cho quản trị viên")
    void getAllPoliciesAdmin_ReturnsList() {
        PlatformPolicy p = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("ADMIN_KEY")
                .title("Admin Policy")
                .build();
        when(platformPolicyRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()).thenReturn(List.of(p));

        List<PlatformPolicyResponse> res = platformPolicyService.getAllPoliciesAdmin();
        assertEquals(1, res.size());
        assertEquals("ADMIN_KEY", res.get(0).getPolicyKey());
    }

    @Test
    @DisplayName("createPolicy: Ném ngoại lệ khi policyKey đã tồn tại")
    void createPolicy_Throws_WhenKeyExists() {
        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest req = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        req.setPolicyKey("EXISTING_KEY");
        when(platformPolicyRepository.existsByPolicyKey("EXISTING_KEY")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> platformPolicyService.createPolicy(req, "admin@test.com"));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("createPolicy: Thành công khi tạo với đầy đủ thông tin hoặc dùng giá trị mặc định")
    void createPolicy_Success_FullAndDefaults() {
        // Full fields
        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest reqFull = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        reqFull.setPolicyKey("NEW_POLICY");
        reqFull.setTitle("New Policy Title");
        reqFull.setSummary("Summary");
        reqFull.setContent("Content");
        reqFull.setCategory("RETURN");
        reqFull.setTargetAudience("BUYER");
        reqFull.setVersion("2.1");
        reqFull.setDisplayOrder(5);
        reqFull.setIsActive(true);
        reqFull.setEffectiveDate(java.time.LocalDateTime.now());

        when(platformPolicyRepository.existsByPolicyKey("NEW_POLICY")).thenReturn(false);
        when(platformPolicyRepository.save(any(PlatformPolicy.class))).thenAnswer(inv -> {
            PlatformPolicy p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        PlatformPolicyResponse resFull = platformPolicyService.createPolicy(reqFull, "admin@test.com");
        assertNotNull(resFull);
        assertEquals("NEW_POLICY", resFull.getPolicyKey());
        assertEquals("RETURN", resFull.getCategory());

        // Default fields (summary null, category blank, audience blank, version blank, displayOrder null, isActive null, effectiveDate null)
        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest reqDef = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        reqDef.setPolicyKey("DEF_POLICY");
        reqDef.setTitle("Def Title");

        when(platformPolicyRepository.existsByPolicyKey("DEF_POLICY")).thenReturn(false);

        PlatformPolicyResponse resDef = platformPolicyService.createPolicy(reqDef, "admin@test.com");
        assertNotNull(resDef);
        assertEquals("DEF_POLICY", resDef.getPolicyKey());
        assertEquals("GENERAL", resDef.getCategory());
        assertEquals("ALL", resDef.getTargetAudience());
        assertEquals("1.0", resDef.getVersion());
        assertTrue(resDef.getIsActive());
    }

    @Test
    @DisplayName("updatePolicy: Ném ngoại lệ khi không tìm thấy policy hoặc trùng key khác")
    void updatePolicy_NotFound_And_DuplicateKey() {
        UUID id = UUID.randomUUID();
        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest req = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        req.setPolicyKey("UPDATED_KEY");
        req.setTitle("Title");

        when(platformPolicyRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> platformPolicyService.updatePolicy(id, req, "admin@test.com"));

        PlatformPolicy existing = PlatformPolicy.builder()
                .id(id)
                .policyKey("OLD_KEY")
                .build();
        when(platformPolicyRepository.findById(id)).thenReturn(Optional.of(existing));
        when(platformPolicyRepository.existsByPolicyKey("UPDATED_KEY")).thenReturn(true);

        CustomException dupEx = assertThrows(CustomException.class, () -> platformPolicyService.updatePolicy(id, req, "admin@test.com"));
        assertTrue(dupEx.getMessage().contains("đã được sử dụng"));
    }

    @Test
    @DisplayName("updatePolicy: Thành công cập nhật các trường đầy đủ và trường null")
    void updatePolicy_Success() {
        UUID id = UUID.randomUUID();
        PlatformPolicy existing = PlatformPolicy.builder()
                .id(id)
                .policyKey("ORIGINAL_KEY")
                .title("Original Title")
                .build();
        when(platformPolicyRepository.findById(id)).thenReturn(Optional.of(existing));
        when(platformPolicyRepository.save(any(PlatformPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest req = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        req.setPolicyKey("ORIGINAL_KEY"); // Same key
        req.setTitle("Updated Title");
        req.setSummary("New Summary");
        req.setContent("New Content");
        req.setCategory("NEW_CAT");
        req.setTargetAudience("SELLER");
        req.setVersion("3.0");
        req.setDisplayOrder(10);
        req.setIsActive(false);
        req.setEffectiveDate(java.time.LocalDateTime.now());

        PlatformPolicyResponse res = platformPolicyService.updatePolicy(id, req, "admin@test.com");
        assertNotNull(res);
        assertEquals("Updated Title", res.getTitle());
        assertEquals("New Summary", res.getSummary());
        assertFalse(res.getIsActive());
        assertEquals(10, res.getDisplayOrder());

        // Update with nulls
        com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest reqNulls = new com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyRequest();
        reqNulls.setPolicyKey("ORIGINAL_KEY");
        reqNulls.setTitle("Only Title");
        PlatformPolicyResponse res2 = platformPolicyService.updatePolicy(id, reqNulls, "admin@test.com");
        assertNotNull(res2);
        assertEquals("Only Title", res2.getTitle());
    }

    @Test
    @DisplayName("deletePolicy: Ném ngoại lệ khi không tìm thấy hoặc xóa thành công")
    void deletePolicy_NotFound_And_Success() {
        UUID id = UUID.randomUUID();
        when(platformPolicyRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> platformPolicyService.deletePolicy(id));

        PlatformPolicy existing = PlatformPolicy.builder().id(id).policyKey("DEL_KEY").build();
        when(platformPolicyRepository.findById(id)).thenReturn(Optional.of(existing));

        platformPolicyService.deletePolicy(id);
        verify(platformPolicyRepository).delete(existing);
    }
}
