package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.request.service.impl.OrderDisputeServiceImpl;
import com.marketplace.ecommerce.request.service.impl.RequestServiceImpl;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderDisputeFlowTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private EscrowRepository escrowRepository;

    @Mock
    private EscrowService escrowService;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private com.marketplace.ecommerce.product.repository.ProductRepository productRepository;

    @Mock
    private OrderDisputeService orderDisputeService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UUID buyerAccountId;
    private UUID buyerUserId;
    private UUID orderId;
    private User buyerUser;
    private Order deliveredOrder;
    private Escrow heldEscrow;

    @BeforeEach
    void setUp() {
        buyerAccountId = UUID.randomUUID();
        buyerUserId = UUID.randomUUID();
        orderId = UUID.randomUUID();

        Account buyerAccount = Account.builder().id(buyerAccountId).build();
        buyerUser = User.builder().id(buyerUserId).account(buyerAccount).build();

        deliveredOrder = Order.builder()
                .id(orderId)
                .orderNumber("ORD-TEST-123")
                .user(buyerUser)
                .status(OrderStatus.DELIVERED)
                .receivedByBuyer(false)
                .total(new BigDecimal("1000000"))
                .build();

        heldEscrow = Escrow.builder()
                .id(UUID.randomUUID())
                .order(deliveredOrder)
                .status(EscrowStatus.HELD)
                .amount(new BigDecimal("1000000"))
                .build();
    }

    @Test
    @DisplayName("Test 1: Không có dispute -> Buyer confirm received thành công -> Release Escrow & Order COMPLETED")
    void markReceivedByBuyer_Success_WhenNoActiveDispute() {
        // Given
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyerUser));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(false);

        // When
        orderService.markReceivedByBuyer(orderId, buyerAccountId);

        // Then
        assertTrue(deliveredOrder.isReceivedByBuyer());
        assertEquals(OrderStatus.COMPLETED, deliveredOrder.getStatus());
        verify(escrowService).releaseByOrder(orderId);
        verify(orderRepository).save(deliveredOrder);
    }

    @Test
    @DisplayName("Test 2 & 4: Có dispute active -> Buyer confirm received bị chặn ngay lập tức (CustomException)")
    void markReceivedByBuyer_ThrowsException_WhenActiveDispute() {
        // Given
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyerUser));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(true);

        // When & Then
        CustomException ex = assertThrows(CustomException.class, () ->
                orderService.markReceivedByBuyer(orderId, buyerAccountId)
        );

        assertTrue(ex.getMessage().contains("khiếu nại hoặc tranh chấp"));
        assertFalse(deliveredOrder.isReceivedByBuyer());
        assertEquals(OrderStatus.DELIVERED, deliveredOrder.getStatus());
        verify(escrowService, never()).releaseByOrder(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 8: Double confirm received -> Bị chặn do idempotent guard")
    void markReceivedByBuyer_ThrowsException_WhenAlreadyReceived() {
        // Given
        deliveredOrder.setReceivedByBuyer(true);
        deliveredOrder.setStatus(OrderStatus.COMPLETED);

        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyerUser));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));

        // When & Then
        CustomException ex = assertThrows(CustomException.class, () ->
                orderService.markReceivedByBuyer(orderId, buyerAccountId)
        );

        assertTrue(ex.getMessage().contains("Chỉ có thể xác nhận khi đơn hàng ở trạng thái đã giao")
                || ex.getMessage().contains("hoàn tất trước đó"));
        verify(escrowService, never()).releaseByOrder(any());
    }

    @Test
    @DisplayName("Test 6: Seller Appeal ACCEPTED -> Tranh chấp giải quyết theo hướng Shop thắng -> Tự động release Escrow & Order COMPLETED")
    void approveAppeal_OrderTarget_ReleasesEscrowAndCompletesOrder() {
        // Given
        RequestServiceImpl requestService = new RequestServiceImpl(
                requestRepository, reportRepository, null, accountRepository, null,
                null, null, productRepository, shopRepository, null, orderRepository, escrowRepository, escrowService, null
        );

        UUID requestId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        Account admin = Account.builder().id(adminId).build();

        Shop shop = Shop.builder().id(UUID.randomUUID()).user(buyerUser).build();
        deliveredOrder.setShop(shop);

        Request appealReq = Request.builder()
                .id(requestId)
                .account(admin)
                .type(RequestType.APPEAL)
                .status(RequestStatus.PENDING)
                .build();

        Report appealReport = Report.builder()
                .id(requestId)
                .request(appealReq)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .build();

        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        when(requestRepository.findById(requestId)).thenReturn(Optional.of(appealReq));
        when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(reportRepository.findByRequestId(requestId)).thenReturn(appealReport);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));

        // When
        requestService.approveRequest(requestId, adminId, "Kháng cáo hợp lệ, gỡ phạt Shop");

        // Then
        assertEquals(RequestStatus.APPROVED, appealReq.getStatus());
        assertEquals(EscrowStatus.HELD, heldEscrow.getStatus());
        assertTrue(deliveredOrder.isReceivedByBuyer());
        assertEquals(OrderStatus.COMPLETED, deliveredOrder.getStatus());
        verify(escrowService).releaseByOrder(orderId);
        verify(orderRepository).save(deliveredOrder);
    }

    @Test
    @DisplayName("Test 7: Seller Appeal REJECTED -> Admin bác kháng cáo -> Hoàn tiền 100% Escrow cho Buyer")
    void rejectAppeal_OrderTarget_RefundsEscrowToBuyer() {
        // Given
        RequestServiceImpl requestService = new RequestServiceImpl(
                requestRepository, reportRepository, null, accountRepository, null,
                null, null, null, shopRepository, null, orderRepository, escrowRepository, escrowService, null
        );

        UUID requestId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        Account admin = Account.builder().id(adminId).build();

        Request appealReq = Request.builder()
                .id(requestId)
                .account(admin)
                .type(RequestType.APPEAL)
                .status(RequestStatus.PENDING)
                .build();

        Report appealReport = Report.builder()
                .id(requestId)
                .request(appealReq)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .build();

        when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(appealReq));
        when(reportRepository.findByRequestId(requestId)).thenReturn(appealReport);

        // When
        requestService.rejectRequest(adminId, requestId, "Bác bỏ kháng cáo");

        // Then
        assertEquals(RequestStatus.REJECTED, appealReq.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), anyString());
    }

    @Test
    @DisplayName("OrderDisputeServiceImpl: Phân tích đúng mọi trạng thái State Machine")
    void orderDisputeServiceImpl_ComputesCorrectStates() {
        // Given
        OrderDisputeServiceImpl disputeService = new OrderDisputeServiceImpl(reportRepository, escrowRepository);

        // Case 1: Không có report nào
        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(Collections.emptyList());
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(heldEscrow));

        OrderDisputeResponse info1 = disputeService.getDisputeInfo(orderId);
        assertFalse(info1.isHasActiveDispute());
        assertEquals("NONE", info1.getDisputeStatus());

        // Case 2: Report PENDING
        Request rPending = Request.builder().type(RequestType.REPORT).status(RequestStatus.PENDING).description("Giao sai hàng").build();
        Report repPending = Report.builder().request(rPending).targetType(TargetType.ORDER).targetId(orderId).build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repPending));

        OrderDisputeResponse info2 = disputeService.getDisputeInfo(orderId);
        assertTrue(info2.isHasActiveDispute());
        assertEquals("REPORT_PENDING", info2.getDisputeStatus());

        // Case 3: Report APPROVED, chưa có Appeal, Escrow DISPUTED
        Request rApproved = Request.builder().type(RequestType.REPORT).status(RequestStatus.APPROVED).description("Giao sai hàng").build();
        Report repApproved = Report.builder().request(rApproved).targetType(TargetType.ORDER).targetId(orderId).build();
        heldEscrow.setStatus(EscrowStatus.DISPUTED);

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repApproved));

        OrderDisputeResponse info3 = disputeService.getDisputeInfo(orderId);
        assertTrue(info3.isHasActiveDispute());
        assertEquals("REPORT_APPROVED", info3.getDisputeStatus());

        // Case 4: Report APPROVED, có Appeal PENDING
        Request aPending = Request.builder().type(RequestType.APPEAL).status(RequestStatus.PENDING).build();
        Report appealPending = Report.builder().request(aPending).targetType(TargetType.ORDER).targetId(orderId).build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repApproved, appealPending));

        OrderDisputeResponse info4 = disputeService.getDisputeInfo(orderId);
        assertTrue(info4.isHasActiveDispute());
        assertEquals("APPEAL_PENDING", info4.getDisputeStatus());

        // Case 5: Report APPROVED, có Appeal APPROVED
        Request aApproved = Request.builder().type(RequestType.APPEAL).status(RequestStatus.APPROVED).build();
        Report appealApproved = Report.builder().request(aApproved).targetType(TargetType.ORDER).targetId(orderId).build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repApproved, appealApproved));

        OrderDisputeResponse info5 = disputeService.getDisputeInfo(orderId);
        assertFalse(info5.isHasActiveDispute());
        assertEquals("APPEAL_APPROVED", info5.getDisputeStatus());

        // Case 6: Report REJECTED
        Request rRejected = Request.builder().type(RequestType.REPORT).status(RequestStatus.REJECTED).build();
        Report repRejected = Report.builder().request(rRejected).targetType(TargetType.ORDER).targetId(orderId).build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repRejected));

        OrderDisputeResponse info6 = disputeService.getDisputeInfo(orderId);
        assertFalse(info6.isHasActiveDispute());
        assertEquals("NONE", info6.getDisputeStatus());
    }
}
