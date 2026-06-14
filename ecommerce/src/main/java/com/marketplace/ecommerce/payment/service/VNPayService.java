package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.payment.entity.Payment;

import java.util.Map;

public interface VNPayService {

    boolean verifyChecksum(Map<String, String> params);
    boolean verifyChecksum(String rawQueryString);
    String buildPaymentUrl(Payment payment);

}
