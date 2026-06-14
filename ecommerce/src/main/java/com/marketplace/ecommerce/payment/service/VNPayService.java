package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.payment.entity.Payment;

import java.util.Map;

public interface VNPayService {

    boolean verifyChecksumFromMap(Map<String, String> params);
    boolean verifyChecksumFromQueryString(String rawQueryString);
    String buildPaymentUrl(Payment payment);

}
