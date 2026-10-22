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
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.request.service.impl.OrderDisputeServiceImpl;
import com.marketplace.ecommerce.request.service.impl.RequestServiceImpl;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    private ProductRepository productRepository;

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

        // Case 4: Report REJECTED
        Request rRejected = Request.builder().type(RequestType.REPORT).status(RequestStatus.REJECTED).build();
        Report repRejected = Report.builder().request(rRejected).targetType(TargetType.ORDER).targetId(orderId).build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repRejected));

        OrderDisputeResponse info6 = disputeService.getDisputeInfo(orderId);
        assertFalse(info6.isHasActiveDispute());
        assertEquals("NONE", info6.getDisputeStatus());

        // Case 7: Report RETURN_IN_PROGRESS -> Bắt buộc active dispute = true để chặn buyer nhận hàng
        Report repReturnInProgress = Report.builder()
                .request(rApproved)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .stage(ReportStage.RETURN_IN_PROGRESS)
                .build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repReturnInProgress));

        OrderDisputeResponse info7 = disputeService.getDisputeInfo(orderId);
        assertTrue(info7.isHasActiveDispute());
        assertEquals("RETURN_IN_PROGRESS", info7.getDisputeStatus());

        // Case 8: Report DIRECT_NEGOTIATION -> Bắt buộc active dispute = true
        Report repNegotiation = Report.builder()
                .request(rPending)
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .stage(ReportStage.DIRECT_NEGOTIATION)
                .build();

        when(reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId))
                .thenReturn(List.of(repNegotiation));

        OrderDisputeResponse info8 = disputeService.getDisputeInfo(orderId);
        assertTrue(info8.isHasActiveDispute());
        assertEquals("DIRECT_NEGOTIATION", info8.getDisputeStatus());

        // Case 9: Escrow REFUNDED -> active dispute = false, status = REFUNDED
        heldEscrow.setStatus(EscrowStatus.REFUNDED);
        OrderDisputeResponse info9 = disputeService.getDisputeInfo(orderId);
        assertFalse(info9.isHasActiveDispute());
        assertEquals("REFUNDED", info9.getDisputeStatus());
    }

    @Test
    @DisplayName("OrderDisputeServiceImpl: getDisputeInfoBatch gom nhóm truy vấn 1 lần, triệt tiêu N+1")
    void orderDisputeServiceImpl_GetDisputeInfoBatch_OptimizedQueries() {
        // Given
        OrderDisputeServiceImpl disputeService = new OrderDisputeServiceImpl(reportRepository, escrowRepository);
        UUID orderId1 = UUID.randomUUID();
        UUID orderId2 = UUID.randomUUID();
        List<UUID> orderIds = List.of(orderId1, orderId2);

        Request rPending = Request.builder().type(RequestType.REPORT).status(RequestStatus.PENDING).description("Lỗi phần cứng").build();
        Report repOrder1 = Report.builder().request(rPending).targetType(TargetType.ORDER).targetId(orderId1).build();

        when(reportRepository.findReportsByTargetTypeAndTargetIdIn(TargetType.ORDER, orderIds))
                .thenReturn(List.of(repOrder1));

        Escrow escrow1 = Escrow.builder().id(UUID.randomUUID()).order(Order.builder().id(orderId1).build()).status(EscrowStatus.DISPUTED).build();
        Escrow escrow2 = Escrow.builder().id(UUID.randomUUID()).order(Order.builder().id(orderId2).build()).status(EscrowStatus.HELD).build();

        when(escrowRepository.findByOrderIdIn(orderIds))
                .thenReturn(List.of(escrow1, escrow2));

        // When
        Map<UUID, OrderDisputeResponse> batchResult = disputeService.getDisputeInfoBatch(orderIds);

        // Then
        assertEquals(2, batchResult.size());
        assertTrue(batchResult.get(orderId1).isHasActiveDispute());
        assertEquals("REPORT_PENDING", batchResult.get(orderId1).getDisputeStatus());
        assertFalse(batchResult.get(orderId2).isHasActiveDispute());
        assertEquals("NONE", batchResult.get(orderId2).getDisputeStatus());

        // Verify escrowRepository.findByOrderIdIn được gọi đúng 1 lần duy nhất, findByOrderId đơn lẻ không được gọi
        verify(escrowRepository, times(1)).findByOrderIdIn(orderIds);
        verify(escrowRepository, never()).findByOrderId(any(UUID.class));
    }
}
