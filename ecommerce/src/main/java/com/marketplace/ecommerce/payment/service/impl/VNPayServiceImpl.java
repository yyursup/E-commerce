package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.config.VNPayConfig;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements VNPayService {
    private final VNPayConfig vnPayConfig;

    @Override
    public String buildPaymentUrl(Payment payment) {

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayConfig.tmnCode);
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + payment.getOrder().getOrderNumber());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Amount", payment.getAmount().multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_ReturnUrl", "http://localhost:5173/payment/vnpay_return");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_Locale", "vn");

        String hashData = vnPayConfig.buildQueryString(params);
        String secureHash = vnPayConfig.hmacSHA512(vnPayConfig.hashSecret, hashData);

        return vnPayConfig.payUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    @Override
    public boolean verifyChecksum(Map<String, String> params) {

        Map<String, String> copy = new HashMap<>(params);

        String receivedHash = copy.remove("vnp_SecureHash");
        copy.remove("vnp_SecureHashType");

        String hashData = vnPayConfig.buildQueryString(new TreeMap<>(copy));
        String calculatedHash = vnPayConfig.hmacSHA512(vnPayConfig.hashSecret, hashData);

        return calculatedHash.equals(receivedHash);
    }
}
