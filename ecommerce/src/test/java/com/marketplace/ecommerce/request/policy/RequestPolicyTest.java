package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
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
    private UUID accountId;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        accountId = UUID.randomUUID();
    }

    @Test
    @DisplayName("resolve: Trả về TargetType chính xác khi tìm thấy đúng 1 loại đối tượng")
    void resolve_ReturnsTargetType_WhenSingleTypeResolved() {
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));

        TargetType type = requestPolicy.resolve(orderId);

        assertEquals(TargetType.ORDER, type);
    }

    @Test
    @DisplayName("resolve: Ném ngoại lệ khi không tìm thấy bất kỳ đối tượng nào")
    void resolve_ThrowsException_WhenNoTypesFound() {
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class, () -> requestPolicy.resolve(orderId));
        assertTrue(ex.getMessage().contains("Không tìm thấy đối tượng báo cáo"));
    }

    @Test
    @DisplayName("resolve: Ném ngoại lệ khi đối tượng trùng khớp nhiều loại khác nhau")
    void resolve_ThrowsException_WhenMultipleTypesFound() {
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER", "PRODUCT"));

        CustomException ex = assertThrows(CustomException.class, () -> requestPolicy.resolve(orderId));
        assertTrue(ex.getMessage().contains("trùng khớp nhiều loại đối tượng"));
    }

    @Test
    @DisplayName("validateOrderReport: Ném ngoại lệ khi đơn hàng không tồn tại")
    void validateOrderReport_ThrowsException_WhenOrderNotFound() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateOrderReport(accountId, orderId));
        assertTrue(ex.getMessage().contains("Không tìm thấy đơn hàng"));
    }

    @Test
    @DisplayName("validateOrderReport: Ném ngoại lệ khi người dùng không phải chủ đơn hàng")
    void validateOrderReport_ThrowsException_WhenNotOrderOwner() {
        Account otherAccount = Account.builder().id(UUID.randomUUID()).build();
        User user = User.builder().account(otherAccount).build();
        Order order = Order.builder().id(orderId).user(user).status(OrderStatus.DELIVERED).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateOrderReport(accountId, orderId));
        assertTrue(ex.getMessage().contains("Bạn không có quyền khiếu nại"));
    }

    @Test
    @DisplayName("validateOrderReport: Ném ngoại lệ khi đơn hàng chưa DELIVERED (ví dụ đang SHIPPED)")
    void validateOrderReport_ThrowsException_WhenOrderNotDelivered() {
        Account account = Account.builder().id(accountId).build();
        User user = User.builder().account(account).build();
        Order order = Order.builder().id(orderId).user(user).status(OrderStatus.SHIPPED).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () ->
                requestPolicy.validateOrderReport(accountId, orderId));
        assertTrue(ex.getMessage().contains("sau khi hệ thống đã cập nhật giao hàng thành công"));
    }

    @Test
    @DisplayName("validateOrderReport: Thành công khi đơn hàng DELIVERED trong vòng 3 ngày và không có báo cáo pending")
    void validateOrderReport_Success_WhenOrderDeliveredWithin3Days() {
        Account account = Account.builder().id(accountId).build();
        User user = User.builder().account(account).build();
        Order order = Order.builder()
                .id(orderId)
                .user(user)
                .status(OrderStatus.DELIVERED)
                .deliveredAt(LocalDateTime.now().minusDays(1))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(reportRepository.existsPendingReportByOrderId(orderId)).thenReturn(false);

        assertDoesNotThrow(() -> requestPolicy.validateOrderReport(accountId, orderId));
    }
}
