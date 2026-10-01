package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.ReportDecision;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.ResolutionType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderReportDisputeTest {

    @Mock
    private RequestPolicy requestValidation;

    @Mock
    private RequestService requestService;

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EscrowRepository escrowRepository;

    @Mock
    private EscrowService escrowService;

    @Mock
    private OrderReturnService orderReturnService;

    @Mock
    private OrderReturnRepository orderReturnRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private UUID buyerAccountId;
    private UUID adminAccountId;
    private UUID orderId;
    private UUID shopId;
    private UUID reportRequestId;
    private Account buyerAccount;
    private Account adminAccount;
    private Shop shop;
    private Order deliveredOrder;
    private Escrow heldEscrow;

    @BeforeEach
    void setUp() {
        buyerAccountId = UUID.randomUUID();
        adminAccountId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        shopId = UUID.randomUUID();
        reportRequestId = UUID.randomUUID();

        buyerAccount = Account.builder()
                .id(buyerAccountId)
                .username("buyer_test")
                .disciplineLevel(DisciplineLevel.NONE)
                .status(AccountStatus.ACTIVE)
                .build();

        com.marketplace.ecommerce.auth.entity.User buyerUser = com.marketplace.ecommerce.auth.entity.User.builder()
                .id(UUID.randomUUID())
                .account(buyerAccount)
                .fullName("Buyer Test")
                .build();

        adminAccount = Account.builder()
                .id(adminAccountId)
                .username("admin_test")
                .build();

        shop = Shop.builder()
                .id(shopId)
                .name("Test Shop")
                .status(com.marketplace.ecommerce.shop.valueObjects.ShopStatus.ACTIVE)
                .build();

        deliveredOrder = Order.builder()
                .id(orderId)
                .orderNumber("ORD-123456")
                .user(buyerUser)
                .shop(shop)
                .status(OrderStatus.DELIVERED)
                .deliveredAt(LocalDateTime.now().minusDays(1))
                .total(new BigDecimal("500000"))
                .build();

        heldEscrow = Escrow.builder()
                .id(UUID.randomUUID())
                .order(deliveredOrder)
                .status(EscrowStatus.HELD)
                .amount(new BigDecimal("500000"))
                .build();
    }

    @Test
    @DisplayName("Tạo khiếu nại đơn hàng thành công và tự động tạm khóa Escrow sang DISPUTED")
    void createReport_OrderTarget_Success_DisputesEscrow() {
        // Given
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("[Hàng bị hư hỏng / bể vỡ] Hàng nhận được bị vỡ nát")
                .evidenceUrl("https://minio.local/img1.jpg")
                .build();

        Request createdRequest = Request.builder()
                .id(reportRequestId)
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
        when(requestValidation.resolve(orderId)).thenReturn(TargetType.ORDER);
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));

        // When
        CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

        // Then
        assertNotNull(response);
        assertEquals(reportRequestId, response.getRequestId());

        // Kiểm tra RequestValidation được gọi để thẩm định đơn hàng
        verify(requestValidation).validateOrderReport(buyerAccountId, orderId);

        // Kiểm tra Escrow được khóa sang DISPUTED
        assertEquals(EscrowStatus.DISPUTED, heldEscrow.getStatus());
        verify(escrowRepository).save(heldEscrow);
    }

    @Test
    @DisplayName("Admin bác khiếu nại đơn hàng thì tự động phục hồi Escrow về HELD")
    void handleReport_Reject_RestoresEscrowToHeld() {
        // Given
        Request reportReq = Request.builder()
                .id(reportRequestId)
                .status(RequestStatus.PENDING)
                .build();

        Report report = Report.builder()
                .id(UUID.randomUUID())
                .request(reportReq)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .build();

        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        HandleReportRequest handleReq = new HandleReportRequest();
        handleReq.setDecision(ReportDecision.REJECT);
        handleReq.setNote("Bằng chứng không hợp lệ, sản phẩm không hư hỏng");

        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
        when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));

        // When
        reportService.handleReport(adminAccountId, reportRequestId, handleReq);

        // Then
        assertEquals(RequestStatus.REJECTED, reportReq.getStatus());
        assertEquals(EscrowStatus.HELD, heldEscrow.getStatus());
        verify(requestRepository).save(reportReq);
        verify(escrowRepository).save(heldEscrow);
    }

    @Test
    @DisplayName("Tự động quét hoàn tiền Escrow khi quá hạn 72h Shop không kháng cáo (REFUND_ONLY)")
    void autoRefundExpiredDisputedOrders_ExecutesRefund() {
        // Given
        RequestServiceImpl requestServiceImpl = new RequestServiceImpl(
                requestRepository, reportRepository, null, accountRepository, null,
                requestValidation, null, null, null, null, orderRepository, escrowRepository, escrowService, orderReturnService
        );
        ReflectionTestUtils.setField(requestServiceImpl, "appealWindowHours", 72);

        Request expiredRequest = Request.builder()
                .id(UUID.randomUUID())
                .status(RequestStatus.APPROVED)
                .reviewedAt(LocalDateTime.now().minusHours(73))
                .build();

        Report expiredReport = Report.builder()
                .id(UUID.randomUUID())
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .request(expiredRequest)
                .resolutionType(ResolutionType.REFUND_ONLY)
                .build();

        when(reportRepository.findApprovedOrderReportsReviewedBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredReport));
        when(reportRepository.findAppealsByViolationReportId(expiredReport.getId()))
                .thenReturn(Collections.emptyList());
        when(escrowRepository.findByOrderIdForUpdate(orderId))
                .thenReturn(Optional.of(heldEscrow));
        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        // When
        requestServiceImpl.autoRefundExpiredDisputedOrders();

        // Then
        verify(escrowService, times(1)).refundByOrder(eq(orderId), anyString());
        verify(orderReturnService, never()).createReturn(any(), any());
    }

    @Test
    @DisplayName("Tự động khởi tạo Return khi quá hạn 72h Shop không kháng cáo (RETURN_AND_REFUND)")
    void autoRefundExpiredDisputedOrders_InitiatesReturn_WhenReturnAndRefund() {
        // Given
        RequestServiceImpl requestServiceImpl = new RequestServiceImpl(
                requestRepository, reportRepository, null, accountRepository, null,
                requestValidation, null, null, null, null, orderRepository, escrowRepository, escrowService, orderReturnService
        );
        ReflectionTestUtils.setField(requestServiceImpl, "appealWindowHours", 72);

        Request expiredRequest = Request.builder()
                .id(UUID.randomUUID())
                .status(RequestStatus.APPROVED)
                .reviewedAt(LocalDateTime.now().minusHours(73))
                .build();

        Report expiredReport = Report.builder()
                .id(UUID.randomUUID())
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .request(expiredRequest)
                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                .build();

        when(reportRepository.findApprovedOrderReportsReviewedBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredReport));
        when(reportRepository.findAppealsByViolationReportId(expiredReport.getId()))
                .thenReturn(Collections.emptyList());
        when(escrowRepository.findByOrderIdForUpdate(orderId))
                .thenReturn(Optional.of(heldEscrow));
        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        // When
        requestServiceImpl.autoRefundExpiredDisputedOrders();

        // Then
        verify(orderReturnService, times(1)).createReturn(eq(orderId), eq(expiredReport.getId()));
        verify(escrowService, never()).refundByOrder(any(), any());
    }

    @Test
    @DisplayName("Admin duyệt khiếu nại kiện hoàn của Shop (APPROVE) -> Release cho Shop, hủy kiện hoàn, không phạt Shop")
    void handleReport_SellerReturnDispute_Approve_ReleasesToShop() {
        Request disputeReq = Request.builder()
                .id(reportRequestId)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .description("[Shop khiếu nại kiện hàng hoàn - DAMAGED] Hàng bị tráo")
                .build();

        Report disputeReport = Report.builder()
                .id(reportRequestId)
                .request(disputeReq)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .violationReportId(UUID.randomUUID())
                .build();

        OrderReturn orderReturn = OrderReturn.builder()
                .id(UUID.randomUUID())
                .order(deliveredOrder)
                .status(ReturnStatus.DISPUTED)
                .build();

        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
        when(reportRepository.findByRequestId(reportRequestId)).thenReturn(disputeReport);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        HandleReportRequest req = HandleReportRequest.builder()
                .decision(ReportDecision.APPROVE)
                .note("Xác nhận khách tráo hàng, duyệt cho Shop")
                .build();

        reportService.handleReport(adminAccountId, reportRequestId, req);

        assertEquals(RequestStatus.APPROVED, disputeReq.getStatus());
        assertEquals(ReturnStatus.CANCELLED, orderReturn.getStatus());
        verify(escrowService).releaseByOrder(orderId);
        verify(escrowService, never()).refundByOrder(any(), any());
    }

    @Test
    @DisplayName("Admin bác bỏ khiếu nại kiện hoàn của Shop (REJECT) -> Hoàn tiền Buyer, hoàn tất kiện hoàn")
    void handleReport_SellerReturnDispute_Reject_RefundsBuyer() {
        Request disputeReq = Request.builder()
                .id(reportRequestId)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .description("[Shop khiếu nại kiện hàng hoàn - DAMAGED] Hàng bị tráo")
                .build();

        Report disputeReport = Report.builder()
                .id(reportRequestId)
                .request(disputeReq)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .violationReportId(UUID.randomUUID())
                .build();

        OrderReturn orderReturn = OrderReturn.builder()
                .id(UUID.randomUUID())
                .order(deliveredOrder)
                .status(ReturnStatus.DISPUTED)
                .build();

        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
        when(reportRepository.findByRequestId(reportRequestId)).thenReturn(disputeReport);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));

        HandleReportRequest req = HandleReportRequest.builder()
                .decision(ReportDecision.REJECT)
                .note("Bằng chứng của Shop không đủ cơ sở")
                .build();

        reportService.handleReport(adminAccountId, reportRequestId, req);

        assertEquals(RequestStatus.REJECTED, disputeReq.getStatus());
        assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), anyString());
        verify(escrowService, never()).releaseByOrder(any());
    }
}
