package com.marketplace.ecommerce.payment.service;

import java.util.Map;
import java.util.UUID;

public interface PaymentService {
    String createPayment(UUID orderId, UUID accountId);

    void processCallback(Map<String, String> params);
}
