package com.marketplace.ecommerce.webhook.service.impl;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.service.CommissionService;
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
class WebhookServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CommissionService commissionService;

    @InjectMocks
    private WebhookServiceImpl webhookService;

    @Test
    @DisplayName("markDeliveredByGhnRef cập nhật DELIVERED thành công theo ghnOrderCode và tính hoa hồng")
    void testMarkDelivered_ByGhnCode() {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setOrderNumber("ORD-100");
        order.setStatus(OrderStatus.SHIPPING);
        order.setGhnOrderCode("GHN123");

        when(orderRepository.findByGhnOrderCode("GHN123")).thenReturn(Optional.of(order));

        boolean res = webhookService.markDeliveredByGhnRef("GHN123", null);
        assertTrue(res);
        assertEquals(OrderStatus.DELIVERED, order.getStatus());
        assertNotNull(order.getDeliveredAt());
        verify(orderRepository).save(order);
        verify(commissionService).createCommission(order.getId());
    }

    @Test
    @DisplayName("markDeliveredByGhnRef cập nhật DELIVERED thành công theo clientOrderCode")
    void testMarkDelivered_ByClientOrderCode() {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setOrderNumber("ORD-200");
        order.setStatus(OrderStatus.SHIPPING);

        when(orderRepository.findByOrderNumber("ORD-200")).thenReturn(Optional.of(order));

        boolean res = webhookService.markDeliveredByGhnRef(null, "ORD-200");
        assertTrue(res);
        assertEquals(OrderStatus.DELIVERED, order.getStatus());
    }

    @Test
    @DisplayName("markDeliveredByGhnRef trả về false khi đơn không ở trạng thái SHIPPING hoặc không tìm thấy")
    void testMarkDelivered_NotShippingOrNotFound() {
        Order order = new Order();
        order.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findByGhnOrderCode("GHN123")).thenReturn(Optional.of(order));

        assertFalse(webhookService.markDeliveredByGhnRef("GHN123", null));

        when(orderRepository.findByGhnOrderCode("UNKNOWN")).thenReturn(Optional.empty());
        assertFalse(webhookService.markDeliveredByGhnRef("UNKNOWN", null));
    }
}
