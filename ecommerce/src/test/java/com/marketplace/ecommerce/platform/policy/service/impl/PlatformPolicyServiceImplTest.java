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
    @DisplayName("getActivePolicies: Trả về danh sách chính sách đang hoạt động sắp xếp theo displayOrder")
    void getActivePolicies_ReturnsList() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("ESCROW_PAYMENT_PROTECTION")
                .title("Cơ Chế Ký Quỹ Thanh Toán Escrow 72h")
                .category("ESCROW")
                .targetAudience("ALL")
                .displayOrder(1)
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc())
                .thenReturn(List.of(policy));

        List<PlatformPolicyResponse> list = platformPolicyService.getActivePolicies(null, null);
        assertEquals(1, list.size());
        assertEquals("ESCROW_PAYMENT_PROTECTION", list.get(0).getPolicyKey());
    }

    @Test
    @DisplayName("getPolicyByKey: Trả về chính sách theo key hoặc quăng exception khi không tìm thấy")
    void getPolicyByKey_Success_And_NotFound() {
        PlatformPolicy policy = PlatformPolicy.builder()
                .id(UUID.randomUUID())
                .policyKey("TEST_KEY")
                .title("Chính sách test")
                .isActive(true)
                .build();
        when(platformPolicyRepository.findByPolicyKey("TEST_KEY")).thenReturn(Optional.of(policy));

        PlatformPolicyResponse res = platformPolicyService.getPolicyByKey("TEST_KEY");
        assertNotNull(res);
        assertEquals("TEST_KEY", res.getPolicyKey());

        when(platformPolicyRepository.findByPolicyKey("UNKNOWN_KEY")).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> platformPolicyService.getPolicyByKey("UNKNOWN_KEY"));
    }
}
