package com.marketplace.ecommerce.payment.policy;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
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
class EscrowPolicyTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderReturnService orderReturnService;

    @InjectMocks
    private EscrowPolicy escrowPolicy;

    private UUID orderId;
    private Order order;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        order = Order.builder().id(orderId).orderNumber("ORD-TEST").build();
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ khi hàng hoàn đang giao (SHIPPED)")
    void validateSettlementPreconditions_BlockedWhenReturnIsShipped() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.SHIPPED)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("Admin chỉ có quyền can thiệp"));
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ khi hàng hoàn đang chờ gửi (WAITING_FOR_SHIPMENT)")
    void validateSettlementPreconditions_BlockedWhenWaitingForShipment() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.WAITING_FOR_SHIPMENT)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("Admin chỉ có quyền can thiệp"));
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ khi kiện hoàn mới tới tay Shop (RETURNED đang trong 72h kiểm hàng)")
    void validateSettlementPreconditions_BlockedWhenReturned() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.RETURNED)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("đang trong thời hạn kiểm hàng 72 giờ"));
    }

    @Test
    @DisplayName("POLICY: Cho phép xử lý ký quỹ khi kiện hoàn phát sinh khiếu nại tranh chấp (DISPUTED)")
    void validateSettlementPreconditions_AllowedWhenDisputed() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.DISPUTED)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        assertDoesNotThrow(() -> escrowPolicy.validateSettlementPreconditions(orderId));
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ khi kiện hoàn đã hoàn tất (COMPLETED)")
    void validateSettlementPreconditions_BlockedWhenCompleted() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.COMPLETED)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("Yêu cầu trả hàng đã kết thúc"));
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ khi kiện hoàn đã bị hủy (CANCELLED)")
    void validateSettlementPreconditions_BlockedWhenCancelled() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        OrderReturnResponse returnDto = OrderReturnResponse.builder()
                .status(ReturnStatus.CANCELLED)
                .build();
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(returnDto);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("Yêu cầu trả hàng đã kết thúc"));
    }

    @Test
    @DisplayName("POLICY: Chặn xử lý ký quỹ thủ công khi đơn hàng không có khiếu nại kiện hoàn (phải theo luồng Báo cáo/Kháng cáo)")
    void validateSettlementPreconditions_BlockedWhenNoReturnExists() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(null);

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowPolicy.validateSettlementPreconditions(orderId));
        assertTrue(ex.getMessage().contains("không có khiếu nại kiện hàng hoàn"));
    }
}
