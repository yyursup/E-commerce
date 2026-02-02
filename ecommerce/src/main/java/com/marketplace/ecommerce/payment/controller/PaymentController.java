package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/orders/{orderId}/vnpay")
    public ResponseEntity<Map<String, Object>> createVnpayPayment(
            @PathVariable UUID orderId,
            @CurrentUser CurrentUserInfo u
    ) {
        String url = paymentService.createPayment(orderId, u.getAccountId());
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "paymentUrl", url
        ));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Map<String, Object>> handleVnpayReturn(
            @RequestParam Map<String, String> params
    ) {
        paymentService.processCallback(params);
        // return UI-friendly response
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Processed VNPay return"
        ));
    }

}
