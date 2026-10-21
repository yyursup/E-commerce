package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateAppealRequest;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestPolicyTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private RequestPolicy requestPolicy;

    private UUID orderId;
    private UUID reportId;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        reportId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Chặn nộp kháng cáo khi targetType là ORDER (Phán quyết Admin là quyết định cuối cùng)")
    void validateAppealRequest_ThrowsException_WhenTargetTypeIsOrder() {
        CreateAppealRequest req = CreateAppealRequest.builder()
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .description("Shop muốn kháng cáo đơn hàng")
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> requestPolicy.validateAppealRequest(req));
        assertTrue(ex.getMessage().contains("quyết định cuối cùng"));
    }

    @Test
    @DisplayName("Chặn nộp kháng cáo khi reportId gốc là vụ việc khiếu nại ORDER")
    void validateAppealRequest_ThrowsException_WhenOriginalReportIsOrder() {
        CreateAppealRequest req = CreateAppealRequest.builder()
                .targetType(TargetType.USER)
                .targetId(UUID.randomUUID())
                .reportId(reportId)
                .description("Kháng cáo lách targetType nhưng trỏ vào Report đơn hàng")
                .build();

        Report orderReport = Report.builder()
                .id(reportId)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .build();

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(orderReport));

        CustomException ex = assertThrows(CustomException.class, () -> requestPolicy.validateAppealRequest(req));
        assertTrue(ex.getMessage().contains("quyết định cuối cùng"));
    }

    @Test
    @DisplayName("Cho phép nộp kháng cáo đối với vi phạm SHOP, PRODUCT, REVIEW")
    void validateAppealRequest_Passes_WhenTargetTypeIsNotOrder() {
        CreateAppealRequest req = CreateAppealRequest.builder()
                .targetType(TargetType.SHOP)
                .targetId(UUID.randomUUID())
                .reportId(reportId)
                .description("Shop giải trình giấy tờ")
                .build();

        Report shopReport = Report.builder()
                .id(reportId)
                .targetType(TargetType.SHOP)
                .targetId(req.getTargetId())
                .build();

        when(reportRepository.findById(reportId)).thenReturn(Optional.of(shopReport));

        assertDoesNotThrow(() -> requestPolicy.validateAppealRequest(req));
    }

    @Test
    @DisplayName("Chặn phán quyết tranh chấp ORDER nếu thiếu mã điều khoản chính sách")
    void validateDisputePolicyClause_ThrowsException_WhenOrderDisputeMissingClause() {
        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, null,
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, false));
        assertTrue(ex.getMessage().contains("bắt buộc phải gắn với một Điều khoản Chính sách"));
    }

    @Test
    @DisplayName("Chặn phán quyết nếu mã điều khoản chính sách không tồn tại")
    void validateDisputePolicyClause_ThrowsException_WhenClauseInvalid() {
        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "INVALID_CLAUSE_XYZ",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, false));
        assertTrue(ex.getMessage().contains("không hợp lệ"));
    }

    @Test
    @DisplayName("Chặn phán quyết khi điều khoản không tương thích với hướng phán quyết (APPROVE nhưng chọn BUYER_FAULT)")
    void validateDisputePolicyClause_ThrowsException_WhenClauseMismatchApprove() {
        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "CLAUSE_14_1_INSUFFICIENT_EVIDENCE",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, false));
        assertTrue(ex.getMessage().contains("không phù hợp với phán quyết chấp thuận khiếu nại"));
    }

    @Test
    @DisplayName("Chặn phán quyết khi điều khoản không tương thích với hướng phán quyết (REJECT nhưng chọn SELLER_FAULT)")
    void validateDisputePolicyClause_ThrowsException_WhenClauseMismatchReject() {
        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "CLAUSE_8_2_FAKE_PRODUCT",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.REJECT, false));
        assertTrue(ex.getMessage().contains("không phù hợp với phán quyết bác bỏ khiếu nại"));
    }

    @Test
    @DisplayName("Xác thực thành công điều khoản hợp lệ khi phán quyết tranh chấp")
    void validateDisputePolicyClause_Passes_WhenClauseIsValidAndMatches() {
        // Buyer thắng: Clause lỗi Shop
        com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause c1 =
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "CLAUSE_9_1_HARDWARE_FAULT",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, false);
        assertNotNull(c1);
        assertEquals("CLAUSE_9_1_HARDWARE_FAULT", c1.getCode());

        // Shop thắng: Clause bác khiếu nại
        com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause c2 =
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "CLAUSE_14_1_INSUFFICIENT_EVIDENCE",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.REJECT, false);
        assertNotNull(c2);
        assertEquals("CLAUSE_14_1_INSUFFICIENT_EVIDENCE", c2.getCode());

        // Tranh chấp kiện hoàn: Clause kiện hoàn
        com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause c3 =
                requestPolicy.validateDisputePolicyClause(TargetType.ORDER, "CLAUSE_15_1_RETURN_EMPTY_PARCEL",
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, true);
        assertNotNull(c3);
        assertEquals("CLAUSE_15_1_RETURN_EMPTY_PARCEL", c3.getCode());

        // Các loại target khác (PRODUCT, SHOP) không bắt buộc clause
        com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause c4 =
                requestPolicy.validateDisputePolicyClause(TargetType.PRODUCT, null,
                        com.marketplace.ecommerce.request.valueObjects.ReportDecision.APPROVE, false);
        assertNull(c4);
    }
}
