package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateAppealRequest;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
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
}
