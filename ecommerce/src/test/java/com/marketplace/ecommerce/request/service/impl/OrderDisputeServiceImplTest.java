package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderDisputeServiceImplTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private EscrowRepository escrowRepository;

    @InjectMocks
    private OrderDisputeServiceImpl orderDisputeService;

    @Test
    @DisplayName("hasActiveDispute và getDisputeInfo khi orderId null hoặc danh sách rỗng")
    void testNullAndEmptyReports() {
        assertFalse(orderDisputeService.hasActiveDispute(null));
        assertEquals("NONE", orderDisputeService.getDisputeInfo(null).getDisputeStatus());
        assertTrue(orderDisputeService.getDisputeInfoBatch(null).isEmpty());
        assertTrue(orderDisputeService.getDisputeInfoBatch(Collections.emptyList()).isEmpty());

        UUID orderId = UUID.randomUUID();
        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId)).thenReturn(Collections.emptyList());
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        assertFalse(orderDisputeService.hasActiveDispute(orderId));

        Escrow disputedEscrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(disputedEscrow));
        OrderDisputeResponse resDisputed = orderDisputeService.getDisputeInfo(orderId);
        assertTrue(resDisputed.isHasActiveDispute());
        assertEquals("REPORT_PENDING", resDisputed.getDisputeStatus());
    }

    @Test
    @DisplayName("computeDisputeInfo: Đầy đủ các trạng thái REPORT và APPEAL")
    void testComputeDisputeInfo_AllBranches() {
        UUID orderId = UUID.randomUUID();

        // 1. Only appeal reports (no initial REPORT)
        Report appealOnly = Report.builder()
                .targetId(orderId)
                .request(Request.builder().type(RequestType.APPEAL).status(RequestStatus.PENDING).build())
                .build();
        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId)).thenReturn(List.of(appealOnly));
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        assertEquals("NONE", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());

        // 2. Initial report PENDING
        Request reqReport = Request.builder().type(RequestType.REPORT).status(RequestStatus.PENDING).description("Hàng lỗi").build();
        Report initialReport = Report.builder().targetId(orderId).request(reqReport).build();
        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId)).thenReturn(List.of(initialReport));
        OrderDisputeResponse resPending = orderDisputeService.getDisputeInfo(orderId);
        assertTrue(resPending.isHasActiveDispute());
        assertEquals("REPORT_PENDING", resPending.getDisputeStatus());

        // 3. Initial report REJECTED
        reqReport.setStatus(RequestStatus.REJECTED);
        OrderDisputeResponse resRejected = orderDisputeService.getDisputeInfo(orderId);
        assertFalse(resRejected.isHasActiveDispute());
        assertEquals("NONE", resRejected.getDisputeStatus());

        // 4. Initial report APPROVED -> no appeal, escrow DISPUTED vs not DISPUTED
        reqReport.setStatus(RequestStatus.APPROVED);
        Escrow escrow = Escrow.builder().status(EscrowStatus.DISPUTED).build();
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));
        assertEquals("REPORT_APPROVED", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());

        escrow.setStatus(EscrowStatus.HELD);
        assertEquals("NONE", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());

        // 5. Escrow status REFUNDED
        escrow.setStatus(EscrowStatus.REFUNDED);
        assertEquals("REFUNDED", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());

        // 6. ReportStage RETURN_IN_PROGRESS
        escrow.setStatus(EscrowStatus.HELD);
        initialReport.setStage(ReportStage.RETURN_IN_PROGRESS);
        OrderDisputeResponse resReturn = orderDisputeService.getDisputeInfo(orderId);
        assertTrue(resReturn.isHasActiveDispute());
        assertEquals("RETURN_IN_PROGRESS", resReturn.getDisputeStatus());

        // 7. ReportStage DIRECT_NEGOTIATION
        initialReport.setStage(ReportStage.DIRECT_NEGOTIATION);
        assertEquals("DIRECT_NEGOTIATION", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());
        initialReport.setStage(null);

        // 8. Initial report status null
        reqReport.setStatus(null);
        assertEquals("NONE", orderDisputeService.getDisputeInfo(orderId).getDisputeStatus());

        // 9. getDisputeInfoBatch
        reqReport.setStatus(RequestStatus.PENDING);
        when(reportRepository.findReportsByTargetTypeAndTargetIdIn(TargetType.ORDER, List.of(orderId)))
                .thenReturn(List.of(initialReport));
        Map<UUID, OrderDisputeResponse> batch = orderDisputeService.getDisputeInfoBatch(List.of(orderId));
        assertEquals(1, batch.size());
        assertTrue(batch.get(orderId).isHasActiveDispute());
    }
}
