package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.payment.entity.Payment;

import java.math.BigDecimal;
import java.util.Map;

public interface VNPayService {

    boolean verifyChecksumFromMap(Map<String, String> params);
    boolean verifyChecksumFromQueryString(String rawQueryString);
    String buildPaymentUrl(Payment payment);
    String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo, String returnUrl, String ipAddr);
}
