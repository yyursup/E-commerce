package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.payment.entity.Payment;

import java.util.Map;

public interface VNPayService {

    boolean verifyChecksum(Map<String, String> params);
    String buildPaymentUrl(Payment payment);

}
