package com.marketplace.ecommerce.payment.service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface PaymentService {
    String createPayment(UUID orderId, UUID accountId);

    String deposit(BigDecimal amount, UUID accountId);

    void processCallback(Map<String, String> params);
}
