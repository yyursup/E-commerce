package com.marketplace.ecommerce.webhook.service.impl;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.webhook.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookServiceImpl implements WebhookService {
    @Override
    public boolean markDeliveredByGhnRef(String ghnOrderCode, String clientOrderCode) {
        Optional<Order> byGhn = ghnOrderCode != null && !ghnOrderCode.isBlank()
                ? orderRepository.findByGhnOrderCode(ghnOrderCode.trim()) : Optional.empty();
        Optional<Order> byClient = clientOrderCode != null && !clientOrderCode.isBlank()
                ? orderRepository.findByOrderNumber(clientOrderCode.trim()) : Optional.empty();
        Order order = byGhn.or(() -> byClient).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.SHIPPING) {
            return false;
        }
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        orderRepository.save(order);
        log.info("GHN webhook: đơn {} đã set DELIVERED (ghnOrderCode={}, clientOrderCode={})",
                order.getOrderNumber(), ghnOrderCode, clientOrderCode);
        return true;
    }

    private final OrderRepository orderRepository;
}
