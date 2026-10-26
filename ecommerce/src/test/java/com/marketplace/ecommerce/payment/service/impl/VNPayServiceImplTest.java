package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.config.VNPayConfig;
import com.marketplace.ecommerce.payment.entity.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VNPayServiceImplTest {

    private VNPayConfig config;
    private VNPayServiceImpl vnPayService;

    @BeforeEach
    void setUp() {
        config = new VNPayConfig();
        config.tmnCode = "DEMOTMN";
        config.hashSecret = "SECRETKEY123456789";
        config.payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        config.returnUrl = "http://localhost:8080/api/payments/callback";

        vnPayService = new VNPayServiceImpl(config);
    }

    @Test
    @DisplayName("buildPaymentUrl tạo đường dẫn thanh toán hợp lệ kèm chữ ký vnp_SecureHash")
    void testBuildPaymentUrl() {
        String url = vnPayService.buildPaymentUrl(
                "PAY-001",
                BigDecimal.valueOf(100000),
                "Thanh toan don 001",
                config.returnUrl,
                "127.0.0.1"
        );

        assertNotNull(url);
        assertTrue(url.startsWith(config.payUrl));
        assertTrue(url.contains("vnp_TxnRef=PAY-001"));
        assertTrue(url.contains("vnp_Amount=10000000")); // nhân 100
        assertTrue(url.contains("vnp_SecureHash="));
    }

    @Test
    @DisplayName("verifyChecksumFromMap xác thực chữ ký chính xác")
    void testVerifyChecksumFromMap() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_Command", "pay");
        params.put("vnp_TxnRef", "PAY-001");

        String hashData = config.buildQueryString(new java.util.TreeMap<>(params));
        String secureHash = config.hmacSHA512(config.hashSecret, hashData);
        params.put("vnp_SecureHash", secureHash);

        boolean valid = vnPayService.verifyChecksumFromMap(params);
        assertTrue(valid);

        params.put("vnp_SecureHash", "INVALIDSIGNATURE");
        assertFalse(vnPayService.verifyChecksumFromMap(params));
    }

    @Test
    @DisplayName("verifyChecksumFromQueryString xác thực chữ ký từ chuỗi query thô")
    void testVerifyChecksumFromQueryString() {
        assertFalse(vnPayService.verifyChecksumFromQueryString(null));
        assertFalse(vnPayService.verifyChecksumFromQueryString(""));
        assertFalse(vnPayService.verifyChecksumFromQueryString("a=1&b=2")); // missing hash

        Map<String, String> params = new java.util.TreeMap<>();
        params.put("vnp_Amount", "50000000");
        params.put("vnp_TxnRef", "PAY-002");
        String hashData = config.buildQueryString(params);
        String secureHash = config.hmacSHA512(config.hashSecret, hashData);

        String rawQuery = hashData + "&vnp_SecureHash=" + secureHash;
        assertTrue(vnPayService.verifyChecksumFromQueryString(rawQuery));
    }
}
